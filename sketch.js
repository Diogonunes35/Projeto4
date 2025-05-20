let seed;
let faseAtual = 0;
let componentes = []; // Lista de imagens da planta
let vetoresFases = []; // Matriz de vetores para cada fase
let planta = []; // Componentes atuais da planta
let maxFases = 5;

//variaveis tempo
let temperature = 0;
let weather = "";
let city = "Loading...";
let weatherData;

let bgColor;
let windSpeed = 0;

let clouds = [];
let cloudOpacity = 200;

let fogParticles = [];
const FOG_PARTICLE_COUNT = 60;

let rainDrops = [];
const RAIN_DROP_COUNT = 100;

let starPositions = [];

let displayWeather = null;

//tarefas
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

function preload() {
  for (let fase = 0; fase < maxFases; fase++) {
    let vetoresParaFase = [];
    for (let i = 0; i < 5; i++) {
      let caminho = `assets/live/fase${fase}/${i}.svg`;
      let img = loadImage(
        caminho,
        () => console.log(`Imagem carregada: ${caminho}`),
        () => console.error(`Erro ao carregar: ${caminho}`)
      );
      vetoresParaFase.push(img);
    }
    vetoresFases.push(vetoresParaFase);
  }

  console.log("Imagens carregadas:", vetoresFases);
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  try {
    if (localStorage.getItem('plantaSeed')) {
      seed = localStorage.getItem('plantaSeed');
      faseAtual = parseInt(localStorage.getItem('faseAtual')) || 0;
      maxFases = parseInt(localStorage.getItem('maxFases')) || 5;

      // Recria o vetor planta com base nos índices salvos
      let plantaIndices = JSON.parse(localStorage.getItem('planta')) || [];
      planta = plantaIndices.map((index, i) => {
        if (vetoresFases[i]) {
          return vetoresFases[i][index];
        } else {
          console.error(`Fase ${i} não encontrada em vetoresFases.`);
          return null;
        }
      });
    } else {
      inicializarDados();
    }
  } catch (e) {
    console.error("Erro ao carregar dados do localStorage:", e);
    inicializarDados();
  }

  randomSeed(int(seed)); 
  gerarPlanta();

  //tempo
  textFont('Arial');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(gotLocation, locationError);
  } else {
    city = "Geolocation not supported";
  }

  generateClouds();
  generateFogParticles();
  generateRainDrops();
  generateStars();

  //tarefas
  mic = new p5.AudioIn();
  mic.start();

  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.hide();

  window.addEventListener('deviceorientation', (event) => {
    gamma = event.gamma;
  });

  textAlign(CENTER, CENTER);
}

function inicializarDados() {
  seed = Math.floor(random(100000, 999999)); // Gera uma seed aleatória entre 100000 e 999999
  faseAtual = 0;
  maxFases = 5;
  planta = [];

  localStorage.setItem('plantaSeed', seed);
  localStorage.setItem('faseAtual', faseAtual);
  localStorage.setItem('maxFases', maxFases);
  localStorage.setItem('planta', JSON.stringify([])); // Salva um vetor vazio
}

function gerarPlanta() {
  randomSeed(int(seed));

  planta = [];
  let plantaIndices = [];

  for (let i = 0; i <= faseAtual; i++) {
    if (vetoresFases[i]) {
      let vetorIndex = int(random(0, 5));
      let img = vetoresFases[i][vetorIndex];

      if (img && img.width > 0 && img.height > 0) {
        planta.push(img);
        plantaIndices.push(vetorIndex);
      } else {
        console.error(`Imagem da fase ${i}, índice ${vetorIndex} não foi carregada.`);
      }
    } else {
      console.error(`Fase ${i} não encontrada em vetoresFases.`);
    }
  }

  console.log("Planta gerada:", planta);

  localStorage.setItem('planta', JSON.stringify(plantaIndices));
}

//tempo
function gotLocation(position) {
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;
  let apiKey = 'e812164ca05ed9e0344b89ebe273c141';
  let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  loadJSON(url, gotWeatherData);
}

function locationError(err) {
  console.error("Location error: ", err.message);
  city = "Location error";
}

function gotWeatherData(data) {
  weatherData = data;
  temperature = weatherData.main.temp;
  weather = weatherData.weather[0].description;
  city = weatherData.name;
  windSpeed = weatherData.wind.speed;
}

