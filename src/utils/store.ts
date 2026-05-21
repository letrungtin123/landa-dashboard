// ============================================================
// Auth Store — Real Open edX authentication + staff/superuser gate
// Token: encrypted localStorage + auto-refresh
// KHÔNG LOG DỮ LIỆU NHẠY CẢM
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  loginApi, refreshTokenApi, getUserMe, getUserAccount,
  establishLmsSessionFromToken, clearLmsSession,
} from '@/api/auth';
import { config } from '@/config/env';
import type { OAuthTokenResponse } from '@/api/types';

// ── Encrypted storage ──
const STORAGE_KEY = 'admin-auth-v1';
const OBF_KEY = 42;

function obfuscate(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const xored = bytes.map((b) => b ^ OBF_KEY);
  let binary = '';
  for (const b of xored) binary += String.fromCharCode(b);
  return btoa(binary);
}

function deobfuscate(encoded: string): string {
  try {
    const binary = atob(encoded);
    const xored = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      xored[i] = binary.charCodeAt(i) ^ OBF_KEY;
    }
    return new TextDecoder().decode(xored);
  } catch { return ''; }
}

const encryptedStorage = createJSONStorage(() => ({
  getItem(key: string): string | null {
    const raw = localStorage.getItem(key);
    return raw ? (deobfuscate(raw) || null) : null;
  },
  setItem(key: string, value: string): void {
    localStorage.setItem(key, obfuscate(value));
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
}));

// ── Types ──
export type UserRole = 'superadmin' | 'admin' | 'staff' | 'learner_plus';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  avatar: string | null;
  avatar_url?: string | null;
  status: UserStatus;
  isStaff: boolean;
  isSuperuser: boolean;
  tenant_id?: string | null;
  created_at?: string;
  permission_group_id?: string | null;
  memberGroupIds?: number[];
  memberGroupNames?: string[];
}

export type PermissionsMap = Record<string, Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>>;

// ── Custom error for staff gate ──
export class StaffAccessDeniedError extends Error {
  constructor() {
    super('Tài khoản không có quyền truy cập admin panel. Chỉ staff/superuser mới được phép.');
    this.name = 'StaffAccessDeniedError';
  }
}

interface AuthState {
  user: User | null;
  permissions: PermissionsMap;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  tokenExpiresAt: number | null;

  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (edxTokens: OAuthTokenResponse) => Promise<void>;
  loginWithMicrosoft: (edxTokens: OAuthTokenResponse) => Promise<void>;
  loginWithKeycloak: (edxTokens: OAuthTokenResponse) => Promise<void>;
  logout: () => Promise<void>;
  startLogout: () => void;
  performTokenRefresh: () => Promise<boolean>;
  scheduleTokenRefresh: () => void;
  updateUser: (data: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setPermissions: (permissions: PermissionsMap) => void;
  hasPermission: (moduleCode: string, tabCode: string, action: 'can_view' | 'can_add' | 'can_edit' | 'can_delete') => boolean;
}

let refreshTimerId: ReturnType<typeof setTimeout> | null = null;
function clearRefreshTimer(): void {
  if (refreshTimerId !== null) { clearTimeout(refreshTimerId); refreshTimerId = null; }
}

/**
 * Sau khi có tokens, fetch user info + kiểm tra quyền staff/superuser.
 * Nếu user KHÔNG phải staff → xóa token ngay + throw StaffAccessDeniedError.
 *
 * @param accessToken - Token vừa nhận được, truyền thẳng vào API để tránh
 *   race condition khi interceptor đọc store cũ (asyncimport có microtask delay).
 */
async function fetchAndVerifyStaffUser(
  set: (partial: Partial<AuthState>) => void,
  accessToken: string,
  tokenType = "Bearer",
): Promise<void> {
  const me = await getUserMe(accessToken, tokenType);

  // ── GATE: staff/superuser hoặc learner_plus mới vào được ──
  if (!me.is_staff && !me.is_superuser) {
    // Không phải staff/superuser → kiểm tra custom role (learner_plus)
    try {
      const { getMyRole } = await import('@/api/landa-groups');
      const roleData = await getMyRole();

      if (roleData.role === 'learner_plus') {
        // learner_plus được phép vào
        let account;
        try {
          account = await getUserAccount(me.username);
        } catch {
          account = {
            name: me.username,
            profile_image: { has_image: false, image_url_full: '' },
            date_joined: new Date().toISOString(),
          };
        }

        const sanitizeUrlToRelative = (url: string | null | undefined): string | null => {
          if (!url) return null;
          try {
            const parsed = new URL(url);
            return parsed.pathname + parsed.search;
          } catch {
            return url;
          }
        };

        set({
          isAuthenticated: true,
          user: {
            id: me.username,
            email: me.email,
            name: account.name || me.username,
            username: me.username,
            role: 'learner_plus',
            avatar: sanitizeUrlToRelative(account.profile_image?.has_image ? account.profile_image.image_url_full : null),
            status: 'active',
            isStaff: false,
            isSuperuser: false,
            memberGroupIds: roleData.group_ids,
            memberGroupNames: roleData.group_names,
          },
        });
        return;
      }
    } catch {
      // API lỗi hoặc không có role → chặn
    }

    // Không phải learner_plus → chặn hoàn toàn
    set({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      user: null,
    });
    await clearLmsSession();
    throw new StaffAccessDeniedError();
  }

  let account;
  try {
    account = await getUserAccount(me.username);
  } catch {
    account = {
      name: me.username,
      profile_image: { has_image: false, image_url_full: '' },
      date_joined: new Date().toISOString(),
    };
  }

  const isSuperuser = !!me.is_superuser;
  const role: UserRole = isSuperuser ? 'superadmin' : 'admin';

  // Sanitize profile image URL to relative path to avoid CORS on production Kong Gateway
  const sanitizeUrlToRelative = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  };

