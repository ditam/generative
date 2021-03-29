
const WIDTH = 400; // should be 600 for 16:9
const HEIGHT = 333;

let sourceCtx, targetCtx;

let xPosition = 0;

function handleImageSelect() {
  if (!this.files || !this.files[0]) return;
  const fileReader = new FileReader();
  fileReader.addEventListener('load', (evt) => {
    const img = new Image();
    img.addEventListener('load', () => {
      sourceCtx.clearRect(0, 0, WIDTH, HEIGHT);
      sourceCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    });
    img.src = evt.target.result;
  });
  fileReader.readAsDataURL(this.files[0]);
}

function drawFrame(timestamp) {
  sourceCtx.clearRect(0, 0, WIDTH, HEIGHT);
}

$(document).ready(function() {
  const sourceCanvas = document.getElementById('source-canvas');
  const targetCanvas = document.getElementById('target-canvas');
  $(sourceCanvas).attr('height', HEIGHT);
  $(sourceCanvas).attr('width', WIDTH);
  $(targetCanvas).attr('height', HEIGHT);
  $(targetCanvas).attr('width', WIDTH);

  sourceCtx = sourceCanvas.getContext('2d');
  targetCtx = targetCanvas.getContext('2d');

  $(sourceCanvas).on('click', () => { $('#fileInput').trigger('click'); });
  $('#fileInput').on('change', handleImageSelect);

  $('.button.clear').on('click', () => { console.log('clear'); });
  $('.button.run').on('click', () => { console.log('run'); });
  $('.button.stop').on('click', () => { console.log('stop'); });

  drawFrame();
});
