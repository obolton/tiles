import { reactive } from "./reactivity";

type Value = string | number | boolean | object;

const cache = new Map<string, Value | null>();

// Session storage

function getFromStorage<T extends Value>(key: string) {
  const valueAsString = sessionStorage.getItem(key);
  return typeof valueAsString === "string"
    ? (JSON.parse(valueAsString) as T)
    : null;
}

export function get<T extends Value>(key: string) {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }
  const value = getFromStorage<T>(key);
  cache.set(key, value);
  return value;
}

export function has(key: string) {
  return sessionStorage.getItem(key) !== null;
}

export function set(key: string, value: Value) {
  const valueAsString = JSON.stringify(value);
  sessionStorage.setItem(key, valueAsString);
  cache.set(key, value);
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
  cache.delete(key);
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
  if (!key) {
    return null;
  }
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

export function persistent<T extends Value>(key: string, defaultValue: T) {
  if (typeof localStorage === "undefined") {
    return reactive<T>(defaultValue);
  }
  const stored = getPersistent<T>(key);
  const value = reactive<T>(stored ?? defaultValue);
  value.subscribe(() => {
    setPersistent(key, value.value);
  });
  return value;
}

// Shared

export function clear() {
  sessionStorage.clear();
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("state:update"));
  window.dispatchEvent(new StorageEvent("state:update-persistent"));
}
