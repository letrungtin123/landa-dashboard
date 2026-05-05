// ============================================================
// Microsoft Auth API — Azure AD OAuth2 popup login
// id_token flow (không dùng access_token, không cần Graph API)
// ============================================================

import axios from "axios";
import { config } from "@/config/env";
import type { OAuthTokenResponse } from "./types";

interface MicrosoftUserInfo {
  email: string;
  displayName: string;
  givenName?: string;
  surname?: string;
}

export interface MicrosoftLoginResult {
  tokens: OAuthTokenResponse;
  isNewUser: boolean;
}

export type MicrosoftAuthErrorCode =
  | "exchange_failed"
  | "graph_api_failed"
  | "registration_failed"
  | "duplicate_email"
  | "network_error"
  | "timeout"
  | "popup_cancelled"
  | "interaction_required";

export class MicrosoftAuthError extends Error {
  public readonly code: MicrosoftAuthErrorCode;
  public readonly originalError?: unknown;

  constructor(message: string, code: MicrosoftAuthErrorCode, originalError?: unknown) {
    super(message);
    this.name = "MicrosoftAuthError";
    this.code = code;
    this.originalError = originalError;
  }
}

const FLOW_TIMEOUT_MS = 30_000;

/** Exchange Microsoft id_token → edX OAuth2 tokens */
export async function exchangeMicrosoftToken(
  microsoftIdToken: string,
  signal?: AbortSignal
): Promise<OAuthTokenResponse> {
  const { data } = await axios.post<OAuthTokenResponse>(
    "/oauth2/exchange_access_token/azuread-oauth2/",
    new URLSearchParams({
      access_token: microsoftIdToken,
      client_id: config.clientId,
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: config.apiTimeoutMs,
      signal,
    }
  );
  return data;
}

/** Decode JWT id_token → user info */
function getMicrosoftUserInfoFromIdToken(idToken: string): MicrosoftUserInfo {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new MicrosoftAuthError("Invalid JWT", "graph_api_failed");

  const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  const email = payload.email || payload.preferred_username || payload.upn || "";
  if (!email) throw new MicrosoftAuthError("Không lấy được email.", "graph_api_failed");

  return {
    email,
    displayName: payload.name || email.split("@")[0],
    givenName: payload.given_name,
    surname: payload.family_name,
  };
}

function generateUsername(email: string): string {
  const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  return `${prefix || "user"}_${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateSecurePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const arr = new Uint32Array(16);
  crypto.getRandomValues(arr);
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[arr[i] % chars.length];
  for (let i = 8; i < 12; i++) pw += upper[arr[i] % upper.length];
  for (let i = 12; i < 14; i++) pw += digits[arr[i] % digits.length];
  for (let i = 14; i < 16; i++) pw += special[arr[i] % special.length];
  return pw;
}

async function registerNewUser(userInfo: MicrosoftUserInfo, signal?: AbortSignal): Promise<void> {
  const username = generateUsername(userInfo.email);
  const name = userInfo.displayName || userInfo.email.split("@")[0];
  const formData = new URLSearchParams({
    email: userInfo.email, name, username,
    password: generateSecurePassword(),
    honor_code: "true", terms_of_service: "true",
  });

  try {
    await axios.post("/api/user/v2/account/registration/", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: config.apiTimeoutMs, signal, withCredentials: false,
    });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const { status, data: d } = err.response;
      if (status === 409 && d?.email) throw new MicrosoftAuthError("Email đã tồn tại.", "duplicate_email", err);
      if (status === 409 && d?.username && !d?.email) {
        formData.set("username", generateUsername(userInfo.email));
        await axios.post("/api/user/v2/account/registration/", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: config.apiTimeoutMs, signal, withCredentials: false,
        });
        return;
      }
      throw new MicrosoftAuthError("Không thể tạo tài khoản.", "registration_failed", err);
    }
    throw err;
  }
}

/** Luồng chính: Microsoft Login hoặc Register */
export async function microsoftLoginOrRegister(
  microsoftIdToken: string
): Promise<MicrosoftLoginResult> {
  const controller = new AbortController();
  const { signal } = controller;
  const timeoutId = setTimeout(() => controller.abort(), FLOW_TIMEOUT_MS);

  try {
    // Bước 1: Exchange (user đã tồn tại)
    try {
      const tokens = await exchangeMicrosoftToken(microsoftIdToken, signal);
      return { tokens, isNewUser: false };
    } catch (err) {
      if (signal.aborted) throw new MicrosoftAuthError("Hết thời gian.", "timeout");
      // Exchange fail → thử đăng ký
      void err;
    }

    // Bước 2: Decode id_token → user info
    const userInfo = getMicrosoftUserInfoFromIdToken(microsoftIdToken);

    // Bước 3: Đăng ký
    let isDupe = false;
    try {
      await registerNewUser(userInfo, signal);
    } catch (err) {
      if (err instanceof MicrosoftAuthError && err.code === "duplicate_email") {
        isDupe = true;
      } else if (err instanceof MicrosoftAuthError) throw err;
      else throw new MicrosoftAuthError("Không thể tạo tài khoản.", "registration_failed", err);
    }

    // Bước 4: Exchange lại
    try {
      const tokens = await exchangeMicrosoftToken(microsoftIdToken, signal);
      return { tokens, isNewUser: !isDupe };
    } catch (err) {
      if (isDupe) {
        throw new MicrosoftAuthError(
          "Tài khoản tồn tại nhưng chưa liên kết Microsoft. Đăng nhập bằng mật khẩu.",
          "duplicate_email", err
        );
      }
      throw new MicrosoftAuthError("Đăng nhập thất bại.", "exchange_failed", err);
    }
  } catch (err) {
    if (err instanceof MicrosoftAuthError) throw err;
    if (axios.isCancel(err) || signal.aborted) throw new MicrosoftAuthError("Hết thời gian.", "timeout");
    throw new MicrosoftAuthError("Lỗi không xác định.", "exchange_failed", err);
  } finally {
    clearTimeout(timeoutId);
  }
}

