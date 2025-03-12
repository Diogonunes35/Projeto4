//mic
let mic;
let rectWidth = 0;
let rectColor = 0;
let velocity = 0;
let angle= 0;
let volmax = 0;
let decayFactor = 0.995;
let noiseThreshold = 0.05; // Defina o valor do threshold para ignorar ruídos
let vol; // Mover a definição de vol para fora da função setup

//nuvens
let clouds = new Array(20);
let cloudOffsets;

//estrelas
let starPositions = new Array(25);

//ondas
let yoff = 0.0; 
let waveOffset = 0; // Adicione esta linha para criar um deslocamento horizontal para as ondas

//predios
let l = 10;

//camera
let capture;
let pixelcount;
let rTotal, gTotal, bTotal;

let skyRed, skyGreen, skyBlue;

let avgR, avgG, avgB;

//altura
let altura = 0;
let alturaDecayFactor = 0.995;

// Variáveis para armazenar os valores de orientação
let gamma = 0; // Inclinação do dispositivo (esquerda e direita)

// Adiciona um evento listener para capturar os dados de orientação do dispositivo
window.addEventListener('deviceorientation', (event) => {
  gamma = event.gamma; // Inclinação do dispositivo em graus (esquerda e direita)
});

let showAbout = false;
let aboutButtonText = "Sobre";

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
  mic.start();
  vol = mic.getLevel(); // Inicializar vol

  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.hide();
  pixelcount = capture.width * capture.height;

  // Gera as posições das estrelas
  generateStars();
  
  // Gera as posições das nuvens
  generateClouds();
}

