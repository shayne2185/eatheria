const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const COLS = 5;
const ROWS = 7;
const SIZE = Math.min(
  canvas.width / COLS,
  canvas.height / (ROWS + 1)
);

const elements = ["leaf", "stone", "fire", "water", "air"];
let grid = [];
let running = false;

function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  running = true;

  const audio = document.getElementById("ambient");
  if (document.getElementById("soundToggle").checked) {
    audio.volume = 0.4;
    audio.play().catch(()=>{});
  }

  initGrid();
  requestAnimationFrame(loop);
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randomElement());
    }
    grid.push(row);
  }
}

function randomElement() {
  return elements[Math.floor(Math.random() * elements.length)];
}

function loop() {
  if (!running) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  requestAnimationFrame(loop);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawOrb(
        grid[r][c],
        c * SIZE + SIZE / 2,
        canvas.height - (r + 1) * SIZE
      );
    }
  }
}

function drawOrb(type, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, SIZE * 0.35, 0, Math.PI * 2);

  ctx.fillStyle = {
    leaf: "#5fa96b",
    stone: "#555",
    fire: "#d66",
    water: "#5aa",
    air: "#eee"
  }[type];

  ctx.fill();
}
