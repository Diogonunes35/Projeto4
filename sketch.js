let seed;
let faseAtual = 0;
let maxFases = 6; // Agora são 6 fases: 0 (vazia) + 5 normais
let vasoImg;

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
let mode = "none";
let progress = { sing: 0, sunlight: 0, water: 0 };
let displayedProgress = { sing: 0, sunlight: 0, water: 0 };

let decayRate = 0.05;
// Torna as tarefas mais lentas de concluir (valor menor = mais lento)
let progressRate = 0.5; // Valor anterior era 0.5
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

let lastCareTime = Date.now();
let isBadState = false;

// Novas variáveis globais
let isDeadState = false;
let badSince = null; 
let showReviveButton = false;

//menus
let menu = 0;

// Variáveis globais para controlar o tempo de espera entre estados (em milissegundos)
const TEMPO_NORMAL_PARA_BAD = 60 * 1000; // 2 DIAS
const TEMPO_BAD_PARA_DEAD = 30 * 1000;   // 1 DIA

// NOVAS VARIÁVEIS PARA CONTROLO DE TAREFAS DIÁRIAS
let lastTaskTime = {
  sing: Date.now(),
  sunlight: Date.now(),
  water: Date.now()
};
const TASK_RESET_INTERVAL = 30 * 1000; // 20 HORAS

// Carregar do localStorage se existir
if (localStorage.getItem('lastTaskTime')) {
  try {
    lastTaskTime = JSON.parse(localStorage.getItem('lastTaskTime'));
  } catch (e) {
    // Se der erro, reinicia
    lastTaskTime = {
      sing: Date.now(),
      sunlight: Date.now(),
      water: Date.now()
    };
  }
}

// Carrega progresso do localStorage ao iniciar
if (localStorage.getItem('progress')) {
  try {
    let cachedProgress = JSON.parse(localStorage.getItem('progress'));
    for (let key in progress) {
      if (typeof cachedProgress[key] === "number") {
        progress[key] = cachedProgress[key];
      }
    }
  } catch (e) {
    // Se der erro, ignora
  }
}

function preload() {
  vetoresFases = [];
  for (let fase = 0; fase < maxFases; fase++) {
    let vetoresParaFase = [];
    // Fase 0 não tem partes da planta
    if (fase === 0) {
      // Não adiciona nenhuma imagem
    } else {
      for (let i = 0; i < 5; i++) {
        let caminho = `assets/live/fase${fase - 1}/${i}.svg`; // -1 porque assets começam na antiga fase 1
        let img = loadImage(
          caminho,
          () => console.log(`Imagem carregada: ${caminho}`),
          () => console.error(`Erro ao carregar: ${caminho}`)
        );
        vetoresParaFase.push(img);
      }
    }
    vetoresFases.push(vetoresParaFase);
  }
  window.vetoresFases = vetoresFases;

  // BAD e DEAD também precisam de fase 0 vazia
  window.vetoresFasesBad = [];
  for (let fase = 0; fase < maxFases; fase++) {
    if (fase === 0) {
      window.vetoresFasesBad.push([]); // vazio
    } else {
      let caminhoBad = `assets/bad/fase${fase - 1}.svg`;
      let imgBad = loadImage(
        caminhoBad,
        () => console.log(`Imagem BAD carregada: ${caminhoBad}`),
        () => console.error(`Erro ao carregar BAD: ${caminhoBad}`)
      );
      window.vetoresFasesBad.push([imgBad]);
    }
  }
  window.vetoresFasesDead = [];
  for (let fase = 0; fase < maxFases; fase++) {
    if (fase === 0) {
      window.vetoresFasesDead.push([]); // vazio
    } else {
      let caminhoDead = `assets/dead/fase${fase - 1}.svg`;
      let imgDead = loadImage(
        caminhoDead,
        () => console.log(`Imagem DEAD carregada: ${caminhoDead}`),
        () => console.error(`Erro ao carregar DEAD: ${caminhoDead}`)
      );
      window.vetoresFasesDead.push([imgDead]);
    }
  }
  console.log("Imagens carregadas:", vetoresFases);

  vasoImg = loadImage("assets/pots/vaso3.svg");
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

  // Recupera o lastCareTime do localStorage se existir
  if (localStorage.getItem('lastCareTime')) {
    lastCareTime = parseInt(localStorage.getItem('lastCareTime'));
  } else {
    lastCareTime = Date.now();
    localStorage.setItem('lastCareTime', lastCareTime);
  }

  // Recupera o badSince do localStorage se existir
  if (localStorage.getItem('badSince')) {
    badSince = parseInt(localStorage.getItem('badSince'));
  }

  // --- CORREÇÃO: Atualiza o estado da planta conforme o tempo real passado ---
  let now = Date.now();
  if (!isBadState && !isDeadState && now - lastCareTime > TEMPO_NORMAL_PARA_BAD) {
    isBadState = true;
    if (!badSince) {
      badSince = lastCareTime + TEMPO_NORMAL_PARA_BAD;
      localStorage.setItem('badSince', badSince);
    }
    vetoresFases = window.vetoresFasesBad;
    gerarPlanta();
  }
  if (isBadState && !isDeadState && badSince && now - badSince > TEMPO_BAD_PARA_DEAD) {
    isDeadState = true;
    vetoresFases = window.vetoresFasesDead;
    gerarPlanta();
    showReviveButton = true;
  }
  if (!isDeadState && badSince && now - badSince > TEMPO_BAD_PARA_DEAD) {
    isBadState = true;
    isDeadState = true;
    vetoresFases = window.vetoresFasesDead;
    gerarPlanta();
    showReviveButton = true;
  }
}