function draw() {
  // Volume Microfone
  vol = mic.getLevel();
  if (vol < noiseThreshold) {
    vol = 0;
  }

  // Desenhar Camera
  image(capture, 0, 0, capture.width, capture.height);

  
  // Capturar os pixels da área da câmera
  let cameraPixels = get(0, 0, capture.width, capture.height);
  cameraPixels.loadPixels();
  
  let stepSize = 1; // Processar menos pixels
  for (let y = 0; y < cameraPixels.height; y += stepSize) {
    for (let x = 0; x < cameraPixels.width; x += stepSize) {
      let i = (cameraPixels.width * y + x) * 4;
      
      let r = cameraPixels.pixels[i + 0];
      let g = cameraPixels.pixels[i + 1];
      let b = cameraPixels.pixels[i + 2];
      
      rTotal += r; 
      gTotal += g; 
      bTotal += b; 
    }
  }    

  avgR = red(rTotal / (pixelcount / (stepSize * stepSize)));
  avgG = green(gTotal / (pixelcount / (stepSize * stepSize)));
  avgB = blue(bTotal / (pixelcount / (stepSize * stepSize)));

  let avgBright = (avgR + avgG + avgB) / 3;
  
  rTotal = 0;
  gTotal = 0;
  bTotal = 0;

  //Desenha Ceu
  skyRed = map(avgR, 0, 255, 30, 135);
  skyGreen = map(avgG, 0, 255, 43, 206);
  skyBlue = map(avgB, 0, 255, 88, 235);

  fill(skyRed,skyGreen,skyBlue);
  rect(0, 0, 2*width, 2*height);

  
  //Desenha estrelas
  let transparencia = map(avgBright, 0, 140, 255, 0);

  for (let i = 0; i < starPositions.length; i++) {
    stroke(255, 255, 100, transparencia);
    fill(255, 255, 0, transparencia);
    star(starPositions[i].x, starPositions[i].y, 2, random(4, 10), 5);
  }

  //Desenha Montanhas com efeito paralaxe
  let parallax1 = map(gamma, -90, 90, -130, 130); 
  let parallax2 = map(gamma, -90, 90, -80, 80); 
  let parallax3 = map(gamma, -90, 90, -30, 30); 

  // Verifica se a largura da janela é menor que 768 pixels
  let heightFactor = windowWidth < 768 ? 1.4 : 1; // Ajusta o fator de altura para 0.5 em ecrãs menores

  // Desenha as montanhas
  noStroke();
  //montanha 1
  fill(3, 118, 61 );  
  triangle(-80, height, width / 3, height / 2 * heightFactor, width/3 *2 + 80, height);
  triangle(width/3 - 80, height, width / 3* 2, height / 2.3 * heightFactor, width +80, height);

  //montanha 2
  fill(71, 147, 87);
  triangle(-80, height, width / 5, height / 4 * 2 * heightFactor, width/5 *2 + 80, height);
  triangle(width /6 * 4 - 80, height, width / 6 * 5, height / 4 * 2 * heightFactor, width + 80, height);
    
  //montanha 3
  fill(113 ,180 ,72);
  triangle(width/4 - 80, height,  width / 2, height / 2.5 * heightFactor, width /4 * 3 + 80, height);



  if (vol > volmax) {
    volmax = vol;
  }
    
  rectWidth = map(vol, 0, 1, 0, width); 
  rectColor = map(vol, 0, 1, 0, 255);
  velocity = map(volmax, 0, 1, 0, 0.5); // Always update velocity based on volume
     
  rectMode(CORNER);
  fill(0, rectColor, rectColor/3);
  //rect(0, 0, rectWidth, 50);
    
  angle += velocity;

  // Atualizar as posições das nuvens
  updateClouds();

  // Desenha as nuvens
  drawClouds();

  //Desenha a primeira onda
  fill(4, 105, 151);
  beginShape();
  let xoff = waveOffset; // Use waveOffset como o valor inicial de xoff
  let waveHeight = gamma <= 0 ? 10 : map(gamma, 0, 90, 10, 60); // Determina a altura da onda com base na posição do cursor

  for (let x = 0; x <= width+10; x += 10) {
    let y = map(sin(xoff), -1, 3, 6 * height / 7 - waveHeight, 6 * height / 7 + waveHeight);
    vertex(x, y);
    xoff += 0.1;
  }
  yoff += 0.01;
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);

  // Ajusta a velocidade das ondas com base na posição do cursor
  let waveSpeed = gamma <= 0 ? 0.05 : map(gamma, 0, 90, 0.05, 0.15);
  waveOffset -= waveSpeed; // Aumente o deslocamento horizontal a cada quadro para mover as ondas da esquerda para a direita

  // Desenha a segunda onda por cima da primeira
  fill(255, 255, 255, 100); // Cor branca com transparência
  beginShape();
  xoff = waveOffset + 100; // Use um deslocamento diferente para a segunda onda
  waveHeight = gamma <= 0 ? 5 : map(gamma, 0, 90, 5, 30); // Altura da segunda onda

  for (let x = 0; x <= width+10; x += 10) {
    let y = map(sin(xoff), -1, 3, 7 * height / 8 - waveHeight, 7 * height / 8 + waveHeight);
    vertex(x, y);
    xoff += 0.1;
  }
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);

  //Desenha Poste
  push();
    stroke(125);
    fill(160);
    translate(width / 2, height / 2);
    beginShape();
    vertex(-10, 0);
    vertex(10, 0);
    vertex(20, width);
    vertex(-20, width);
    endShape(CLOSE);
  pop();

  //Desenha Relva
  noStroke();
  fill(126,200,80);
  ellipse(width / 2, height, width, 120);
    
  //Desenha Ventuinha
  push();
    stroke(125);
    fill(160);
    translate(width / 2, height / 2);
    scale(0.8); // Escala a ventoinha para 0.8 do tamanho original
    rotate(angle);
    rectMode(CENTER);
    circle(0, 0, 50);

    //Desenha Hélices
    for(let i=1; i<=3; i+=1) {
      push();
        stroke(125);
        fill(160);
        beginShape();
        rotate(TWO_PI/3*i);
        vertex(0, -10);
        vertex(30, -10);
        vertex(50, -20);
        vertex(220, -8);
        vertex(220, 8);
        vertex(50, 20);
        vertex(30, 5);
        vertex(0, 5);
        endShape(CLOSE);
      pop();

      push();
      noStroke();
        fill(200);
        beginShape();
        rotate(TWO_PI/3*i);
        vertex(0, 0);
        vertex(35, 0);
        vertex(50, 10);
        vertex(220, 3);
        vertex(220, 8);
        vertex(50, 20);
        vertex(30, 5);
        vertex(0, 5);
        endShape(CLOSE);
      pop();
    }
    circle(0, 0, 30);
  pop();
      
  volmax *= decayFactor;

  //desenha pilha

  if(volmax> 0.4){
    altura -= map(volmax, 0.20, 1, 0, 1.5);
  };

  if(avgBright > 140){
    altura -= map(avgBright, 130, 255, 0, 1);
  };

  if(waveHeight > 10){
    altura -= map(waveHeight, 10, 60, 0, 1);
  };

  altura *= alturaDecayFactor;

  // Constrain altura to be between -110 and 0
  altura = constrain(altura, -110, 0);

  console.log(altura);

  push();

  let previousHeight = windowWidth < 768 ? 18 * height / 20 : 17 * height / 20;
  translate(2*width/8, previousHeight);

  if(windowWidth < 768){
    scale(0.8);
  }

  fill(70);
  beginShape();
  curveVertex(-50, -60);
  curveVertex(50, -60);
  curveVertex(50, 60);
  curveVertex(-50, 60);
  curveVertex(-50, -60);
  curveVertex(50, -60);
  curveVertex(50, 60);
  endShape();

  fill(70);
  beginShape();
  curveVertex(-35, -80);
  curveVertex(-15, -80);
  curveVertex(-15, -60);
  curveVertex(-35, -60);
  curveVertex(-35, -80);
  curveVertex(-15, -80);
  curveVertex(-15, -60);
  endShape();

  fill(70);
  beginShape();
  curveVertex(35, -80);
  curveVertex(15, -80);
  curveVertex(15, -60);
  curveVertex(35, -60);
  curveVertex(35, -80);
  curveVertex(15, -80);
  curveVertex(15, -60);
  endShape();  

  //desenha carga

  /*
  fill(30);
  beginShape();
  curveVertex(-45, -50);
  curveVertex(45, -50);
  curveVertex(45, 50);
  curveVertex(-45, 50);
  curveVertex(-45, -50);
  curveVertex(45, -50);
  curveVertex(45, 50);
  endShape();
  */

  fill(0,128,0);
  translate(0, 55);
  beginShape();
  curveVertex(-45, altura);
  curveVertex(45, altura);
  curveVertex(45, 0);
  curveVertex(-45, 0);
  curveVertex(-45, altura);
  curveVertex(45, altura);
  curveVertex(45, 0);
  endShape();

  pop();
 
  // Desenha o botão "Sobre"
  drawAboutButton();

  // Exibe o texto informativo se o botão "Sobre" for clicado
  if (showAbout) {
    drawAboutText();
  }
}

