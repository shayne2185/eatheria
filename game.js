const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const beginBtn = document.getElementById("begin");

let GAME_STATE = "menu";

// ===============================
// BEGIN
// ===============================
beginBtn.onclick = () => {
  menu.style.display = "none";
  resize();
  initGame();
  GAME_STATE = "playing";
};

// ===============================
// GRID SETUP
// ===============================
const COLS = 6;
const ROWS = 8;
let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let swipeStart = null;
let animating = false;

// ===============================
// RESIZE
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

// ===============================
// INIT GAME
// ===============================
function initGame() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randType());
    }
    grid.push(row);
  }
  resolveMatches(); // vyčistí náhodné počiatočné match
}

function randType() {
  return Math.floor(Math.random() * 4);
}

// ===============================
// INPUT (SWIPE)
// ===============================
canvas.addEventListener("pointerdown", e => {
  if (GAME_STATE !== "playing" || animating) return;
  swipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!swipeStart || GAME_STATE !== "playing" || animating) return;

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

  if (validCell(r, c) && validCell(tr, tc)) {
    swap(r, c, tr, tc);
  }

  swipeStart = null;
});

// ===============================
// GAME LOGIC
// ===============================
function validCell(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) {
    resolveMatches();
  } else {
    // swap späť ak nebol match
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
  }
}

// ===============================
// MATCH
// ===============================
function findMatches() {
  const matches = [];

  // horizontálne
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (
        c < COLS &&
        grid[r][c] === grid[r][c - 1]
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

  // vertikálne
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (
        r < ROWS &&
        grid[r][c] === grid[r - 1][c]
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

// ===============================
// RESOLVE + FALL
// ===============================
function resolveMatches() {
  const matches = findMatches();
  if (!matches.length) {
    animating = false;
    return;
  }

  animating = true;

  matches.forEach(m => {
    grid[m.r][m.c] = null;
  });

  setTimeout(() => {
    collapse();
    setTimeout(resolveMatches, 120);
  }, 150);
}

function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }

    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.length ? stack.shift() : randType();
    }
  }
}

// ===============================
// RENDER
// ===============================
function drawBackground() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  const colors = [
    "#34d399",
    "#38bdf8",
    "#fb923c",
    "#64748b"
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = offsetX + c * SIZE + SIZE / 2;
      const y = offsetY + r * SIZE + SIZE / 2;

      ctx.beginPath();
      ctx.fillStyle = colors[grid[r][c]];
      ctx.arc(x, y, SIZE * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ===============================
// LOOP
// ===============================
function loop() {
  if (GAME_STATE === "playing") {
    drawBackground();
    drawGrid();
  }
  requestAnimationFrame(loop);
}
loop();