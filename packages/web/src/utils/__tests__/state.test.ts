import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  get,
  has,
  set,
  remove,
  getPersistent,
  hasPersistent,
  setPersistent,
  removePersistent,
  clear,
} from "../state";

beforeEach(() => {
  clear();
});

describe("state", () => {
  describe("get", () => {
    test("returns null for non-existent key", () => {
      expect(get("nonexistent")).toBeNull();
    });

    test("returns stored string value", () => {
      sessionStorage.setItem("key", JSON.stringify("hello"));
      expect(get("key")).toBe("hello");
    });

    test("returns stored number value", () => {
      sessionStorage.setItem("key", JSON.stringify(42));
      expect(get("key")).toBe(42);
    });

    test("returns stored boolean value", () => {
      sessionStorage.setItem("key", JSON.stringify(true));
      expect(get("key")).toBe(true);
    });

    test("returns stored object value", () => {
      sessionStorage.setItem("key", JSON.stringify({ foo: "bar" }));
      expect(get("key")).toEqual({ foo: "bar" });
    });

    test("caches value after first read", () => {
      sessionStorage.setItem("key", JSON.stringify("original"));
      expect(get("key")).toBe("original");

      // Change storage directly - cached value should persist
      sessionStorage.setItem("key", JSON.stringify("modified"));
      expect(get("key")).toBe("original");
    });
  });

  describe("has", () => {
    test("returns false for non-existent key", () => {
      expect(has("nonexistent")).toBe(false);
    });

    test("returns true for existing key", () => {
      sessionStorage.setItem("key", JSON.stringify("value"));
      expect(has("key")).toBe(true);
    });
  });

  describe("set", () => {
    test("stores a string value", () => {
      set("key", "hello");
      expect(sessionStorage.getItem("key")).toBe('"hello"');
    });

    test("stores a number value", () => {
      set("key", 123);
      expect(sessionStorage.getItem("key")).toBe("123");
    });

    test("stores an object value", () => {
      set("key", { a: 1 });
      expect(sessionStorage.getItem("key")).toBe('{"a":1}');
    });

    test("dispatches state:update event", () => {
      const listener = vi.fn();
      window.addEventListener("state:update", listener);

      set("key", "value");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]![0] as StorageEvent;
      expect(event.key).toBe("key");
      expect(event.newValue).toBe('"value"');
      expect(event.storageArea).toBe(sessionStorage);

      window.removeEventListener("state:update", listener);
    });

    test("updates cache so subsequent get returns new value", () => {
      set("key", "first");
      expect(get("key")).toBe("first");

      set("key", "second");
      expect(get("key")).toBe("second");
    });
  });

  describe("remove", () => {
    test("removes item from storage", () => {
      sessionStorage.setItem("key", JSON.stringify("value"));
      remove("key");
      expect(sessionStorage.getItem("key")).toBeNull();
    });

    test("dispatches state:update event with null newValue", () => {
      sessionStorage.setItem("key", JSON.stringify("value"));
      const listener = vi.fn();
      window.addEventListener("state:update", listener);

      remove("key");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]![0] as StorageEvent;
      expect(event.key).toBe("key");
      expect(event.newValue).toBeNull();

      window.removeEventListener("state:update", listener);
    });

    test("clears cache so subsequent get returns null", () => {
      set("key", "value");
      expect(get("key")).toBe("value");

      remove("key");
      expect(get("key")).toBeNull();
    });
  });
});

describe("persistent storage", () => {
  describe("getPersistent", () => {
    test("returns null for non-existent key", () => {
      expect(getPersistent("nonexistent")).toBeNull();
    });

    test("returns stored value for simple key", () => {
      localStorage.setItem("key", JSON.stringify({ data: "value" }));
      expect(getPersistent("key")).toEqual({ data: "value" });
    });

    test("returns nested value for dot-notation path", () => {
      localStorage.setItem("parent", JSON.stringify({ child: "nested" }));
      expect(getPersistent("parent.child")).toBe("nested");
    });

    test("returns null for empty key", () => {
      expect(getPersistent("")).toBeNull();
    });

    test("returns undefined when parent exists but child path does not", () => {
      localStorage.setItem("obj", JSON.stringify({ a: 1 }));
      expect(getPersistent("obj.nonexistent")).toBeUndefined();
    });
  });

  describe("hasPersistent", () => {
    test("returns false for non-existent key", () => {
      expect(hasPersistent("nonexistent")).toBe(false);
    });

    test("returns true for existing key", () => {
      localStorage.setItem("key", JSON.stringify("value"));
      expect(hasPersistent("key")).toBe(true);
    });
  });

  describe("setPersistent", () => {
    test("stores value in localStorage", () => {
      setPersistent("key", { foo: "bar" });
      expect(localStorage.getItem("key")).toBe('{"foo":"bar"}');
    });

    test("dispatches state:update-persistent event", () => {
      const listener = vi.fn();
      window.addEventListener("state:update-persistent", listener);

      setPersistent("key", "value");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]![0] as StorageEvent;
      expect(event.key).toBe("key");
      expect(event.newValue).toBe('"value"');
      expect(event.storageArea).toBe(localStorage);

      window.removeEventListener("state:update-persistent", listener);
    });
  });

  describe("removePersistent", () => {
    test("removes item from localStorage", () => {
      localStorage.setItem("key", JSON.stringify("value"));
      removePersistent("key");
      expect(localStorage.getItem("key")).toBeNull();
    });

    test("dispatches state:update-persistent event", () => {
      localStorage.setItem("key", JSON.stringify("value"));
      const listener = vi.fn();
      window.addEventListener("state:update-persistent", listener);

      removePersistent("key");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]![0] as StorageEvent;
      expect(event.key).toBe("key");
      expect(event.newValue).toBeNull();

      window.removeEventListener("state:update-persistent", listener);
    });
  });
});

describe("clear", () => {
  test("clears both sessionStorage and localStorage", () => {
    sessionStorage.setItem("session-item", "value");
    localStorage.setItem("local-item", "value");

    clear();

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  test("clears internal cache", () => {
    set("key", "value");
    expect(get("key")).toBe("value");

    clear();

    expect(get("key")).toBeNull();
  });

  test("dispatches both update events", () => {
    const sessionListener = vi.fn();
    const persistentListener = vi.fn();
    window.addEventListener("state:update", sessionListener);
    window.addEventListener("state:update-persistent", persistentListener);

    clear();

    expect(sessionListener).toHaveBeenCalledTimes(1);
    expect(persistentListener).toHaveBeenCalledTimes(1);

    window.removeEventListener("state:update", sessionListener);
    window.removeEventListener("state:update-persistent", persistentListener);
  });
});
