// ============================================================
// Auth API — Login, Refresh, User Info
// KHÔNG LOG DỮ LIỆU NHẠY CẢM (token, email, password)
// ============================================================

import axios from "axios";
import { config } from "@/config/env";
import { lmsUrl } from "@/config/openedx";
import { apiClient } from "./client";
import type { OAuthTokenResponse, UserMe, UserAccount } from "./types";

/** OAuth2 password grant → access_token + refresh_token */
export async function loginApi(
  username: string,
  password: string
): Promise<OAuthTokenResponse> {
  const { data } = await axios.post<OAuthTokenResponse>(
    lmsUrl("/oauth2/access_token"),
    new URLSearchParams({
      grant_type: "password",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username,
      password,
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: config.apiTimeoutMs,
    }
  );
  return data;
}

/** Refresh access token — single-use refresh token */
export async function refreshTokenApi(
  refreshToken: string
): Promise<OAuthTokenResponse> {
  const { data } = await axios.post<OAuthTokenResponse>(
    lmsUrl("/oauth2/access_token"),
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: config.apiTimeoutMs,
    }
  );
  return data;
}

/**
 * Lấy thông tin user hiện tại.
 * /api/user/v1/me trả về { username, is_staff }.
 * is_superuser lấy thêm từ admin API nếu cần.
 */
export async function getUserMe(): Promise<UserMe> {
  const { data } = await apiClient.get("/api/user/v1/me");

  let email = "";
  try {
    const acct = await apiClient.get(`/api/user/v1/accounts/${data.username}`);
    email = acct.data.email || "";
  } catch {
    // Email không bắt buộc cho flow chính
  }

  return {
    username: data.username,
    email,
    is_staff: data.is_staff === true,
    is_superuser: data.is_superuser === true,
  };
}

/** Lấy chi tiết tài khoản */
export async function getUserAccount(username: string): Promise<UserAccount> {
  const { data } = await apiClient.get(`/api/user/v1/accounts/${username}`);
  return data;
}

/** Tạo LMS session từ access token (cần cho embedded views) */
export async function establishLmsSessionFromToken(): Promise<void> {
  try {
    await apiClient.get("/api/user/v1/me", { withCredentials: true });
  } catch {
    // Bỏ qua — session không bắt buộc cho admin panel
  }
}

/** Xóa LMS session */
export async function clearLmsSession(): Promise<void> {
  try {
    // Dùng apiClient để có CSRF header tự động
    await apiClient.get("/logout", {
      withCredentials: true,
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: (status) => status < 500,
    });
  } catch {
    // Bỏ qua — server logout không critical
  }
}
