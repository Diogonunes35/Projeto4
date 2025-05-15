let mic, capture;
let gamma = 0;
let mode = "sing"; // "sing", "sunlight", "water"
let progress = { sing: 0, sunlight: 0, water: 0 };
let displayedProgress = { sing: 0, sunlight: 0, water: 0 };

let decayRate = 0.05;      // Decay per frame (when inactive or not performing)
let progressRate = 0.5;    // Progress increase per frame
let completionMessage = "";

function setup() {
  createCanvas(windowWidth, windowHeight);

  mic = new p5.AudioIn();
  mic.start();

  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.hide();

  window.addEventListener('deviceorientation', (event) => {
    gamma = event.gamma;
  });

  textAlign(CENTER, CENTER);
  textSize(18);
}

function draw() {
  background(255);

  drawButtons();
  updateProgress();
  drawProgressBar();

  if (completionMessage !== "") {
    fill(0, 200, 0);
    textSize(24);
    text(completionMessage, width / 2, height / 2 + 100);
  }
}

function drawButtons() {
  let labels = ["Sing", "Sunlight", "Water"];
  for (let i = 0; i < labels.length; i++) {
    let x = 50 + i * (width / 4);
    let y = 50;
    let w = width / 5;
    let h = 40;
    fill(mode === labels[i].toLowerCase() ? '#aaa' : '#ddd');
    rect(x, y, w, h, 10);
    fill(0);
    text(labels[i], x + w / 2, y + h / 2);
  }
}

function updateProgress() {
  let activePerformed = false;

  // Check performance of the current task
  if (progress[mode] < 100) {
    if (mode === "sing") {
      let level = mic.getLevel();
      if (level > 0.01) {
        progress.sing += progressRate;
        activePerformed = true;
      }
    } else if (mode === "sunlight") {
      image(capture, 0, 0, 1, 1);
      capture.loadPixels();
      let avg = 0;
      for (let i = 0; i < capture.pixels.length; i += 4) {
        avg += (capture.pixels[i] + capture.pixels[i + 1] + capture.pixels[i + 2]) / 3;
      }
      avg /= (capture.pixels.length / 4);
      if (avg > 100) {
        progress.sunlight += progressRate;
        activePerformed = true;
      }
    } else if (mode === "water") {
      if (abs(gamma) > 20) {
        progress.water += progressRate;
        activePerformed = true;
      }
    }
  }

  // Apply decay to ALL modes, including active if not performed
  for (let key in progress) {
    if (progress[key] < 100) {
      if (key !== mode || !activePerformed) {
        progress[key] = max(0, progress[key] - decayRate);
      }
    }
    if (progress[key] > 100) progress[key] = 100; // clamp
  }

  // Smooth visual animation with lerp
  for (let key in displayedProgress) {
    displayedProgress[key] = lerp(displayedProgress[key], progress[key], 0.1);

    // Snap to 100% when very close
    if (abs(displayedProgress[key] - 100) < 0.5 && progress[key] >= 100) {
      displayedProgress[key] = 100;
    }
  }

  // Completion message
  if (progress[mode] >= 100 && completionMessage === "") {
    completionMessage = `Congrats! ${capitalize(mode)} task completed!`;
  }
}

function drawProgressBar() {
  let barWidth = width * 0.8;
  let barHeight = 30;
  let x = width * 0.1;
  let y = height / 2;

  fill(220);
  rect(x, y, barWidth, barHeight, 10);

  let p = displayedProgress[mode];
  fill(100, 200, 100);
  rect(x, y, map(p, 0, 100, 0, barWidth), barHeight, 10);

  fill(0);
  text(`${capitalize(mode)}: ${floor(p)}%`, width / 2, y - 20);
}

function mousePressed() {
  userStartAudio();
  let labels = ["sing", "sunlight", "water"];
  for (let i = 0; i < labels.length; i++) {
    let x = 50 + i * (width / 4);
    let y = 50;
    let w = width / 5;
    let h = 40;
    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
      mode = labels[i];
      completionMessage = "";
    }
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function limparLocalStorage() {
  localStorage.clear();
  console.log("Local storage limpo!");
}
