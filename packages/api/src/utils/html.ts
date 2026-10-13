const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes a string for safe interpolation into HTML text and attribute values. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}
