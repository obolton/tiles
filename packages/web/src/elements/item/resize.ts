export const RESIZE_HANDLE_DIRECTIONS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

export type ResizeHandleDirection = (typeof RESIZE_HANDLE_DIRECTIONS)[number];

export function getResizeHandleDirections(value: string | null): readonly ResizeHandleDirection[] {
  if (!value) {
    return [];
  }
  if (value === "all") {
    return RESIZE_HANDLE_DIRECTIONS;
  }
  if (value === "horizontal") {
    return ["e", "w"];
  }
  if (value === "vertical") {
    return ["n", "s"];
  }
  const requested = new Set(value.split(/\s+/));
  return RESIZE_HANDLE_DIRECTIONS.filter((handle) => requested.has(handle));
}
