import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import Dropdown from "@/models/Dropdown";

describe("Dropdown", () => {
  let dropdown: Dropdown;

  beforeEach(() => {
    const map = Dropdown.createMap({
      title: "Status",
      options: [
        { value: "Active" },
        { value: "Inactive" },
        { value: "Pending" },
      ],
    });
    new Y.Doc().getMap("dropdowns").set("dropdown-id", map);
    dropdown = new Dropdown("dropdown-id", map);
  });

  describe("addOption", () => {
    test("appends a new option", () => {
      dropdown.addOption("Archived");

      expect(dropdown.options.value).toEqual([
        { value: "Active" },
        { value: "Inactive" },
        { value: "Pending" },
        { value: "Archived" },
      ]);
    });
  });

  describe("updateOption", () => {
    test("updates the option at the given index", () => {
      dropdown.updateOption(1, "Disabled");

      expect(dropdown.options.value).toEqual([
        { value: "Active" },
        { value: "Disabled" },
        { value: "Pending" },
      ]);
    });
  });

  describe("removeOption", () => {
    test("removes the option at the given index", () => {
      dropdown.removeOption(1);

      expect(dropdown.options.value).toEqual([
        { value: "Active" },
        { value: "Pending" },
      ]);
    });
  });

  describe("reorderOptions", () => {
    test("moves an option from one index to another", () => {
      dropdown.reorderOptions(2, 0);

      expect(dropdown.options.value).toEqual([
        { value: "Pending" },
        { value: "Active" },
        { value: "Inactive" },
      ]);
    });

    test("throws for an invalid from index", () => {
      expect(() => dropdown.reorderOptions(5, 0)).toThrow(
        "Invalid option index: 5",
      );
    });
  });
});