function inicializarDados() {
  seed = Math.floor(random(100000, 999999)); // Gera uma seed aleatória entre 100000 e 999999
  faseAtual = 0;
  maxFases = 6; // <-- Corrige para 6 fases (0 a 5)
  planta = [];

  localStorage.setItem('plantaSeed', seed);
  localStorage.setItem('faseAtual', faseAtual);
  localStorage.setItem('maxFases', maxFases); // <-- Corrige para 6 fases
  localStorage.setItem('planta', JSON.stringify([])); // Salva um vetor vazio
}

// --- 1. Corrigir gerarPlanta para mostrar todas as partes até à faseAtual (incluindo a última fase) ---
function gerarPlanta() {
  randomSeed(int(seed));

  planta = [];
  let plantaIndices = [];

  // Corrigido: mostra todas as partes até à faseAtual (inclusive a última fase)
  for (let i = 0; i <= faseAtual; i++) {
    if (vetoresFases[i] && vetoresFases[i].length > 0) {
      let vetorIndex = (vetoresFases[i].length === 1) ? 0 : int(random(0, 5));
      let img = vetoresFases[i][vetorIndex];

      if (img && img.width > 0 && img.height > 0) {
        planta.push(img);
        plantaIndices.push(vetorIndex);
      } else {
        console.error(`Imagem da fase ${i}, índice ${vetorIndex} não foi carregada.`);
      }
    }
    // Se for fase 0, não faz nada (planta fica vazia)
  }

  console.log("Planta gerada:", planta);

  localStorage.setItem('planta', JSON.stringify(plantaIndices));
}

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
  // BAD: tempo sem cuidar
  if (!isBadState && !isDeadState && Date.now() - lastCareTime > TEMPO_NORMAL_PARA_BAD) {
    isBadState = true;
    vetoresFases = window.vetoresFasesBad;
    gerarPlanta();
    badSince = Date.now();
    localStorage.setItem('badSince', badSince);
  }

  // DEAD: tempo após BAD
  if (isBadState && !isDeadState && badSince && Date.now() - badSince > TEMPO_BAD_PARA_DEAD) {
    isDeadState = true;
    vetoresFases = window.vetoresFasesDead;
    gerarPlanta();
    showReviveButton = true;
  }

  // Mostra tempo restante para BAD e DEAD na consola
  if (!isBadState && !isDeadState) {
    let tempoRestante = TEMPO_NORMAL_PARA_BAD - (Date.now() - lastCareTime);
    if (tempoRestante > 0) {
      let segundos = Math.ceil(tempoRestante / 1000);
      let min = Math.floor(segundos / 60);
      let sec = segundos % 60;
      // Mostra na consola
      console.log(
        `Tempo até a planta ficar estragada: ${min}:${sec.toString().padStart(2, '0')}`
      );
    }
  } else if (isBadState && !isDeadState && badSince) {
    let tempoRestante = TEMPO_BAD_PARA_DEAD - (Date.now() - badSince);
    if (tempoRestante > 0) {
      let segundos = Math.ceil(tempoRestante / 1000);
      let min = Math.floor(segundos / 60);
      let sec = segundos % 60;
      console.log(
        `Tempo até a planta morrer: ${min}:${sec.toString().padStart(2, '0')}`
      );
    }
  }

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
// Se for telemóvel, coloca a planta ligeiramente mais acima (por exemplo, 30 em vez de 60)
let baseYOffset = windowWidth > 768 ? 0 : 30;
let baseY = height - 200 + baseYOffset; // Ponto inicial da base

