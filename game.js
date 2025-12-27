const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DPR = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// veľkosť gridu
const COLS = 5;
const ROWS = 6;
const START_ROWS = 3; // začneme s 3 riadkami ako v aurora štýle

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = []; // čísla alebo null
let running = false;
let animating = false;

// časovanie auto-push
let lastTime = 0;
let autoAccumulator = 0;
const AUTO_PUSH_INTERVAL = 5000; // pomalé, zenové

// swipe / touch
let pointerSwipeStart = null;
let singleTouchStart = null;
let multiTouchStart = null;

// efekty miznutia
let vanishEffects = []; // {r,c,type,progress}

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

  // maximalizujeme veľkosť kociek
  SIZE = Math.floor(Math.min(w / COLS, h / ROWS));

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

// začíname s pár riadkami, zvyšok prázdny
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      if (r >= ROWS - START_ROWS) {
        row.push(randomType());
      } else {
        row.push(null);
      }
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

function canAutoPush() {
  if (animating) return false;
  const ratio = getFillRatio();
  return ratio < 0.8; // keď je viac než 80% plné, nespúšťame auto-push
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

  updateVanishEffects(dt);

  drawBackground();
  drawVignette();
  drawBoardFrame();
  drawGrid();
  drawVanishOverlay();

  requestAnimationFrame(loop);
}

// ===== BACKGROUND =====
function drawBackground() {
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  const grad = ctx.createRadialGradient(
    w / 2, h * 0.2, 0,
    w / 2, h / 2, h * 0.9
  );
  grad.addColorStop(0, "#020617");
  grad.addColorStop(0.4, "#020617");
  grad.addColorStop(1, "#020617");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// jemná vinieta okolo okrajov
function drawVignette() {
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.2,
    w / 2, h / 2, Math.max(w, h) * 0.8
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.55)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ===== BOARD FRAME =====
function drawBoardFrame() {
  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;

  const x = offsetX - 12;
  const y = offsetY - 12;
  const w = boardW + 24;
  const h = boardH + 24;

  // zaoblený rám – dark, faded
  const radius = 18;

  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.9)";
  ctx.shadowBlur = 32;
  ctx.fillStyle = "rgba(15,23,42,0.98)";
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 1.5;
  roundedRectPath(ctx, x + 2, y + 2, w - 4, h - 4, radius - 4);
  ctx.stroke();
  ctx.restore();
}

// helper – zaoblený rect
function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ===== DRAW GRID =====
function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      const x = offsetX + c * SIZE;
      const y = offsetY + r * SIZE;

      const tilePadding = 4; // minimalny padding, veľké ikonky
      const tileX = x + tilePadding;
      const tileY = y + tilePadding;
      const tileSize = SIZE - tilePadding * 2;

      const radius = tileSize * 0.22;

      // podklad dlaždice – zaoblený, tmavý, faded
      ctx.fillStyle = "rgba(15,23,42,0.92)";
      roundedRectPath(ctx, tileX, tileY, tileSize, tileSize, radius);
      ctx.fill();

      // vnútorný jemný rámik
      ctx.strokeStyle = "rgba(51,65,85,0.8)";
      ctx.lineWidth = 1;
      roundedRectPath(ctx, tileX + 1, tileY + 1, tileSize - 2, tileSize - 2, radius - 2);
      ctx.stroke();

      if (t === null || t === undefined) continue;

      const iconSize = tileSize * 0.76;
      const ix = tileX + (tileSize - iconSize) / 2;
      const iy = tileY + (tileSize - iconSize) / 2;

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
    }
  }
}

// ===== VANISH EFFECTS =====
// efekty miznutia pri match-3: shrink + fade
function updateVanishEffects(dt) {
  const duration = 280; // ms
  for (const eff of vanishEffects) {
    eff.progress += dt / duration;
  }
  vanishEffects = vanishEffects.filter(eff => eff.progress < 1);
}

function drawVanishOverlay() {
  for (const eff of vanishEffects) {
    const { r, c, type, progress } = eff;

    const x = offsetX + c * SIZE;
    const y = offsetY + r * SIZE;

    const tilePadding = 4;
    const tileX = x + tilePadding;
    const tileY = y + tilePadding;
    const tileSize = SIZE - tilePadding * 2;

    const iconBaseSize = tileSize * 0.76;

    const scale = 1 - 0.4 * progress;
    const alpha = 1 - progress;

    const iconSize = iconBaseSize * scale;
    const ix = tileX + (tileSize - iconSize) / 2;
    const iy = tileY + (tileSize - iconSize) / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(ICONS[type], ix, iy, iconSize, iconSize);
    ctx.restore();
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

// ===== SINGLE SWIPE – SWAP ikoniek =====
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
    setTimeout(resolveMatches, 260);
  }
}

function removeMatches(matches) {
  animating = true;

  // efekt miznutia
  for (const m of matches) {
    const { r, c } = m;
    if (grid[r] && grid[r][c] !== null && grid[r][c] !== undefined) {
      vanishEffects.push({
        r,
        c,
        type: grid[r][c],
        progress: 0
      });
    }
  }

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

// collapse len posúva existujúce ikonky dole, nové NEVYTVÁRA
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

// ===== PUSH
