const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 5;
const ROWS = 5;
const TYPES = 6;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let selected = null;
let animating = false;

const icons = [];
for (let i = 0; i < TYPES; i++) {
  const img = new Image();
  img.src = `icons/${i}.png`; // ⬅️ icons/0.png ... 5.png
  icons.push(img);
}

/* ================== RESIZE (RETINA FIX) ================== */
function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  SIZE = Math.floor(
    Math.min(
      window.innerWidth / COLS,
      window.innerHeight / (ROWS + 0.5)
    )
  );

  offsetX = Math.floor((window.innerWidth - SIZE * COLS) / 2);
  offsetY = Math.floor((window.innerHeight - SIZE * ROWS) / 2.2);
}

window.addEventListener("resize", resize);

/* ================== GRID ================== */
function initGrid() {
  grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = Math.floor(Math.random() * TYPES);
    }
  }
  resolveBoard();
}

/* ================== DRAW ================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = Math.floor(SIZE * 0.075);
  const iconSize = SIZE - padding * 2;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = grid[y][x];
      if (t === null) continue;

      const px = offsetX + x * SIZE + padding;
      const py = offsetY + y * SIZE + padding;

      ctx.drawImage(icons[t], px, py, iconSize, iconSize);
    }
  }
}

/* ================== MATCH LOGIC ================== */
function findMatches() {
  const matches = [];

  // horizontal
  for (let y = 0; y < ROWS; y++) {
    let run = 1;
    for (let x = 1; x <= COLS; x++) {
      if (x < COLS && grid[y][x] === grid[y][x - 1]) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            matches.push({ x: x - 1 - i, y });
          }
        }
        run = 1;
      }
    }
  }

  // vertical
  for (let x = 0; x < COLS; x++) {
    let run = 1;
    for (let y = 1; y <= ROWS; y++) {
      if (y < ROWS && grid[y][x] === grid[y - 1][x]) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            matches.push({ x, y: y - 1 - i });
          }
        }
        run = 1;
      }
    }
  }

  return matches;
}

function removeMatches(matches) {
  matches.forEach(m => grid[m.y][m.x] = null);
  fall();
}

function fall() {
  for (let x = 0; x < COLS; x++) {
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y][x] === null) {
        for (let yy = y - 1; yy >= 0; yy--) {
          if (grid[yy][x] !== null) {
            grid[y][x] = grid[yy][x];
            grid[yy][x] = null;
            break;
          }
        }
        if (grid[y][x] === null) {
          grid[y][x] = Math.floor(Math.random() * TYPES);
        }
      }
    }
  }
}

function resolveBoard() {
  const matches = findMatches();
  if (matches.length) {
    removeMatches(matches);
    setTimeout(resolveBoard, 150);
  }
}

/* ================== INPUT ================== */
function getCell(px, py) {
  const x = Math.floor((px - offsetX) / SIZE);
  const y = Math.floor((py - offsetY) / SIZE);
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
  return { x, y };
}

let startPos = null;

canvas.addEventListener("pointerdown", e => {
  startPos = getCell(e.clientX, e.clientY);
});

canvas.addEventListener("pointerup", e => {
  if (!startPos || animating) return;
  const end = getCell(e.clientX, e.clientY);
  if (!end) return;

  const dx = end.x - startPos.x;
  const dy = end.y - startPos.y;

  if (Math.abs(dx) + Math.abs(dy) === 1) {
    [grid[startPos.y][startPos.x], grid[end.y][end.x]] =
    [grid[end.y][end.x], grid[startPos.y][startPos.x]];

    const matches = findMatches();
    if (matches.length) {
      removeMatches(matches);
    } else {
      // revert
      [grid[startPos.y][startPos.x], grid[end.y][end.x]] =
      [grid[end.y][end.x], grid[startPos.y][startPos.x]];
    }
  }
});

/* ================== LOOP ================== */
function loop() {
  draw();
  requestAnimationFrame(loop);
}

/* ================== START ================== */
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  resize();
  initGrid();
  loop();
};