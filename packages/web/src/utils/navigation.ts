export function setSearchParam(name: string, value: string | null) {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get(name) === value) {
    return;
  }
  if (!value) {
    searchParams.delete(name);
  } else {
    searchParams.set(name, value);
  }
  history.pushState(
    null,
    "",
    `?${searchParams.toString()}${window.location.hash}`
  );
  window.dispatchEvent(
    new CustomEvent("navigate:search-params", { detail: { name, value } })
  );
}
