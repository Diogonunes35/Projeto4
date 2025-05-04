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
  componentes.push(loadImage('assets/flor.svg')); // A flor final
}

function setup() {
  createCanvas(400, 700);
  
  if (localStorage.getItem('plantaSeed')) {
    seed = localStorage.getItem('plantaSeed');
    faseAtual = parseInt(localStorage.getItem('faseAtual')) || 0;
    maxFases = parseInt(localStorage.getItem('maxFases')) || 5;
  } else {
    seed = Math.floor(Math.random() * 1000000).toString();
    faseAtual = 0;
    maxFases = 5;
    
    localStorage.setItem('plantaSeed', seed);
    localStorage.setItem('faseAtual', faseAtual);
    localStorage.setItem('maxFases', maxFases);
  }
  
  randomSeed(int(seed)); // Muito importante: aplicar a seed no random
  gerarPlanta();
}

function gerarPlanta() {
  planta = [];
  for (let i = 0; i <= faseAtual; i++) {
    if (i === maxFases - 1) {
      planta.push(componentes[4]); // Última fase é sempre a flor
    } else {
      let comp = random(componentes.slice(0, 4)); // Escolhe entre parte1 a parte4
      planta.push(comp);
    }
  }
}


function draw() {
  background(220);

  let baseX = width / 2;
  let baseY = height - 120; // Ponto inicial da base
  let larguraDesejada = 90; // Reduzido proporcionalmente (225 → 90)
  let alturaDesejada = 60;  // Reduzido proporcionalmente (150 → 60)
  let distanciaEntrePartes = alturaDesejada - 10; // ligeiro overlap para parecer contínuo

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

