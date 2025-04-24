const rectangle = document.getElementById('rectangle');
const maxWidth = 100; 
const buttonLimits = [25, 25, 25, 25]; 
let buttonCharges = [25, 25, 25, 25]; 

function updateRectangleWidth() {
  const totalCharge = buttonCharges.reduce((sum, charge) => sum + charge, 0);
  rectangle.style.width = `${totalCharge}%`;
}

function interpolateColor(color1, color2, factor) {
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const rgbToHex = (rgb) =>
    `#${rgb
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`;

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const interpolatedRgb = rgb1.map((value, index) =>
    Math.round(value + factor * (rgb2[index] - value))
  );

  return rgbToHex(interpolatedRgb);
}

function updateButtonColors() {
  buttonCharges.forEach((charge, index) => {
    const button = document.getElementById(`button${index + 1}`);
    const factor = 1 - charge / buttonLimits[index]; 
    const color = interpolateColor('#2ecc71', '#FF0000', factor); 
    button.style.backgroundColor = color; 
  });
}

setInterval(() => {
  buttonCharges = buttonCharges.map((charge, index) => {
    if (charge > 0) {
      charge -= 1;
      if (charge < 0) charge = 0; 
    }
    return charge;
  });
  updateRectangleWidth(); 
  updateButtonColors(); 
}, 2000);


function rechargeButton(buttonIndex) {
  const maxCharge = buttonLimits[buttonIndex]; 
  const currentCharge = buttonCharges[buttonIndex]; 
  const rechargeAmount = maxCharge - currentCharge; 

  if (rechargeAmount > 0) {
    buttonCharges[buttonIndex] += rechargeAmount; 
    updateRectangleWidth(); 
    updateButtonColors(); 
  }
}