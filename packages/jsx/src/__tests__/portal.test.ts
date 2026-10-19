import { afterEach, describe, expect, test, vi } from "vitest";
import { jsx } from "../jsx";
import { render } from "../dom";
import Portal from "../portal";

vi.mock("../dom", { spy: true });

describe("Portal", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    document.body.innerHTML = "";
  });

  test("returns null and skips rendering during SSR", () => {
    vi.stubEnv("SSR", true);

    const result = Portal({
      children: jsx("div", {
        id: "portal-content",
        children: "Hello world",
      }),
    });

    expect(result).toBeNull();
    expect(render).not.toHaveBeenCalled();
    expect(document.body.childNodes).toHaveLength(0);
  });

  test("appends children to document.body by default", () => {
    Portal({
      children: jsx("div", {
        id: "portal-content",
        children: "Hello world",
      }),
    });

    const element = document.getElementById("portal-content");
    expect(element).not.toBeNull();
    expect(element?.parentElement).toBe(document.body);
  });

  test("appends children to a provided element", () => {
    const host = document.createElement("div");

    Portal({
      element: host,
      children: jsx("div", {
        id: "portal-content",
        children: "Hello world",
      }),
    });

    const element = host.querySelector("#portal-content");
    expect(element).not.toBeNull();
    expect(document.body.contains(element)).toBe(false);
  });

  test("removes appended nodes when the signal aborts", () => {
    const host = document.createElement("div");
    const controller = new AbortController();

    Portal({
      element: host,
      signal: controller.signal,
      children: [
        jsx("span", { id: "node-a", children: "First" }),
        jsx("span", { id: "node-b", children: "Second" }),
      ],
    });

    expect(host.childNodes).toHaveLength(2);

    controller.abort();

    expect(host.childNodes).toHaveLength(0);
  });
});
