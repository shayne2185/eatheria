const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");

const COLS = 6;
const ROWS = 8;
let SIZE, offX, offY;

let grid = [];
let swipe = null;
let animating = false;

// ================== INIT ==================
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  resize();
  initGrid();
  requestAnimationFrame(loop);
};

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  SIZE = Math.min(
    canvas.width / COLS,
    canvas.height / (ROWS + 1)
  );

  offX = (canvas.width - COLS * SIZE) / 2;
  offY = (canvas.height - ROWS * SIZE) / 2;
}
window.addEventListener("resize", resize);

// ================== GRID ==================
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = rand();
    }
  }
}

function rand() {
  return Math.floor(Math.random() * 5);
}

// ================== LOOP ==================
function loop() {
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// ================== INPUT ==================
canvas.addEventListener("pointerdown", e => {
  swipe = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!swipe || animating) return;

  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  if (Math.hypot(dx, dy) < 20) return;

  const c = Math.floor((swipe.x - offX) / SIZE);
  const r = Math.floor((swipe.y - offY) / SIZE);

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
  else tr += dy > 0 ? 1 : -1;

  if (grid[r] && grid[tr] && grid[r][c] != null && grid[tr][tc] != null) {
    swap(r, c, tr, tc);
  }

  swipe = null;
});

function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  const m = findMatches();
  if (m.length) resolve();
  else [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
}

// ================== MATCH ==================
function findMatches() {
  let out = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const t = grid[r][c];
      if (t != null && t === grid[r][c + 1] && t === grid[r][c + 2])
        out.push([r, c], [r, c + 1], [r, c + 2]);
    }
  }

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      const t = grid[r][c];
      if (t != null && t === grid[r + 1][c] && t === grid[r + 2][c])
        out.push([r, c], [r + 1, c], [r + 2, c]);
    }
  }

  return out;
}

function resolve() {
  animating = true;
  const m = findMatches();
  m.forEach(([r, c]) => grid[r][c] = null);

  setTimeout(() => {
    fall();
    animating = false;
  }, 200);
}

function fall() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] != null) stack.push(grid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.length ? stack.shift() : rand();
    }
  }
}

// ================== RENDER ==================
function drawBackground() {
  const g = ctx.createRadialGradient(
    canvas.width / 2, 0, 50,
    canvas.width / 2, canvas.height, canvas.height
  );
  g.addColorStop(0, "#0f172a");
  g.addColorStop(1, "#020617");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  const palette = [
    ["#22c55e", "#14532d"],
    ["#64748b", "#1e293b"],
    ["#f97316", "#7c2d12"],
    ["#38bdf8", "#0c4a6e"],
    ["#e5e7eb", "#334155"]
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (t == null) continue;

      const x = offX + c * SIZE + SIZE / 2;
      const y = offY + r * SIZE + SIZE / 2;
      const rad = SIZE * 0.36;

      // glow
      const glow = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad * 1.5);
      glow.addColorStop(0, palette[t][0] + "88");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, rad * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // core
      const g = ctx.createLinearGradient(x - rad, y - rad, x + rad, y + rad);
      g.addColorStop(0, palette[t][0]);
      g.addColorStop(1, palette[t][1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}