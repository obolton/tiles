/**
 * Safely serialize data to JSON for embedding in HTML script tags.
 *
 * Escapes characters that could break out of the script context:
 * - `<` prevents `</script>` from closing the tag
 * - `>` prevents other HTML injection vectors
 * - `&` prevents HTML entity injection
 *
 * Uses Unicode escapes which are valid JSON and correctly parsed by JSON.parse().
 */
export function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
