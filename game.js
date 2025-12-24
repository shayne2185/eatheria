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
      row.push(Math.floor(Math.random() * 4));
    }
    grid.push(row);
  }
}

// ===============================
// INPUT (SWIPE)
// ===============================
canvas.addEventListener("pointerdown", (e) => {
  if (GAME_STATE !== "playing") return;
  swipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", (e) => {
  if (!swipeStart || GAME_STATE !== "playing") return;

  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;

  if (Math.hypot(dx, dy) < 20) {
    swipeStart = null;
    return;
  }

  const startCol = Math.floor((swipeStart.x - offsetX) / SIZE);
  const startRow = Math.floor((swipeStart.y - offsetY) / SIZE);

  if (
    startCol < 0 || startCol >= COLS ||
    startRow < 0 || startRow >= ROWS
  ) {
    swipeStart = null;
    return;
  }

  let targetCol = startCol;
  let targetRow = startRow;

  if (Math.abs(dx) > Math.abs(dy)) {
    targetCol += dx > 0 ? 1 : -1;
  } else {
    targetRow += dy > 0 ? 1 : -1;
  }

  if (
    targetCol >= 0 && targetCol < COLS &&
    targetRow >= 0 && targetRow < ROWS
  ) {
    swap(startRow, startCol, targetRow, targetCol);
  }

  swipeStart = null;
});

// ===============================
// SWAP
// ===============================
function swap(r1, c1, r2, c2) {
  const temp = grid[r1][c1];
  grid[r1][c1] = grid[r2][c2];
  grid[r2][c2] = temp;
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
    "#34d399", // life
    "#38bdf8", // water
    "#fb923c", // fire
    "#64748b"  // stone
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