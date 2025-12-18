import { describe, test, expect } from "vitest";
import { findTextChange } from "../sync";

describe("findTextChange", () => {
  test("returns null when strings are identical", () => {
    const result = findTextChange("hello", "hello");
    expect(result).toBeNull();
  });

  test("returns null for empty strings that are identical", () => {
    const result = findTextChange("", "");
    expect(result).toBeNull();
  });

  test("detects insertion at the end", () => {
    const result = findTextChange("hello", "hello world");
    expect(result).toEqual({
      from: 5,
      to: 5,
      insert: " world",
    });
  });

  test("detects insertion at the beginning", () => {
    const result = findTextChange("world", "hello world");
    expect(result).toEqual({
      from: 0,
      to: 0,
      insert: "hello ",
    });
  });

  test("detects insertion in the middle", () => {
    const result = findTextChange("helloworld", "hello world");
    expect(result).toEqual({
      from: 5,
      to: 5,
      insert: " ",
    });
  });

  test("detects deletion at the end", () => {
    const result = findTextChange("hello world", "hello");
    expect(result).toEqual({
      from: 5,
      to: 11,
      insert: "",
    });
  });

  test("detects deletion at the beginning", () => {
    const result = findTextChange("hello world", "world");
    expect(result).toEqual({
      from: 0,
      to: 6,
      insert: "",
    });
  });

  test("detects deletion in the middle", () => {
    const result = findTextChange("hello world", "helloworld");
    expect(result).toEqual({
      from: 5,
      to: 6,
      insert: "",
    });
  });

  test("detects replacement", () => {
    const result = findTextChange("hello world", "hello there");
    expect(result).toEqual({
      from: 6,
      to: 11,
      insert: "there",
    });
  });

  test("detects single character insertion", () => {
    const result = findTextChange("helo", "hello");
    expect(result).toEqual({
      from: 3,
      to: 3,
      insert: "l",
    });
  });

  test("detects single character deletion", () => {
    const result = findTextChange("hello", "helo");
    expect(result).toEqual({
      from: 3,
      to: 4,
      insert: "",
    });
  });

  test("detects complete replacement", () => {
    const result = findTextChange("abc", "xyz");
    expect(result).toEqual({
      from: 0,
      to: 3,
      insert: "xyz",
    });
  });

  test("handles inserting into empty string", () => {
    const result = findTextChange("", "hello");
    expect(result).toEqual({
      from: 0,
      to: 0,
      insert: "hello",
    });
  });

  test("handles deleting to empty string", () => {
    const result = findTextChange("hello", "");
    expect(result).toEqual({
      from: 0,
      to: 5,
      insert: "",
    });
  });

  test("handles multiline text insertion", () => {
    const result = findTextChange("aaa\nbbb", "aaa\nccc\nbbb");
    expect(result).toEqual({
      from: 4,
      to: 4,
      insert: "ccc\n",
    });
  });

  test("handles multiline text deletion", () => {
    const result = findTextChange("aaa\nccc\nbbb", "aaa\nbbb");
    expect(result).toEqual({
      from: 4,
      to: 8,
      insert: "",
    });
  });
});
