export interface FreeformPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Default width of an inserted tile as a percentage of its freeform section. */
export const DEFAULT_FREEFORM_WIDTH = 100 / 3;

/** Tallest default placement, so that tall content stays well inside the section. */
const MAX_HEIGHT = 60;

/**
 * Centered default geometry, in percentages of the section, for a tile
 * inserted into a freeform section. `sectionAspect` and `contentAspect` are
 * width / height ratios; the tile keeps `contentAspect` and is shrunk to fit
 * when it would otherwise be too tall.
 */
export function getFreeformPlacement(
  sectionAspect: number,
  contentAspect: number,
  width = DEFAULT_FREEFORM_WIDTH,
): FreeformPlacement {
  let height = (width * sectionAspect) / contentAspect;
  if (height > MAX_HEIGHT) {
    width = (MAX_HEIGHT * contentAspect) / sectionAspect;
    height = MAX_HEIGHT;
  }
  return {
    x: (100 - width) / 2,
    y: (100 - height) / 2,
    width,
    height,
  };
}
