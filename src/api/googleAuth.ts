// ============================================================
// Google Auth — Exchange token + auto-register
// Copy logic từ FE-5173, giữ nguyên pipeline
// ============================================================

import axios from "axios";
import { config } from "@/config/env";
import type { OAuthTokenResponse } from "./types";

interface GoogleUserInfo {
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleLoginResult {
  tokens: OAuthTokenResponse;
  isNewUser: boolean;
}

export type GoogleAuthErrorCode =
  | "exchange_failed"
  | "google_api_failed"
  | "registration_failed"
  | "duplicate_email"
  | "network_error"
  | "timeout";

export class GoogleAuthError extends Error {
  public readonly code: GoogleAuthErrorCode;
  public readonly originalError?: unknown;

  constructor(message: string, code: GoogleAuthErrorCode, originalError?: unknown) {
    super(message);
    this.name = "GoogleAuthError";
    this.code = code;
    this.originalError = originalError;
  }
}

const FLOW_TIMEOUT_MS = 30_000;

/** Exchange Google access token → edX OAuth2 tokens */
export async function exchangeGoogleToken(
  googleAccessToken: string,
  signal?: AbortSignal
): Promise<OAuthTokenResponse> {
  const { data } = await axios.post<OAuthTokenResponse>(
    "/oauth2/exchange_access_token/google-oauth2/",
    new URLSearchParams({
      access_token: googleAccessToken,
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

async function getGoogleUserInfo(
  googleAccessToken: string,
  signal?: AbortSignal
): Promise<GoogleUserInfo> {
  const { data } = await axios.get<GoogleUserInfo>(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
      timeout: 10_000,
      signal,
    }
  );
  if (!data.email) {
    throw new GoogleAuthError("Không thể lấy email từ Google", "google_api_failed");
  }
  return data;
}

function generateUsername(email: string): string {
  const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix || "user"}_${suffix}`;
}

async function registerNewUser(
  userInfo: GoogleUserInfo,
  signal?: AbortSignal
): Promise<void> {
  const username = generateUsername(userInfo.email);
  const name = userInfo.name || userInfo.email.split("@")[0];
  const tempPassword =
    Math.random().toString(36).slice(-8) +
    Math.random().toString(36).slice(-8).toUpperCase() +
    "!@#";

  const formData = new URLSearchParams({
    email: userInfo.email,
    name,
    username,
    password: tempPassword,
    honor_code: "true",
    terms_of_service: "true",
  });

  try {
    await axios.post("/api/user/v2/account/registration/", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: config.apiTimeoutMs,
      signal,
      withCredentials: false,
    });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const { status, data: errorData } = err.response;
      if (status === 409 && errorData?.email) {
        throw new GoogleAuthError("Email đã được sử dụng.", "duplicate_email", err);
      }
      if (status === 409 && errorData?.username && !errorData?.email) {
        formData.set("username", generateUsername(userInfo.email));
        await axios.post("/api/user/v2/account/registration/", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: config.apiTimeoutMs,
          signal,
          withCredentials: false,
        });
        return;
      }
      throw new GoogleAuthError("Không thể tạo tài khoản.", "registration_failed", err);
    }
    throw err;
  }
}

/** Luồng chính: Google Login hoặc Register */
export async function googleLoginOrRegister(
  googleAccessToken: string
): Promise<GoogleLoginResult> {
  const controller = new AbortController();
  const { signal } = controller;
  const timeoutId = setTimeout(() => controller.abort(), FLOW_TIMEOUT_MS);

  try {
    // Thử exchange (user đã tồn tại)
    try {
      const tokens = await exchangeGoogleToken(googleAccessToken, signal);
      return { tokens, isNewUser: false };
    } catch {
      if (signal.aborted) throw new GoogleAuthError("Hết thời gian.", "timeout");
    }

    // Lấy profile + đăng ký
    const userInfo = await getGoogleUserInfo(googleAccessToken, signal);

    try {
      await registerNewUser(userInfo, signal);
    } catch (err) {
      if (err instanceof GoogleAuthError) throw err;
      throw new GoogleAuthError("Không thể tạo tài khoản.", "registration_failed", err);
    }

    // Exchange lại
    try {
      const tokens = await exchangeGoogleToken(googleAccessToken, signal);
      return { tokens, isNewUser: true };
    } catch (err) {
      throw new GoogleAuthError("Đăng nhập thất bại.", "exchange_failed", err);
    }
  } catch (err) {
    if (err instanceof GoogleAuthError) throw err;
    if (axios.isCancel(err) || signal.aborted) {
      throw new GoogleAuthError("Hết thời gian.", "timeout");
    }
    throw new GoogleAuthError("Lỗi không xác định.", "exchange_failed", err);
  } finally {
    clearTimeout(timeoutId);
  }
}
