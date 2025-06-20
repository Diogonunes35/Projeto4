//ios compatibilidade
let motion = false;
let ios = false;

if (typeof DeviceMotionEvent.requestPermission === 'function') {
  document.body.addEventListener('click', function() {
    DeviceMotionEvent.requestPermission()
      .then(function() {
        console.log('DeviceMotionEvent enabled');

        motion = true;
        ios = true;
      })
      .catch(function(error) {
        console.warn('DeviceMotionEvent not enabled', error);
      })
  })
}

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
const TEMPO_NORMAL_PARA_BAD = 2 * 24 * 60 *60 * 1000; // 2 DIAS
const TEMPO_BAD_PARA_DEAD = 1 * 24 * 60 * 60 * 1000;   // 1 DIA

//vaso selecionado
let vasoSelecionado = 1; // Começa sempre com vaso1

// NOVAS VARIÁVEIS PARA CONTROLO DE TAREFAS DIÁRIAS
let lastTaskTime = {
  sing: Date.now(),
  sunlight: Date.now(),
  water: Date.now()
};

// Intervalos personalizados baseados na seed
let taskResetIntervals = {
  sing: 20 * 60 * 60 * 1000,    // Valor padrão: 20 horas
  sunlight: 20 * 60 * 60 * 1000, // Valor padrão: 20 horas
  water: 20 * 60 * 60 * 1000     // Valor padrão: 20 horas
};

// Taxas de reset personalizadas (calculadas depois)
let taskResetRates = {
  sing: 0,
  sunlight: 0,
  water: 0
};

// Constantes para os limites de horas
const MIN_HOURS = 10;
const MAX_HOURS = 30;

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

let backgroundMusic;
let levelUpSound;
let completedSound;

let flowerType = "sunflower"; // sunflower ou daisy

// Carregar do localStorage se existir
if (localStorage.getItem('flowerType')) {
  flowerType = localStorage.getItem('flowerType');
}

