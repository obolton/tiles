import { reactive } from "reactivity";

type Value = string | number | boolean | object;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
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

  const value = reactive<T>((read(key) as T | null) ?? defaultValue);
  value.subscribe(() => write(key, value.value));

  return value;
}
