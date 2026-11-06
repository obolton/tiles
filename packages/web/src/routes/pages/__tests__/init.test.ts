import { describe, expect, test, vi, beforeEach } from "vitest";
import { isEditMode } from "@/utils/edit";

const { startPresentation, hydrateRoute } = vi.hoisted(() => ({
  startPresentation: vi.fn(async () => {}),
  hydrateRoute: vi.fn(async () => ({ data: undefined, parameters: {} })),
}));

vi.mock("@/presentation", () => ({ startPresentation }));
vi.mock("@/utils/hydration", () => ({ hydrateRoute }));
vi.mock("@/utils/sessions", () => ({ isSignedIn: () => true }));
vi.mock("@/utils/lightbox", () => ({ initialize: () => {} }));

const PATHNAME = "/pages/page-id";

// The init script runs on import, so load a fresh copy for each URL
async function init(search = "") {
  history.replaceState(null, "", `${PATHNAME}${search}`);
  vi.resetModules();
  await import("../init");
}

beforeEach(() => {
  sessionStorage.clear();
  delete document.body.dataset.editing;
});

describe("pages init", () => {
  test("restores edit mode for the page being edited", async () => {
    sessionStorage.setItem("edit", PATHNAME);

    await init();

    expect(isEditMode()).toBe(true);
    expect(hydrateRoute).toHaveBeenCalledTimes(1);
    expect(startPresentation).not.toHaveBeenCalled();
  });

  test("enters edit mode from the edit parameter and removes it from the URL", async () => {
    await init("?edit=1");

    expect(isEditMode()).toBe(true);
    expect(sessionStorage.getItem("edit")).toBe(PATHNAME);
    expect(window.location.search).toBe("");
  });

  test("does not enter edit mode when viewing a version", async () => {
    sessionStorage.setItem("edit", PATHNAME);

    await init("?version=version-id");

    expect(isEditMode()).toBe(false);
  });

  test("starts presenting from the requested slide after hydration", async () => {
    await init("?present=2");

    expect(hydrateRoute).toHaveBeenCalledTimes(1);
    expect(startPresentation).toHaveBeenCalledExactlyOnceWith(2);
    expect(isEditMode()).toBe(false);
  });

  test("leaves edit mode when presenting the page being edited", async () => {
    sessionStorage.setItem("edit", PATHNAME);

    await init("?present=0");

    expect(isEditMode()).toBe(false);
    expect(sessionStorage.getItem("edit")).toBeNull();
    expect(startPresentation).toHaveBeenCalledExactlyOnceWith(0);
  });

  test("presents in view mode even with the edit parameter", async () => {
    await init("?edit=1&present=0");

    expect(isEditMode()).toBe(false);
    expect(sessionStorage.getItem("edit")).toBeNull();
    expect(window.location.search).toBe("?present=0");
  });
});
