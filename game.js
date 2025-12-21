const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const COLS = 5;
const ROWS = 7;
const SIZE = Math.min(canvas.width / COLS, canvas.height / (ROWS + 1));
const SWAP_TIME = 180;

const TYPES = ["leaf", "stone", "fire", "water", "air"];

let grid = [];
let animating = false;
let activeSwap = null;

// ---------------- INIT ----------------

function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  initGrid();
  requestAnimationFrame(loop);
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(makeTile(r, c, randomType()));
    }
    grid.push(row);
  }
}

function randomType() {
  return TYPES[Math.floor(Math.random() * TYPES.length)];
}

function makeTile(r, c, type) {
  return {
    r, c,
    type,
    x: c * SIZE + SIZE / 2,
    y: canvas.height - (r + 1) * SIZE,
    tx: null,
    ty: null,
    t: 0
  };
}

// ---------------- LOOP ----------------

function loop(ts) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  updateAnimations();
  requestAnimationFrame(loop);
}

// ---------------- DRAW ----------------

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawIcon(grid[r][c]);
    }
  }
}

function drawIcon(tile) {
  ctx.save();
  ctx.translate(tile.x, tile.y);

  if (tile.type === "leaf") {
    ctx.fillStyle = "#6bbf7a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 22, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tile.type === "stone") {
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.lineTo(-6, -18);
    ctx.lineTo(14, -12);
    ctx.lineTo(18, 8);
    ctx.closePath();
    ctx.fill();
  }

  if (tile.type === "fire") {
    ctx.fillStyle = "#e07a5f";
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(14, 0, 0, 22);
    ctx.quadraticCurveTo(-14, 0, 0, -22);
    ctx.fill();
  }

  if (tile.type === "water") {
    ctx.fillStyle = "#5fa8d3";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tile.type === "air") {
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  ctx.restore();
}

// ---------------- INPUT ENGINE ----------------

let dragStart = null;

canvas.addEventListener("pointerdown", e => {
  if (animating) return;

  const pos = getCell(e);
  if (!pos) return;

  dragStart = pos;
});

canvas.addEventListener("pointerup", e => {
  if (!dragStart || animating) return;

  const pos = getCell(e);
