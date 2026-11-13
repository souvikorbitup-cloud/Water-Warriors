export interface Px {
  x: number;
  y: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

interface DetectOptions {
  width: number;
  height: number;
  center: LatLng;
  zoom: number;
  scale: number;
}

const MIN_LUM = 185;
const MAX_LUM = 246;
const MIN_BLUE_CAST = 2;
const MAX_BLUE_CAST = 24;
const MAX_RG_SPREAD = 6;
const SEED_TOLERANCE = 22;

function isGreyBuilding(r: number, g: number, b: number): boolean {
  const lum = (r + g + b) / 3;
  const cast = b - r;

  return (
    lum >= MIN_LUM &&
    lum <= MAX_LUM &&
    Math.abs(g - r) <= MAX_RG_SPREAD &&
    cast >= MIN_BLUE_CAST &&
    cast <= MAX_BLUE_CAST
  );
}

const WARM_MIN_LUM = 198;
const WARM_MAX_LUM = 251;
const WARM_MIN_CAST = 8;
const WARM_MAX_CAST = 48;
const WARM_MAX_RG_SPREAD = 18;
const WARM_SEED_TOLERANCE = 10;

function isWarmBuilding(r: number, g: number, b: number): boolean {
  const lum = (r + g + b) / 3;
  const cast = r - b;

  return (
    lum >= WARM_MIN_LUM &&
    lum <= WARM_MAX_LUM &&
    r >= g - 2 &&
    r - g <= WARM_MAX_RG_SPREAD &&
    g > b &&
    cast >= WARM_MIN_CAST &&
    cast <= WARM_MAX_CAST
  );
}

function floodFillRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  seed: Px,
): { mask: Uint8Array; count: number } | null {
  const index = (x: number, y: number) => (y * width + x) * 4;
  const seedIndex = index(seed.x, seed.y);
  const seedR = data[seedIndex];
  const seedG = data[seedIndex + 1];
  const seedB = data[seedIndex + 2];
  const classifier = isGreyBuilding(seedR, seedG, seedB)
    ? isGreyBuilding
    : isWarmBuilding(seedR, seedG, seedB)
      ? isWarmBuilding
      : null;

  if (!classifier) return null;

  const tolerance =
    classifier === isWarmBuilding ? WARM_SEED_TOLERANCE : SEED_TOLERANCE;
  const seedLum = (seedR + seedG + seedB) / 3;
  const mask = new Uint8Array(width * height);
  const stack = [seed.y * width + seed.x];
  mask[stack[0]] = 1;
  let count = 1;

  while (stack.length > 0) {
    const pixel = stack.pop();
    if (pixel === undefined) break;

    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const neighbors = [
      x > 0 ? pixel - 1 : -1,
      x < width - 1 ? pixel + 1 : -1,
      y > 0 ? pixel - width : -1,
      y < height - 1 ? pixel + width : -1,
    ];

    for (const neighbor of neighbors) {
      if (neighbor < 0 || mask[neighbor]) continue;

      const neighborX = neighbor % width;
      const neighborY = Math.floor(neighbor / width);
      const colorIndex = index(neighborX, neighborY);
      const r = data[colorIndex];
      const g = data[colorIndex + 1];
      const b = data[colorIndex + 2];

      if (!classifier(r, g, b)) continue;
      if (Math.abs((r + g + b) / 3 - seedLum) > tolerance) continue;

      mask[neighbor] = 1;
      count += 1;
      stack.push(neighbor);
    }
  }

  return { mask, count };
}

function traceBoundary(mask: Uint8Array, width: number, height: number): Px[] {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 0 : mask[y * width + x];

  let start: Px | null = null;
  for (let y = 0; y < height && !start; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (at(x, y)) {
        start = { x, y };
        break;
      }
    }
  }

  if (!start) return [];

  const directions = [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
  ];
  const contour: Px[] = [];
  let current = start;
  let direction = 6;

  for (let step = 0; step < width * height * 4; step += 1) {
    contour.push(current);
    let moved = false;

    for (let offset = 0; offset < 8; offset += 1) {
      const nextDirection = (direction + 6 + offset) % 8;
      const next = directions[nextDirection];
      const nextX = current.x + next.x;
      const nextY = current.y + next.y;

      if (at(nextX, nextY)) {
        current = { x: nextX, y: nextY };
        direction = nextDirection;
        moved = true;
        break;
      }
    }

    if (!moved) break;
    if (current.x === start.x && current.y === start.y && contour.length > 2) {
      break;
    }
  }

  return contour;
}

function perpendicularDistance(point: Px, start: Px, end: Px): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs(dy * (point.x - start.x) - dx * (point.y - start.y)) / length;
}

