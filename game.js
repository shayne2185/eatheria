// ===============================
// EATHERIA ZEN – CORE GAMEPLAY
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 6;
const ROWS = 8;
let SIZE;

const TYPES = [0, 1, 2, 3, 4]; // elements
let grid = [];
let animating = false;
let swipeStart = null;

// -------------------------------
// INIT
// -------------------------------
startBtn.onclick = startGame;

function startGame() {
  menu.style.display = "none";
  canvas.style.display = "block";
  resize();let gridOffsetX = 0;
let gridOffsetY = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.min(
    canvas.width / COLS,
    canvas.height / ROWS
  );

  const gridW = SIZE * COLS;
  const gridH = SIZE * ROWS;

  gridOffsetX = (canvas.width - gridW) / 2;
  gridOffsetY = (canvas.height - gridH) / 2;
}
  initGrid();
  resolveMatches();
  requestAnimationFrame(loop);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  SIZE = Math.min(canvas.width / COLS, canvas.height / (ROWS + 1));
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
      row.push(randomType());
    }
    grid.push(row);
  }
}

function randomType() {
  return TYPES[Math.random() * TYPES.length | 0];
}

// -------------------------------
// MAIN LOOP
// -------------------------------
function loop() {
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// -------------------------------
// MATCH LOGIC
// -------------------------------
function resolveMatches() {
  let matches = findMatches();
  if (matches.length === 0) {
    animating = false;
    return;
  }

  animating = true;

  // remove matched
  matches.forEach(cell => {
    grid[cell.r][cell.c] = null;
  });

  setTimeout(() => {
    collapseGrid();
    setTimeout(resolveMatches, 150);
  }, 180);
}

function findMatches() {
  let result = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (
        c < COLS &&
        grid[r][c] !== null &&
        grid[r][c] === grid[r][c - 1]
      ) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            result.push({ r, c: c - 1 - i });
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
      if (
        r < ROWS &&
        grid[r][c] !== null &&
        grid[r][c] === grid[r - 1][c]
      ) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            result.push({ r: r - 1 - i, c });
          }
        }
        run = 1;
      }
    }
  }

  return result;
}

// -------------------------------
// COLLAPSE + REFILL
// -------------------------------
function collapseGrid() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }

    for (let r = ROWS - 1; r >= 0; r--) {
      if (stack.length) {
        grid[r][c] = stack.shift();
      } else {
        grid[r][c] = randomType();
      }
    }
  }
}

// -------------------------------
// INPUT (SWIPE)
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

  const c = Math.floor(swipeStart.x / SIZE);
  const r = Math.floor((canvas.height - swipeStart.y) / SIZE);

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) {
    tc += dx > 0 ? 1 : -1;
  } else {
    tr += dy > 0 ? -1 : 1;
  }

  if (
    grid[r] && grid[tr] &&
    grid[r][c] !== undefined &&
    grid[tr][tc] !== undefined
  ) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  let matches = findMatches();
  if (matches.length) {
    resolveMatches();
  } else {
    // swap back if no match
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
  }
}

// -------------------------------
// RENDER (PLACEHOLDER)
// -------------------------------
function drawBackground() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) continue;
const x = gridOffsetX + c * SIZE + SIZE / 2;
const y = gridOffsetY + r * SIZE + SIZE / 2;
      const colors = [
  "#22c55e", // life
  "#64748b", // stone
  "#f97316", // fire
  "#38bdf8", // water
  "#e5e7eb"  // air
];
ctx.fillStyle = colors[grid[r][c]];
      ctx.beginPath();
      ctx.arc(x, y, SIZE * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}