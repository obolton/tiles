/**
 * ARIA attributes that accept boolean values but are serialized as "true"/"false" strings.
 * Used by dom.ts and server.ts for runtime attribute handling.
 */
export const BOOLEAN_STRING_ATTRIBUTES = new Set([
  "aria-checked",
  "aria-current",
  "aria-expanded",
  "aria-pressed",
  "aria-selected",
]);