// Ajusta o tamanho da planta com base no tipo de dispositivo
let larguraDesejada = windowWidth > 768 ? 120 : 90; // Maior no PC, menor no telemóvel
let alturaDesejada = windowWidth > 768 ? 80 : 60;   // Maior no PC, menor no telemóvel
let distanciaEntrePartes = alturaDesejada - 10;    // Distância entre os componentes

imageMode(CENTER);

// Desenhar o vaso SVG debaixo da planta
if (vasoImg && vasoImg.width > 0 && vasoImg.height > 0) {
  let vasoLargura = larguraDesejada * 1.5;
  let vasoAltura = alturaDesejada * 1.1;
  let vasoX = baseX;
  // Se for telemóvel, coloca o vaso mais abaixo (-15), senão (-20)
  let vasoY = baseY + vasoAltura - (windowWidth > 768 ? 20 : 15);
  imageMode(CENTER);
  image(vasoImg, vasoX, vasoY, vasoLargura, vasoAltura);
}

// Desenhar a planta
for (let i = 0; i < planta.length; i++) {
  if (planta[i] && planta[i].width > 0 && planta[i].height > 0) { // Verifica se a imagem foi carregada
    let posX = baseX;
    let posY = baseY - (i * distanciaEntrePartes);
    image(planta[i], posX, posY, larguraDesejada, alturaDesejada);
  } else {
    console.warn(`Imagem da planta na posição ${i} não foi carregada ou está vazia.`);
  }
}


  //tarefas
  textSize(windowWidth > 768 ? 24 : 16);
  if (menu == 0){
    if(!isDeadState){
      updateProgress();
    drawButtons();
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

  // A barra vai de 0 (fase 0) até maxFases-2 (fase 4), pois maxFases=6 (0 a 5), mas só mostra até 5/5
  let maxFaseVisivel = maxFases - 1; // Agora mostra até fase 5 de 5
  let progression = map(faseAtual, 0, maxFaseVisivel, 0, barraLargura);
  if (faseAtual >= maxFaseVisivel) {
    progression = barraLargura;
  }
  rect(barraX, barraY, progression, barraAltura, 10);

  fill(0);
  textAlign(CENTER);
  textSize(windowWidth > 768 ? 24 : 16);
  if (faseAtual >= maxFaseVisivel) {
    text(`Máximo`, width / 2, barraY + barraAltura / 3 + (windowWidth > 768 ? 10 : 6));
  } else {
    text(`Fase: ${faseAtual} de ${maxFaseVisivel}`, width / 2, barraY + barraAltura / 3 + (windowWidth > 768 ? 10 : 6));
  }
  }
  }

  if(menu == 1){
    updateProgress();
    drawProgressBar();
    fill(255,0,0);
    square(20,20, 40);
  }
  if (menu == 2){
    updateProgress();
    drawProgressBar();
    fill(255,0,0);
    square(20,20, 40);
  }
  if (menu == 3){
    updateProgress();
    drawProgressBar();
    fill(255,0,0);
    square(20,20, 40);
  }

  if (mode === "sing") {
    drawSingAnimation();
  } else if (mode === "sunlight") {
    drawSunlightAnimation();
  } else if (mode === "water") {
    // Se for PC (sem touch), usa o rato; se for mobile, usa gamma
    let isPC = !('ontouchstart' in window || navigator.maxTouchPoints > 0);
    let waterActive = false;
    if (isPC) {
      // Considera "regar" se o botão esquerdo do rato estiver pressionado
      if (mouseIsPressed) {
        waterActive = true;
      }
    } else {
      if (abs(gamma) > 20) {
        waterActive = true;
      }
    }
    if (waterActive) {
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

  if (completionMessage !== "") {
    fill(0, 200, 0);
    textSize(24);
    text(completionMessage, width / 2, height / 2 + 100);
  }

  // Botão para reviver planta se estiver morta
  if (showReviveButton && isDeadState) {
    fill(255, 0, 0);
    rectMode(CORNER);
    rect(width / 2 - 110, height / 2 - 30, 220, 60, 15);
    fill(255);
    textSize(22);
    textAlign(CENTER, CENTER);
    text("A planta morreu", width / 2, height/2 -10);
    text("Recomeçar", width / 2, height/2 +15);
  }
  
}

function mousePressed() {
  userStartAudio();
  // Se a planta estiver morta e o botão estiver visível, reseta tudo
  if (showReviveButton && isDeadState) {
    if (
      mouseX > width / 2 - 110 &&
      mouseX < width / 2 + 110 &&
      mouseY > height / 2 - 30 &&
      mouseY < height / 2 + 30
    ) {
      showReviveButton = false;
      isDeadState = false;
      isBadState = false;
      badSince = null;
      limparLocalStorage();
      inicializarDados();
      faseAtual = 0;
      localStorage.setItem('faseAtual', faseAtual);

      // Limpa a planta e não gera nada
      planta = [];
      localStorage.setItem('planta', JSON.stringify([]));

      // Garante que vetoresFases está correto (fase 0 vazia)
      vetoresFases = [];
      for (let fase = 0; fase < maxFases; fase++) {
        let vetoresParaFase = [];
        // Fase 0 deve ser SEM IMAGEM
        if (fase !== 0) {
          for (let i = 0; i < 5; i++) {
            let caminho = `assets/live/fase${fase}/${i}.svg`;
            let img = loadImage(
              caminho,
              () => {},
              () => {}
            );
            vetoresParaFase.push(img);
          }
        }
        vetoresFases.push(vetoresParaFase);
      }
      // NÃO chama gerarPlanta() aqui!
      lastCareTime = Date.now();
      localStorage.setItem('lastCareTime', lastCareTime);
      localStorage.removeItem('badSince');

      // Faz refresh à página para garantir reset total
      window.location.reload();
    }
  }

  let labels = ["sing", "sunlight", "water"];
  for (let i = 0; i < labels.length; i++) {
    let x = i * (width / 3) + width / 15;
    let y = height - 80;
    let w = width / 5;
    let h = 40;
    if(menu == 0 && !isDeadState){
      if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
        mode = labels[i];
        if (labels[i] === "sing") {
          menu = 1;
        }
        if (labels[i] === "sunlight") {
          menu = 2;
        }
        if (labels[i] === "water") {
          menu = 3;
        }
        completionMessage = "";
      }
    }
  }

  if (mouseX > 20 && mouseX < 60 && mouseY > 20 && mouseY < 60) {
    menu = 0;
    mode = "none";
    completionMessage = "";
  }
}

