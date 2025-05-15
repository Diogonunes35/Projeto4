let seed;
let faseAtual = 0;
let componentes = []; // Lista de imagens da planta
let vetoresFases = []; // Matriz de vetores para cada fase
let planta = []; // Componentes atuais da planta
let maxFases = 5;

function preload() {
  // Carrega os vetores de cada fase dinamicamente
  for (let fase = 0; fase < maxFases; fase++) {
    let vetoresParaFase = [];
    for (let i = 0; i < 5; i++) {
      let caminho = `assets/fase${fase}/${i}.svg`;
      let img = loadImage(caminho, 
        () => console.log(`Imagem carregada: ${caminho}`), 
        () => console.error(`Erro ao carregar: ${caminho}`)
      );
      vetoresParaFase.push(img);
    }
    vetoresFases.push(vetoresParaFase);
  }

  console.log(vetoresFases);
}

function setup() {
  createCanvas(400, 700);

  try {
    if (localStorage.getItem('plantaSeed')) {
      seed = localStorage.getItem('plantaSeed');
      faseAtual = parseInt(localStorage.getItem('faseAtual')) || 0;
      maxFases = parseInt(localStorage.getItem('maxFases')) || 5;
      planta = JSON.parse(localStorage.getItem('planta')) || [];
    } else {
      inicializarDados();
    }
  } catch (e) {
    console.error("Erro ao carregar dados do localStorage:", e);
    inicializarDados();
  }

  randomSeed(int(seed)); 
  gerarPlanta();
}

function inicializarDados() {
  seed = 123456; // Para testes
  faseAtual = 0;
  maxFases = 5;
  planta = [];

  localStorage.setItem('plantaSeed', seed);
  localStorage.setItem('faseAtual', faseAtual);
  localStorage.setItem('maxFases', maxFases);
  localStorage.setItem('planta', JSON.stringify(planta));
}

function gerarPlanta() {
  randomSeed(int(seed)); // Reinicia o gerador de números aleatórios com a seed

  planta = []; // Reinicia o vetor planta
  let plantaIndices = []; // Vetor para salvar os índices das imagens

  for (let i = 0; i <= faseAtual; i++) {
    if (vetoresFases[i]) { // Verifica se a fase existe
      let vetorIndex = int(random(0, 5)); // Escolhe um dos 5 vetores para a fase atual
      planta.push(vetoresFases[i][vetorIndex]); // Adiciona o vetor escolhido
      plantaIndices.push(vetorIndex); // Salva o índice
    } else {
      console.error(`Fase ${i} não encontrada em vetoresFases.`);
    }
  }

  console.log("Planta gerada:", planta);

  // Salva apenas os índices no localStorage
  localStorage.setItem('planta', JSON.stringify(plantaIndices));
}

function draw() {
  background(220);

  let baseX = width / 2;
  let baseY = height - 120; // Ponto inicial da base
  let larguraDesejada = 90; // Largura desejada para os componentes
  let alturaDesejada = 60;  // Altura desejada para os componentes
  let distanciaEntrePartes = alturaDesejada - 10; // Distância entre os componentes

  imageMode(CENTER);

  for (let i = 0; i < planta.length; i++) {
    if (planta[i]) { // Verifica se a imagem foi carregada
      let posX = baseX;
      let posY = baseY - (i * distanciaEntrePartes);
      image(planta[i], posX, posY, larguraDesejada, alturaDesejada);
    } else {
      console.warn(`Imagem da planta na posição ${i} não foi carregada.`);
    }
  }
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