// Função para desenhar o botão "Sobre"
function drawAboutButton() {
  fill(255, 200); // Fundo semitransparente
  stroke(100);
  fill(255); // Cor do texto
  textSize(20);
  textAlign(LEFT, TOP);
  text(aboutButtonText, 10, 10);
}

// Função para desenhar o texto informativo
function drawAboutText() {
  fill(255, 200); // Fundo semitransparente
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  let aboutText = "Esta é a Ilha Renovavel. Nesta ilha toda a sua energia é gerada por energia renovavel seja ela atraves de vento, da luz do sol ou do mar. Tu es a força que gera a energia desta ilha!\n\nTrabalho realizado por Diogo Nunes no ambito da cadeira de Projeto 4 da Licenciatura de Design e Multimédia da Universidade de Coimbra. 2024/25";
  
  // Calcula a altura do texto
  let textHeight = textAscent() + textDescent();
  let lines = aboutText.split('\n').length;
  let rectHeight = textHeight * lines + 10; // Altura do retângulo com padding

  // Desenha o fundo do texto
  rect(5, 35, width - 10, rectHeight); // Fundo do texto

  fill(0); // Cor do texto
  text(aboutText, 10, 40, width - 20); // Ajusta a largura do texto para caber na tela
}

// Função para lidar com cliques do mouse
function mousePressed() {
  userStartAudio();

  // Verifica se o botão "Sobre" foi clicado
  if (mouseX >= 10 && mouseX <= 10 + textWidth(aboutButtonText) && mouseY >= 10 && mouseY <= 30) {
    showAbout = !showAbout;
    aboutButtonText = showAbout ? "X" : "Sobre";
  }
}