function draw() {
  //tempo
  if (!displayWeather && weatherData) {
    let main = weatherData.weather[0].main.toLowerCase();
    let desc = weatherData.weather[0].description.toLowerCase();

    if (["rain", "drizzle", "thunderstorm"].includes(main)) {
      displayWeather = "rainy";
    } else if (["clouds"].includes(main) || desc.includes("cloud")) {
      displayWeather = "cloudy";
    } else if (["mist", "fog", "haze", "dust", "smoke"].includes(main)) {
      displayWeather = "fog";
    } else {
      displayWeather = "clear";
    }
  }

  let now = Math.floor(Date.now() / 1000);
  let sunrise = weatherData?.sys?.sunrise || 0;
  let sunset = weatherData?.sys?.sunset || 0;

  let nightColor = color(5, 10, 30);
  let dayColor = color(135, 206, 250);

  if (now < sunrise || now > sunset) {
    bgColor = nightColor;
  } else {
    let dayProgress = map(now, sunrise, sunset, 0, 1);
    let smoothDay = sin(dayProgress * PI);
    bgColor = lerpColor(nightColor, dayColor, smoothDay);
  }

  background(bgColor);

  // Draw stars only at night
  if (now < sunrise || now > sunset) {
    drawStars();
  }

  if (["cloudy", "rainy"].includes(displayWeather)) {
    cloudOpacity = lerp(cloudOpacity, 200, 0.05);
    updateClouds();
    drawClouds();
  } else {
    cloudOpacity = lerp(cloudOpacity, 0, 0.05);
  }

  if (displayWeather === "fog") {
    updateFogParticles();
    drawFogParticles();
  }

  if (displayWeather === "rainy") {
    updateRainDrops();
    drawRainDrops();
  }

  // GRASS + FENCE
  noStroke();
  fill(120, 180, 90);
  let GREENheight = 100;
  rect(0, height - GREENheight, width, GREENheight);

  let fenceColor = color(200, 100, 70);
  let postWidth = 60;
  let postHeight = 300;
  for (let i = 0; i < width; i += postWidth - 4) {
    let x = i;
    let y = height - GREENheight - postHeight;
    fill(fenceColor);
    rect(x, y, postWidth, postHeight, 3);
    stroke(160, 80, 60);
    line(x + 5, y + 10, x + 5, y + postHeight - 10);
    line(x + 10, y + 5, x + 10, y + postHeight - 5);
    noStroke();
  }

  //planta
  let baseX = width / 2;
  let baseY = height - 200; // Ponto inicial da base

  // Ajusta o tamanho da planta com base no tipo de dispositivo
  let larguraDesejada = windowWidth > 768 ? 120 : 90; // Maior no PC, menor no telemóvel
  let alturaDesejada = windowWidth > 768 ? 80 : 60;   // Maior no PC, menor no telemóvel
  let distanciaEntrePartes = alturaDesejada - 10;    // Distância entre os componentes

  imageMode(CENTER);

  for (let i = 0; i < planta.length; i++) {
    if (planta[i] && planta[i].width > 0 && planta[i].height > 0) { // Verifica se a imagem foi carregada
      let posX = baseX;
      let posY = baseY - (i * distanciaEntrePartes);
      image(planta[i], posX, posY, larguraDesejada, alturaDesejada);
    } else {
      console.warn(`Imagem da planta na posição ${i} não foi carregada ou está vazia.`);
    }
  }

  // Desenha barra de progresso
  rectMode(CORNER);

  // Ajusta o tamanho da barra de progresso conforme o dispositivo
  let barraLargura, barraAltura, barraX, barraY;
  if (windowWidth > 768) {
    // PC
    barraLargura = 500;
    barraAltura = 50;
    barraX = width / 2 - 250;
    barraY = 60;
  } else {
    // Telemóvel
    barraLargura = 220;
    barraAltura = 30;
    barraX = width / 2 - barraLargura / 2;
    barraY = 60;
  }

  fill(255);
  rect(barraX, barraY, barraLargura, barraAltura, 10);
  fill(0, 255, 0);
  let progression = map(faseAtual, 0, maxFases - 1, 0, barraLargura);
  rect(barraX, barraY, progression, barraAltura, 10);
  fill(0);
  textAlign(CENTER);
  textSize(windowWidth > 768 ? 24 : 16);
  text(`Fase: ${faseAtual + 1} de ${maxFases}`, width / 2, barraY + barraAltura / 2 + (windowWidth > 768 ? 10 : 6));

  //tarefas
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

function mousePressed() {
  userStartAudio();
  let labels = ["sing", "sunlight", "water"];
  for (let i = 0; i < labels.length; i++) {
    let x = i * (width / 3) + width / 15;
    let y = height - 80;
    let w = width / 5;
    let h = 40;
    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
      mode = labels[i];
      completionMessage = "";
    }
  }
}

