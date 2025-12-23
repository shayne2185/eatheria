// ===============================
// EATHERIA ZEN – MATCH & FALL
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 6;
const ROWS = 8;
let SIZE = 0;

const TYPES = [0, 1, 2, 3, 4];
const COLORS = [
  "#22c55e", // life
  "#64748b", // stone
  "#f97316", // fire
  "#38bdf8", // water
  "#e5e7eb"  // air
];

let grid = [];
let animating = false;
let swipeStart = null;

// -------------------------------
// INIT
// -------------------------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  SIZE = Math.min(canvas.width / COLS, canvas.height / ROWS);
}
window.addEventListener("resize", resize);

resize();
initGrid();
requestAnimationFrame(loop);

// -------------------------------
// GRID
// -------------------------------
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        type: randomType(),
        scale: 1,
        alpha: 1
      });
    }
    grid.push(row);
  }
  resolveMatches();
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
// MATCH LOGIC
// -------------------------------
function resolveMatches() {
  const matches = findMatches();
  if (matches.length === 0) {
    animating = false;
    return;
  }

  animating = true;

  matches.forEach(cell => {
    const orb = grid[cell.r][cell.c];
    if (orb) orb.removing = true;
  });

  setTimeout(() => {
    removeMatches();
    collapseGrid();
    setTimeout(resolveMatches, 120);
  }, 180);
}

function findMatches() {
  let result = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (
        c < COLS &&
        grid[r][c] &&
        grid[r][c - 1] &&
        grid[r][c].type === grid[r][c - 1].type
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

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (
        r < ROWS &&
        grid[r][c] &&
        grid[r - 1][c] &&
        grid[r][c].type === grid[r - 1][c].type
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

function removeMatches() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const orb = grid[r][c];
      if (orb && orb.removing) {
        grid[r][c] = null;
      }
    }
  }
}

// -------------------------------
// FALL & REFILL
// -------------------------------
function collapseGrid() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) stack.push(grid[r][c]);
    }

    for (let r = ROWS - 1; r >= 0; r--) {
      if (stack.length) {
        grid[r][c] = stack.shift();
      } else {
        grid[r][c] = {
          type: randomType(),
          scale: 1,
          alpha: 1
        };
      }
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

  const c = Math.floor(swipeStart.x / SIZE);
  const r = Math.floor(swipeStart.y / SIZE);

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) {
    tc += dx > 0 ? 1 : -1;
  } else {
    tr += dy > 0 ? 1 : -1;
  }

  if (grid[r] && grid[tr] && grid[r][c] && grid[tr][tc]) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

function swap(r1, c1, r2, c2) {
  animating = true;

  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) {
    resolveMatches();
  } else {
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
    animating = false;
  }
}

// -------------------------------
// RENDER
// -------------------------------
function drawBackground() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const orb = grid[r][c];
      if (!orb) continue;

      const x = c * SIZE + SIZE / 2;
      const y = r * SIZE + SIZE / 2;

      ctx.globalAlpha = orb.alpha;
      ctx.fillStyle = COLORS[orb.type];
      ctx.beginPath();
      ctx.arc(x, y, SIZE * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}