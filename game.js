const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DPR = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

const COLS = 5;
const ROWS = 6;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let running = false;
let swipeStart = null;
let animating = false;

// auto push timing
let lastTime = 0;
let autoAccumulator = 0;
const AUTO_PUSH_INTERVAL = 2200; // ms – ako rýchlo sa grid sám posúva

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

  SIZE = Math.floor(Math.min(w / COLS, h / ROWS));

  offsetX = Math.floor((w - SIZE * COLS) / 2);
  offsetY = Math.floor((h - SIZE * ROWS) / 2);
}
window.addEventListener("resize", resize);

// ===== GRID =====
function randomType() {
  return Math.floor(Math.random() * ICONS.length);
}

// začíname s prázdnou plochou (null = žiadna ikonka)
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

// ===== MAIN LOOP =====
function loop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // automatické pomalé ťaženie – grid sa posúva hore a nové ikonky sa rodia dole
  autoAccumulator += dt;
  if (autoAccumulator >= AUTO_PUSH_INTERVAL) {
    autoAccumulator = 0;
    pushUp();
    resolveMatches();
  }

  drawBackground();
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

// ===== DRAW GRID =====
function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (t === null || t === undefined) continue;

      const x = offsetX + c * SIZE;
      const y = offsetY + r * SIZE;

      const tilePadding = 4;
      const tileX = x + tilePadding;
      const tileY = y + tilePadding;
      const tileSize = SIZE - tilePadding * 2;

      ctx.fillStyle = "#020617";
      ctx.fillRect(tileX, tileY, tileSize, tileSize);

      const iconSize = tileSize - 10;
      const ix = tileX + (tileSize - iconSize) / 2;
      const iy = tileY + (tileSize - iconSize) / 2;

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
    }
  }
}

// ===== INPUT – MOUSE / POINTER (single swipe) =====
canvas.addEventListener("pointerdown", e => {
  if (animating) return;
  // ignorujeme touch pointery, tie riešime cez touch* eventy
  if (e.pointerType === "touch") return;

  swipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!swipeStart || animating) return;
  if (e.pointerType === "touch") return;

  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;

  handleSingleSwipe(dx, dy, swipeStart.x, swipeStart.y);
  swipeStart = null;
});

// ===== INPUT – TOUCH (single + double finger) =====
let singleTouchStart = null;
let multiTouchStart = null;

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

  // dvojprstový swipe = rýchly pushUp
  if (e.touches.length === 2 && multiTouchStart) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const avgDy =
      ((t1.clientY - multiTouchStart[0].clientY) +
       (t2.clientY - multiTouchStart[1].clientY)) / 2;

    // hráč ťahá smerom hore (negatívny dy)
    if (avgDy < -35) {
      pushUp();
      resolveMatches();
      // resetneme referenčné pozície, aby mohol znova potiahnuť a znova to spustiť
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

  // ak končí single touch, riešime swipe na swap
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

// ===== SINGLE SWIPE LOGIKA (swap ikoniek) =====
function handleSingleSwipe(dx, dy, startX, startY) {
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

  // z ktorého políčka začal swipe
  const c = Math.floor((startX - offsetX) / SIZE);
  const r = Math.floor((startY - offsetY) / SIZE);

  let tc = c;
  let tr = r;

  if (Math.abs(dx) > Math.abs(dy)) {
    // horizontálny swipe
    tc += dx > 0 ? 1 : -1;
  } else {
    // vertikálny swipe
    tr += dy > 0 ? 1 : -1;
  }

  if (grid[r]?.[c] !== undefined && grid[tr]?.[tc] !== undefined) {
    swap(r, c, tr, tc);
  }
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
      if (c < COLS && grid[r][c] !== null && grid[r][c] === grid[r][c - 1]) {
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
      if (r < ROWS && grid[r][c] !== null && grid[r][c] === grid[r - 1][c]) {
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
  }, 200);
}

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

  // ak chceme, aby sa null dopĺňali zhora hneď:
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = randomType();
      }
    }
  }
}

// ===== PUSH-UP MECHANIKA =====
// posunie grid o 1 riadok hore, spodok je nový, horný sa zahodí
function pushUp() {
  // posun všetkých riadkov o 1 hore
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