function limparLocalStorage() {
  localStorage.clear();
  console.log("Local storage limpo!");
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    limparLocalStorage();
    window.location.reload()
  }

  if (key === 's' || key === 'S') {
      if (faseAtual < maxFases - 1) {
    faseAtual++;
    console.log(`Fase atual: ${faseAtual}`); // Verifica se está incrementando
    gerarPlanta();
    localStorage.setItem('faseAtual', faseAtual);
  } else {
    console.log("Você já atingiu o número máximo de fases.");
  }
}
}

//tempo
// ---------- CLOUDS ----------
function generateClouds() {
  for (let i = 0; i < 20; i++) {
    clouds.push({
      x: random(width),
      y: random(30, 200),
      size: random(40, 70),
      offset: random(TWO_PI)
    });
  }
}

function updateClouds() {
  let windX = map(windSpeed, 0, 10, 0, 1);
  for (let c of clouds) {
    c.x += windX;
    if (c.x > width + 100) c.x = -100;
  }
}

function drawClouds() {
  noStroke();
  fill(255, cloudOpacity);
  for (let c of clouds) {
    ellipse(c.x, c.y, c.size, c.size * 0.6);
    ellipse(c.x + 15, c.y - 10, c.size * 1.2, c.size * 0.7);
    ellipse(c.x - 15, c.y - 10, c.size * 1.1, c.size * 0.6);
  }
}

// ---------- FOG ----------
function generateFogParticles() {
  for (let i = 0; i < FOG_PARTICLE_COUNT; i++) {
    fogParticles.push({
      x: random(width),
      y: random(height / 2),
      size: random(80, 140),
      alpha: random(30, 70),
      xDrift: random(-0.2, 0.2),
      yDrift: random(-0.05, 0.05),
    });
  }
}

function updateFogParticles() {
  for (let p of fogParticles) {
    p.x += p.xDrift;
    p.y += p.yDrift;

    if (p.x > width + p.size / 2) p.x = -p.size / 2;
    else if (p.x < -p.size / 2) p.x = width + p.size / 2;

    if (p.y > height / 2 + p.size / 2) p.y = random(-p.size / 2, 0);
    else if (p.y < -p.size / 2) p.y = height / 2 + p.size / 2;
  }
}

function drawFogParticles() {
  noStroke();
  for (let p of fogParticles) {
    fill(230, 230, 230, p.alpha);
    ellipse(p.x, p.y, p.size, p.size * 0.6);
  }
}

// ---------- RAIN ----------
function generateRainDrops() {
  for (let i = 0; i < RAIN_DROP_COUNT; i++) {
    rainDrops.push({
      x: random(width),
      y: random(height),
      length: random(7, 13),
      speed: random(4, 7),
      alpha: random(120, 200),
    });
  }
}

function updateRainDrops() {
  for (let drop of rainDrops) {
    drop.y += drop.speed;
    if (drop.y > height + drop.length) {
      drop.y = -drop.length;
      drop.x = random(width);
    }
  }
}

function drawRainDrops() {
  strokeWeight(2);
  for (let drop of rainDrops) {
    stroke(170, 190, 255, drop.alpha);
    line(drop.x, drop.y, drop.x, drop.y + drop.length);
  }
}

// ---------- STARS ----------
function generateStars() {
  for (let i = 0; i < 25; i++) {
    starPositions.push({
      x: random(width),
      y: random(height / 2)
    });
  }
}

function drawStars() {
  let avgBright = red(bgColor) + green(bgColor) + blue(bgColor);
  let transparencia = map(avgBright, 0, 140, 255, 0);

  for (let i = 0; i < starPositions.length; i++) {
    stroke(255, 255, 100, transparencia);
    fill(255, 255, 0, transparencia);
    star(starPositions[i].x, starPositions[i].y, 2, random(4, 10), 5);
  }
}

function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

//tarefas
function drawButtons() {
  let labels = ["Sing", "Sunlight", "Water"];
  for (let i = 0; i < labels.length; i++) {
    let w = width / 5;
    let x = i * (width / 3) + width / 15;
    let y = height-80;
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}