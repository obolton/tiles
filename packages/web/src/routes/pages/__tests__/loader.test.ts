import { describe, expect, test, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { bytesToBase64 } from "doc/encoding";
import route from "../[id]";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { NAMED_VERSION } from "@/test/fixtures/PageVersion";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";

vi.mock("@/api/client", () => ({
  default: {
    pages: {
      getById: {
        query: vi.fn(),
      },
    },
    versions: {
      get: {
        query: vi.fn(),
      },
    },
  },
}));

const getPage = vi.mocked(client.pages.getById.query);
const getVersion = vi.mocked(client.versions.get.query);

function encodeDoc(tileId: string) {
  const doc = new Y.Doc();
  const tile = new Y.Map<unknown>();
  doc.getMap<Y.Map<unknown>>("tiles").set(tileId, tile);
  tile.set("id", tileId);
  tile.set("type", "TEXT");
  return bytesToBase64(Y.encodeStateAsUpdate(doc));
}

const LIVE_DOCUMENT = encodeDoc("live-tile");
const VERSION_DOCUMENT = encodeDoc("version-tile");

async function runLoader(search = "") {
  if (!route.loader) {
    throw new Error("The page route has no loader");
  }
  return route.loader({
    url: new URL(`http://localhost/pages/${PAGE.id}${search}`),
    headers: new Headers(),
    parameters: { id: PAGE.id },
  });
}

function unwrapData(result: Awaited<ReturnType<typeof runLoader>>) {
  if (!result || result instanceof Response) {
    throw new Error("Expected loader data");
  }
  return result;
}

describe("pages/[id] loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPage.mockResolvedValue({ ...PAGE, document: LIVE_DOCUMENT });
  });

  test("returns the live document", async () => {
    const result = unwrapData(await runLoader());

    expect(getVersion).not.toHaveBeenCalled();
    expect(result.data.version).toBeUndefined();
    expect(result.data.doc.getMap("tiles").has("live-tile")).toBe(true);
    expect(result.headers).toEqual({ "Cache-Control": CACHE_CONTROL_VALUE });
  });

  test("returns the version document for ?version=", async () => {
    getVersion.mockResolvedValue({ ...NAMED_VERSION, document: VERSION_DOCUMENT });

    const result = unwrapData(await runLoader(`?version=${NAMED_VERSION.id}`));

    expect(getVersion).toHaveBeenCalledExactlyOnceWith(
      { pageId: PAGE.id, versionId: NAMED_VERSION.id },
      expect.anything(),
    );
    expect(result.data.version).toEqual(NAMED_VERSION);
    expect(result.data.version).not.toHaveProperty("document");
    expect(result.data.doc.getMap("tiles").has("version-tile")).toBe(true);
    expect(result.data.doc.getMap("tiles").has("live-tile")).toBe(false);
    // Historical states are never cached, even on published pages
    expect(result.headers).toBeUndefined();
  });

  test("redirects to the live page when the version is unavailable", async () => {
    getVersion.mockRejectedValue(new Error("Not found"));

    const result = await runLoader(`?version=${NAMED_VERSION.id}`);

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(302);
      expect(result.headers.get("Location")).toBe(`/pages/${PAGE.id}`);
    }
  });

  test("returns not found for a missing page", async () => {
    getPage.mockResolvedValue(null);

    const result = await runLoader();

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(404);
    }
  });
});
