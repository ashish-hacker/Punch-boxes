// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
let x = canvasElement.width - 185;

let y = 0;
let y1 = canvasElement.height+30;
let count = 0;
let co_ordinates = Array(20).fill({'x':0, 'y':0});
let co_ordinates1 = Array(20).fill({'x':0, 'y':0});
let co_ordinates2 = Array(20).fill({'x':0, 'y':0});
let co_ordinates3 = Array(20).fill({'x':0, 'y':0});
let dist = 0;
let max_dist = 0;
let prev = 0;
class tile {
  constructor(x, y, colour, velocity, height, width) {
    this.x = x;
    this.y = y;
    this.colour = colour;
    this.velocity = velocity;
    this.h = height;
    this.w = width;
  }
  draw() {
    canvasCtx.beginPath();
    canvasCtx.fillStyle = this.colour;
    canvasCtx.fillRect(this.x, this.y, this.w, this.h);
    canvasCtx.closePath();
  }
  update() {
    this.draw();

    if(this.y > canvasElement.height+150) {
      this.y = (Math.floor(Math.random()*50)) - 100;
      this.colour = colours[Math.floor(Math.random()*6+1)];
    }
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new FPS();

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};

function zColor(data) {
  return 'white';
}
function calDistance(a, b) {
  return Math.sqrt((a.x - b.x)*(a.x - b.x) +  (a.y - b.y)*(a.y - b.y));
}

const colours = ["orange", "red", "green", "blue", "#9f765e", "#df765e", "#ff99ff", "#00ffff", "#66ff33", "#ccff66"];
let v = { x: 0,
            y: 16};

const left_tiles = [];
const right_tiles = [];
for(let i = 1; i <= 3; i++) {
  let t = new tile(canvasElement.width*0.1*i, (Math.floor(Math.random()*50)) - 100, colours[Math.floor(Math.random()*colours.length+1)], v, 150, 10);
  left_tiles.push(t);
}
for(let i = 7; i <= 9; i++) {
  let t = new tile(canvasElement.width*0.1*i, (Math.floor(Math.random()*50)) - 100, colours[Math.floor(Math.random()*colours.length+1)], v, 150, 10);
  right_tiles.push(t);
}

function onResults(results) {
  // Hide the spinner.
  document.body.classList.add('loaded');


  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.beginPath();
  canvasCtx.fillStyle = 'blue';
  canvasCtx.font = "bold 50px Courier";
  canvasCtx.fillText(`Punches :${count}`, 350, 100);
  canvasCtx.closePath();
  const body_parts = [results.poseLandmarks[19], results.poseLandmarks[20], results.poseLandmarks[28], results.poseLandmarks[27]];
  drawLandmarks(
      canvasCtx,
      body_parts,
      {visibilityMin: 0.55, color: zColor, fillColor: 'rgb(255,138,0)'});
  // GENERATE TILES
  // generate left tiles
  for(let i = 0; i < 3; i++) {
    left_tiles[i].update();
    right_tiles[i].update();
  }


  // FIFO operation
  co_ordinates.shift();
  co_ordinates.push({'x':results.poseLandmarks[19].x, 'y':results.poseLandmarks[19].y});
  co_ordinates1.shift();
  co_ordinates1.push({'x':results.poseLandmarks[20].x, 'y':results.poseLandmarks[20].y});
  co_ordinates2.shift();
  co_ordinates2.push({'x':results.poseLandmarks[27].x, 'y':results.poseLandmarks[27].y});
  co_ordinates3.shift();
  co_ordinates3.push({'x':results.poseLandmarks[28].x, 'y':results.poseLandmarks[28].y});

  const co = [co_ordinates, co_ordinates1, co_ordinates2, co_ordinates3];
  //collisions
  for(let i = 0; i < body_parts.length; i++) {
    for(let j = 0; j < 3; j++) {
      if((body_parts[i].x >= ((left_tiles[j].x-50)/canvasElement.width) && body_parts[i].x <= (left_tiles[j].x+100)/canvasElement.width) &&
    (body_parts[i].y >= (left_tiles[j].y/canvasElement.height) && body_parts[i].y <= (left_tiles[j].y+100)/canvasElement.height)) {
        left_tiles[j].y = -100;
        count += 1;
        dist = calDistance(co[i][19], co[i][0]);
        max_dist = Math.max(max_dist, dist);
        if(dist > 0) prev = dist;
      }
    }
    for(let j = 0; j < 3; j++) {
      if((body_parts[i].x >= ((right_tiles[j].x-50)/canvasElement.width) && body_parts[i].x <= (right_tiles[j].x+100)/canvasElement.width) &&
    (body_parts[i].y >= (right_tiles[j].y/canvasElement.height) && body_parts[i].y <= (right_tiles[j].y+100)/canvasElement.height)) {
        right_tiles[j].y = -100;
        count += 1;
        dist = calDistance(co[i][19], co[i][0]);
        max_dist = Math.max(max_dist, dist);
        if(dist > 0) prev = dist;
      }
    }
  }

  canvasCtx.beginPath();
  canvasCtx.fillStyle = 'red';
  canvasCtx.font = "bold 25px Courier";
  //canvasCtx.fillText(`Current Velocity :${(dist/20).toFixed(3)}`, 700, 100);
  canvasCtx.fillText(`Previous Velocity :${(prev/20).toFixed(3)}`, 700, 90);
  canvasCtx.fillText(`Maximum Velocity :${(max_dist/20).toFixed(3)}`, 700, 120);
  canvasCtx.closePath();
  dist = 0;
  canvasCtx.restore();
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.3.1621277220/${file}`;
}});
pose.onResults(onResults);

/**
 * Instantiate a camera. We'll feed each frame we receive into the solution.
 */
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
      selfieMode: true,
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    .add([
      new StaticText({title: 'MediaPipe Pose'}),
      fpsControl,
      new Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
      new Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full', 'Heavy'],
      }),
      new Toggle({title: 'Smooth Landmarks', field: 'smoothLandmarks'}),
      new Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
      }),
      new Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
      }),
    ])
    .on(options => {
      videoElement.classList.toggle('selfie', options.selfieMode);
      pose.setOptions(options);
    });
