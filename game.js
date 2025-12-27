const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DPR = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// veľkosť gridu
const COLS = 5;
const ROWS = 6;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let running = false;
let animating = false;

// časovanie auto-push
let lastTime = 0;
let autoAccumulator = 0;
const AUTO_PUSH_INTERVAL = 4500; // pomalé, zenové

// swipe / touch
let pointerSwipeStart = null;
let singleTouchStart = null;
let multiTouchStart = null;

// ===== ICONS =====
const ICONS = [
  "assets/icons/life.png",
  "assets/icons/stone.png",
  "assets/icons/fire.png",
  "assets/icons/water.png",
  "assets/icons/air.png"
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// ===== START =====
startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  canvas.classList.add("active");
  running = true;
  resize();
  initGrid();
  lastTime = 0;
  autoAccumulator = 0;
  requestAnimationFrame(loop);
};

// ===== RESIZE =====
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  canvas.width = Math.floor(w * DPR);
  canvas.height = Math.floor(h * DPR);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  SIZE = Math.floor(Math.min(w / (COLS + 1), h / (ROWS + 1)));

  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;

  offsetX = Math.floor((w - boardW) / 2);
  offsetY = Math.floor((h - boardH) / 2);
}
window.addEventListener("resize", resize);

// ===== GRID =====
function randomType() {
  return Math.floor(Math.random() * ICONS.length);
}

// začíname prázdno – null = žiadna ikonka
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(null);
    }
    grid.push(row);
  }
}

// koľko percent gridu je zaplnených (0–1)
function getFillRatio() {
  let filled = 0;
  const total = ROWS * COLS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== null) filled++;
    }
  }
  return filled / total;
}

// auto-push len keď nie je preplnené
function canAutoPush() {
  if (animating) return false;
  const ratio = getFillRatio();
  return ratio < 0.75; // keď je viac než 75% plné, spomalíme ťaženie
}

// ===== MAIN LOOP =====
function loop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // automatické pomalé ťaženie
  autoAccumulator += dt;
  if (autoAccumulator >= AUTO_PUSH_INTERVAL) {
    autoAccumulator = 0;
    if (canAutoPush()) {
      pushUp();
      resolveMatches();
    }
  }

  drawBackground();
  drawBoardFrame();
  drawGrid();

  requestAnimationFrame(loop);
}

// ===== BACKGROUND =====
function drawBackground() {
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#020617");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ===== BOARD FRAME =====
function drawBoardFrame() {
  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;

  const x = offsetX - 10;
  const y = offsetY - 10;
  const w = boardW + 20;
  const h = boardH + 20;

  // tieň
  ctx.fillStyle = "#020617";
  ctx.shadowColor = "rgba(15,23,42,0.9)";
  ctx.shadowBlur = 30;
  ctx.fillRect(x, y, w, h);

  // vnútorný rám
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(148,163,184,0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
}

// ===== DRAW GRID =====
function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      const x = offsetX + c * SIZE;
      const y = offsetY + r * SIZE;

      const tilePadding = 6;
      const tileX = x + tilePadding;
      const tileY = y + tilePadding;
      const tileSize = SIZE - tilePadding * 2;

      // podklad dlaždice
      ctx.fillStyle = "rgba(15,23,42,0.95)";
      ctx.fillRect(tileX, tileY, tileSize, tileSize);

      // vnútorný rámik
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(tileX + 1, tileY + 1, tileSize - 2, tileSize - 2);

      if (t === null || t === undefined) continue;

      const iconSize = tileSize - 14;
      const ix = tileX + (tileSize - iconSize) / 2;
      const iy = tileY + (tileSize - iconSize) / 2;

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
    }
  }
}

// ===== INPUT – POINTER (myš, stylus) – SINGLE SWIPE =====
canvas.addEventListener("pointerdown", e => {
  if (animating) return;
  if (e.pointerType === "touch") return; // touch riešime zvlášť

  pointerSwipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!pointerSwipeStart || animating) return;
  if (e.pointerType === "touch") return;

  const dx = e.clientX - pointerSwipeStart.x;
  const dy = e.clientY - pointerSwipeStart.y;

  handleSingleSwipe(dx, dy, pointerSwipeStart.x, pointerSwipeStart.y);
  pointerSwipeStart = null;
});

