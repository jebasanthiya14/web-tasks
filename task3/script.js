const btn = document.getElementById("colorBtn");
const colorCode = document.getElementById("colorCode");

// Array of bright colors
const colors = [
  "#00eaff", "#ff0066", "#39ff14", "#ffea00", "#ff4d00",
  "#7d00ff", "#ff0099", "#00ff99", "#ffffff"
];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

btn.addEventListener("click", function() {
  // Pick 2 or 3 random colors for the gradient
  const color1 = getRandomColor();
  const color2 = getRandomColor();
  const color3 = getRandomColor();
  
  // Apply linear gradient
  document.body.style.background = `linear-gradient(120deg, ${color1}, ${color2}, ${color3})`;
  
  // Show the colors as text
  colorCode.textContent = `Colors: ${color1}, ${color2}, ${color3}`;
});
