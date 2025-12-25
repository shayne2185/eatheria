// ===============================
// EATHERIA ZEN – FINAL STABLE BUILD
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 6;
const ROWS = 8;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let running = false;
let animating = false;
let swipeStart = null;

// ===============================
// ICONS
// ===============================
const ICONS = {
  0: new Image(),
  1: new Image(),
  2: new Image(),
  3: new Image(),
  4: new Image()
};

ICONS[0].src = "assets/icons/life.png";
ICONS[1].src = "assets/icons/stone.png";
ICONS[2].src = "assets/icons/fire.png";
ICONS[3].src = "assets/icons/water.png";
ICONS[4].src = "assets/icons/air.png";

const GLOWS = [
  "#22c55e",
  "#94a3b8",
  "#f97316",
  "#38bdf8",
  "#e5e7eb"
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
  resolveMatches(); // ★ FIX: odstráni matchy hneď na začiatku
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
  return Math.floor(Math.random() * 5);
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

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(x + 6, y + 6, SIZE - 12, SIZE - 12);

      ctx.shadowColor = GLOWS[t];
      ctx.shadowBlur = 14;

      const img = ICONS[t];
      const iconSize = Math.floor(SIZE * 0.85);
      const ix = Math.floor(x + (SIZE - iconSize) / 2);
      const iy = Math.floor(y + (SIZE - iconSize) / 2);

      ctx.drawImage(img, ix, iy, iconSize, iconSize);
      ctx.shadowBlur = 0;
    }
  }
}

// ===============================
// INPUT
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

  if (Math.abs(dx) > Math.abs(dy)) {
    tc += dx > 0 ? 1 : -1;
  } else {
    tr += dy > 0 ? 1 : -1;
  }

  if (grid[r] && grid[tr] && grid[r][c] !== undefined && grid[tr][tc] !== undefined) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

// ===============================
// MATCH SYSTEM (FINAL)
// ===============================
function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) {
    resolveMatches();
  } else {
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
  }
}

function resolveMatches() {
  const matches = findMatches();
  if (!matches.length) return;

  animating = true;
  matches.forEach(m => grid[m.r][m.c] = null);

  setTimeout(() => {
    collapse();
    animating = false;
    resolveMatches(); // ★ FIX: rekurzívne, kým nič nezostane
  }, 160);
}

function findMatches() {
  const res = [];

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