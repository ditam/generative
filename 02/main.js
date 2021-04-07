
let WIDTH;
let HEIGHT;

let ctx;

let DEBUG = false;

function getRandomInt(min, max) { // min max inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomColor() {
  const r = getRandomInt(0, 255);
  const g = getRandomInt(0, 255);
  const b = getRandomInt(0, 255);

  return `rgb(${r},${g},${b})`;
}

const drops = [{
  x: 50,
  y: 20,
  color: 'rgb(50, 200, 50)',
  r: 10
}];

let rotation = 0; // in radians
let lastDrawTime = 0;
let drawCount = 0;

const compositeOperations = [
  'source-over',
  'source-atop',
  'destination-over',
  'destination-out',
  'lighter',
  'xor',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity'
];

function draw(time) {
  if (getRandomInt(0, 100) < 5) {
    const size = WIDTH > HEIGHT? WIDTH : HEIGHT;
    drops.push({
      x: getRandomInt(0, size) - size/2,
      // Note that the canvas gets rotated, so both directions are limited by the same size
      y: getRandomInt(0, size) - size/2,
      r: getRandomInt(1, 15),
      color: getRandomColor()
    });
  }

  drawCount++;
  // every once in a while change composition modes
  if (drawCount % (60 * 10) === 0) {
    const newCompositeOperation = compositeOperations[getRandomInt(0, compositeOperations.length-1)];
    ctx.globalCompositeOperation = newCompositeOperation;
    console.log('set new composite operation:', newCompositeOperation);
  }

  const secondsSpent = (time - lastDrawTime) / 1000;
  lastDrawTime = time;
  const rotationDiff = secondsSpent / (2 * Math.PI);
  rotation += rotationDiff;

  //ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.translate(WIDTH/2, HEIGHT/2);
  ctx.rotate(rotation);

  if (DEBUG) {
    ctx.fillStyle = 'black';
    ctx.arc(0, 0, 10, 0, 2 * Math.PI);
    ctx.fill();
  }

  drops.forEach(drop => {
    ctx.beginPath();
    ctx.fillStyle = drop.color;
    ctx.arc(drop.x, drop.y, drop.r, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.restore();

  requestAnimationFrame(draw);
}

$(document).ready(function() {
  WIDTH = $(window).width();
  HEIGHT = $(window).height();

  $('canvas').attr('width', WIDTH);
  $('canvas').attr('height', HEIGHT);

  ctx = $('canvas').get(0).getContext('2d');

  draw(0);
});
