type Params = Record<string, string | null>;

export function setSearchParams(params: Params) {
  const searchParams = new URLSearchParams(window.location.search);
  const entries = Object.entries(params);
  for (const [key, value] of entries) {
    if (!value) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  }
  history.pushState(
    null,
    "",
    `${window.location.pathname}${
      searchParams.size > 0 ? `?${searchParams.toString()}` : ""
    }${window.location.hash}`
  );
  window.dispatchEvent(new CustomEvent("navigate:search-params"));
}
