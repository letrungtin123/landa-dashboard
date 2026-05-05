// ============================================================
// Open edX URL Helpers
// Dev: relative path → Vite proxy xử lý
// Prod: absolute URL từ env
// ============================================================

import { config } from "./env";

function ensureLeadingSlash(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function lmsUrl(path: string): string {
  const normalized = ensureLeadingSlash(path);
  return import.meta.env.DEV ? normalized : `${config.lmsBaseUrl}${normalized}`;
}
