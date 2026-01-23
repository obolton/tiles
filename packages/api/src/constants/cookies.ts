type SecureCookie = `__Host-${string}` | `__Secure-${string}`;

export const SESSION_COOKIE_NAME: SecureCookie = "__Secure-session";
export const SIGNED_IN_FLAG_COOKIE_NAME: SecureCookie = "__Secure-signed-in";
