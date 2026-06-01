import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import Page from "@/models/Page";
import { PAGE } from "@/test/fixtures/Page";

describe("PageDropdowns", () => {
  let page: Page;

  beforeEach(() => {
    page = new Page(PAGE, new Y.Doc());
  });

  describe("create", () => {
    test("adds a dropdown to the collection", () => {
      const dropdown = page.dropdowns.create({
        title: "Status",
        options: [{ value: "Active" }],
      });

      expect(dropdown.id).toBeTruthy();
      expect(dropdown.title.value).toBe("Status");
      expect(dropdown.options.value).toEqual([{ value: "Active" }]);
      expect(page.dropdowns.value).toContain(dropdown);
      expect(page.dropdowns.get(dropdown.id)).toBe(dropdown);
    });
  });

  describe("get", () => {
    test("throws for an unknown id", () => {
      expect(() => page.dropdowns.get("unknown")).toThrow(
        "Dropdown cannot be found: unknown",
      );
    });
  });

  describe("remove", () => {
    test("removes the dropdown from the collection", () => {
      const dropdown = page.dropdowns.create({
        title: "Status",
        options: [{ value: "Active" }],
      });

      page.dropdowns.remove(dropdown.id);

      expect(page.dropdowns.value).not.toContain(dropdown);
      expect(() => page.dropdowns.get(dropdown.id)).toThrow(
        `Dropdown cannot be found: ${dropdown.id}`,
      );
    });
  });
});
