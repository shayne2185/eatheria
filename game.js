// ===============================
// EATHERIA ZEN – FINAL CORE
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 6;
const ROWS = 8;
let SIZE = 0;

const TYPES = [0, 1, 2, 3]; // life, water, fire, stone
let grid = [];
let animating = false;
let swipeStart = null;

let offsetX = 0;
let offsetY = 0;

// -------------------------------
// START
// -------------------------------
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  resize();
  initGrid();
  resolveMatches();
  requestAnimationFrame(loop);
};

window.addEventListener("resize", resize);

// -------------------------------
// RESIZE
// -------------------------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.min(
    canvas.width / COLS,
    canvas.height / ROWS
  );

  offsetX = (canvas.width - COLS * SIZE) / 2;
  offsetY = (canvas.height - ROWS * SIZE) / 2;
}

// -------------------------------
// GRID
// -------------------------------
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randomType());
    }
    grid.push(row);
  }
}

function randomType() {
  return TYPES[Math.random() * TYPES.length | 0];
}

// -------------------------------
// LOOP
// -------------------------------
function loop() {
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// -------------------------------
// MATCH
// -------------------------------
function resolveMatches() {
  const matches = findMatches();
  if (matches.length === 0) {
    animating = false;
    return;
  }

  animating = true;
  matches.forEach(({ r, c }) => grid[r][c] = null);

  setTimeout(() => {
    collapseGrid();
    setTimeout(resolveMatches, 150);
  }, 180);
}

function findMatches() {
  let out = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && grid[r][c] !== null && grid[r][c] === grid[r][c - 1]) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            out.push({ r, c: c - 1 - i });
          }
        }
        run = 1;
      }
    }
  }

  // vertical
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (r < ROWS && grid[r][c] !== null && grid[r][c] === grid[r - 1][c]) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            out.push({ r: r - 1 - i, c });
          }
        }
        run = 1;
      }
    }
  }

  return out;
}

// -------------------------------
// FALL
// -------------------------------
function collapseGrid() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.length ? stack.shift() : randomType();
    }
  }
}

// -------------------------------
// INPUT
// -------------------------------
canvas.addEventListener("pointerdown", e => {
  if (animating) return;
  swipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!swipeStart || animating) return;

  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;

  if (Math.hypot(dx, dy) < 20) {
    swipeStart = null;
    return;
  }

  const c = Math.floor((swipeStart.x - offsetX) / SIZE);
  const r = Math.floor((swipeStart.y - offsetY) / SIZE);

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) {
    tc += dx > 0 ? 1 : -1;
  } else {
    tr += dy > 0 ? 1 : -1;
  }

  if (grid[r]?.[c] !== undefined && grid[tr]?.[tc] !== undefined) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  const matches = findMatches();
  if (matches.length) {
    resolveMatches();
  } else {
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  }
}

// -------------------------------
// RENDER
// -------------------------------
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#020617");
  g.addColorStop(1, "#0f172a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const type = grid[r][c];
      if (type === null) continue;

      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2;

      drawOrb(type, x, y, SIZE * 0.42);
      drawIcon(type, x, y, SIZE * 0.25);
    }
  }
}

function drawOrb(type, x, y, r) {
  const colors = [
    ["#22c55e", "#86efac"], // life
    ["#38bdf8", "#7dd3fc"], // water
    ["#f97316", "#fdba74"], // fire
    ["#94a3b8", "#e5e7eb"]  // stone
  ];

  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, colors[type][1]);
  g.addColorStop(1, colors[type][0]);

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawIcon(type, x, y, s) {
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = s * 0.15;
  ctx.beginPath();

  if (type === 0) ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
  if (type === 1) ctx.moveTo(x - s, y), ctx.quadraticCurveTo(x, y - s, x + s, y);
  if (type === 2) ctx.moveTo(x, y - s), ctx.lineTo(x + s, y + s), ctx.lineTo(x - s, y + s), ctx.closePath();
  if (type === 3) ctx.rect(x - s * 0.5, y - s * 0.5, s, s);

  ctx.stroke();
}