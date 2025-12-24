// ===============================
// EATHERIA ZEN – STABLE CORE
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 6;
const ROWS = 8;
let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

const ELEMENTS = [
  { color: "#22c55e" }, // life
  { color: "#64748b" }, // stone
  { color: "#38bdf8" }, // water
  { color: "#f97316" }, // fire
  { color: "#a855f7" }  // ether
];

let grid = [];
let dragging = null;
let locked = false;

// ---------------- START ----------------
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  resize();
  initGrid();
  requestAnimationFrame(loop);
};

// ---------------- RESIZE ----------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SIZE = Math.floor(Math.min(
    canvas.width / COLS,
    canvas.height / (ROWS + 1)
  ));

  offsetX = (canvas.width - COLS * SIZE) / 2;
  offsetY = (canvas.height - ROWS * SIZE) / 2;
}
window.addEventListener("resize", resize);

// ---------------- GRID ----------------
function randomGem() {
  return {
    type: Math.floor(Math.random() * ELEMENTS.length),
    yOffset: 0,
    removing: false,
    alpha: 1
  };
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) row.push(randomGem());
    grid.push(row);
  }
  resolve();
}

// ---------------- LOOP ----------------
function loop() {
  drawBackground();
  update();
  drawGrid();
  requestAnimationFrame(loop);
}

// ---------------- UPDATE ----------------
function update() {
  let falling = false;

  for (let c = 0; c < COLS; c++) {
    for (let r = ROWS - 1; r >= 0; r--) {
      const g = grid[r][c];
      if (!g) continue;

      if (g.removing) {
        g.alpha -= 0.08;
        if (g.alpha <= 0) {
          grid[r][c] = null;
          falling = true;
        }
      }
    }
  }

  if (falling) collapse();
}

// ---------------- MATCH ----------------
function resolve() {
  const matches = findMatches();
  if (!matches.length) return;

  locked = true;
  matches.forEach(({ r, c }) => grid[r][c].removing = true);

  setTimeout(() => {
    locked = false;
    resolve();
  }, 250);
}

function findMatches() {
  let out = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && grid[r][c] && grid[r][c - 1] &&
          grid[r][c].type === grid[r][c - 1].type) {
        run++;
      } else {
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
      if (r < ROWS && grid[r][c] && grid[r - 1][c] &&
          grid[r][c].type === grid[r - 1][c].type) {
        run++;
      } else {
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

// ---------------- COLLAPSE ----------------
function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) stack.push(grid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.shift() || randomGem();
    }
  }
  resolve();
}

// ---------------- INPUT ----------------
canvas.addEventListener("pointerdown", e => {
  if (locked) return;
  dragging = {
    x: e.clientX,
    y: e.clientY,
    r: Math.floor((e.clientY - offsetY) / SIZE),
    c: Math.floor((e.clientX - offsetX) / SIZE)
  };
});

canvas.addEventListener("pointerup", e => {
  if (!dragging || locked) return;

  const dx = e.clientX - dragging.x;
  const dy = e.clientY - dragging.y;

  if (Math.hypot(dx, dy) < 20) return;

  let tr = dragging.r;
  let tc = dragging.c;

  if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
  else tr += dy > 0 ? 1 : -1;

  if (grid[tr] && grid[tr][tc]) {
    [grid[dragging.r][dragging.c], grid[tr][tc]] =
      [grid[tr][tc], grid[dragging.r][dragging.c]];

    if (!findMatches().length) {
      [grid[dragging.r][dragging.c], grid[tr][tc]] =
        [grid[tr][tc], grid[dragging.r][dragging.c]];
    } else resolve();
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
      const g = grid[r][c];
      if (!g) continue;

      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2;
      const radius = SIZE * 0.38;

      // glow
      const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.4);
      glow.addColorStop(0, ELEMENTS[g.type].color);
      glow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.globalAlpha = g.alpha;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // core orb
      ctx.fillStyle = ELEMENTS[g.type].color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }
  }
}