import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "jsx/dom";
import PlaceModal from "../PlaceModal";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";

type Place = AppRouterOutputs["places"]["search"][number];

vi.mock("@/api/client", () => ({
  default: {
    places: {
      search: {
        mutate: vi.fn(),
      },
    },
  },
}));

vi.mock("@/utils/errors");

const BOUNDING_BOX: [number, number, number, number] = [-0.2, 51.4, 0.1, 51.6];

const PLACE: Place = {
  providerId: "here:pds:place:1",
  name: "Tower Bridge",
  lat: 51.5055,
  long: -0.0754,
  address: "Tower Bridge, London, England",
  boundingBox: null,
};

function deferred() {
  return Promise.withResolvers<Place[]>();
}

function renderModal() {
  document.body.append(
    ...render(<PlaceModal boundingBox={BOUNDING_BOX} cancel={() => {}} confirm={() => {}} />),
  );
  const input = document.querySelector("input[name=search]");
  const status = document.querySelector("[role=status]");
  const results = document.querySelector("[aria-label=Results]");
  if (!(input instanceof HTMLInputElement) || !status || !results) {
    throw new Error("Missing modal elements");
  }
  return { input, status, results };
}

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

describe("PlaceModal", () => {
  const searchMock = vi.mocked(client.places.search.mutate);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    searchMock.mockReset();
    vi.mocked(handleError).mockClear();
  });

  test("shows a searching status until the results arrive", async () => {
    const search = deferred();
    searchMock.mockReturnValue(search.promise);
    const { input, status, results } = renderModal();

    type(input, "Tower");
    await vi.advanceTimersByTimeAsync(250);

    expect(searchMock).toHaveBeenCalledWith({ query: "Tower", boundingBox: BOUNDING_BOX });
    expect(status.textContent).toBe("Searching…");
    expect(results.children).toHaveLength(0);

    search.resolve([PLACE]);
    await vi.advanceTimersByTimeAsync(0);

    expect(status.textContent).toBe("");
    expect(results.children).toHaveLength(1);
    expect(results.textContent).toContain("Tower Bridge");
  });

  test("keeps the previous results visible while refreshing them", async () => {
    const search = deferred();
    searchMock.mockResolvedValueOnce([PLACE]).mockReturnValueOnce(search.promise);
    const { input, status, results } = renderModal();

    type(input, "Tower");
    await vi.advanceTimersByTimeAsync(250);
    type(input, "Tower Bridge");
    await vi.advanceTimersByTimeAsync(250);

    expect(status.textContent).toBe("");
    expect(results.children).toHaveLength(1);
  });

  test("clears the results and shows a toast when the search fails", async () => {
    searchMock.mockResolvedValueOnce([PLACE]).mockRejectedValueOnce(new Error("fetch failed"));
    const { input, status, results } = renderModal();

    type(input, "Tower");
    await vi.advanceTimersByTimeAsync(250);
    expect(results.children).toHaveLength(1);

    type(input, "Tower Bridge");
    await vi.advanceTimersByTimeAsync(250);

    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "Couldn't search for places. Please try again.",
    );
    expect(results.children).toHaveLength(0);
    expect(status.textContent).toBe("");
  });

  test("ignores the response of a superseded search", async () => {
    const staleSearch = deferred();
    searchMock.mockReturnValueOnce(staleSearch.promise).mockResolvedValueOnce([PLACE]);
    const { input, status, results } = renderModal();

    type(input, "Tow");
    await vi.advanceTimersByTimeAsync(250);
    type(input, "Tower");
    await vi.advanceTimersByTimeAsync(250);
    expect(results.textContent).toContain("Tower Bridge");

    staleSearch.resolve([{ ...PLACE, name: "Stale result" }]);
    await vi.advanceTimersByTimeAsync(0);

    expect(results.textContent).not.toContain("Stale result");
    expect(status.textContent).toBe("");
  });

  test("clears the results when the query is emptied", async () => {
    searchMock.mockResolvedValueOnce([PLACE]);
    const { input, status, results } = renderModal();

    type(input, "Tower");
    await vi.advanceTimersByTimeAsync(250);
    expect(results.children).toHaveLength(1);

    type(input, "");
    await vi.advanceTimersByTimeAsync(250);

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(results.children).toHaveLength(0);
    expect(status.textContent).toBe("");
  });
});