function preload() {
  // Load background music
  backgroundMusic = loadSound('assets/sound/background.mp3', 
    () => console.log("Background music loaded successfully"),
    () => console.error("Failed to load background music")
  );
  
  // Load level up sound
  levelUpSound = loadSound('assets/sound/levelup.mp3',
    () => console.log("Level up sound loaded successfully"),
    () => console.error("Failed to load level up sound")
  );
  
  // Load task completed sound
  completedSound = loadSound('assets/sound/completed.mp3',
    () => console.log("Task completed sound loaded successfully"),
    () => console.error("Failed to load task completed sound")
  );

  // Busca o vaso a ser usado no localStorage
  if (localStorage.getItem('vasoSelecionado')) {
  vasoSelecionado = parseInt(localStorage.getItem('vasoSelecionado'));
  } else {
  vasoSelecionado = 1;
  localStorage.setItem('vasoSelecionado', vasoSelecionado);
  }

  // Usa flowerType para definir o diretório base
  let flowerDir = `assets/${flowerType}`;

  vetoresFases = [];
  for (let fase = 0; fase < maxFases; fase++) {
    let vetoresParaFase = [];
    // Fase 0 não tem partes da planta
    if (fase === 0) {
      // Não adiciona nenhuma imagem
    } else {
      for (let i = 0; i < 5; i++) {
        let caminho = `${flowerDir}/live/fase${fase - 1}/${i}.svg`;
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
      let caminhoBad = `${flowerDir}/bad/fase${fase - 1}.svg`;
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
      let caminhoDead = `${flowerDir}/dead/fase${fase - 1}.svg`;
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
  
  // Set up background music to play in loop
  if (backgroundMusic) {
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5); // Set volume to 50%
    // We'll start the music on user interaction
  }
  
  try {
    if (localStorage.getItem('plantaSeed')) {
      seed = localStorage.getItem('plantaSeed');
      faseAtual = parseInt(localStorage.getItem('faseAtual')) || 0;
      maxFases = parseInt(localStorage.getItem('maxFases')) || 5;

      // Carrega intervalos personalizados do localStorage
      if (localStorage.getItem('taskResetIntervals')) {
        taskResetIntervals = JSON.parse(localStorage.getItem('taskResetIntervals'));
        
        // Recalcula as taxas de reset
        for (let task in taskResetIntervals) {
          taskResetRates[task] = 100 / (taskResetIntervals[task] / 1000);
        }
      } else {
        // Se não existir, configura com base na seed
        setupTaskIntervals(seed);
      }

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

  // Determina flowerType pela seed (par = sunflower, ímpar = daisy), mantendo 50% de chance
  flowerType = (seed % 2 === 0) ? "sunflower" : "daisy";
  localStorage.setItem('flowerType', flowerType);
  
  // Configura intervalos personalizados baseados na seed
  setupTaskIntervals(seed);

  localStorage.setItem('plantaSeed', seed);
  localStorage.setItem('faseAtual', faseAtual);
  localStorage.setItem('maxFases', maxFases); // <-- Corrige para 6 fases
  localStorage.setItem('planta', JSON.stringify([])); // Salva um vetor vazio
  localStorage.setItem('taskResetIntervals', JSON.stringify(taskResetIntervals));
}

// Nova função para configurar intervalos baseados na seed
function setupTaskIntervals(seedValue) {
  // Usa diferentes partes da seed para cada tarefa
  let seedPart1 = parseInt(seedValue.toString().substring(0, 2)) % 21;
  let seedPart2 = parseInt(seedValue.toString().substring(2, 4)) % 21;
  let seedPart3 = parseInt(seedValue.toString().substring(4, 6)) % 21;
  
  // Calcula horas entre MIN_HOURS e MAX_HOURS
  let singHours = MIN_HOURS + seedPart1;
  let sunlightHours = MIN_HOURS + seedPart2;
  let waterHours = MIN_HOURS + seedPart3;
  
  // Converte horas para milissegundos
  taskResetIntervals.sing = singHours * 60 * 60 * 1000;
  taskResetIntervals.sunlight = sunlightHours * 60 * 60 * 1000;
  taskResetIntervals.water = waterHours * 60 * 60 * 1000;
  
  // Calcula as taxas de reset (percentagem por segundo)
  taskResetRates.sing = 100 / (taskResetIntervals.sing / 1000);
  taskResetRates.sunlight = 100 / (taskResetIntervals.sunlight / 1000);
  taskResetRates.water = 100 / (taskResetIntervals.water / 1000);
  
  console.log(`Task intervals set - Sing: ${singHours}h, Sunlight: ${sunlightHours}h, Water: ${waterHours}h`);
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

  // Ao gerar planta nova, se não houver vasoSelecionado, começa com vaso1
  if (!localStorage.getItem('vasoSelecionado')) {
    vasoSelecionado = 1;
    localStorage.setItem('vasoSelecionado', vasoSelecionado);
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

    // Zera os progressos ao morrer
    progress = { sing: 0, sunlight: 0, water: 0 };
    displayedProgress = { sing: 0, sunlight: 0, water: 0 };
    saveProgressToCache();
  }

  // Mostra tempo restante para BAD e DEAD na consola
  if (!isBadState && !isDeadState) {
    let tempoRestante = TEMPO_NORMAL_PARA_BAD - (Date.now() - lastCareTime);
    if (tempoRestante > 0) {
      let segundos = Math.ceil(tempoRestante / 1000);
      let min = Math.floor(segundos / 60);
      let sec = segundos % 60;
    }
  } else if (isBadState && !isDeadState && badSince) {
    let tempoRestante = TEMPO_BAD_PARA_DEAD - (Date.now() - badSince);
    if (tempoRestante > 0) {
      let segundos = Math.ceil(tempoRestante / 1000);
      let min = Math.floor(segundos / 60);
      let sec = segundos % 60;
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
    strokeWeight(3);
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
  let vasoImg;
if (!window["vasoImgs"]) window["vasoImgs"] = [];
if (!window["vasoImgs"][vasoSelecionado]) {
  window["vasoImgs"][vasoSelecionado] = loadImage(`assets/pots/vaso${vasoSelecionado}.svg`);
}
vasoImg = window["vasoImgs"][vasoSelecionado];

if (vasoImg && vasoImg.width > 0 && vasoImg.height > 0) {
  let vasoLargura = larguraDesejada * 1.5;
  let vasoAltura = alturaDesejada * 1.1;
  let vasoX = baseX;
  let vasoY = baseY + vasoAltura - (windowWidth > 768 ? 20 : 15);
  imageMode(CENTER);
  image(vasoImg, vasoX, vasoY, vasoLargura, vasoAltura);
}
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

      // --- Barra de fase ENTRE os botões de inventário e mute no topo em telemóvel ---
      if (windowWidth <= 768) {
        // Topo, entre os dois botões (mute e inventário)
        let barraLargura = width - 160; // <-- Reduzido de 120 para 160 para ficar menos comprida
        let barraAltura = 28;
        let barraX = 80; // <-- Ajustado para centrar a barra
        let barraY = 40 - barraAltura / 2;

        // Modern rounded progress bar with shadow and emoji
        let maxFaseVisivel = maxFases - 1;
        let progression = map(faseAtual, 0, maxFaseVisivel, 0, barraLargura);
        if (faseAtual >= maxFaseVisivel) progression = barraLargura;

        // Shadow
        push();
        noStroke();
        fill(0, 40);
        rect(barraX, barraY + 5, barraLargura, barraAltura, barraAltura / 2);
        pop();

        // Background bar
        noStroke();
        fill(240);
        rect(barraX, barraY, barraLargura, barraAltura, barraAltura / 2);

        // Progress bar (gradient green)
        let grad = drawingContext.createLinearGradient(barraX, 0, barraX + progression, 0);
        grad.addColorStop(0, '#43e97b');
        grad.addColorStop(1, '#38f9d7');
        drawingContext.save();
        drawingContext.fillStyle = grad;
        rect(barraX, barraY, progression, barraAltura, barraAltura / 2);
        drawingContext.restore();

        // Border
        stroke(80, 180, 120, 120);
        strokeWeight(2);
        noFill();
        rect(barraX, barraY, barraLargura, barraAltura, barraAltura / 2);

        // Plant emoji at the end of the bar
        noStroke();
        textSize(barraAltura * 1.2);
        textAlign(CENTER, CENTER);
        text("🪴", barraX + progression, barraY + barraAltura / 2);

        // Text label
        fill(0, 120);
        textSize(13);
        if (faseAtual >= maxFaseVisivel) {
          text(`Máximo`, width / 2, barraY + barraAltura / 2);
        } else {
          text(`Fase: ${faseAtual} de ${maxFaseVisivel}`, width / 2, barraY + barraAltura / 2);
        }
      } else {
        // PC: barra como estava antes
        let barraLargura = 500;
        let barraAltura = 50;
        let barraX = width / 2 - 250;
        let barraY = 60;

        let maxFaseVisivel = maxFases - 1;
        let progression = map(faseAtual, 0, maxFaseVisivel, 0, barraLargura);
        if (faseAtual >= maxFaseVisivel) progression = barraLargura;

        // Shadow
        push();
        noStroke();
        fill(0, 40);
        rect(barraX, barraY + 6, barraLargura, barraAltura, barraAltura / 2);
        pop();

        // Background bar
        noStroke();
        fill(240);
        rect(barraX, barraY, barraLargura, barraAltura, barraAltura / 2);

        // Progress bar (gradient green)
        let grad = drawingContext.createLinearGradient(barraX, 0, barraX + progression, 0);
        grad.addColorStop(0, '#43e97b');
        grad.addColorStop(1, '#38f9d7');
        drawingContext.save();
        drawingContext.fillStyle = grad;
        rect(barraX, barraY, progression, barraAltura, barraAltura / 2);
        drawingContext.restore();

        // Border
        stroke(80, 180, 120, 120);
        strokeWeight(2);
        noFill();
        rect(barraX, barraY, barraLargura, barraAltura, barraAltura / 2);

        // Plant emoji at the end of the bar
        noStroke();
        textSize(barraAltura * 1.2);
        textAlign(CENTER, CENTER);
        text("🪴", barraX + progression, barraY + barraAltura / 2);

        // Text label
        fill(0, 120);
        textSize(22);
        if (faseAtual >= maxFaseVisivel) {
          text(`Máximo`, width / 2, barraY + barraAltura / 2);
        } else {
          text(`Fase: ${faseAtual} de ${maxFaseVisivel}`, width / 2, barraY + barraAltura / 2);
        }
      }
    }
  }

  if(menu == 1){
    updateProgress();
    drawProgressBar();

     // Circular exit button
  push();
  noStroke();
  fill(220, 60, 60, 230); // Red with some transparency
  ellipse(40, 40, 44, 44); // Circle button
  stroke(255);
  strokeWeight(4);
  line(28, 28, 52, 52); // X
  line(52, 28, 28, 52);
  pop();
  }
  if (menu == 2){
    updateProgress();
    drawProgressBar();
  
     // Circular exit button
  push();
  noStroke();
  fill(220, 60, 60, 230); // Red with some transparency
  ellipse(40, 40, 44, 44); // Circle button
  stroke(255);
  strokeWeight(4);
  line(28, 28, 52, 52); // X
  line(52, 28, 28, 52);
  pop();
  }
  if (menu == 3){
    updateProgress();
    drawProgressBar();
 
     // Circular exit button
  push();
  noStroke();
  fill(220, 60, 60, 230); // Red with some transparency
  ellipse(40, 40, 44, 44); // Circle button
  stroke(255);
  strokeWeight(4);
  line(28, 28, 52, 52); // X
  line(52, 28, 28, 52);
  pop();
  }

  if (mode === "sing") {
    drawSingAnimation();
  } else if (mode === "sunlight") {
    drawSunlightAnimation();
  } else if (mode === "water") {
    drawWaterAnimation();
  }

  if (completionMessage !== "") {
    // Card background with shadow
    push();
    rectMode(CENTER);
    noStroke();
    fill(255, 90); // semi-transparent black
    rect(width / 2, height / 2, 380, 180, 32);
    pop();

    // Shadow for emoji
    push();
    textAlign(CENTER, CENTER);
    textSize(80);
    fill(0);
    text("🪴", width / 2 + 4, height / 2 - 32 + 4);
    pop();


    // Congratulatory message
    textSize(28);
    fill(255);
    textStyle(BOLD);
    text("Parabéns!", width / 2, height / 2 + 30);

    textSize(18);
    textStyle(NORMAL);
    fill(220);
    text("A tua planta cresceu para a próxima fase!", width / 2, height / 2 + 65);
  }

  // --- INVENTORY POPUP (menu 4) ---
  if (menu == 4) {
    // --- Overlay with blur and shadow ---
    push();
    drawingContext.save();
    drawingContext.filter = 'blur(2px)';
    fill(0, 120);
    rect(0, 0, width, height);
    drawingContext.restore();
    pop();

    // --- Grid de vasos 3x3: calcula tamanho para envolver todos os vasos ---
    let gridRows = 3;
    let gridCols = 3;
    let cellPadding = 12;
    let cellSize = min(width * 0.18, 80); // Tamanho máximo responsivo
    let gridW = gridCols * cellSize + (gridCols - 1) * cellPadding;
    let gridH = gridRows * cellSize + (gridRows - 1) * cellPadding;

    // --- Caixa do inventário envolve o grid + espaço para título e emoji ---
    let popupW = gridW + 76; // 38px de margem de cada lado
    let popupH = gridH + 170; // espaço para título, emoji e divisória
    let popupX = width / 2 - popupW / 2;
    let popupY = height / 2 - popupH / 2;

    // Shadow
    push();
    noStroke();
    fill(0, 60);
    rect(popupX + 6, popupY + 10, popupW, popupH, 36);
    pop();

    // Card
    push();
    fill(255, 90);
    stroke(80, 180, 120, 80);
    strokeWeight(2.5);
    rect(popupX, popupY, popupW, popupH, 36);
    pop();

    // Decorative top emoji
    textAlign(CENTER, CENTER);
    textSize(48);
    text("📦", width / 2, popupY + 38);

    // Title
    textAlign(CENTER, CENTER);
    textSize(26);
    fill(60, 120, 80);
    textStyle(BOLD);
    text("Inventário", width / 2, popupY + 82);

    // Divider line
    stroke(200, 230, 210, 120);
    strokeWeight(1.5);
    line(popupX + 32, popupY + 108, popupX + popupW - 32, popupY + 108);

    // --- Grid centralizado dentro da caixa ---
    let gridStartX = popupX + (popupW - gridW) / 2;
    let gridStartY = popupY + 120;

    // Detecta sobre que vaso está o rato
    let hoveredVaso = null;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        let idx = row * gridCols + col + 1;
        let x = gridStartX + col * (cellSize + cellPadding) + cellSize / 2;
        let y = gridStartY + row * (cellSize + cellPadding) + cellSize / 2;
        // Verifica se o rato está sobre esta célula
        if (
          mouseX > x - cellSize / 2 &&
          mouseX < x + cellSize / 2 &&
          mouseY > y - cellSize * 0.35 &&
          mouseY < y + cellSize * 0.35
        ) {
          hoveredVaso = { x, y, idx };
        }
      }
    }

    // Desenha o destaque se o rato estiver sobre algum vaso
    if (hoveredVaso) {
      push();
      rectMode(CENTER);
      noStroke();
      fill(80, 180, 120, 60); // cor de destaque suave
      rect(hoveredVaso.x, hoveredVaso.y, cellSize + 10, cellSize * 0.7 + 10, 16);
      pop();
    }

    // Agora desenha o grid normalmente
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        let idx = row * gridCols + col + 1;
        let imgPath = `assets/pots/vaso${idx}.svg`;
        let x = gridStartX + col * (cellSize + cellPadding) + cellSize / 2;
        let y = gridStartY + row * (cellSize + cellPadding) + cellSize / 2;

        // --- Destaque do vaso selecionado ---
        if (vasoSelecionado === idx) {
          push();
          rectMode(CENTER);
          stroke(60, 180, 80, 220); // verde forte
          strokeWeight(4);
          fill(255, 255, 255, 0); // só borda
          rect(x, y, cellSize + 16, cellSize * 0.7 + 16, 18);
          pop();
        }

        // Desenha o vaso normalmente
        if (!window["vasoImgs"]) window["vasoImgs"] = [];
        if (!window["vasoImgs"][idx]) {
          window["vasoImgs"][idx] = loadImage(imgPath);
        }
        let vasoImg = window["vasoImgs"][idx];
        if (vasoImg && vasoImg.width > 0 && vasoImg.height > 0) {
          imageMode(CENTER);
          image(vasoImg, x, y, cellSize, cellSize * 0.7);
        } else {
          // Placeholder se não carregou
          push();
          rectMode(CENTER);
          fill(230, 200, 180, 80);
          rect(x, y, cellSize, cellSize * 0.7, 10);
          fill(120);
          textAlign(CENTER, CENTER);
          textSize(16);
          text(`Vaso ${idx}`, x, y);
          pop();
        }
      }
    }

    // Após desenhar o grid, deteta clique para selecionar vaso
    if (mouseIsPressed && hoveredVaso && menu == 4) {
      if (vasoSelecionado !== hoveredVaso.idx) {
        vasoSelecionado = hoveredVaso.idx;
        localStorage.setItem('vasoSelecionado', vasoSelecionado);
        // Atualiza vasoImg imediatamente
        if (!window["vasoImgs"][vasoSelecionado]) {
          window["vasoImgs"][vasoSelecionado] = loadImage(`assets/pots/vaso${vasoSelecionado}.svg`);
        }
      }
    }

    // Exit button (same as in other menus)
    push();
    noStroke();
    fill(220, 60, 60, 230); // Red with some transparency
    ellipse(40, 40, 44, 44); // Circle button
    stroke(255);
    strokeWeight(4);
    line(28, 28, 52, 52); // X
    line(52, 28, 28, 52);
    pop();
  }

    // Mostra na consola quanto tempo falta para a planta ficar estragada (BAD)
  if (!isBadState && !isDeadState) {
    let tempoRestante = TEMPO_NORMAL_PARA_BAD - (Date.now() - lastCareTime);
    if (tempoRestante > 0) {
      let minutos = Math.floor(tempoRestante / 60000);
      let segundos = Math.floor((tempoRestante % 60000) / 1000);
      console.log(`Tempo até a planta ficar estragada: ${minutos}m ${segundos}s`);
    } else {
      console.log("A planta já devia estar estragada!");
    }
  }

  if (isDeadState && showReviveButton) {
    // Mensagem de planta morta
    push();
  rectMode(CENTER);
  noStroke();
  fill(255, 90);
  rect(width / 2, height / 2 + 20, 380, 240, 32); // altura aumentada e centrada para envolver o botão
  pop();

  textAlign(CENTER, CENTER);
  textSize(32);
  fill(220, 60, 60);
  textStyle(BOLD);
  text("A tua planta morreu!", width / 2, height / 2 - 20);

  textSize(18);
  textStyle(NORMAL);
  fill(220);
  text("Clica no botão para recomeçar.", width / 2, height / 2 + 30);

  // --- Botão de reiniciar ---
  let btnX = width / 2;
  let btnY = height / 2 + 70;
  let btnW = 180;
  let btnH = 48;
  push();
  rectMode(CENTER);
  fill(60, 180, 80, 230); // verde
  stroke(40, 120, 60);
  strokeWeight(2.5);
  rect(btnX, btnY, btnW, btnH, 18);
  noStroke();
  fill(255);
  textSize(22);
  textStyle(BOLD);
  text("Reiniciar Planta", btnX, btnY + 2);
  pop();
}

  
}

