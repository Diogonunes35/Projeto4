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
    barraY = height - 80;
  } else {
    // Telemóvel
    barraLargura = 220;
    barraAltura = 30;
    barraX = width / 2 - barraLargura / 2;
    barraY = height - 60;
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
}

function mousePressed() {
  if (faseAtual < maxFases - 1) {
    faseAtual++;
    console.log(`Fase atual: ${faseAtual}`); // Verifica se está incrementando
    gerarPlanta();
    localStorage.setItem('faseAtual', faseAtual);
  } else {
    console.log("Você já atingiu o número máximo de fases.");
  }
}

function limparLocalStorage() {
  localStorage.clear();
  console.log("Local storage limpo!");
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