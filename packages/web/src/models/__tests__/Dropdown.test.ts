import { afterEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Dropdown from "@/models/Dropdown";
import Page from "@/models/Page";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { DROPDOWN } from "@/test/fixtures/Dropdown";

vi.mock("@/api/client", () => ({
  default: {
    dropdowns: {
      create: {
        mutate: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Dropdown", () => {
  const page = new Page(PAGE, new Y.Doc());
  const createMock = vi.mocked(client.dropdowns.create.mutate);
  const updateMock = vi.mocked(client.dropdowns.update.mutate);
  const deleteMock = vi.mocked(client.dropdowns.delete.mutate);

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("maps properties to reactive values", () => {
    const dropdown = new Dropdown(page, DROPDOWN);

    expect(dropdown.page).toBe(page);
    expect(dropdown.id).toBe(DROPDOWN.id);
    expect(dropdown.title.value).toBe(DROPDOWN.title);
    expect(dropdown.options.value).toEqual(DROPDOWN.options);
  });

  describe("create", () => {
    test("creates a new dropdown and adds it to the page", async () => {
      createMock.mockResolvedValue(DROPDOWN);

      const dropdown = await Dropdown.create(page, {
        title: "Status",
        options: DROPDOWN.options,
      });

      expect(createMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        title: "Status",
        options: DROPDOWN.options,
      });
      expect(dropdown.id).toBe(DROPDOWN.id);
      expect(dropdown.title.value).toBe(DROPDOWN.title);
      expect(page.dropdowns.value).toContain(dropdown);
    });
  });

  describe("setTitle", () => {
    test("updates the title", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);
      const newTitle = "Priority";

      await dropdown.setTitle(newTitle);

      expect(dropdown.title.value).toBe(newTitle);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        title: newTitle,
      });
    });

    test("clears the title", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);

      await dropdown.setTitle(null);

      expect(dropdown.title.value).toBeNull();
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        title: null,
      });
    });
  });

  describe("setOptions", () => {
    test("updates the options", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);
      const newOptions = [{ value: "High" }, { value: "Low" }];

      await dropdown.setOptions(newOptions);

      expect(dropdown.options.value).toEqual(newOptions);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        options: newOptions,
      });
    });
  });

  describe("addOption", () => {
    test("adds a new option to the list", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);

      await dropdown.addOption("Archived");

      expect(dropdown.options.value).toEqual([
        { value: "Active" },
        { value: "Inactive" },
        { value: "Pending" },
        { value: "Archived" },
      ]);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        options: [
          { value: "Active" },
          { value: "Inactive" },
          { value: "Pending" },
          { value: "Archived" },
        ],
      });
    });
  });

  describe("updateOption", () => {
    test("updates an option at the specified index", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);

      await dropdown.updateOption(1, "Disabled");

      expect(dropdown.options.value).toEqual([
        { value: "Active" },
        { value: "Disabled" },
        { value: "Pending" },
      ]);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        options: [
          { value: "Active" },
          { value: "Disabled" },
          { value: "Pending" },
        ],
      });
    });
  });

  describe("removeOption", () => {
    test("removes an option at the specified index", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);

      await dropdown.removeOption(1);

      expect(dropdown.options.value).toEqual([
        { value: "Active" },
        { value: "Pending" },
      ]);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        options: [{ value: "Active" }, { value: "Pending" }],
      });
    });
  });

  describe("reorderOptions", () => {
    test("moves an option from one index to another", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);

      await dropdown.reorderOptions(2, 0);

      expect(dropdown.options.value).toEqual([
        { value: "Pending" },
        { value: "Active" },
        { value: "Inactive" },
      ]);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
        options: [
          { value: "Pending" },
          { value: "Active" },
          { value: "Inactive" },
        ],
      });
    });

    test("throws an error for invalid from index", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);

      await expect(dropdown.reorderOptions(5, 0)).rejects.toThrow(
        "Invalid option index: 5",
      );
    });
  });

  describe("delete", () => {
    test("deletes the dropdown and removes it from the page", async () => {
      const dropdown = new Dropdown(page, DROPDOWN);
      page.dropdowns.value = page.dropdowns.value.concat(dropdown);

      await dropdown.delete();

      expect(deleteMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: DROPDOWN.id,
      });
      expect(page.dropdowns.value).not.toContain(dropdown);
    });
  });
});
