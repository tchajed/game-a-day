export type Point = { x: number; y: number };
export type Polygon = readonly Point[];
export type CompoundShape = readonly Polygon[];
export type Pose = { x: number; y: number; angle: number };

const roundedRectangle = (halfWidth: number, halfHeight: number, radius: number, cornerSteps = 4): Point[] => {
  const points: Point[] = [];
  const corners = [
    { x: halfWidth - radius, y: -halfHeight + radius, start: -Math.PI / 2 },
    { x: halfWidth - radius, y: halfHeight - radius, start: 0 },
    { x: -halfWidth + radius, y: halfHeight - radius, start: Math.PI / 2 },
    { x: -halfWidth + radius, y: -halfHeight + radius, start: Math.PI },
  ];

  for (const corner of corners) {
    for (let step = 0; step <= cornerSteps; step++) {
      const angle = corner.start + (step / cornerSteps) * Math.PI / 2;
      points.push({ x: corner.x + Math.cos(angle) * radius, y: corner.y + Math.sin(angle) * radius });
    }
  }
  return points;
};

const rectangle = (x: number, y: number, width: number, height: number): Point[] => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    { x: x - halfWidth, y: y - halfHeight },
    { x: x + halfWidth, y: y - halfHeight },
    { x: x + halfWidth, y: y + halfHeight },
    { x: x - halfWidth, y: y + halfHeight },
  ];
};

// These fixtures trace the visible dark chassis and the four exposed tires.
// The drop shadow is intentionally excluded: it has no physical substance.
export const CAR_LOCAL_SHAPE: CompoundShape = [
  roundedRectangle(73, 35, 19),
  rectangle(-43, -35, 24, 8),
  rectangle(-43, 35, 24, 8),
  rectangle(43, -35, 24, 8),
  rectangle(43, 35, 24, 8),
];

export const CONE_LOCAL_SHAPE: CompoundShape = [[
  { x: -8, y: 11 },
  { x: 0, y: -11 },
  { x: 8, y: 11 },
]];

export const transformShape = (shape: CompoundShape, pose: Pose): Point[][] => {
  const cosine = Math.cos(pose.angle);
  const sine = Math.sin(pose.angle);
  return shape.map(polygon => polygon.map(point => ({
    x: pose.x + point.x * cosine - point.y * sine,
    y: pose.y + point.x * sine + point.y * cosine,
  })));
};

const polygonsIntersect = (a: Polygon, b: Polygon): boolean => {
  for (const polygon of [a, b]) {
    for (let index = 0; index < polygon.length; index++) {
      const point = polygon[index];
      const next = polygon[(index + 1) % polygon.length];
      const axis = { x: -(next.y - point.y), y: next.x - point.x };
      let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;

      for (const vertex of a) {
        const projection = vertex.x * axis.x + vertex.y * axis.y;
        minA = Math.min(minA, projection);
        maxA = Math.max(maxA, projection);
      }
      for (const vertex of b) {
        const projection = vertex.x * axis.x + vertex.y * axis.y;
        minB = Math.min(minB, projection);
        maxB = Math.max(maxB, projection);
      }
      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
};

export const shapesIntersect = (a: CompoundShape, b: CompoundShape): boolean =>
  a.some(aPolygon => b.some(bPolygon => polygonsIntersect(aPolygon, bPolygon)));

export const carShapeAt = (pose: Pose): Point[][] => transformShape(CAR_LOCAL_SHAPE, pose);
