
let WIDTH;
let HEIGHT;

let ctx;

let lastDrawTime = 0;
let drawCount = 0;

function getPointBetween(a, b, distance) {
  console.assert(distance <= 1, 'distance should be <= 1')
  let x0 = a.x;
  let y0 = a.y;
  const dx = b.x-a.x;
  const dy = b.y-a.y;
  return {
    x: x0 + distance * dx,
    y: y0 + distance * dy
  };
}

const points = [];
const sizeX = 70;
const sizeY = 140;
const COLUMNS = 13;
const ROWS = 3;
const stepDuration = 1000;

function getRandomPoint() {
  return {
    x: Math.floor(Math.random() * sizeX),
    y: Math.floor(Math.random() * sizeY),
  };
}

function isPointTooCloseToExistingPoints(_p) {
  const minDistX = sizeX/4;
  const minDistY = sizeY/4;
  return points.some(p => {
    return Math.abs(p.x - _p.x) < minDistX && Math.abs(p.y - _p.y) < minDistY;
  });
}

for (let i=0; i<8; i++) {
  let newPoint;
  let tries = 0;
  do {
    tries++;
    newPoint = getRandomPoint();
  } while (isPointTooCloseToExistingPoints(newPoint) && tries < 10)

  points.push(getRandomPoint());
}

const permutations = [];

for (let i=0; i<COLUMNS * ROWS; i++) {
  let _points = JSON.parse(JSON.stringify(points));
  for (let j=0; j<10; j++) {
    let i1 = Math.floor(Math.random() * _points.length);
    let i2 = Math.floor(Math.random() * _points.length);
    let tmp = _points[i1];
    _points[i1] = _points[i2];
    _points[i2] = tmp;
  }
  permutations.push(_points);
}

function draw(time) {
  drawCount++;

  lastDrawTime = time;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const currentlyAnimatingEdge = Math.floor(time/stepDuration);
  const progress = (time - stepDuration * currentlyAnimatingEdge) / stepDuration;

  permutations.forEach((points, _i) => {
    const currentRow = Math.floor(_i/COLUMNS);
    const currentCol = _i - (currentRow * 13);
    const offsetX = (currentCol + 1.5) * (sizeX + 10);
    const offsetY = (currentRow + 0.5) * (sizeY + 10);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    points.forEach((point, i) => {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      const nextPointIndex = i + 1;
      const nextPoint = points[nextPointIndex];
      if (!nextPoint) {
        return;
      }

      let target;
      if (i < currentlyAnimatingEdge) {
        target = nextPoint;
      } else if (i === currentlyAnimatingEdge) {
        target = getPointBetween(point, nextPoint, progress);
      } else {
        return;
      }

      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });
    ctx.restore();
  });

  requestAnimationFrame(draw);
}

// Improvement ideas:
// - dynamic layout based on screen size
// - regenerate points and restart after a while
// - after a while, draw backwards to disappear and then regenerate
// - display base points somewhere (1 block in middle? Big block on the left?)
// - dynamic colors
// - adjust line width based on position (increasing left-to-right, or towards middle)

$(document).ready(function() {
  WIDTH = $(window).width();
  HEIGHT = $(window).height();

  $('canvas').attr('width', WIDTH);
  $('canvas').attr('height', HEIGHT);

  ctx = $('canvas').get(0).getContext('2d');
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#d0b300';

  draw(0);
});
