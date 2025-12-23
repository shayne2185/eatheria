// ===============================
// EATHERIA ZEN – STABLE CORE
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const beginBtn = document.getElementById("begin");
const menu = document.getElementById("menu");

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
let dragging = null;
let animating = false;
let started = false;

// ---------------- INIT ----------------
beginBtn.addEventListener("click", () => {
  if (started) return;
  started = true;

  menu.style.display = "none";
  canvas.style.display = "block";

  resize();
  initGrid();
  requestAnimationFrame(loop);
});

window.addEventListener("resize", resize);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.floor(
    Math.min(canvas.width / COLS, canvas.height / ROWS)
  );

  offsetX = (canvas.width - SIZE * COLS) / 2;
  offsetY = (canvas.height - SIZE * ROWS) / 2;
}

// ---------------- GRID ----------------
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randType());
    }
    grid.push(row);
  }
}

function randType() {
  return Math.floor(Math.random() * COLORS.length);
}

// ---------------- LOOP ----------------
function loop() {
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// ---------------- MATCH ----------------
function findMatches() {
  let out = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && grid[r][c] === grid[r][c - 1]) run++;
      else {
        if (run >= 3) {
          for (let i = 0; i < run; i++)
            out.push({ r, c: c - 1 - i });
        }
        run = 1;
      }
    }
  }

  // vertical
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (r < ROWS && grid[r][c] === grid[r - 1][c]) run++;
      else {
        if (run >= 3) {
          for (let i = 0; i < run; i++)
            out.push({ r: r - 1 - i, c });
        }
        run = 1;
      }
    }
  }

  return out;
}

function resolveMatches() {
  let matches = findMatches();
  if (!matches.length) return;

  matches.forEach(m => grid[m.r][m.c] = null);
  setTimeout(() => {
    collapse();
    setTimeout(resolveMatches, 120);
  }, 120);
}

function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--)
      if (grid[r][c] !== null) stack.push(grid[r][c]);

    for (let r = ROWS - 1; r >= 0; r--)
      grid[r][c] = stack.length ? stack.shift() : randType();
  }
}

// ---------------- INPUT ----------------
canvas.addEventListener("pointerdown", e => {
  dragging = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!dragging) return;

  const dx = e.clientX - dragging.x;
  const dy = e.clientY - dragging.y;
  if (Math.hypot(dx, dy) < 20) return;

  const c = Math.floor((dragging.x - offsetX) / SIZE);
  const r = Math.floor((dragging.y - offsetY) / SIZE);

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
  else tr += dy > 0 ? 1 : -1;

  if (grid[r] && grid[tr] && grid[r][c] !== undefined && grid[tr][tc] !== undefined) {
    [grid[r][c], grid[tr][tc]] = [grid[tr][tc], grid[r][c]];
    if (!findMatches().length)
      [grid[r][c], grid[tr][tc]] = [grid[tr][tc], grid[r][c]];
    else resolveMatches();
  }

  dragging = null;
});

// ---------------- RENDER ----------------
function drawBackground() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2;

      ctx.fillStyle = COLORS[t];
      ctx.beginPath();
      ctx.arc(x, y, SIZE * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}