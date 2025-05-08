let seed;
let faseAtual = 0;
let componentes = []; // Lista de imagens da planta
let planta = []; // Componentes atuais da planta
let maxFases;

function preload() {
  componentes.push(loadImage('assets/parte1.svg'));
  componentes.push(loadImage('assets/parte2.svg'));
  componentes.push(loadImage('assets/parte3.svg'));
  componentes.push(loadImage('assets/parte4.svg'));
  componentes.push(loadImage('assets/flor.svg')); 
}

function setup() {
  createCanvas(400, 700);

  if (localStorage.getItem('plantaSeed')) {
    seed = localStorage.getItem('plantaSeed');
    faseAtual = parseInt(localStorage.getItem('faseAtual')) || 0;
    maxFases = parseInt(localStorage.getItem('maxFases')) || 5;
    planta = JSON.parse(localStorage.getItem('planta')) || [];
  } else {
    seed = 1;
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
  // Garante que o vetor planta seja gerado de forma determinística com base na seed
  randomSeed(int(seed)); // Reinicia o gerador de números aleatórios com a seed

  planta = []; // Reinicia o vetor planta
  for (let i = 0; i <= faseAtual; i++) {
    if (i === maxFases - 1) {
      planta.push(4); // Última fase é sempre a flor
    } else {
      let compIndex = int(random(0, 4)); // Escolhe um índice entre 0 e 3
      planta.push(compIndex);
    }
  }

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
    let compIndex = planta[i];
    image(componentes[compIndex], posX, posY, larguraDesejada, alturaDesejada);
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