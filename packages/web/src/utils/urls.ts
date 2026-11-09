export function setSearchParams(src: string, params: Record<string, string>) {
  const url = new URL(src);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

/**
 * A compact, human-readable form of a URL for display: the scheme and any trailing slash are
 * dropped, so `https://example.com/` becomes `example.com`.
 */
export function formatUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return url;
  }
  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  return `${parsed.host}${path === "/" ? "" : path}`;
}
