// ===============================
// EATHERIA ZEN – MATCH & FLOW CORE
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 6;
const ROWS = 8;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let dragging = null;
let animating = false;

// ===============================
// ELEMENTS (ZEN PALETTE)
// ===============================

const ELEMENTS = [
  { core: "#34d399", glow: "rgba(52,211,153,0.25)" }, // life
  { core: "#38bdf8", glow: "rgba(56,189,248,0.25)" }, // flow
  { core: "#fb923c", glow: "rgba(251,146,60,0.22)" }, // ember
  { core: "#64748b", glow: "rgba(148,163,184,0.18)" } // stone
];

// ===============================
// INIT
// ===============================

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.min(
    canvas.width / COLS,
    canvas.height / (ROWS + 1)
  );

  offsetX = (canvas.width - SIZE * COLS) / 2;
  offsetY = (canvas.height - SIZE * ROWS) / 2;
}

window.addEventListener("resize", resize);
resize();

function randomOrb() {
  return {
    type: Math.floor(Math.random() * ELEMENTS.length),
    yOffset: 0
  };
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randomOrb());
    }
    grid.push(row);
  }
  resolveMatches();
}

// ===============================
// INPUT (SWIPE)
// ===============================

canvas.addEventListener("pointerdown", e => {
  dragging = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!dragging || animating) return;

  const dx = e.clientX - dragging.x;
  const dy = e.clientY - dragging.y;

  if (Math.hypot(dx, dy) < 24) return;

  const c = Math.floor((dragging.x - offsetX) / SIZE);
  const r = Math.floor((dragging.y - offsetY) / SIZE);

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

  dragging = null;
});

// ===============================
// MATCH LOGIC
// ===============================

function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  if (findMatches().length) {
    resolveMatches();
  } else {
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
  }
}

function findMatches() {
  let matches = [];

  // horizontal
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
            matches.push({ r, c: c - 1 - i });
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
        grid[r][c] &&
        grid[r - 1][c] &&
        grid[r][c].type === grid[r - 1][c].type
      ) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            matches.push({ r: r - 1 - i, c });
          }
        }
        run = 1;
      }
    }
  }

  return matches;
}

function resolveMatches() {
  const matches = findMatches();
  if (!matches.length) return;

  animating = true;

  matches.forEach(m => grid[m.r][m.c] = null);

  setTimeout(() => {
    collapse();
    setTimeout(() => {
      animating = false;
      resolveMatches();
    }, 200);
  }, 180);
}

function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) stack.push(grid[r][c]);
    }

    for (let r = ROWS - 1; r >= 0; r--) {
      if (stack.length) {
        grid[r][c] = stack.shift();
      } else {
        grid[r][c] = randomOrb();
      }
    }
  }
}

// ===============================
// RENDER
// ===============================

function drawBackground() {
  const g = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 3,
    50,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width
  );
  g.addColorStop(0, "#020617");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawOrb(x, y, orb) {
  const r = SIZE * 0.34;
  const el = ELEMENTS[orb.type];

  // glow
  ctx.beginPath();
  ctx.fillStyle = el.glow;
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // body
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  grad.addColorStop(0, el.core);
  grad.addColorStop(1, "#020617");

  ctx.beginPath();
  ctx.fillStyle = grad;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // inner breath
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const orb = grid[r][c];
      if (!orb) continue;

      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2;

      drawOrb(x, y, orb);
    }
  }
}

function loop() {
  drawBackground();
  drawGrid();
  requestAnimationFrame(loop);
}

// ===============================
// START
// ===============================

initGrid();
loop();