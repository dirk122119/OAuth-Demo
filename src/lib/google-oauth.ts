/**
 * 客戶端用：OAuth 教學用常數。換票與 UserInfo 請走 /api/auth/*（HttpOnly session）。
 */

/** SessionStorage keys（僅 pending 教學用；token 在 HttpOnly cookie） */
export const STORAGE_KEYS = {
  /** Set before redirect to Google; cleared on success / logout */
  OAUTH_PENDING_GOOGLE: "oauth_pending_google",
  /** 本輪登入 callback 的 code（僅教學展示，logout / 重產 PKCE 時清除） */
  OAUTH_LAST_DISPLAY_CODE: "oauth_last_display_code",
} as const;
