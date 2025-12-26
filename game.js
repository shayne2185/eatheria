// ===============================
// EATHERIA ZEN – FINAL STABLE BUILD
// 5x5 GRID • SHARP ICONS • AUTO MATCH
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- pixel perfect ---
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// --- GRID SIZE ---
const COLS = 5;
const ROWS = 5;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let running = false;
let animating = false;
let swipeStart = null;

// ===============================
// ICONS (CORRECT PATHS)
// ===============================
const ICON_PATHS = [
  "assets-icons/life.png",
  "assets-icons/stone.png",
  "assets-icons/fire.png",
  "assets-icons/water.png",
  "assets-icons/air.png"
];

const ICONS = ICON_PATHS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const GLOWS = [
  "#22c55e", // life
  "#94a3b8", // stone
  "#f97316", // fire
  "#38bdf8", // water
  "#e5e7eb"  // air
];

// ===============================
// START
// ===============================
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  running = true;
  resize();
  initGrid();
  resolveBoard(); // odstráni úvodné match-e
  requestAnimationFrame(loop);
};

// ===============================
// RESIZE
// ===============================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.floor(
    Math.min(
      canvas.width / COLS,
      canvas.height / (ROWS + 1)
    )
  );

  offsetX = Math.floor((canvas.width - SIZE * COLS) / 2);
  offsetY = Math.floor((canvas.height - SIZE * ROWS) / 2);
}
window.addEventListener("resize", resize);

// ===============================
// GRID
// ===============================
function randomType() {
  return Math.floor(Math.random() * ICONS.length);
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randomType());
    }
    grid.push(row);
  }
}

// ===============================
// LOOP
// ===============================
function loop() {
  if (!running) return;
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// ===============================
// DRAW
// ===============================
function drawBackground() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (t === null) continue;

      const x = offsetX + c * SIZE;
      const y = offsetY + r * SIZE;

      // tile
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(x + 8, y + 8, SIZE - 16, SIZE - 16);

      // glow
      ctx.shadowColor = GLOWS[t];
      ctx.shadowBlur = 16;

      const iconSize = Math.floor(SIZE * 0.78);
      const ix = Math.floor(x + (SIZE - iconSize) / 2);
      const iy = Math.floor(y + (SIZE - iconSize) / 2);

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
      ctx.shadowBlur = 0;
    }
  }
}

// ===============================
// INPUT (SWIPE)
// ===============================
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

  if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
  else tr += dy > 0 ? 1 : -1;

  if (grid[r]?.[c] !== undefined && grid[tr]?.[tc] !== undefined) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

// ===============================
// MATCH LOGIC
// ===============================
function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) removeMatches(matches);
  else {
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
  }
}

function findMatches() {
  const res = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && grid[r][c] === grid[r][c - 1]) run++;
      else {
        if (run >= 3)
          for (let i = 0; i < run; i++)
            res.push({ r, c: c - 1 - i });
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
        if (run >= 3)
          for (let i = 0; i < run; i++)
            res.push({ r: r - 1 - i, c });
        run = 1;
      }
    }
  }

  return res;
}

function removeMatches(matches) {
  animating = true;
  matches.forEach(m => grid[m.r][m.c] = null);

  setTimeout(() => {
    collapse();
    animating = false;
    resolveBoard();
  }, 180);
}

function collapse() {
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

// --- auto resolve ---
function resolveBoard() {
  const matches = findMatches();
  if (matches.length) removeMatches(matches);
}