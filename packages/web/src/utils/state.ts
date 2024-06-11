export function get(key: string) {
  return sessionStorage.getItem(key);
}

export function set(key: string, value: string) {
  sessionStorage.setItem(key, value);
  window.dispatchEvent(
    new StorageEvent("state:update", { key, newValue: value })
  );
}

export function remove(key: string) {
  sessionStorage.removeItem(key);
  window.dispatchEvent(
    new StorageEvent("state:update", { key, newValue: null })
  );
}

export function clear() {
  sessionStorage.clear();
  window.dispatchEvent(new StorageEvent("state:update"));
}