// Corrigir a função cloud para usar os parâmetros x e y
function cloud(x, y) {
  let alpha = map(y, 0, height / 3, 50, height/2);
  fill(250, alpha);
  noStroke();
  ellipse(x, y, 70, 50);
  ellipse(x + 10, y + 10, 70, 50);
  ellipse(x - 20, y + 10, 70, 50);
}

function indexExistsClouds(x, y) {
  for (let star of starPositions) {
    if (abs(star.x - x) < 30 && abs(star.y - y) < 20) {
      return true;
    }
  }
  return false;
}

// Atualizar a função generateClouds para inicializar cloudOffsets
function generateClouds() {
  cloudOffsets = new Array(clouds.length).fill(0);
  for (let i = 0; i < clouds.length; i++) {
    let x = random(0, width);
    let y = random(15, height / 3);
    clouds[i] = { x, y };
  }
}

// Adicionar a função para atualizar as posições das nuvens
function updateClouds() {
  let widthFactor = windowWidth < 768 ? 0.5 : 1; // Ajusta o fator de velocidade e distância para telas menores
  for (let i = 0; i < clouds.length; i++) {
    let direction = clouds[i].x < width / 2 ? -1 : 1;
    let speedFactor = map(clouds[i].y, 0, height / 3, 0.5, 1.5) * widthFactor; // Ajusta a velocidade com base na posição Y e largura da tela
    let distanceFactor = map(clouds[i].y, 0, height / 3, 1, 2) * widthFactor; // Ajusta a distância com base na posição Y e largura da tela
    cloudOffsets[i] += direction * vol * 10 * speedFactor * distanceFactor; // Ajuste o fator de multiplicação conforme necessário
    cloudOffsets[i] *= 0.995; // Fator de desaceleração para retornar à posição inicial
  }
}

// Modificar a função drawClouds para desenhar as nuvens com os deslocamentos aplicados
function drawClouds() {
  for (let i = 0; i < clouds.length; i++) {
    cloud(clouds[i].x + cloudOffsets[i], clouds[i].y);
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

function indexExistsStars(x, y) {
  for (let star of starPositions) {
    if (abs(star.x - x) < 30 && abs(star.y - y) < 20) {
      return true;
    }
  }
  return false;
}

function generateStars() {
  for (let i = 0; i < starPositions.length; i++) {
    let x, y;
      x = random(15, width - 15);
      y = random(15, height - 15);
    
    starPositions[i] = { x, y };
  }
}

/*
function building(x, y, scaleFactor){
  push();
  translate(x, y);
  scale(scaleFactor);
  strokeWeight(1/scaleFactor);
  rectMode(CENTER);
  
  fill(150);
  stroke(100);
  rect(0,0,l, 3*l);
  
  fill(238,221,130);
  stroke(191, 173, 78);
  for(let y = -13; y<15; y+=4){
    square(3,y,l/4);
    square(-3,y,l/4);
    square(0,y,l/4);
  }
  
  stroke(0);
  beginShape();
  fill(0);
  vertex(-l/3+1,-l-8);
  vertex(l/3+1,-l-8);
  vertex(l/3-1, -7-8)
  vertex(-l/3-1, -7-8);
  endShape(CLOSE);
  
  rectMode(CORNER);
  fill(0);
  rect(l/3,-l-8, 0.5, 3);
  
  beginShape();
  fill(12, 26, 171);
  vertex(-l/3+1,-l-7.5);
  vertex(l/3,-l-7.5);
  vertex(l/3-1, -7-8.5)
  vertex(-l/3-0.5, -7-8.5);
  endShape(CLOSE);
  pop();
}
*/