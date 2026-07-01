export function setSearchParams(src: string, params: Record<string, string>) {
  const url = new URL(src);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
