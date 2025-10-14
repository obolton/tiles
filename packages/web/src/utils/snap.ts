export interface SnapPoint {
  type: "edge";
  id?: string;
  value: number;
}

export interface SnapPoints {
  x: SnapPoint[];
  y: SnapPoint[];
}

export function getSnapPoints(
  elements: Iterable<Element>,
  origin: { x: number; y: number },
): SnapPoints {
  const x: SnapPoint[] = [];
  const y: SnapPoint[] = [];

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    const left: SnapPoint = {
      type: "edge",
      id: element.id,
      value: rect.left - origin.x,
    };
    const right: SnapPoint = {
      type: "edge",
      id: element.id,
      value: rect.right - origin.x,
    };
    const top: SnapPoint = {
      type: "edge",
      id: element.id,
      value: rect.top - origin.y,
    };
    const bottom: SnapPoint = {
      type: "edge",
      id: element.id,
      value: rect.bottom - origin.y,
    };
    x.push(left, right);
    y.push(top, bottom);
  }

  x.sort((a, b) => a.value - b.value);
  y.sort((a, b) => a.value - b.value);

  return { x, y };
}

function getLowerBound(guides: SnapPoint[], value: number) {
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

export function findSnapPoint(
  snapPoints: SnapPoint[],
  value: number,
  threshold: number,
  ignoreId?: string,
): SnapPoint | null {
  const lower = getLowerBound(snapPoints, value - threshold);
  let match: { point: SnapPoint; distance: number } | null = null;

  for (
    let i = lower;
    i < snapPoints.length && snapPoints[i]!.value <= value + threshold;
    i++
  ) {
    const guide = snapPoints[i]!;

    if (ignoreId && ignoreId === guide.id) {
      continue;
    }

    const distance = Math.abs(guide.value - value);
    if (!match || distance < match.distance) {
      match = { point: guide, distance };
    }
  }

  return match ? match.point : null;
}
