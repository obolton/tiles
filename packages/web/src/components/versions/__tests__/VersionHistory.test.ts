import { describe, expect, test, vi, beforeEach } from "vitest";
import VersionHistory from "../VersionHistory";
import client from "@/api/client";
import { VERSIONS, NAMED_VERSION, OLDER_AUTO_VERSION } from "@/test/fixtures/PageVersion";

vi.mock("@/api/client", () => ({
  default: {
    versions: {
      list: {
        query: vi.fn(),
      },
    },
  },
}));

const listQuery = vi.mocked(client.versions.list.query);

function getVersionParam() {
  return new URL(window.location.href).searchParams.get("version");
}

describe("VersionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    history.replaceState(null, "", "/");
  });

  describe("open", () => {
    test("fetches the first page of versions", async () => {
      listQuery.mockResolvedValue({ versions: VERSIONS, nextCursor: null });
      const state = new VersionHistory("page-id");

      state.open();

      expect(state.isOpen.value).toBe(true);
      await vi.waitFor(() => expect(state.versions.value).toEqual(VERSIONS));
      expect(listQuery).toHaveBeenCalledExactlyOnceWith({ pageId: "page-id" });
      expect(state.nextCursor.value).toBeNull();
      expect(state.isLoading.value).toBe(false);
    });

    test("does nothing when already open", async () => {
      listQuery.mockResolvedValue({ versions: VERSIONS, nextCursor: null });
      const state = new VersionHistory("page-id");

      state.open();
      state.open();

      await vi.waitFor(() => expect(state.versions.value).toEqual(VERSIONS));
      expect(listQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("loadMore", () => {
    test("appends the next page of versions", async () => {
      listQuery.mockResolvedValueOnce({
        versions: [NAMED_VERSION],
        nextCursor: NAMED_VERSION.id,
      });
      const state = new VersionHistory("page-id");
      state.open();
      await vi.waitFor(() => expect(state.versions.value).toEqual([NAMED_VERSION]));

      listQuery.mockResolvedValueOnce({
        versions: [OLDER_AUTO_VERSION],
        nextCursor: null,
      });
      await state.loadMore();

      expect(listQuery).toHaveBeenLastCalledWith({
        pageId: "page-id",
        cursor: NAMED_VERSION.id,
      });
      expect(state.versions.value).toEqual([NAMED_VERSION, OLDER_AUTO_VERSION]);
      expect(state.nextCursor.value).toBeNull();
    });

    test("does nothing at the end of the list", async () => {
      listQuery.mockResolvedValue({ versions: VERSIONS, nextCursor: null });
      const state = new VersionHistory("page-id");
      state.open();
      await vi.waitFor(() => expect(state.versions.value).toEqual(VERSIONS));

      await state.loadMore();

      expect(listQuery).toHaveBeenCalledTimes(1);
    });

    test("does nothing while a load is in flight", async () => {
      listQuery.mockResolvedValue({ versions: [], nextCursor: null });
      const state = new VersionHistory("page-id");
      state.nextCursor.value = "cursor";

      const first = state.loadMore();
      const second = state.loadMore();
      await Promise.all([first, second]);

      expect(listQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("select", () => {
    test("sets the version query parameter", () => {
      const state = new VersionHistory("page-id");

      state.select(NAMED_VERSION.id);

      expect(state.selectedId.value).toBe(NAMED_VERSION.id);
      expect(getVersionParam()).toBe(NAMED_VERSION.id);
    });

    test("removes the version query parameter when deselecting", () => {
      const state = new VersionHistory("page-id");
      state.select(NAMED_VERSION.id);

      state.select(null);

      expect(state.selectedId.value).toBeNull();
      expect(getVersionParam()).toBeNull();
    });
  });

  describe("close", () => {
    test("clears the selection", async () => {
      listQuery.mockResolvedValue({ versions: VERSIONS, nextCursor: null });
      const state = new VersionHistory("page-id");
      state.open();
      state.select(NAMED_VERSION.id);

      state.close();

      expect(state.isOpen.value).toBe(false);
      expect(state.selectedId.value).toBeNull();
      expect(getVersionParam()).toBeNull();
    });
  });

  describe("toggle", () => {
    test("opens and closes", () => {
      listQuery.mockResolvedValue({ versions: [], nextCursor: null });
      const state = new VersionHistory("page-id");

      state.toggle();
      expect(state.isOpen.value).toBe(true);

      state.toggle();
      expect(state.isOpen.value).toBe(false);
    });
  });
});