function limparLocalStorage() {
  localStorage.clear();
  console.log("Local storage limpo!");
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    // Limpa localStorage
    limparLocalStorage();
    localStorage.removeItem('plantaCriada');

    // Reseta variáveis principais
    lastCareTime = Date.now();
    badSince = null;
    isBadState = false;
    isDeadState = false;
    showReviveButton = false;
    menu = 0;
    mode = "none";
    completionMessage = "";

    // Reseta progresso das tarefas
    progress = { sing: 0, sunlight: 0, water: 0 };
    displayedProgress = { sing: 0, sunlight: 0, water: 0 };

    // Reseta tempos das tarefas
    lastTaskTime = {
      sing: Date.now(),
      sunlight: Date.now(),
      water: Date.now()
    };
    localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
    localStorage.setItem('lastCareTime', lastCareTime);
    faseAtual = 0; // Planta volta a não aparecer
    planta = [];
    // NÃO chamar gerarPlanta() aqui!
    window.location.reload();
  }

  if (key === 's' || key === 'S') {
    if (isDeadState) return; // Não faz nada se estiver morta

    lastCareTime = Date.now();
    localStorage.setItem('lastCareTime', lastCareTime);
    if (isBadState) {
      isBadState = false;
      badSince = null;
      localStorage.removeItem('badSince');
      vetoresFases = [];
      for (let fase = 0; fase < maxFases; fase++) {
        let vetoresParaFase = [];
        for (let i = 0; i < 5; i++) {
          let caminho = `assets/live/fase${fase}/${i}.svg`;
          let img = loadImage(
            caminho,
            () => {},
            () => {}
          );
          vetoresParaFase.push(img);
        }
        vetoresFases.push(vetoresParaFase);
      }
      gerarPlanta();
      return;
    }
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
  let progressKeys = ["sing", "sunlight", "water"];

  // Carrega progresso do localStorage (cache) para garantir atualização em tempo real
  let cachedProgress = {};
  try {
    const cached = localStorage.getItem('progress');
    if (cached) {
      cachedProgress = JSON.parse(cached);
      // Atualiza apenas se for diferente do atual (evita sobrescrever progresso em memória)
      for (let key of progressKeys) {
        if (typeof cachedProgress[key] === "number") {
          progress[key] = cachedProgress[key];
        }
      }
    }
  } catch (e) {
    // Se der erro, ignora e usa o progresso em memória
  }

  for (let i = 0; i < labels.length; i++) {
    let w = width / 5;
    let x = i * (width / 3) + width / 15;
    let y = height - 80;
    let h = 40;
    // Botão vermelho, mais escuro se selecionado
    fill(mode === labels[i].toLowerCase() ? '#b71c1c' : '#e53935');
    rect(x, y, w, h, 10);

    // Retângulo azul de progresso (altura em tempo real)
    let progresso = constrain(progress[progressKeys[i]], 0, 100);
    let progressoAltura = h * (progresso / 100);
    if (progressoAltura > 0) {
      fill(33, 150, 243); // azul
      rect(x, y + h - progressoAltura, w, progressoAltura, 10, 10, 10, 10);
    }

    fill(255);
    text(labels[i], x + w / 2, y + h / 2);
  }
}