// ===== INPUT – TOUCH (single + double) =====
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  if (animating) return;

  if (e.touches.length === 1) {
    const t = e.touches[0];
    singleTouchStart = { x: t.clientX, y: t.clientY };
    multiTouchStart = null;
  } else if (e.touches.length === 2) {
    multiTouchStart = [
      { x: e.touches[0].clientX, y: e.touches[0].clientY },
      { x: e.touches[1].clientX, y: e.touches[1].clientY }
    ];
    singleTouchStart = null;
  }
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (animating) return;

  // dvojprstový swipe = rýchly pushUp (ak nie je preplnené)
  if (e.touches.length === 2 && multiTouchStart) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const avgDy =
      ((t1.clientY - multiTouchStart[0].clientY) +
       (t2.clientY - multiTouchStart[1].clientY)) / 2;

    if (avgDy < -35 && canAutoPush()) {
      pushUp();
      resolveMatches();
      multiTouchStart = [
        { x: t1.clientX, y: t1.clientY },
        { x: t2.clientX, y: t2.clientY }
      ];
    }
  }
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  if (animating) return;

  if (e.touches.length === 0 && singleTouchStart) {
    const changed = e.changedTouches[0];
    const dx = changed.clientX - singleTouchStart.x;
    const dy = changed.clientY - singleTouchStart.y;

    handleSingleSwipe(dx, dy, singleTouchStart.x, singleTouchStart.y);
    singleTouchStart = null;
  }

  if (e.touches.length < 2) {
    multiTouchStart = null;
  }
}, { passive: false });

// ===== SINGLE SWIPE (jedným prstom / myšou) – SWAP ikoniek =====
function handleSingleSwipe(dx, dy, startX, startY) {
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

  const c = Math.floor((startX - offsetX) / SIZE);
  const r = Math.floor((startY - offsetY) / SIZE);

  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (grid[r][c] === null) return;

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) {
    tc += dx > 0 ? 1 : -1;
  } else {
    tr += dy > 0 ? 1 : -1;
  }

  if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) return;
  if (grid[tr][tc] === null) return;

  swap(r, c, tr, tc);
}

// ===== MATCH ENGINE =====
function swap(r1, c1, r2, c2) {
  if (grid[r1][c1] === null || grid[r2][c2] === null) return;

  [grid[r1][c1], grid[r2][c2]] =
    [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) {
    removeMatches(matches);
  } else {
    [grid[r1][c1], grid[r2][c2]] =
      [grid[r2][c2], grid[r1][c1]];
  }
}

function findMatches() {
  const res = [];

  // horizontálne
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
            res.push({ r, c: c - 1 - i });
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
        grid[r][c] !== null &&
        grid[r][c] === grid[r - 1][c]
      ) {
        run++;
      } else {
        if (run >= 3) {
          for (let i = 0; i < run; i++) {
            res.push({ r: r - 1 - i, c });
          }
        }
        run = 1;
      }
    }
  }

  return res;
}

function resolveMatches() {
  const matches = findMatches();
  if (matches.length) {
    removeMatches(matches);
    setTimeout(resolveMatches, 220);
  }
}

function removeMatches(matches) {
  animating = true;
  matches.forEach(m => {
    if (grid[m.r] && grid[m.r][m.c] !== undefined) {
      grid[m.r][m.c] = null;
    }
  });
  setTimeout(() => {
    collapse();
    animating = false;
  }, 180);
}

// dlaždice padajú dole, ale NEGENERUJEME nové – tie prídu z pushUp
function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.length ? stack.shift() : null;
    }
  }
}

// ===== PUSH-UP MECHANIKA =====
// posunie grid o 1 riadok hore, spodok dostane nový rad
function pushUp() {
  // posun o 1 hore
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = grid[r + 1][c];
    }
  }

  // nový spodný rad
  const bottomRow = [];
  for (let c = 0; c < COLS; c++) {
    bottomRow.push(randomType());
  }
  grid[ROWS - 1] = bottomRow;
}
