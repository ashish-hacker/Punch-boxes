// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
let x = canvasElement.width - 185;

let y = 0;
let count = 0;
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

function onResults(results) {

  // Hide the spinner.
  document.body.classList.add('loaded');

  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.fillStyle = 'red';
  canvasCtx.fillRect(x, y, 100, 100);
  canvasCtx.beginPath();
  canvasCtx.fillStyle = 'blue';
  canvasCtx.font = "50px Arial";
  canvasCtx.fillText(`Punches : ${count}`, 350, 100);
  canvasCtx.closePath();
  drawConnectors(
      canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        visibilityMin: 0.65,
        color: 'white'
      });
  drawLandmarks(
      canvasCtx,
      Object.values(POSE_LANDMARKS_LEFT)
          .map(index => results.poseLandmarks[index]),
      {visibilityMin: 0.65, color: zColor, fillColor: 'rgb(255,138,0)'});
  drawLandmarks(
      canvasCtx,
      Object.values(POSE_LANDMARKS_RIGHT)
          .map(index => results.poseLandmarks[index]),
      {visibilityMin: 0.65, color: zColor, fillColor: 'rgb(0,217,231)'});
  drawLandmarks(
      canvasCtx,
      Object.values(POSE_LANDMARKS_NEUTRAL)
          .map(index => results.poseLandmarks[index]),
      {visibilityMin: 0.65, color: zColor, fillColor: 'white'});
  const Ax = results.poseLandmarks[23].x;
  const Ay = results.poseLandmarks[23].y;
  const Az = results.poseLandmarks[23].z;
  const Bx = results.poseLandmarks[25].x;
  const By = results.poseLandmarks[25].y;
  const Bz = results.poseLandmarks[25].z;
  const Cx = results.poseLandmarks[27].x;
  const Cy = results.poseLandmarks[27].y;
  const Cz = results.poseLandmarks[27].z;
  const ABx = Ax - Bx;
  const ABy = Ay - By;
  const ABz = Az - Bz;
  const BCx = Cx - Bx;
  const BCy = Cy - By;
  const BCz = Cz - Bz;
  const dotProduct
        = ABx * BCx
          + ABy * BCy
          + ABz * BCz;

  // Find magnitude of
  // line AB and BC
  const magnitudeAB
        = ABx * ABx
          + ABy * ABy
          + ABz * ABz;
  const magnitudeBC
        = BCx * BCx
          + BCy * BCy
          + BCz * BCz;
  // Find the cosine of
  // the angle formed
  // by line AB and BC
  var angle = dotProduct;
  angle /= Math.sqrt(magnitudeAB * magnitudeBC);
  angle = Math.acos(angle);
  angle = (angle * 180) / Math.PI;
  // Print the angle
  //console.log(Math.abs(angle));
  //canvasCtx.restore();
  if(angle <= 80) {
    drawConnectors(
        canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          visibilityMin: 0.65,
          color: 'green'
        });
  }
  else {
    drawConnectors(
        canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          visibilityMin: 0.65,
          color: 'white'
        });
  }


  y += 12;
  if(y >= canvasElement.height - 150) {
    y = 0;
  }
  //console.log(y);
  if((results.poseLandmarks[19].x >= ((x-50)/canvasElement.width) && results.poseLandmarks[19].x <= (x+100)/canvasElement.width) &&
    (results.poseLandmarks[19].y >= (y/canvasElement.height) && results.poseLandmarks[19].y <= (y+100)/canvasElement.height)) {
    y = -30;
    count += 1;

  }
  if((results.poseLandmarks[20].x >= ((x-50)/canvasElement.width) && results.poseLandmarks[20].x <= (x+100)/canvasElement.width) &&
    (results.poseLandmarks[20].y >= (y/canvasElement.height) && results.poseLandmarks[20].y <= (y+100)/canvasElement.height)) {
    y = -30;
    count += 1;


  }
  console.log(count);
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