// Salva o progresso no localStorage sempre que houver alteração
function saveProgressToCache() {
  try {
    localStorage.setItem('progress', JSON.stringify(progress));
  } catch (e) {
    // Se der erro, ignora
  }
}

// Modifique a função updateProgress para guardar o progresso sempre que mudar
function updateProgress() {
  let activePerformed = false;

  // Impede progresso se a planta estiver morta
  if (isDeadState) {
    return;
  }

  // Atualiza percentagem de cada tarefa com base no tempo desde a última realização
  let now = Date.now();
  let changed = false;
  for (let key in progress) {
    let elapsed = now - (lastTaskTime[key] || now);
    let percent = 100 - (elapsed / TASK_RESET_INTERVAL) * 100;
    let newValue = constrain(percent, 0, 100);
    if (progress[key] !== newValue) {
      progress[key] = newValue;
      changed = true;
    }
  }

  // Só atualiza a tarefa ativa
  if (progress[mode] < 100) {
    if (mode === "sing") {
      let level = mic.getLevel();
      if (level > 0.01) {
        progress.sing = 100;
        lastTaskTime.sing = now;
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
        activePerformed = true;
        changed = true;
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
        progress.sunlight = 100;
        lastTaskTime.sunlight = now;
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
        activePerformed = true;
        changed = true;
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
      let isPC = !('ontouchstart' in window || navigator.maxTouchPoints > 0);
      let waterActive = false;
      if (isPC) {
        if (mouseIsPressed) {
          waterActive = true;
        }
      } else {
        if (abs(gamma) > 20) {
          waterActive = true;
        }
      }
      if (waterActive) {
        progress.water = 100;
        lastTaskTime.water = now;
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
        activePerformed = true;
        changed = true;
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

  // Atualiza barra visual suavemente
  for (let key in displayedProgress) {
    displayedProgress[key] = lerp(displayedProgress[key], progress[key], 0.1);
    if (abs(displayedProgress[key] - 100) < 0.5 && progress[key] >= 100) {
      displayedProgress[key] = 100;
    }
  }

  // Só reseta o tempo se TODAS as tarefas estiverem >= 90%
  if (
    !isBadState &&
    !isDeadState &&
    progress.sing >= 90 &&
    progress.sunlight >= 90 &&
    progress.water >= 90
  ) {
    lastCareTime = Date.now();
    localStorage.setItem('lastCareTime', lastCareTime);
  }

  // NOVO: Só pode crescer se já passaram 24h desde o último crescimento
  let lastGrowthTime = parseInt(localStorage.getItem('lastGrowthTime')) || 0;
  let canGrow = (Date.now() - lastGrowthTime) > TASK_RESET_INTERVAL;

  // NOVO: Se todas as tarefas forem concluídas enquanto está bad, volta ao normal, mas não sobe de fase
  if (
    isBadState &&
    !isDeadState &&
    progress.sing >= 90 &&
    progress.sunlight >= 90 &&
    progress.water >= 90
  ) {
    isBadState = false;
    badSince = null;
    localStorage.removeItem('badSince');
    vetoresFases = window.vetoresFases; // volta ao normal
    gerarPlanta();
    completionMessage = "Planta recuperada! Continue a cuidar para subir de fase.";
    menu = 0;
    mode = "none";
    lastCareTime = Date.now();
    localStorage.setItem('lastCareTime', lastCareTime);
    showReviveButton = false;

    // Adicione esta linha para limpar a mensagem após 2 segundos
    setTimeout(() => {
      completionMessage = "";
    }, 2000);

    return;
  }

  // Sobe de fase apenas se não estiver bad ou dead, todas as tarefas >= 90% e já passou 24h desde o último crescimento
  if (
    !isBadState &&
    !isDeadState &&
    progress.sing >= 90 &&
    progress.sunlight >= 90 &&
    progress.water >= 90 &&
    canGrow &&
    completionMessage === ""
  ) {
    // Só permite crescer se TODAS as tarefas estiverem >= 90% no momento do crescimento
    // (impede que uma tarefa seja completada e as outras não, mesmo na fase 0)
    if (
      progress.sing >= 90 &&
      progress.sunlight >= 90 &&
      progress.water >= 90
    ) {
      if (faseAtual === 0) {
        completionMessage = "Parabéns! A tua planta nasceu!";
      } else {
        completionMessage = "Parabéns! Todas as tarefas completas! Planta subiu de fase!";
      }
      localStorage.setItem('lastGrowthTime', Date.now());
      setTimeout(() => {
        if (faseAtual < maxFases - 1) {
          faseAtual++;
          gerarPlanta();
          localStorage.setItem('faseAtual', faseAtual);
        }
        // Resetar progresso para próxima fase
        progress = { sing: 0, sunlight: 0, water: 0 };
        displayedProgress = { sing: 0, sunlight: 0, water: 0 };
        completionMessage = "";
        menu = 0;
        mode = "none";
        lastCareTime = Date.now();
        localStorage.setItem('lastCareTime', lastCareTime);
        badSince = null;
        localStorage.removeItem('badSince');
        isBadState = false;
        isDeadState = false;
        showReviveButton = false;
        // Reinicia os tempos das tarefas para o novo ciclo
        lastTaskTime = {
          sing: Date.now(),
          sunlight: Date.now(),
          water: Date.now()
        };
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
      }, 1500);
    }
  }

  if (changed) {
    saveProgressToCache();
  }
}

function drawProgressBar() {
  let barWidth = width * 0.8;
  let barHeight = 30;
  let x = width * 0.1;
  let y;
  if (windowWidth <= 768) {
    y = height / 4;
  } else {
    y = 50;
  }

  fill(220);
  rect(x, y, barWidth, barHeight, 10);

  let p = displayedProgress[mode];
  fill(100, 200, 100);
  rect(x, y, map(p, 0, 100, 0, barWidth), barHeight, 10);

  fill(0);
  text(`${capitalize(mode)}: ${floor(p)}%`, width / 2, y+15);
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

// Atualiza o lastCareTime no localStorage quando o utilizador sai do site
window.addEventListener('beforeunload', () => {
  localStorage.setItem('lastCareTime', lastCareTime);
  if (badSince) {
    localStorage.setItem('badSince', badSince);
  }
});


function resetWaterProgress() {
  progress.sunlight = 0;
  displayedProgress.sunlight = 0;
  lastTaskTime.sunlight = Date.now();
  saveProgressToCache();
  localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
}