// Add this near your other global variables at the top:
let soundMode = 2; // 0 = all on, 1 = music off, 2 = all muted

function mousePressed() {
  userStartAudio();
  startBackgroundMusic();

  // Sound button toggle (already present)
  if (menu == 0 && dist(mouseX, mouseY, 40, 40) < 22) {
    soundMode = (soundMode + 1) % 3;
    if (backgroundMusic) {
      if (soundMode === 0) backgroundMusic.play();
      else backgroundMusic.stop();
    }
    return;
  }

  // Inventory button (top right) - only opens the inventory
  let invBtnX = width - 40;
  let invBtnY = 40;
  let invBtnR = 44;
  if (menu == 0 && dist(mouseX, mouseY, invBtnX, invBtnY) < invBtnR / 2) {
    menu = 4;
    return;
  }

  // If the plant is dead and the button is visible, reset everything
  if (showReviveButton && isDeadState) {
    let btnX = width / 2;
    let btnY = height / 2 + 70;
    let btnW = 180;
    let btnH = 48;
    if (
      mouseX > btnX - btnW / 2 &&
      mouseX < btnX + btnW / 2 &&
      mouseY > btnY - btnH / 2 &&
      mouseY < btnY + btnH / 2
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
      let flowerDir = `assets/${flowerType}`;
      vetoresFases = [];
      for (let fase = 0; fase < maxFases; fase++) {
        let vetoresParaFase = [];
        // Fase 0 deve ser SEM IMAGEM
        if (fase !== 0) {
          for (let i = 0; i < 5; i++) {
            let caminho = `${flowerDir}/live/fase${fase}/${i}.svg`;
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
  let diameter = min(width, 320) / 3.2;
  let spacing = width / (labels.length + 1);
  let btnY = height - diameter + 20;
  for (let i = 0; i < labels.length; i++) {
    let btnX = spacing * (i + 1);
    let dx = mouseX - btnX;
    let dy = mouseY - btnY;
    if (menu == 0 && !isDeadState) {
      console.log('Clique detetado no botão:', labels[i]);
      if (dx * dx + dy * dy < (diameter / 2) * (diameter / 2)) {
        console.log('Botão clicado:', labels[i], 'Menu antes:', menu);
        mode = labels[i];
        if (labels[i] === "sing") menu = 1;
        if (labels[i] === "sunlight") menu = 2;
        if (labels[i] === "water") menu = 3;
        completionMessage = "";
        console.log('Menu depois:', menu);
        break; // <-- SAI DO CICLO ASSIM QUE UM BOTÃO É CLICADO
      }
    }
  }

  // Exit button (red X, top left) - closes any menu (including inventory)
  if (dist(mouseX, mouseY, 40, 40) < 22) {
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
  if (key === 'j' || key === 'J') {
    showTaskIntervals();
    return; // Return to prevent other key handlers from executing
  }

    if (key === 'g' || key === 'G') {
    // Reseta todas as tarefas para 0%
    progress = { sing: 0, sunlight: 0, water: 0 };
    displayedProgress = { sing: 0, sunlight: 0, water: 0 };
    lastTaskTime = {
      sing: Date.now(),
      sunlight: Date.now(),
      water: Date.now()
    };
    saveProgressToCache();
    localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
    return;
  }
  
  if (key === 'r' || key === 'R') {
    // Limpa localStorage
    limparLocalStorage();
    localStorage.removeItem('plantaCriada');
    localStorage.removeItem('taskResetIntervals');

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
    
    // Configura novos intervalos baseados na nova seed
    setupTaskIntervals(seed);
    
    localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
    localStorage.setItem('lastCareTime', lastCareTime);
    localStorage.setItem('taskResetIntervals', JSON.stringify(taskResetIntervals));
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
      let flowerDir = `assets/${flowerType}`;
      vetoresFases = [];
      for (let fase = 0; fase < maxFases; fase++) {
        let vetoresParaFase = [];
        for (let i = 0; i < 5; i++) {
          let caminho = `${flowerDir}/live/fase${fase}/${i}.svg`;
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

    if (key === 'h' || key === 'H') {
    setFlorMax();
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
  let emojis = ["🎤", "☀️", "💧"];

  // Responsive button size and layout
  let buttonCount = labels.length;
  // Botões mais pequenos em telemóvel
  let diameter = (windowWidth <= 768) ? min(width, 320) / 4.5 : min(width, 320) / 3.2;
  let spacing = width / (buttonCount + 1);
  let y = height - diameter + 20;

  // Carrega progresso do localStorage (cache) para garantir atualização em tempo real
  let cachedProgress = {};
  try {
    const cached = localStorage.getItem('progress');
    if (cached) {
      cachedProgress = JSON.parse(cached);
      for (let key of progressKeys) {
        if (typeof cachedProgress[key] === "number") {
          progress[key] = cachedProgress[key];
        }
      }
    }
  } catch (e) {}

  textAlign(CENTER, CENTER);

  for (let i = 0; i < labels.length; i++) {
    let x = spacing * (i + 1);

    // Shadow
    noStroke();
    fill(0, 40);
    ellipse(x, y + 7, diameter * 1.08);

    // Fundo do botão (sólido)
    fill(mode === labels[i].toLowerCase() ? '#43a047' : '#BEE7B8');
    ellipse(x, y, diameter);

    // --- ARCO DE PROGRESSO COM GRADIENTE ---
    let progresso = constrain(progress[progressKeys[i]], 0, 100);
    let angle = map(progresso, 0, 100, 0, TWO_PI);

    // Desenha o arco com gradiente usando pequenos segmentos
    let arcSteps = 80;
    for (let j = 0; j < arcSteps; j++) {
      let t0 = j / arcSteps;
      let t1 = (j + 1) / arcSteps;
      let a0 = -HALF_PI + t0 * angle;
      let a1 = -HALF_PI + t1 * angle;
      let gradColor = lerpColor(color('#43e97b'), color('#38f9d7'), t0);
      stroke(gradColor);
      strokeWeight(diameter * 0.13);
      noFill();
      arc(x, y, diameter * 0.82, diameter * 0.82, a0, a1);
    }

    // Emoji
    noStroke();
    fill(255);
    textSize(diameter * 0.38);
    text(emojis[i], x, y);

    fill(255); // Reset fill
  }

  // --- SOUND BUTTON (top left, styled like other buttons) ---
  let btnX = 40, btnY = 40, btnR = 44;
  // Shadow
  push();
  noStroke();
  fill(0, 40);
  ellipse(btnX, btnY + 7, btnR * 1.08);
  pop();
  // Button
  push();
  stroke(180);
  strokeWeight(2.5);
  fill(255, 240); // White, slightly transparent
  ellipse(btnX, btnY, btnR, btnR);
  // Icon
  textAlign(CENTER, CENTER);
  textSize(25);
  fill(60); // Dark icon for contrast
  let icon = "🎵";
  if (soundMode === 1) icon = "🔈";
  if (soundMode === 2) icon = "🔇";
  text(icon, btnX, btnY + 1);
  pop();

  // --- INVENTORY BUTTON (top right, styled like sound button) ---
  let invBtnR = btnR;
  let invBtnX = width - 40;
  let invBtnY = 40;
  // Shadow
  push();
  noStroke();
  fill(0, 40);
  ellipse(invBtnX, invBtnY + 7, invBtnR * 1.08);
  pop();
  // Button
  push();
  stroke(180);
  strokeWeight(2.5);
  fill(255, 240); // White, slightly transparent
  ellipse(invBtnX, invBtnY, invBtnR, invBtnR);
  // Icon (choose your favorite inventory emoji)
  textAlign(CENTER, CENTER);
  textSize(25);
  fill(60);
  let invIcon = "📦"; // "🏺" caso queira trocar
  text(invIcon, invBtnX, invBtnY + 1);
  pop();

  // --- Barra de progresso da tarefa ativa (sempre visível no fundo em telemóvel) ---
  if (windowWidth <= 768) {
    drawProgressBar();
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

let lastDecayTime = Date.now(); // Adiciona isto no topo do ficheiro, fora das funções

// Modifique a função updateProgress para guardar o progresso sempre que mudar
function updateProgress() {
  let activePerformed = false;
  let changed = false;

  // Impede progresso se a planta estiver morta
  if (isDeadState) {
    return;
  }

  // --- NOVO: Atualiza o progresso de cada tarefa com base no tempo real passado ---
  let now = Date.now();
  for (let key in progress) {
    // Só decresce se não estiver a realizar a tarefa
    if (mode !== key) {
      let elapsed = now - (lastTaskTime[key] || now);
      if (elapsed > 0) {
        // Decresce proporcionalmente ao tempo passado
        let decay = (elapsed / 1000) * taskResetRates[key];
        let newProgress = constrain(progress[key] - decay, 0, 100);
        if (abs(newProgress - progress[key]) > 0.01) {
          progress[key] = newProgress;
          changed = true;
        }
        // Atualiza o lastTaskTime para agora, para não descontar de novo no próximo frame
        lastTaskTime[key] = now;
      }
    }
  }

  // Sensibilidade mais difícil:
  const MIC_THRESHOLD = 0.05;
  const CAMERA_BRIGHTNESS = 140;
  const TILT_THRESHOLD = 30;

  // Só atualiza a tarefa ativa
  if (progress[mode] < 100) {
    let previousProgress = progress[mode];

    if (mode === "sing") {
      let level = mic.getLevel();
      if (level > MIC_THRESHOLD) {
        progress.sing = constrain(progress.sing + progressRate, 0, 100);
        lastTaskTime.sing = Date.now();
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
        activePerformed = true;
        changed = true;

        if (previousProgress < 100 && progress.sing >= 100 && (soundMode === 0 || soundMode === 1) && completedSound) {
          completedSound.play();
        }

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
      if (avg > CAMERA_BRIGHTNESS) {
        progress.sunlight = constrain(progress.sunlight + progressRate, 0, 100);
        lastTaskTime.sunlight = Date.now();
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
        activePerformed = true;
        changed = true;

        if (previousProgress < 100 && progress.sunlight >= 100 && (soundMode === 0 || soundMode === 1) && completedSound) {
          completedSound.play();
        }

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
      if (abs(gamma) > TILT_THRESHOLD) {
        progress.water = constrain(progress.water + progressRate, 0, 100);
        lastTaskTime.water = Date.now();
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
        activePerformed = true;
        changed = true;

        if (previousProgress < 100 && progress.water >= 100 && (soundMode === 0 || soundMode === 1) && completedSound) {
          completedSound.play();
        }

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
  let canGrow = (Date.now() - lastGrowthTime) > (24 * 60 * 60 * 1000);

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
    vetoresFases = window.vetoresFases;
    gerarPlanta();
    completionMessage = "Planta recuperada!\nContinue a cuidar para subir de fase.";
    menu = 0;
    mode = "none";
    lastCareTime = Date.now();
    localStorage.setItem('lastCareTime', lastCareTime);
    showReviveButton = false;

    setTimeout(() => {
      completionMessage = "";
    }, 5000);

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
    if (
      progress.sing >= 90 &&
      progress.sunlight >= 90 &&
      progress.water >= 90
    ) {
      if (levelUpSound) {
        levelUpSound.play();
      }

      if (faseAtual === 0) {
        completionMessage = "Parabéns!\nA tua planta nasceu!";
      } else {
        completionMessage = "Parabéns!\nTodas as tarefas completas!\nPlanta subiu de fase!";
      }
      localStorage.setItem('lastGrowthTime', Date.now());
      setTimeout(() => {
        if (faseAtual < maxFases - 1) {
          faseAtual++;
          gerarPlanta();
          localStorage.setItem('faseAtual', faseAtual);
        }
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

        lastTaskTime = {
          sing: Date.now(),
          sunlight: Date.now(),
          water: Date.now()
        };
        localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));

        saveProgressToCache();
      }, 1500);
    }
  }

  if (changed) {
    saveProgressToCache();
    localStorage.setItem('lastTaskTime', JSON.stringify(lastTaskTime));
  }
}

function drawProgressBar() {
  // Só desenha se o modo for válido
  if (!mode || mode === "none" || typeof displayedProgress[mode] !== "number") return;

  let barWidth = width * 0.8;
  let barHeight = 30;
  let x = width * 0.1;
  let y;
  if (windowWidth <= 768) {
    y = height / 4;
  } else {
    y = 50;
  }

  // Sombra
  push();
  noStroke();
  fill(0, 40);
  rect(x, y + 5, barWidth, barHeight, barHeight / 2);
  pop();

  // Fundo da barra
  noStroke();
  fill(240);
  rect(x, y, barWidth, barHeight, barHeight / 2);

  // Barra de progresso (gradiente)
  let p = displayedProgress[mode];
  let progression = map(p, 0, 100, 0, barWidth);
  let grad = drawingContext.createLinearGradient(x, 0, x + progression, 0);
  grad.addColorStop(0, '#43e97b');
  grad.addColorStop(1, '#38f9d7');
  drawingContext.save();
  drawingContext.fillStyle = grad;
  rect(x, y, progression, barHeight, barHeight / 2);
  drawingContext.restore();

  // Borda
  stroke(80, 180, 120, 120);
  strokeWeight(2);
  noFill();
  rect(x, y, barWidth, barHeight, barHeight / 2);

  // Emoji da tarefa no fim da barra
  let emoji = "🌱";
  if (mode === "sing") emoji = "🎤";
  if (mode === "sunlight") emoji = "☀️";
  if (mode === "water") emoji = "💧";
  noStroke();
  textSize(barHeight * 1.2);
  textAlign(CENTER, CENTER);
  text(emoji, x + progression, y + barHeight / 2);

  // (Opcional) Se quiser remover o texto, não desenhe nada aqui.
  // Se quiser mostrar o valor, pode adicionar um texto pequeno acima ou abaixo da barra.
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

function startBackgroundMusic() {
  // Only play if soundMode is 0 (all on)
  if (backgroundMusic && !backgroundMusic.isPlaying() && soundMode === 0) {
    backgroundMusic.play();
  }
}


// Função para colocar a flor no nível máximo (chamar na consola: setFlorMax())
function setFlorMax() {
  faseAtual = maxFases - 1;
  localStorage.setItem('faseAtual', faseAtual);
  gerarPlanta();
  completionMessage = "A flor está agora no nível máximo!";
  // Atualiza o progresso das tarefas para 100%
  progress = { sing: 100, sunlight: 100, water: 100 };
  displayedProgress = { sing: 100, sunlight: 100, water: 100 };
  saveProgressToCache();
}

// Add this new function to show task intervals and remaining time
function showTaskIntervals() {
  console.log("=== TASK INTERVALS ===");
  
  // Show the configured intervals for each task
  console.log("CONFIGURED INTERVALS:");
  for (let task in taskResetIntervals) {
    let hours = taskResetIntervals[task] / (60 * 60 * 1000);
    console.log(`${capitalize(task)}: ${hours.toFixed(1)} hours (${taskResetIntervals[task]} ms)`);
  }
  
  // Show the remaining time for each task based on current progress
  console.log("\nREMAINING TIME:");
  let now = Date.now();
  for (let task in progress) {
    // Calculate time remaining based on current progress percentage
    let currentProgress = progress[task];
    let totalInterval = taskResetIntervals[task];
    
       
    // Calculate decay rate (% per millisecond)
    let decayRate = taskResetRates[task] / 1000;
    
    // Calculate milliseconds until zero (current progress ÷ decay rate)
    let msUntilZero = currentProgress / decayRate;
    
    // Convert to hours, minutes, seconds
    let remainingHours = Math.floor(msUntilZero / (60 * 60 * 1000));
    let remainingMinutes = Math.floor((msUntilZero % (60 * 60 * 1000)) / (60 * 1000));
    let remainingSeconds = Math.floor((msUntilZero % (60 * 1000)) / 1000);
    
    // Calculate percentage of time remaining
    let percentRemaining = (msUntilZero / totalInterval) * 100;
    
    console.log(`${capitalize(task)}: ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s (${currentProgress.toFixed(1)}% remaining)`);
  }
  
  // Show current progress values
  console.log("\nCURRENT PROGRESS:");
  for (let task in progress) {
    console.log(`${capitalize(task)}: ${progress[task].toFixed(1)}%`);
  }
  
  console.log("=====================");
}
