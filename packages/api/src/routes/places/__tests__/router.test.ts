import { vi } from "vitest";
import { searchPlaces } from "@/routes/places/places";
import { describeRouter } from "@/test/procedures";

vi.mock("@/routes/places/places");

describeRouter("places", {
  search: {
    guard: "authenticated",
    handler: searchPlaces,
    input: { query: "Cafe", lat: 51.5, long: -0.1 },
    args: (input) => [input],
    invalid: { query: "", lat: 51.5, long: -0.1 },
  },
});
