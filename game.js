const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 5;
const ROWS = 5;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let animating = false;

/* ================= ICONS ================= */

const ICON_PATHS = [
  "assets/icons/life.png",
  "assets/icons/stone.png",
  "assets/icons/fire.png",
  "assets/icons/water.png",
  "assets/icons/air.png"
];

const ICONS = [];
let loadedIcons = 0;

/* ================= LOAD ICONS ================= */

function loadIcons(callback) {
  ICON_PATHS.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      loadedIcons++;
      if (loadedIcons === ICON_PATHS.length) callback();
    };
    img.src = src;
    ICONS[i] = img;
  });
}

/* ================= RESIZE (RETINA FIX) ================= */

function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";

  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  SIZE = Math.floor(
    Math.min(innerWidth / COLS, innerHeight / (ROWS + 1))
  );

  offsetX = Math.floor((innerWidth - SIZE * COLS) / 2);
  offsetY = Math.floor((innerHeight - SIZE * ROWS) / 2);
}

window.addEventListener("resize", resize);

/* ================= GRID ================= */

function randomType() {
  return Math.floor(Math.random() * ICONS.length);
}

function initGrid() {
  grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = randomType();
    }
  }
  resolveBoard();
}

/* ================= DRAW ================= */

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pad = Math.floor(SIZE * 0.08);
  const iconSize = SIZE - pad * 2;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = grid[y][x];
      if (t === null) continue;

      const px = offsetX + x * SIZE + pad;
      const py = offsetY + y * SIZE + pad;

      ctx.drawImage(ICONS[t], px, py, iconSize, iconSize);
    }
  }
}

/* ================= MATCH ================= */

function findMatches() {
  const res = [];

  // horizontal
  for (let y = 0; y < ROWS; y++) {
    let run = 1;
    for (let x = 1; x <= COLS; x++) {
      if (x < COLS && grid[y][x] === grid[y][x - 1]) run++;
      else {
        if (run >= 3)
          for (let i = 0; i < run; i++)
            res.push({ x: x - 1 - i, y });
        run = 1;
      }
    }
  }

  // vertical
  for (let x = 0; x < COLS; x++) {
    let run = 1;
    for (let y = 1; y <= ROWS; y++) {
      if (y < ROWS && grid[y][x] === grid[y - 1][x]) run++;
      else {
        if (run >= 3)
          for (let i = 0; i < run; i++)
            res.push({ x, y: y - 1 - i });
        run = 1;
      }
    }
  }

  return res;
}

function removeMatches(matches) {
  matches.forEach(m => grid[m.y][m.x] = null);
  collapse();
}

function collapse() {
  for (let x = 0; x < COLS; x++) {
    let stack = [];
    for (let y = ROWS - 1; y >= 0; y--)
      if (grid[y][x] !== null) stack.push(grid[y][x]);

    for (let y = ROWS - 1; y >= 0; y--)
      grid[y][x] = stack.length ? stack.shift() : randomType();
  }
}

function resolveBoard() {
  const matches = findMatches();
  if (matches.length) {
    removeMatches(matches);
    setTimeout(resolveBoard, 120);
  }
}

/* ================= INPUT ================= */

let startCell = null;

canvas.addEventListener("pointerdown", e => {
  const x = Math.floor((e.clientX - offsetX) / SIZE);
  const y = Math.floor((e.clientY - offsetY) / SIZE);
  if (x >= 0 && y >= 0 && x < COLS && y < ROWS)
    startCell = { x, y };
});

canvas.addEventListener("pointerup", e => {
  if (!startCell) return;

  const x = Math.floor((e.clientX - offsetX) / SIZE);
  const y = Math.floor((e.clientY - offsetY) / SIZE);

  const dx = x - startCell.x;
  const dy = y - startCell.y;

  if (Math.abs(dx) + Math.abs(dy) === 1) {
    [grid[startCell.y][startCell.x], grid[y][x]] =
    [grid[y][x], grid[startCell.y][startCell.x]];

    const matches = findMatches();
    if (matches.length) removeMatches(matches);
    else
      [grid[startCell.y][startCell.x], grid[y][x]] =
      [grid[y][x], grid[startCell.y][startCell.x]];
  }

  startCell = null;
});

/* ================= LOOP ================= */

function loop() {
  draw();
  requestAnimationFrame(loop);
}

/* ================= START ================= */

startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";

  loadIcons(() => {
    resize();
    initGrid();
    loop();
  });
};