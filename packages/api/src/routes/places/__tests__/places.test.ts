import { describe, test, expect, vi, beforeEach } from "vitest";
import { fetchedUrl, jsonResponse } from "@/test/mocks/fetch";
import { searchPlaces } from "../places";

const MOCK_PLACE = {
  id: "here:pds:place:1",
  title: "Tower Bridge",
  resultType: "place",
  position: { lat: 51.5055, lng: -0.0754 },
  address: { label: "Tower Bridge, London, England" },
  mapView: { west: -0.0774, south: 51.5035, east: -0.0734, north: 51.5075 },
};

const MOCK_CATEGORY = {
  id: "here:cm:ontology:bridge",
  title: "Bridges",
  resultType: "categoryQuery",
  href: "https://discover.search.hereapi.com/v1/discover?q=bridges",
};

beforeEach(() => {
  vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [] }));
});

describe("searchPlaces", () => {
  test("searches around a point with the API key, query and result limit", async () => {
    await searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 });

    const url = fetchedUrl();
    expect(url.origin + url.pathname).toBe("https://autosuggest.search.hereapi.com/v1/autosuggest");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      apiKey: "test",
      q: "bridge",
      limit: "10",
      at: "51.5,-0.1",
    });
  });

  test("searches within a bounding box when one is given", async () => {
    await searchPlaces({ query: "bridge", boundingBox: [-0.2, 51.4, 0.1, 51.6] });

    const params = Object.fromEntries(fetchedUrl().searchParams);
    expect(params.in).toBe("bbox:-0.2,51.4,0.1,51.6");
    expect(params).not.toHaveProperty("at");
  });

  test("requests a JSON response", async () => {
    await searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 });

    expect(fetch).toHaveBeenCalledWith(expect.any(URL), {
      headers: { Accept: "application/json" },
    });
  });

  test("throws when the search request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("error", { status: 503, statusText: "Service Unavailable" }),
    );

    await expect(searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 })).rejects.toThrow(
      "Place search failed: 503: Service Unavailable",
    );
  });

  test("maps results to places with a bounding box", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [MOCK_PLACE] }));

    const result = await searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 });

    expect(result).toEqual([
      {
        providerId: "here:pds:place:1",
        name: "Tower Bridge",
        lat: 51.5055,
        long: -0.0754,
        address: "Tower Bridge, London, England",
        boundingBox: [-0.0774, 51.5035, -0.0734, 51.5075],
      },
    ]);
  });

  test("returns a null bounding box when the result has no map view", async () => {
    const { mapView: _mapView, ...place } = MOCK_PLACE;
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [place] }));

    const [result] = await searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 });

    expect(result?.boundingBox).toBeNull();
  });

  test("drops results without a position", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [MOCK_CATEGORY, MOCK_PLACE] }));

    const result = await searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 });

    expect(result.map((place) => place.providerId)).toEqual(["here:pds:place:1"]);
  });

  test("returns an empty list when there are no results", async () => {
    await expect(searchPlaces({ query: "bridge", lat: 51.5, long: -0.1 })).resolves.toEqual([]);
  });
});
