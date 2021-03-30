
const WIDTH = 400; // should be 600 for 16:9
const HEIGHT = 333;

let sourceCtx, ctx;
let sourceImageData = null;

// as a performance improvement, off-screen canvases are used:
// one to save the composite image of the strokes selected so far,
// one to apply candidate strokes to and calculate diffs
let compositeCtx, candidateCtx;

// increase this for better convergence, but note that it has an almost linear performance cost
const CANDIDATES_PER_STEP = 25;

function getRandomInt(min, max) { // min max inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function handleImageSelect() {
  if (!this.files || !this.files[0]) return;
  const fileReader = new FileReader();
  fileReader.addEventListener('load', (evt) => {
    const img = new Image();
    img.addEventListener('load', () => {
      const _w = img.width;
      const _h = img.height;
      let displayW, displayH;
      let scale;
      let x0, y0;
      // figure out distortion-free sizing
      if (_w > _h) {
        // wide image -> use full width, adjust height
        displayW = WIDTH;
        scale = displayW / _w;
        displayH = scale * _h;
        x0 = 0;
        y0 = (HEIGHT - displayH) / 2;
      } else {
        // tall image -> use full height, adjust width
        displayH = HEIGHT;
        scale = displayH / _h;
        displayW = scale * _w;
        x0 = (WIDTH - displayW) / 2;
        y0 = 0;
      }

      sourceCtx.clearRect(0, 0, WIDTH, HEIGHT);
      sourceCtx.drawImage(img, x0, y0, displayW, displayH);

      // we can keep diffing the entire canvas - it is a bit wasteful,
      // but note that we have already "cached" the source data of full size
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

  const verticeCount = 3;
  const points = [];
  for (let i=0; i<verticeCount; i++) {
    points.push([getRandomInt(0, WIDTH), getRandomInt(0, HEIGHT)]);
  }

  return {
    points: points,
    color: `rgba(${r},${g},${b},${a})`
  };
}

function drawStroke(_stroke, context) {
  // shifting mutates stroke, so we deep copy
  const stroke = JSON.parse(JSON.stringify(_stroke));
  context.beginPath();
  const startingPoint = stroke.points.shift();
  context.moveTo(startingPoint[0], startingPoint[1]);
  stroke.points.forEach((point) => {
    context.lineTo(point[0], point[1]);
  });
  context.lineTo(startingPoint[0], startingPoint[1]);
  context.fillStyle = stroke.color;
  context.fill();
}

let previousAvgDiff = 255 * 4;
function run() {
  console.time('run');
  // TODO: handle multiple clicks - disable or singleton

  // diff is an avg of diff per channel, so it is at most 255*4
  let bestDiff = 255 * 4;
  let bestStroke = null;

  for (let _i=0; _i<CANDIDATES_PER_STEP; _i++) {
    const stroke = getRandomStroke();

    // reset canvas to saved state
    // NB: drawimage accepts an other canvas, but not a canvasContext
    candidateCtx.clearRect(0, 0, WIDTH, HEIGHT);
    candidateCtx.drawImage(compositeCtx.canvas, 0, 0);

    // draw candidate
    drawStroke(stroke, candidateCtx);

    // calculate avg diff to source img
    let count = 0;
    let diffSum = 0;
    const imageData = candidateCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
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

  // only add the new stroke if it was an improvement
  if (bestDiff < previousAvgDiff) {
    previousAvgDiff = bestDiff;
    // draw composite + new stroke to main canvas,
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(compositeCtx.canvas, 0, 0);
    drawStroke(bestStroke, ctx);
    // then save the new composite
    compositeCtx.clearRect(0, 0, WIDTH, HEIGHT);
    compositeCtx.drawImage(ctx.canvas, 0, 0);
  }

  console.timeEnd('run');
  requestAnimationFrame(run);
}

$(document).ready(function() {
  const sourceCanvas = document.getElementById('source-canvas');
  const targetCanvas = document.getElementById('target-canvas');
  $(sourceCanvas).attr('width', WIDTH);
  $(sourceCanvas).attr('height', HEIGHT);
  $(targetCanvas).attr('width', WIDTH);
  $(targetCanvas).attr('height', HEIGHT);

  // create off-screen canvases
  const compositeCanvas = $('<canvas>');
  compositeCanvas.attr('width', WIDTH);
  compositeCanvas.attr('height', HEIGHT);
  compositeCtx = compositeCanvas.get(0).getContext('2d');
  const candidateCanvas = $('<canvas>');
  candidateCanvas.attr('width', WIDTH);
  candidateCanvas.attr('height', HEIGHT);
  candidateCtx = candidateCanvas.get(0).getContext('2d');

  sourceCtx = sourceCanvas.getContext('2d');
  ctx = targetCanvas.getContext('2d');

  $(sourceCanvas).on('click', () => { $('#fileInput').trigger('click'); });
  $('#fileInput').on('change', handleImageSelect);

  $('.button.clear').on('click', () => { console.log('clear'); });
  $('.button.run').on('click', run);
  $('.button.stop').on('click', () => { console.log('stop'); });
});
