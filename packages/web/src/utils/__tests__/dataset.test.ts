import { describe, expect, test } from "vitest";
import Dataset from "../dataset";

interface TestProperty {
  type: string;
  required?: boolean;
}

describe("Dataset", () => {
  describe("constructor", () => {
    test("initializes with empty properties and records", () => {
      const dataset = new Dataset<TestProperty>([], []);
      expect(dataset.length.value).toBe(0);
    });

    test("initializes with provided properties and records", () => {
      const properties: [string, TestProperty][] = [["prop1", { type: "string" }]];
      const records: [string, Record<string, unknown>][] = [
        ["rec1", { prop1: "value1" }],
        ["rec2", { prop1: "value2" }],
      ];
      const dataset = new Dataset(properties, records);
      expect(dataset.length.value).toBe(2);
    });
  });

  describe("records", () => {
    test("get returns value for existing record and property", () => {
      const records: [string, Record<string, unknown>][] = [["rec1", { name: "Alice", age: 30 }]];
      const dataset = new Dataset<TestProperty>([], records);
      expect(dataset.get("rec1", "name")).toBe("Alice");
      expect(dataset.get("rec1", "age")).toBe(30);
    });

    test("get returns undefined for non-existent record", () => {
      const dataset = new Dataset<TestProperty>([], []);
      expect(dataset.get("nonexistent", "prop")).toBeUndefined();
    });

    test("get returns undefined for non-existent property on existing record", () => {
      const records: [string, Record<string, unknown>][] = [["rec1", { name: "Alice" }]];
      const dataset = new Dataset<TestProperty>([], records);
      expect(dataset.get("rec1", "nonexistent")).toBeUndefined();
    });

    test("insert adds a new record and updates length", () => {
      const dataset = new Dataset<TestProperty>([], []);
      expect(dataset.length.value).toBe(0);

      dataset.insert("rec1", { name: "Alice" });

      expect(dataset.length.value).toBe(1);
      expect(dataset.get("rec1", "name")).toBe("Alice");
    });

    test("insert overwrites an existing record", () => {
      const records: [string, Record<string, unknown>][] = [["rec1", { name: "Alice" }]];
      const dataset = new Dataset<TestProperty>([], records);

      dataset.insert("rec1", { name: "Bob" });

      expect(dataset.length.value).toBe(1);
      expect(dataset.get("rec1", "name")).toBe("Bob");
    });

    test("remove deletes a record and updates length", () => {
      const records: [string, Record<string, unknown>][] = [
        ["rec1", { name: "Alice" }],
        ["rec2", { name: "Bob" }],
      ];
      const dataset = new Dataset<TestProperty>([], records);
      expect(dataset.length.value).toBe(2);

      dataset.remove("rec1");

      expect(dataset.length.value).toBe(1);
      expect(dataset.get("rec1", "name")).toBeUndefined();
      expect(dataset.get("rec2", "name")).toBe("Bob");
    });

    test("remove does nothing for non-existent record", () => {
      const records: [string, Record<string, unknown>][] = [["rec1", { name: "Alice" }]];
      const dataset = new Dataset<TestProperty>([], records);

      dataset.remove("nonexistent");

      expect(dataset.length.value).toBe(1);
    });
  });

  describe("properties", () => {
    test("addProperty adds a new property", () => {
      const dataset = new Dataset<TestProperty>([], []);

      dataset.addProperty("prop1", { type: "string", required: true });

      expect(dataset.getProperty("prop1")).toEqual({
        type: "string",
        required: true,
      });
    });

    test("getProperty returns undefined for non-existent property", () => {
      const dataset = new Dataset<TestProperty>([], []);
      expect(dataset.getProperty("nonexistent")).toBeUndefined();
    });

    test("getProperty returns property for existing id", () => {
      const properties: [string, TestProperty][] = [["prop1", { type: "number" }]];
      const dataset = new Dataset(properties, []);
      expect(dataset.getProperty("prop1")).toEqual({ type: "number" });
    });

    test("updateProperty updates an existing property", () => {
      const properties: [string, TestProperty][] = [["prop1", { type: "string", required: false }]];
      const dataset = new Dataset(properties, []);

      dataset.updateProperty("prop1", { required: true });

      expect(dataset.getProperty("prop1")).toEqual({
        type: "string",
        required: true,
      });
    });

    test("updateProperty throws for non-existent property", () => {
      const dataset = new Dataset<TestProperty>([], []);
      expect(() => {
        dataset.updateProperty("nonexistent", { type: "string" });
      }).toThrow("Invalid property ID: nonexistent");
    });

    test("removeProperty deletes a property", () => {
      const properties: [string, TestProperty][] = [["prop1", { type: "string" }]];
      const dataset = new Dataset(properties, []);

      dataset.removeProperty("prop1");

      expect(dataset.getProperty("prop1")).toBeUndefined();
    });
  });
});
