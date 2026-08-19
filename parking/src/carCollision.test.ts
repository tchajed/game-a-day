import { carShapeAt, shapesIntersect } from './carCollision';

const car = (x: number, y: number, angle = 0) => carShapeAt({ x, y, angle });
const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(shapesIntersect(car(0, 0), car(0, 0)), 'overlapping cars should collide');
assert(!shapesIntersect(car(0, 0), car(200, 0)), 'separated cars should not collide');
assert(
  !shapesIntersect(car(0, 0), car(140, 65)),
  'transparent rounded corners should not collide merely because their bounds overlap',
);
assert(
  shapesIntersect(car(0, 0), car(0, 73)),
  'the exposed visible tires should be part of the collision shape',
);
assert(
  shapesIntersect(car(0, 0), car(70, 0, Math.PI / 2)),
  'collision should account for arbitrary car rotation',
);

console.log('car collision checks passed');
