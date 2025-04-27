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
    background(200);
  }
  
  function draw() {
    fill(50);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Bem-vindo ao Jogo da Planta!", width/2, height/2);
  } 
  