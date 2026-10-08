import { describe, expect, test } from "vitest";
import { MIN_TEXT_SIZE, MAX_TEXT_SIZE } from "@/constants/formatting";
import { schema } from "../schema";

describe("schema", () => {
  describe("size mark", () => {
    test.each([MIN_TEXT_SIZE, 1, 1.25, MAX_TEXT_SIZE])("accepts size %s", (size) => {
      expect(schema.marks.size.create({ size }).attrs.size).toBe(size);
    });

    test.each([MIN_TEXT_SIZE - 0.1, MAX_TEXT_SIZE + 0.1, Number.NaN, "1", null])(
      "rejects size %s",
      (size) => {
        expect(() => schema.marks.size.create({ size })).toThrow(RangeError);
      },
    );
  });
});
