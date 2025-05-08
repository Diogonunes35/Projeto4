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
      vetoresParaFase.push(loadImage(caminho));
    }
    vetoresFases.push(vetoresParaFase);
  }

  console.log(vetoresFases);
}

function setup() {
  createCanvas(400, 700);

  if (localStorage.getItem('plantaSeed')) {
    seed = localStorage.getItem('plantaSeed');
    faseAtual = parseInt(localStorage.getItem('faseAtual')) || 0;
    maxFases = parseInt(localStorage.getItem('maxFases')) || 5;
    planta = JSON.parse(localStorage.getItem('planta')) || [];
  } else {
    //seed = Math.floor(Math.random() * 1000000).toString(); // Gera uma nova seed
    seed = 123456; // Para testes
    faseAtual = 0;
    maxFases = 5;
    planta = [];

    localStorage.setItem('plantaSeed', seed);
    localStorage.setItem('faseAtual', faseAtual);
    localStorage.setItem('maxFases', maxFases);
    localStorage.setItem('planta', JSON.stringify(planta));
  }

  randomSeed(int(seed)); 
  gerarPlanta();
}

function gerarPlanta() {
  // Usa a seed para escolher um vetor para cada fase
  randomSeed(int(seed)); // Reinicia o gerador de números aleatórios com a seed

  planta = []; // Reinicia o vetor planta
  for (let i = 0; i < faseAtual; i++) { // Inclui a fase atual
    let vetorIndex = int(random(0, 5)); // Escolhe um dos 5 vetores para a fase atual
    planta.push(vetoresFases[i][vetorIndex]); // Adiciona o vetor escolhido
  }

  console.log(planta);

  localStorage.setItem('planta', JSON.stringify(planta));
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
    let posX = baseX;
    let posY = baseY - (i * distanciaEntrePartes);
    image(planta[i], posX, posY, larguraDesejada, alturaDesejada);
  }
}

function mousePressed() {
  if (faseAtual < maxFases - 1) {
    faseAtual++;
    gerarPlanta();
    localStorage.setItem('faseAtual', faseAtual);
  }
}

function limparLocalStorage() {
  localStorage.clear();
  console.log("Local storage limpo!");
}