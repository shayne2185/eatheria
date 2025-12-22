const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 6;
const ROWS = 8;
let SIZE;

const TYPES = [0, 1, 2, 3, 4]; // leaf, stone, fire, water, air
let grid = [];
let swipeStart = null;

startBtn.onclick = startGame;

function startGame() {
  menu.style.display = "none";
  canvas.style.display = "block";
  resize();
  initGrid();
  requestAnimationFrame(loop);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  SIZE = Math.min(canvas.width / COLS, canvas.height / (ROWS + 1));
}
window.addEventListener("resize", resize);

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(TYPES[Math.random() * 5 | 0]);
    }
    grid.push(row);
  }
}

function loop() {
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

function drawBackground() {
  const g = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height * 0.2,
    20,
    canvas.width / 2,
    canvas.height,
    canvas.width
  );
  g.addColorStop(0, "#0f172a");
  g.addColorStop(1, "#020617");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * SIZE + SIZE / 2;
      const y = canvas.height - (r + 1) * SIZE;
      drawOrbWithIcon(grid[r][c], x, y, SIZE);
    }
  }
}

function drawOrbWithIcon(type, x, y, size) {
  const r = size * 0.38;

  // glow
  const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6);
  glow.addColorStop(0, "rgba(180,255,240,0.35)");
  glow.addColorStop(1, "rgba(15,23,42,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // orb body
  const orb = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  orb.addColorStop(0, "#1e293b");
  orb.addColorStop(1, "#020617");
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // icon
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;

  if (type === 0) drawLeaf(r * 0.6);
  if (type === 1) drawStone(r * 0.6);
  if (type === 2) drawFire(r * 0.6);
  if (type === 3) drawWater(r * 0.6);
  if (type === 4) drawAir(r * 0.6);

  ctx.restore();
}

// ICONS
function drawLeaf(r) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.6, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
}

function drawStone(r) {
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(-r * 0.2, -r * 0.6);
  ctx.lineTo(r * 0.6, -r * 0.3);
  ctx.lineTo(r * 0.5, r * 0.5);
  ctx.lineTo(0, r * 0.7);
  ctx.closePath();
  ctx.stroke();
}

function drawFire(r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.5, -r * 0.2, r * 0.3, r * 0.7, 0, r);
  ctx.bezierCurveTo(-r * 0.3, r * 0.7, -r * 0.5, -r * 0.2, 0, -r);
  ctx.stroke();
}

function drawWater(r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.6, 0, r * 0.3, r, 0, r);
  ctx.bezierCurveTo(-r * 0.3, r, -r * 0.6, 0, 0, -r);
  ctx.stroke();
}

function drawAir(r) {
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, Math.PI * 0.5, Math.PI * 2);
  ctx.stroke();
}

// SWIPE – iOS SAFE
canvas.addEventListener("pointerdown", e => {
  swipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!swipeStart) return;

  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;

  if (Math.hypot(dx, dy) < 20) {
    swipeStart = null;
    return;
  }

  const c = Math.floor(swipeStart.x / SIZE);
  const r = Math.floor((canvas.height - swipeStart.y) / SIZE);

  let tc = c, tr = r;
  if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
  else tr += dy > 0 ? -1 : 1;

  if (grid[r] && grid[tr] && grid[r][c] !== undefined && grid[tr][tc] !== undefined) {
    [grid[r][c], grid[tr][tc]] = [grid[tr][tc], grid[r][c]];
  }

  swipeStart = null;
});