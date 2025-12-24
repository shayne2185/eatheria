const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const beginBtn = document.getElementById("begin");

let GAME_STATE = "menu"; // menu | playing

// ===============================
// BEGIN BUTTON (KONEČNE SPRÁVNE)
// ===============================
beginBtn.onclick = () => {
  menu.style.display = "none";
  resize();
  initGame();
  GAME_STATE = "playing";
};

// ===============================
// BASIC SETUP
// ===============================
const COLS = 6;
const ROWS = 8;
let SIZE = 0;
let offsetX = 0;
let offsetY = 0;
let grid = [];

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
// GAME INIT
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
// RENDER
// ===============================
function drawBackground() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  const colors = ["#34d399", "#38bdf8", "#fb923c", "#64748b"];

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
// MAIN LOOP (STATE AWARE)
// ===============================
function loop() {
  if (GAME_STATE === "playing") {
    drawBackground();
    drawGrid();
  }
  requestAnimationFrame(loop);
}

loop();