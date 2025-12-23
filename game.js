// ===============================
// EATHERIA ZEN – SWIPE & SWAP
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

let running = false;

// GRID
const COLS = 6;
const ROWS = 8;
let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

const COLORS = [
  "#22c55e", // life
  "#64748b", // stone
  "#f97316", // fire
  "#38bdf8", // water
  "#e5e7eb"  // air
];

let grid = [];

// INPUT
let swipeStart = null;
let isSwapping = false;

// -------------------------------
// START
// -------------------------------
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  startGame();
};

function startGame() {
  resize();
  initGrid();
  running = true;
  requestAnimationFrame(loop);
}

// -------------------------------
// RESIZE
// -------------------------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.floor(
    Math.min(
      canvas.width / COLS,
      canvas.height / (ROWS + 1)
    )
  );

  const gridW = SIZE * COLS;
  const gridH = SIZE * ROWS;

  offsetX = (canvas.width - gridW) / 2;
  offsetY = (canvas.height - gridH) / 2;
}
window.addEventListener("resize", resize);

// -------------------------------
// GRID
// -------------------------------
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(Math.floor(Math.random() * COLORS.length));
    }
    grid.push(row);
  }
}

// -------------------------------
// LOOP
// -------------------------------
function loop() {
  if (!running) return;
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// -------------------------------
// RENDER
// -------------------------------
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#020617");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2;
      const radius = SIZE * 0.38;

      const glow = ctx.createRadialGradient(
        x, y, radius * 0.2,
        x, y, radius * 1.5
      );
      glow.addColorStop(0, COLORS[grid[r][c]]);
      glow.addColorStop(1, "rgba(15,23,42,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS[grid[r][c]];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// -------------------------------
// INPUT → SWIPE
// -------------------------------
canvas.addEventListener("pointerdown", e => {
  if (isSwapping) return;
  swipeStart = getCell(e.clientX, e.clientY);
});

canvas.addEventListener("pointerup", e => {
  if (!swipeStart || isSwapping) return;

  const end = getCell(e.clientX, e.clientY);
  if (!end) {
    swipeStart = null;
    return;
  }

  const dr = end.r - swipeStart.r;
  const dc = end.c - swipeStart.c;

  if (Math.abs(dr) + Math.abs(dc) !== 1) {
    swipeStart = null;
    return;
  }

  swapCells(swipeStart, end);
  swipeStart = null;
});

// -------------------------------
// HELPERS
// -------------------------------
function getCell(x, y) {
  const cx = x - offsetX;
  const cy = y - offsetY;
  if (cx < 0 || cy < 0) return null;

  const c = Math.floor(cx / SIZE);
  const r = Math.floor(cy / SIZE);

  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return { r, c };
}

function swapCells(a, b) {
  isSwapping = true;

  const temp = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = temp;

  // short zen delay
  setTimeout(() => {
    isSwapping = false;
  }, 120);
}