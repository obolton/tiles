import assert from "node:assert";
import { HereAutosuggestQueryResults } from "./schema.ts";
import type { SearchPlacesSchema } from "./schema.ts";

type SearchPlacesResult = {
  providerId: string;
  name: string;
  lat: number;
  long: number;
  address: string;
  boundingBox: number[] | null;
};

assert(process.env.HERE_API_KEY);

const API_KEY = process.env.HERE_API_KEY;
const AUTOSUGGEST_ENDPOINT = "https://autosuggest.search.hereapi.com/v1/autosuggest";

export async function searchPlaces(input: SearchPlacesSchema): Promise<SearchPlacesResult[]> {
  const query = input.query;

  const url = new URL(AUTOSUGGEST_ENDPOINT);
  url.searchParams.set("apiKey", API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");

  if ("boundingBox" in input) {
    url.searchParams.set("in", `bbox:${input.boundingBox.join(",")}`);
  } else {
    url.searchParams.set("at", `${input.lat},${input.long}`);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Place search failed: ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const results = HereAutosuggestQueryResults.parse(json);

  return results.items
    .filter((result) => "position" in result)
    .map((result) => ({
      providerId: result.id,
      name: result.title,
      lat: result.position.lat,
      long: result.position.lng,
      address: result.address.label,
      boundingBox: result.mapView
        ? [result.mapView.west, result.mapView.south, result.mapView.east, result.mapView.north]
        : null,
    }));
}
