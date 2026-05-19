// ============================================================
// Env Config — Xác thực biến môi trường bắt buộc
// App CRASH ngay nếu thiếu biến — không fallback, không đoán
// ============================================================

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[ENV] Thiếu biến môi trường: ${key}. Kiểm tra file .env.local.`
    );
  }
  return value.trim();
}

function requireEnvNumber(key: string, fallback?: number): number {
  const raw = import.meta.env[key];
  if (!raw && fallback !== undefined) return fallback;
  const num = Number(raw);
  if (isNaN(num) || num <= 0) {
    throw new Error(`[ENV] ${key} phải là số dương, nhận: "${raw}"`);
  }
  return num;
}

function requireUrl(key: string): string {
  const url = requireEnv(key);
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(`[ENV] ${key} phải là URL hợp lệ, nhận: "${url}"`);
  }
  return url.replace(/\/+$/, "");
}

export const config = {
  lmsBaseUrl: requireUrl("VITE_OPENEDX_LMS_URL"),
  cmsBaseUrl: requireUrl("VITE_OPENEDX_CMS_URL"),
  clientId: requireEnv("VITE_OPENEDX_CLIENT_ID"),
  clientSecret: requireEnv("VITE_OPENEDX_CLIENT_SECRET"),
  tokenRefreshBufferMs: requireEnvNumber("VITE_TOKEN_REFRESH_BUFFER_MS", 300_000),
  apiTimeoutMs: requireEnvNumber("VITE_API_TIMEOUT_MS", 30_000),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim(),
  microsoftClientId: (import.meta.env.VITE_MICROSOFT_CLIENT_ID || "").trim(),
  microsoftAuthority: (
    import.meta.env.VITE_MICROSOFT_AUTHORITY ||
    "https://login.microsoftonline.com/common"
  ).trim(),

  useRelativeApi: import.meta.env.VITE_USE_RELATIVE_API === "true",
  publicOrigin: (import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin).trim(),

  get apiBaseUrl(): string {
    return this.useRelativeApi ? "" : (import.meta.env.DEV ? "" : this.lmsBaseUrl);
  },
} as const;
