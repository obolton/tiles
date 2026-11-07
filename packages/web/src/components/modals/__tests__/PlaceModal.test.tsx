import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "jsx/dom";
import client from "@/api/client";
import PlaceModal from "../PlaceModal";

vi.mock("@/api/client", () => ({
  default: {
    places: {
      search: {
        mutate: vi.fn(),
      },
    },
  },
}));

const BOUNDING_BOX: [number, number, number, number] = [-0.2, 51.4, 0.1, 51.6];

const PLACE = {
  providerId: "here:pds:place:1",
  name: "Tower Bridge",
  lat: 51.5055,
  long: -0.0754,
  address: "Tower Bridge, London, England",
  boundingBox: null,
};

function renderModal(confirm = vi.fn()) {
  document.body.append(
    ...render(<PlaceModal boundingBox={BOUNDING_BOX} cancel={() => {}} confirm={confirm} />),
  );
  const input = document.querySelector("input[name='search']");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("Missing search input");
  }
  return input;
}

async function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await vi.advanceTimersByTimeAsync(250);
}

function statusText() {
  return document.querySelector("[role='status']")?.textContent?.trim() ?? "";
}

function resultNames() {
  return Array.from(document.querySelectorAll("[aria-label='Results'] li span:first-child")).map(
    (name) => name.textContent,
  );
}

function clickButton(name: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!button) {
    throw new Error(`Missing button: ${name}`);
  }
  button.click();
}

describe("PlaceModal", () => {
  const searchMock = vi.mocked(client.places.search.mutate);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    searchMock.mockReset();
    document.body.replaceChildren();
  });

  test("searches within the bounding box once typing pauses", async () => {
    searchMock.mockResolvedValue([]);
    const input = renderModal();

    input.value = "Tow";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await type(input, "Tower");

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith({ query: "Tower", boundingBox: BOUNDING_BOX });
  });

  test("shows that a search is in progress", async () => {
    searchMock.mockReturnValue(new Promise(() => {}));
    const input = renderModal();

    await type(input, "Tower");

    expect(statusText()).toBe("Searching…");
  });

  test("lists the places found", async () => {
    searchMock.mockResolvedValue([PLACE]);
    const input = renderModal();

    await type(input, "Tower");

    expect(resultNames()).toEqual(["Tower Bridge"]);
    expect(statusText()).toBe("");
  });

  test("says when no places are found", async () => {
    searchMock.mockResolvedValue([]);
    const input = renderModal();

    await type(input, "Tower");

    expect(resultNames()).toEqual([]);
    expect(statusText()).toBe("No places found.");
  });

  test("explains when the search fails and can try again", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("fetch failed");
    searchMock.mockRejectedValueOnce(error).mockResolvedValueOnce([PLACE]);
    const input = renderModal();

    await type(input, "Tower");

    expect(statusText()).toContain("Place search isn’t available right now.");
    expect(resultNames()).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(error);

    clickButton("Try again");
    await vi.advanceTimersByTimeAsync(0);

    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(resultNames()).toEqual(["Tower Bridge"]);
    expect(statusText()).toBe("");
  });

  test("ignores the response to a superseded search", async () => {
    const first = Promise.withResolvers<(typeof PLACE)[]>();
    searchMock.mockReturnValueOnce(first.promise).mockResolvedValueOnce([PLACE]);
    const input = renderModal();

    await type(input, "Tow");
    await type(input, "Tower");
    expect(resultNames()).toEqual(["Tower Bridge"]);

    first.resolve([]);
    await vi.advanceTimersByTimeAsync(0);

    expect(resultNames()).toEqual(["Tower Bridge"]);
    expect(statusText()).toBe("");
  });

  test("clears the results when the query is cleared", async () => {
    searchMock.mockResolvedValue([PLACE]);
    const input = renderModal();

    await type(input, "Tower");
    await type(input, "");

    expect(resultNames()).toEqual([]);
    expect(statusText()).toBe("");
  });

  test("confirms the selected place", async () => {
    const confirm = vi.fn();
    searchMock.mockResolvedValue([PLACE]);
    const input = renderModal(confirm);

    await type(input, "Tower");
    clickButton("Tower BridgeTower Bridge, London, England");

    expect(confirm).toHaveBeenCalledWith({ place: PLACE });
  });
});
