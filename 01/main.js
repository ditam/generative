
const WIDTH = 400; // should be 600 for 16:9
const HEIGHT = 333;

let sourceCtx, ctx;
let sourceImageData = null;

// as a performance improvement, an off-screen canvas holds the
// composite image of the strokes selected so far.
let offscreenCtx;

const CANDIDATES_PER_STEP = 20;
const STEP_DELAY = 100;

function getRandomInt(min, max) { // min max inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function handleImageSelect() {
  if (!this.files || !this.files[0]) return;
  const fileReader = new FileReader();
  fileReader.addEventListener('load', (evt) => {
    const img = new Image();
    img.addEventListener('load', () => {
      sourceCtx.clearRect(0, 0, WIDTH, HEIGHT);
      sourceCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
      sourceImageData = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
    });
    img.src = evt.target.result;
  });
  fileReader.readAsDataURL(this.files[0]);
}

function getRandomStroke() {
  const r = getRandomInt(0, 255);
  const g = getRandomInt(0, 255);
  const b = getRandomInt(0, 255);
  const a = Math.random();

  return {
    points: [
      [getRandomInt(0, WIDTH), getRandomInt(0, HEIGHT)],
      [getRandomInt(0, WIDTH), getRandomInt(0, HEIGHT)],
      [getRandomInt(0, WIDTH), getRandomInt(0, HEIGHT)]
    ],
    color: `rgba(${r},${g},${b},${a})`
  };
}

function drawStroke(_stroke) {
  // shifting mutates stroke, so we deep copy
  const stroke = JSON.parse(JSON.stringify(_stroke));
  ctx.beginPath();
  const startingPoint = stroke.points.shift();
  ctx.moveTo(startingPoint[0], startingPoint[1]);
  stroke.points.forEach((point) => {
    ctx.lineTo(point[0], point[1]);
  });
  ctx.lineTo(startingPoint[0], startingPoint[1]);
  ctx.fillStyle = stroke.color;
  ctx.fill();
}

function run() {
  // TODO: handle multiple clicks - disable or singleton

  // diff is an avg of diff per channel, so it is at most 255*4
  let bestDiff = 255 * 4;
  let bestStroke = null;

  for (let _i=0; _i<CANDIDATES_PER_STEP; _i++) {
    const stroke = getRandomStroke();

    // reset canvas to saved state
    // NB: drawimage accepts an other canvas, but not a canvasContext
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(offscreenCtx.canvas, 0, 0);

    // draw candidate
    drawStroke(stroke);

    // calculate avg diff to source img
    let count = 0;
    let diffSum = 0;
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    for (let i = 0; i < imageData.length; i += 4) {
      const sourceRed = sourceImageData[i];
      const sourceGreen = sourceImageData[i + 1];
      const sourceBlue = sourceImageData[i + 2];
      const sourceAlpha = sourceImageData[i + 3];
      const red = imageData[i];
      const green = imageData[i + 1];
      const blue = imageData[i + 2];
      const alpha = imageData[i + 3];

      diffSum += Math.abs(sourceRed - red);
      diffSum += Math.abs(sourceGreen - green);
      diffSum += Math.abs(sourceBlue - blue);
      diffSum += Math.abs(sourceAlpha - alpha);

      count++;
    }

    // save stroke if best
    const avgDiff = diffSum / count;
    if (avgDiff < bestDiff) {
      bestDiff = avgDiff;
      bestStroke = stroke;
    }

  }

  // reload saved state, apply selected stroke and save
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(offscreenCtx.canvas, 0, 0);
  drawStroke(bestStroke);
  offscreenCtx.clearRect(0, 0, WIDTH, HEIGHT);
  offscreenCtx.drawImage(ctx.canvas, 0, 0);

  setTimeout(run, STEP_DELAY);
}

$(document).ready(function() {
  const sourceCanvas = document.getElementById('source-canvas');
  const targetCanvas = document.getElementById('target-canvas');
  $(sourceCanvas).attr('width', WIDTH);
  $(sourceCanvas).attr('height', HEIGHT);
  $(targetCanvas).attr('width', WIDTH);
  $(targetCanvas).attr('height', HEIGHT);

  // create an offscreen canvas
  const offscreenCanvas = $('<canvas>');
  offscreenCanvas.attr('width', WIDTH);
  offscreenCanvas.attr('height', HEIGHT);
  offscreenCtx = offscreenCanvas.get(0).getContext('2d');

  sourceCtx = sourceCanvas.getContext('2d');
  ctx = targetCanvas.getContext('2d');

  $(sourceCanvas).on('click', () => { $('#fileInput').trigger('click'); });
  $('#fileInput').on('change', handleImageSelect);

  $('.button.clear').on('click', () => { console.log('clear'); });
  $('.button.run').on('click', run);
  $('.button.stop').on('click', () => { console.log('stop'); });
});
