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

function spyOnNavigate(state: VersionHistory) {
  return vi.spyOn(state, "navigate").mockImplementation(() => {});
}

describe("VersionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    history.replaceState(null, "", "/pages/page-id");
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
    test("navigates to the version URL", () => {
      const state = new VersionHistory("page-id");
      const navigate = spyOnNavigate(state);

      state.select(NAMED_VERSION.id);

      expect(navigate).toHaveBeenCalledOnce();
      const url = navigate.mock.lastCall?.[0];
      expect(url?.pathname).toBe("/pages/page-id");
      expect(url?.searchParams.get("version")).toBe(NAMED_VERSION.id);
    });

    test("preserves other query parameters", () => {
      history.replaceState(null, "", "/pages/page-id?foo=bar");
      const state = new VersionHistory("page-id");
      const navigate = spyOnNavigate(state);

      state.select(NAMED_VERSION.id);

      const url = navigate.mock.lastCall?.[0];
      expect(url?.searchParams.get("foo")).toBe("bar");
      expect(url?.searchParams.get("version")).toBe(NAMED_VERSION.id);
    });

    test("exits when selecting the previewed version", () => {
      listQuery.mockResolvedValue({ versions: VERSIONS, nextCursor: null });
      history.replaceState(null, "", `/pages/page-id?version=${NAMED_VERSION.id}`);
      const state = new VersionHistory("page-id", NAMED_VERSION);
      const navigate = spyOnNavigate(state);

      state.select(NAMED_VERSION.id);

      const url = navigate.mock.lastCall?.[0];
      expect(url?.pathname).toBe("/pages/page-id");
      expect(url?.searchParams.has("version")).toBe(false);
    });
  });

  describe("preview", () => {
    test("starts open with the version selected and fetches the list", async () => {
      listQuery.mockResolvedValue({ versions: VERSIONS, nextCursor: null });

      const state = new VersionHistory("page-id", NAMED_VERSION);

      expect(state.previewVersion).toBe(NAMED_VERSION);
      expect(state.isOpen.value).toBe(true);
      expect(state.selectedId.value).toBe(NAMED_VERSION.id);
      await vi.waitFor(() => expect(state.versions.value).toEqual(VERSIONS));
    });

    test("close exits the preview", () => {
      listQuery.mockResolvedValue({ versions: [], nextCursor: null });
      history.replaceState(null, "", `/pages/page-id?version=${NAMED_VERSION.id}`);
      const state = new VersionHistory("page-id", NAMED_VERSION);
      const navigate = spyOnNavigate(state);

      state.close();

      const url = navigate.mock.lastCall?.[0];
      expect(url?.pathname).toBe("/pages/page-id");
      expect(url?.searchParams.has("version")).toBe(false);
    });
  });

  describe("close", () => {
    test("closes the panel outside a preview", () => {
      listQuery.mockResolvedValue({ versions: [], nextCursor: null });
      const state = new VersionHistory("page-id");
      const navigate = spyOnNavigate(state);
      state.open();

      state.close();

      expect(state.isOpen.value).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
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
