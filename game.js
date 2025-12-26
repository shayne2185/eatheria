// ===============================
// EATHERIA ZEN – CLEAN STABLE CORE
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// GRID SIZE (STABLE)
const COLS = 6;
const ROWS = 7;

// RUNTIME
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
const ICONS = [];
const ICON_COUNT = 5;

for (let i = 0; i < ICON_COUNT; i++) {
  const img = new Image();
  img.src = `assets/icons/${i}.png`; // 0.png – 4.png
  ICONS.push(img);
}

// ===============================
// START
// ===============================
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  running = true;
  resize();
  initGrid();
  requestAnimationFrame(loop);
};

// ===============================
// RETINA RESIZE (CRITICAL FIX)
// ===============================
function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  // BIGGER PLAY AREA
  SIZE = Math.floor(
    Math.min(
      window.innerWidth / COLS,
      window.innerHeight / ROWS
    )
  );

  offsetX = Math.floor((window.innerWidth - SIZE * COLS) / 2);
  offsetY = Math.floor((window.innerHeight - SIZE * ROWS) / 2);
}

window.addEventListener("resize", resize);

// ===============================
// GRID
// ===============================
function randomType() {
  return Math.floor(Math.random() * ICON_COUNT);
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
  ctx.fillStyle = "#05060b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (t === null) continue;

      const x = offsetX + c * SIZE;
      const y = offsetY + r * SIZE;

      // tile base
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(x, y, SIZE, SIZE);

      // ICON (BIG + SHARP)
      const img = ICONS[t];
      const iconSize = Math.floor(SIZE * 0.9);
      const ix = Math.floor(x + (SIZE - iconSize) / 2);
      const iy = Math.floor(y + (SIZE - iconSize) / 2);

      ctx.drawImage(img, ix, iy, iconSize, iconSize);
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

  if (Math.abs(dx) > Math.abs(dy)) {
    tc += dx > 0 ? 1 : -1;
  } else {
    tr += dy > 0 ? 1 : -1;
  }

  if (
    grid[r] &&
    grid[tr] &&
    grid[r][c] !== undefined &&
    grid[tr][tc] !== undefined
  ) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

// ===============================
// MATCH & FALL
// ===============================
function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) {
    removeMatches(matches);
  } else {
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
  }, 140);
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