  set({
    isAuthenticated: true,
    user: {
      id: me.username,
      email: me.email,
      name: account.name || me.username,
      username: me.username,
      role,
      avatar: sanitizeUrlToRelative(account.profile_image?.has_image ? account.profile_image.image_url_full : null),
      status: 'active',
      isStaff: !!me.is_staff,
      isSuperuser,
    },
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: {},
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      accessToken: null,
      refreshToken: null,
      tokenType: 'Bearer',
      tokenExpiresAt: null,

      setLoading: (loading) => set({ isLoading: loading }),
      startLogout: () => set({ isLoggingOut: true }),

      login: async (username: string, password: string) => {
        const tokenRes = await loginApi(username, password);
        const tokenType = tokenRes.token_type || 'Bearer';
        const expiresAt = Date.now() + tokenRes.expires_in * 1000;
        set({
          accessToken: tokenRes.access_token,
          refreshToken: tokenRes.refresh_token,
          tokenType,
          tokenExpiresAt: expiresAt,
        });

        // Truyền token trực tiếp — tránh race condition khi interceptor đọc store cũ
        await fetchAndVerifyStaffUser(set, tokenRes.access_token, tokenType);
        await establishLmsSessionFromToken();
        get().scheduleTokenRefresh();
      },

      loginWithGoogle: async (edxTokens) => {
        const tokenType = edxTokens.token_type || 'Bearer';
        const expiresAt = Date.now() + edxTokens.expires_in * 1000;
        set({
          accessToken: edxTokens.access_token,
          refreshToken: edxTokens.refresh_token,
          tokenType,
          tokenExpiresAt: expiresAt,
        });

        await fetchAndVerifyStaffUser(set, edxTokens.access_token, tokenType);
        await establishLmsSessionFromToken();
        get().scheduleTokenRefresh();
      },

      loginWithMicrosoft: async (edxTokens) => {
        const tokenType = edxTokens.token_type || 'Bearer';
        const expiresAt = Date.now() + edxTokens.expires_in * 1000;
        set({
          accessToken: edxTokens.access_token,
          refreshToken: edxTokens.refresh_token,
          tokenType,
          tokenExpiresAt: expiresAt,
        });

        await fetchAndVerifyStaffUser(set, edxTokens.access_token, tokenType);
        await establishLmsSessionFromToken();
        get().scheduleTokenRefresh();
      },

      loginWithKeycloak: async (edxTokens) => {
        const tokenType = edxTokens.token_type || 'Bearer';
        const expiresAt = Date.now() + edxTokens.expires_in * 1000;
        set({
          accessToken: edxTokens.access_token,
          refreshToken: edxTokens.refresh_token,
          tokenType,
          tokenExpiresAt: expiresAt,
        });

        await fetchAndVerifyStaffUser(set, edxTokens.access_token, tokenType);
        await establishLmsSessionFromToken();
        get().scheduleTokenRefresh();
      },

      logout: async () => {
        clearRefreshTimer();
        set({ isLoggingOut: true });
        await clearLmsSession();
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenType: 'Bearer',
          tokenExpiresAt: null,
          user: null,
          permissions: {},
          isLoggingOut: false,
        });
      },

      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),

      setPermissions: (permissions) => set({ permissions }),

      hasPermission: (moduleCode, tabCode, action) => {
        const state = get();
        if (state.user?.role === 'superadmin') return true;
        const perm = state.permissions?.[moduleCode]?.[tabCode];
        // Shell mode: Nếu chưa có cấu hình quyền cho module này → mặc định cho phép truy cập
        if (!perm) return true;
        const actionKey = action.replace('can_', '') as 'view' | 'add' | 'edit' | 'delete';
        return perm[actionKey] === true;
      },

      performTokenRefresh: async (): Promise<boolean> => {
        const { refreshToken: currentRefreshToken } = get();
        if (!currentRefreshToken) return false;
        try {
          const tokenRes = await refreshTokenApi(currentRefreshToken);
          const expiresAt = Date.now() + tokenRes.expires_in * 1000;
          set({
            accessToken: tokenRes.access_token,
            refreshToken: tokenRes.refresh_token,
            tokenType: tokenRes.token_type || 'Bearer',
            tokenExpiresAt: expiresAt,
          });
          get().scheduleTokenRefresh();
          return true;
        } catch { return false; }
      },

      scheduleTokenRefresh: () => {
        clearRefreshTimer();
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return;
        const delay = tokenExpiresAt - Date.now() - config.tokenRefreshBufferMs;
        if (delay <= 0) {
          get().performTokenRefresh().then((ok) => { if (!ok) get().logout(); });
          return;
        }
        refreshTimerId = setTimeout(() => {
          get().performTokenRefresh().then((ok) => { if (!ok) get().logout(); });
        }, delay);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: encryptedStorage,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenType: state.tokenType,
        tokenExpiresAt: state.tokenExpiresAt,
        user: state.user,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && state?.tokenExpiresAt) {
          if (Date.now() >= state.tokenExpiresAt) {
            state.performTokenRefresh().then((ok) => { if (!ok) state.logout(); });
          } else {
            state.scheduleTokenRefresh();
            establishLmsSessionFromToken();
          }
        }
      },
    }
  )
);
