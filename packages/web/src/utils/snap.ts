export interface SnapGuide {
  type: "edge";
  value: number;
}

export interface SnapGuides {
  x: SnapGuide[];
  y: SnapGuide[];
}

export function getSnapGuides(
  elements: Iterable<Element>,
  origin: { x: number; y: number },
): SnapGuides {
  const x: SnapGuide[] = [];
  const y: SnapGuide[] = [];

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    const left: SnapGuide = { type: "edge", value: rect.left - origin.x };
    const right: SnapGuide = { type: "edge", value: rect.right - origin.x };
    const top: SnapGuide = { type: "edge", value: rect.top - origin.y };
    const bottom: SnapGuide = {
      type: "edge",
      value: rect.bottom - origin.y,
    };
    x.push(left, right);
    y.push(top, bottom);
  }

  x.sort((a, b) => a.value - b.value);
  y.sort((a, b) => a.value - b.value);

  return { x, y };
}

function getLowerBound(guides: SnapGuide[], value: number) {
  let low = 0;
  let high = guides.length;

  while (low < high) {
    const mid = (low + high) >>> 1;

    if (guides[mid]!.value < value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export function getMatchingSnapGuide(
  guides: SnapGuide[],
  value: number,
  threshold: number,
) {
  const lower = getLowerBound(guides, value - threshold);
  let match: { guide: SnapGuide; distance: number } | null = null;

  for (
    let i = lower;
    i < guides.length && guides[i]!.value <= value + threshold;
    i++
  ) {
    const guide = guides[i]!;
    const distance = Math.abs(guide.value - value);
    if (!match || distance < match.distance) {
      match = { guide, distance };
    }
  }

  return match;
}
