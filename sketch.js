let mic, capture;
let gamma = 0;
let mode = "sing";
let progress = { sing: 0, sunlight: 0, water: 0 };
let displayedProgress = { sing: 0, sunlight: 0, water: 0 };

let decayRate = 0.05;
let progressRate = 0.5;
let completionMessage = "";

let musicalNotes = [];
let sunParticles = [];
let waterDroplets = [];
let sunGlowAlpha = 0;

// Design Settings
let minNoteSize = 24;
let maxNoteSize = 40;
let noteAlphaDecrease = 3;
let noteEmojis = ["🎵", "♫", "♪"];

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

  if (mode === "sing") {
    drawSingAnimation();
  } else if (mode === "sunlight") {
    drawSunlightAnimation();
  } else if (mode === "water") {
    drawWaterAnimation();
  }

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

  if (progress[mode] < 100) {
    if (mode === "sing") {
      let level = mic.getLevel();
      if (level > 0.01) {
        progress.sing += progressRate;
        activePerformed = true;

        if (frameCount % 5 === 0) {
          musicalNotes.push({
            x: random(width),
            y: height,
            speed: random(1, 3),
            size: random(minNoteSize, maxNoteSize),
            alpha: 255,
            emoji: random(noteEmojis),
            colorOffset: random(1000)
          });
        }
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

        if (frameCount % 5 === 0) {
          sunParticles.push({
            x: random(width),
            y: 0,
            speed: random(0.5, 1.5),
            size: random(4, 10),
            alpha: 255
          });
        }
      }
    } else if (mode === "water") {
      if (abs(gamma) > 20) {
        progress.water += progressRate;
        activePerformed = true;

        if (frameCount % 5 === 0) {
          waterDroplets.push({
            x: random(width),
            y: 0,
            speed: random(2, 5),
            size: random(5, 10),
            alpha: 255,
            splashed: false
          });
        }
      }
    }
  }

  for (let key in progress) {
    if (progress[key] < 100) {
      if (key !== mode || !activePerformed) {
        progress[key] = max(0, progress[key] - decayRate);
      }
    }
    if (progress[key] > 100) progress[key] = 100;
  }

  for (let key in displayedProgress) {
    displayedProgress[key] = lerp(displayedProgress[key], progress[key], 0.1);
    if (abs(displayedProgress[key] - 100) < 0.5 && progress[key] >= 100) {
      displayedProgress[key] = 100;
    }
  }

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

function drawSingAnimation() {
  for (let i = musicalNotes.length - 1; i >= 0; i--) {
    let note = musicalNotes[i];

    let hueShift = (millis() * 0.05 + note.colorOffset) % 360;
    colorMode(HSB, 360, 100, 100, 255);
    fill(hueShift, 80, 100, note.alpha);
    colorMode(RGB, 255);

    textSize(note.size);
    text(note.emoji, note.x, note.y);

    note.y -= note.speed;
    note.alpha -= noteAlphaDecrease;

    if (note.alpha <= 0) {
      musicalNotes.splice(i, 1);
    }
  }
}

function drawSunlightAnimation() {
  if (sunParticles.length > 0) {
    sunGlowAlpha = lerp(sunGlowAlpha, 150, 0.05);
  } else {
    sunGlowAlpha = lerp(sunGlowAlpha, 0, 0.05);
  }

  noStroke();
  for (let i = sunParticles.length - 1; i >= 0; i--) {
    let p = sunParticles[i];
    fill(255, 204, 0, p.alpha);
    ellipse(p.x, p.y, p.size);
    p.y += p.speed;
    p.alpha -= 1;
    if (p.alpha <= 0) {
      sunParticles.splice(i, 1);
    }
  }

  noStroke();
  for (let i = 0; i < 200; i++) {
    let inter = map(i, 0, 200, 0, 1);
    fill(255, 255, 150, sunGlowAlpha * (1 - inter));
    rect(0, i, width, 1);
  }
}

function drawWaterAnimation() {
  for (let i = waterDroplets.length - 1; i >= 0; i--) {
    let d = waterDroplets[i];
    fill(100, 150, 255, d.alpha);
    ellipse(d.x, d.y, d.size);

    d.y += d.speed;
    d.alpha -= 2;

    if (!d.splashed && d.y >= height - 10) {
      d.splashed = true;
    }

    if (d.alpha <= 0) {
      waterDroplets.splice(i, 1);
    }
  }
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
  console.log("Local storage limpo!");
}
