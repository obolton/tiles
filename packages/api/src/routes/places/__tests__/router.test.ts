import { vi } from "vitest";
import { searchPlaces } from "../places";
import { describeRouter } from "@/test/router";

vi.mock("../places");

describeRouter("places", {
  search: {
    guard: "authenticated",
    handler: searchPlaces,
    input: { query: "Cafe", lat: 51.5, long: -0.1 },
    args: (input) => [input],
    invalid: { query: "", lat: 51.5, long: -0.1 },
  },
});
