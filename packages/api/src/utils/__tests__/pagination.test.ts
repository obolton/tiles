import { describe, expect, test } from "vitest";
import { RESULTS_PER_PAGE, paginate } from "../pagination";

describe("paginate", () => {
  test("returns all items and null cursor when results fit in page", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const result = paginate(items, (item) => item.id, 5);

    expect(result.items).toEqual(items);
    expect(result.nextCursor).toBeNull();
  });

  test("returns all items and null cursor when results exactly fill page", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const result = paginate(items, (item) => item.id, 3);

    expect(result.items).toEqual(items);
    expect(result.nextCursor).toBeNull();
  });

  test("trims extra item and returns cursor when results exceed page size", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
    const result = paginate(items, (item) => item.id, 3);

    expect(result.items).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
    expect(result.nextCursor).toBe("3");
  });

  test("returns null cursor for empty results", () => {
    const result = paginate([], (item: { id: string }) => item.id, 5);

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  test("uses RESULTS_PER_PAGE as default page size", () => {
    const items = Array.from({ length: RESULTS_PER_PAGE + 1 }, (_, i) => ({
      id: String(i + 1),
    }));
    const result = paginate(items, (item) => item.id);

    expect(result.items).toHaveLength(RESULTS_PER_PAGE);
    expect(result.nextCursor).toBe(String(RESULTS_PER_PAGE));
  });

  test("works with nested cursor extraction", () => {
    const items = [
      { page: { id: "page-1" } },
      { page: { id: "page-2" } },
      { page: { id: "page-3" } },
    ];
    const result = paginate(items, (item) => item.page.id, 2);

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBe("page-2");
  });
});
