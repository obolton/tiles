import { reactive } from "./value";

type Value = string | number | boolean | object;

function read<T extends Value>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Failed to read "${key}" from localStorage`, error);
    }
    return null;
  }
}

function write(key: string, value: Value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Failed to write "${key}" to localStorage`, error);
    }
  }
}

export function persistent<T extends Value>(key: string, defaultValue: T) {
  if (typeof localStorage === "undefined") {
    return reactive<T>(defaultValue);
  }

  const value = reactive<T>(read<T>(key) ?? defaultValue);
  value.subscribe(() => write(key, value.value));

  return value;
}