function simplifyOpenPolygon(points: Px[], epsilon: number): Px[] {
  if (points.length < 3) return points.slice();

  let maxDistance = 0;
  let farthestIndex = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points.at(-1)!,
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      farthestIndex = i;
    }
  }

  if (maxDistance <= epsilon) return [points[0], points.at(-1)!];

  const left = simplifyOpenPolygon(points.slice(0, farthestIndex + 1), epsilon);
  const right = simplifyOpenPolygon(points.slice(farthestIndex), epsilon);
  return left.slice(0, -1).concat(right);
}

function simplifyPolygon(
  contour: Px[],
  startEpsilon = 3,
  maxVertices = 20,
): Px[] {
  if (contour.length < 4) return contour.slice();

  let epsilon = startEpsilon;
  let result = contour;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const closed = simplifyOpenPolygon(contour.concat(contour[0]), epsilon);
    result = closed.slice(0, -1);
    if (result.length <= maxVertices) break;
    epsilon *= 1.8;
  }

  return result.length >= 3 ? result : contour.slice();
}

function polygonArea(points: Px[]): number {
  let area = 0;

  for (let i = 0; i < points.length; i += 1) {
    const next = (i + 1) % points.length;
    area += points[i].x * points[next].y - points[next].x * points[i].y;
  }

  return Math.abs(area) / 2;
}

function convexHull(points: Px[]): Px[] {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;

  const cross = (origin: Px, a: Px, b: Px) =>
    (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  const lower: Px[] = [];
  const upper: Px[] = [];

  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }

  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }

  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function minimumAreaRectangle(
  hull: Px[],
): { corners: Px[]; area: number } | null {
  if (hull.length < 3) return null;

  let best: { corners: Px[]; area: number } | null = null;

  for (let degrees = 0; degrees < 90; degrees += 1) {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    for (const point of hull) {
      const u = point.x * cos + point.y * sin;
      const v = -point.x * sin + point.y * cos;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }

    const area = (maxU - minU) * (maxV - minV);
    if (!best || area < best.area) {
      const toPoint = (u: number, v: number) => ({
        x: u * cos - v * sin,
        y: u * sin + v * cos,
      });

      best = {
        area,
        corners: [
          toPoint(minU, minV),
          toPoint(maxU, minV),
          toPoint(maxU, maxV),
          toPoint(minU, maxV),
        ],
      };
    }
  }

  return best;
}

function maybeRectangle(polygon: Px[], fillThreshold = 0.9): Px[] | null {
  const hull = convexHull(polygon);
  const rectangle = minimumAreaRectangle(hull);
  if (!rectangle || rectangle.area === 0) return null;

  const fill = polygonArea(hull) / rectangle.area;
  const hullFill = polygonArea(polygon) / Math.max(polygonArea(hull), 1);
  return fill >= fillThreshold && hullFill >= fillThreshold
    ? rectangle.corners
    : null;
}

function pixelToLatLng(point: Px, options: DetectOptions): LatLng {
  const { center, zoom, width, height, scale } = options;
  const worldSize = 256 * 2 ** zoom;
  const centerX = ((center.lng + 180) / 360) * worldSize;
  const sinLatitude = Math.sin((center.lat * Math.PI) / 180);
  const centerY =
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
    worldSize;
  const worldX = centerX + (point.x - width / 2) / scale;
  const worldY = centerY + (point.y - height / 2) / scale;
  const lng = (worldX / worldSize) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * worldY) / worldSize;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));

  return { lat, lng };
}

export function detectRoofFromPixels(
  data: Uint8ClampedArray,
  options: DetectOptions,
): LatLng[] | null {
  const { width, height } = options;
  if (
    width < 1 ||
    height < 1 ||
    data.length !== width * height * 4 ||
    !Number.isFinite(options.zoom) ||
    !Number.isFinite(options.scale) ||
    options.scale <= 0
  ) {
    return null;
  }

  const seed = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const filled = floodFillRegion(data, width, height, seed);
  if (!filled) return null;

  const totalPixels = width * height;
  if (filled.count < 300 || filled.count > totalPixels * 0.45) return null;

  const contour = traceBoundary(filled.mask, width, height);
  if (contour.length < 8) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of contour) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  if ((minX <= 1 && maxX >= width - 2) || (minY <= 1 && maxY >= height - 2)) {
    return null;
  }

  let polygon = simplifyPolygon(contour);
  polygon = maybeRectangle(polygon) ?? polygon;
  if (polygon.length < 3) return null;

  const points = polygon.map((point) => pixelToLatLng(point, options));
  return points.every(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
  )
    ? points
    : null;
}
