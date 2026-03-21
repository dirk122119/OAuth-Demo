/**
 * 僅由 middleware 寫入，供 /protected 等 Server 下游讀取本請求的 access（避免 RSC 仍讀到過期 cookie）。
 * 勿在客戶端依賴此 header。
 */
export const OAUTH_INTERNAL_ACCESS_HEADER = "x-oauth-internal-access";
