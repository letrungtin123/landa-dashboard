// ============================================================
// API Types — Kiểu dữ liệu cho Open edX API
// ============================================================

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface UserMe {
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface UserAccount {
  username: string;
  name: string;
  email: string;
  date_joined: string;
  profile_image: {
    has_image: boolean;
    image_url_full: string;
    image_url_medium: string;
  };
}
