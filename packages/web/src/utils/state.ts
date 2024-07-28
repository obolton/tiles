type Value = string | number | boolean | object;

// Session storage

export function get<T extends Value>(key: string) {
  const valueAsString = sessionStorage.getItem(key);
  return typeof valueAsString === "string"
    ? (JSON.parse(valueAsString) as T)
    : null;
}

export function has(key: string) {
  return sessionStorage.getItem(key) !== null;
}

export function set(key: string, value: Value) {
  const valueAsString = JSON.stringify(value);
  sessionStorage.setItem(key, valueAsString);
  window.dispatchEvent(
    new StorageEvent("state:update", {
      key,
      newValue: valueAsString,
      storageArea: sessionStorage,
    }),
  );
}

export function remove(key: string) {
  sessionStorage.removeItem(key);
  window.dispatchEvent(
    new StorageEvent("state:update", {
      key,
      newValue: null,
      storageArea: sessionStorage,
    }),
  );
}

// Persistent storage

export function getPersistent<T extends Value>(path: string) {
  const [key, childPath] = path.split(".");
  const valueAsString = localStorage.getItem(key);
  const value =
    typeof valueAsString === "string" ? JSON.parse(valueAsString) : null;
  if (!value) {
    return null;
  }
  return childPath ? (value[childPath] as T) : (value as T);
}

export function hasPersistent(key: string) {
  return localStorage.getItem(key) !== null;
}

export function setPersistent(key: string, value: Value) {
  const valueAsString = JSON.stringify(value);
  localStorage.setItem(key, valueAsString);
  window.dispatchEvent(
    new StorageEvent("state:update-persistent", {
      key,
      newValue: valueAsString,
      storageArea: localStorage,
    }),
  );
}

export function removePersistent(key: string) {
  localStorage.removeItem(key);
  window.dispatchEvent(
    new StorageEvent("state:update-persistent", {
      key,
      newValue: null,
      storageArea: localStorage,
    }),
  );
}

// Shared

export function clear() {
  sessionStorage.clear();
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("state:update"));
  window.dispatchEvent(new StorageEvent("state:update-persistent"));
}
