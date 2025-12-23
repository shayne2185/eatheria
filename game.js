// ===============================
// EATHERIA ZEN – MATCH & FALL
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

let running = false;
let busy = false;

// GRID
const COLS = 6;
const ROWS = 8;
let SIZE, offsetX, offsetY;

const COLORS = [
  "#22c55e", // life
  "#64748b", // stone
  "#f97316", // fire
  "#38bdf8", // water
  "#e5e7eb"  // air
];

let grid = [];
let swipeStart = null;

// -------------------------------
// START
// -------------------------------
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  startGame();
};

function startGame() {
  resize();
  initGrid();
  running = true;
  requestAnimationFrame(loop);
}

// -------------------------------
// RESIZE
// -------------------------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.floor(
    Math.min(canvas.width / COLS, canvas.height / (ROWS + 1))
  );

  offsetX = (canvas.width - SIZE * COLS) / 2;
  offsetY = (canvas.height - SIZE * ROWS) / 2;
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
      row.push({
        type: rand(),
        alpha: 1,
        falling: 0
      });
    }
    grid.push(row);
  }
}

function rand() {
  return Math.floor(Math.random() * COLORS.length);
}

// -------------------------------
// LOOP
// -------------------------------
function loop() {
  if (!running) return;
  drawBackground();
  update();
  drawGrid();
  requestAnimationFrame(loop);
}

// -------------------------------
// UPDATE
// -------------------------------
function update() {
  let animating = false;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const g = grid[r][c];
      if (!g) continue;

      if (g.alpha < 1) {
        g.alpha -= 0.08;
        if (g.alpha <= 0) grid[r][c] = null;
        animating = true;
      }

      if (g.falling < 0) {
        g.falling += 8;
        if (g.falling > 0) g.falling = 0;
        animating = true;
      }
    }
  }

  if (!animating && busy) {
    busy = false;
    resolveMatches();
  }
}

// -------------------------------
// MATCH
// -------------------------------
function resolveMatches() {
  const matches = findMatches();
  if (!matches.length) return;

  busy = true;

  matches.forEach(({ r, c }) => {
    if (grid[r][c]) grid[r][c].alpha = 0.9;
  });

  setTimeout(() => {
    collapse();
  }, 180);
}

function findMatches() {
  const res = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (
        c < COLS &&
        grid[r][c] &&
        grid[r][c - 1] &&
        grid[r][c].type === grid[r][c - 1].type
      ) run++;
      else {
        if (run >= 3) {
          for (let i = 0; i < run; i++)
            res.push({ r, c: c - 1 - i });
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
        grid[r][c] &&
        grid[r - 1][c] &&
        grid[r][c].type === grid[r - 1][c].type
      ) run++;
      else {
        if (run >= 3) {
          for (let i = 0; i < run; i++)
            res.push({ r: r - 1 - i, c });
        }
        run = 1;
      }
    }
  }

  return res;
}

// -------------------------------
// COLLAPSE
// -------------------------------
function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) stack.push(grid[r][c]);
    }

    for (let r = ROWS - 1; r >= 0; r--) {
      if (stack.length) {
        const g = stack.shift();
        g.falling = (r - (ROWS - stack.length - 1)) * -SIZE;
        grid[r][c] = g;
      } else {
        grid[r][c] = {
          type: rand(),
          alpha: 1,
          falling: -SIZE * 1.5
        };
      }
    }
  }

  setTimeout(resolveMatches, 200);
}

// -------------------------------
// INPUT
// -------------------------------
canvas.addEventListener("pointerdown", e => {
  if (busy) return;
  swipeStart = cellFrom(e.clientX, e.clientY);
});

canvas.addEventListener("pointerup", e => {
  if (!swipeStart || busy) return;
  const end = cellFrom(e.clientX, e.clientY);
  swipeStart = null;
  if (!end) return;

  const dr = end.r - swipeStart.r;
  const dc = end.c - swipeStart.c;
  if (Math.abs(dr) + Math.abs(dc) !== 1) return;

  swap(swipeStart, end);
});

function swap(a, b) {
  [grid[a.r][a.c], grid[b.r][b.c]] =
    [grid[b.r][b.c], grid[a.r][a.c]];

  if (findMatches().length) resolveMatches();
  else {
    [grid[a.r][a.c], grid[b.r][b.c]] =
      [grid[b.r][b.c], grid[a.r][a.c]];
  }
}

function cellFrom(x, y) {
  const cx = x - offsetX;
  const cy = y - offsetY;
  if (cx < 0 || cy < 0) return null;
  const c = Math.floor(cx / SIZE);
  const r = Math.floor(cy / SIZE);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return { r, c };
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
      const g = grid[r][c];
      if (!g) continue;

      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2 + g.falling;

      ctx.globalAlpha = g.alpha;

      const glow = ctx.createRadialGradient(
        x, y, SIZE * 0.2,
        x, y, SIZE * 1.4
      );
      glow.addColorStop(0, COLORS[g.type]);
      glow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, SIZE * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS[g.type];
      ctx.beginPath();
      ctx.arc(x, y, SIZE * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }
  }
}