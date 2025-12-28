/*  ============================
      E A T H E R I A   –  GAME ENGINE
    ============================  */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DPR = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// GRID PARAMS
const COLS = 5;
const ROWS = 6;
const START_ROWS = 3;
const AUTO_FILL_ROWS = 4;

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = [];
let running = false;

// INPUT
let pointerSwipeStart = null;
let singleTouchStart = null;
let multiTouchStart = null;

// push-up bump anim
let pushAnim = { active: false, offset: 0, t: 0, duration: 120 };

// jemná para pri zmiznutí
let vanishEffects = []; // { r, c, type, progress }

// flag na auto-resolve
let needsResolve = false;

// ICONS
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
  needsResolve = true;
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

  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;

  offsetX = Math.floor((w - boardW) / 2);
  offsetY = Math.floor((h - boardH) / 2);
}
window.addEventListener("resize", resize);

// ===== GRID / GENERATOR =====
function randomType() {
  return Math.floor(Math.random() * ICONS.length);
}

function generateClusteredRow(prevRowBelow) {
  const row = [];
  for (let c = 0; c < COLS; c++) {
    let candidates = [];
    if (c > 0 && row[c - 1] !== null) candidates.push(row[c - 1]);
    if (prevRowBelow && prevRowBelow[c] !== null) candidates.push(prevRowBelow[c]);

    let type;
    if (candidates.length > 0 && Math.random() < 0.8) {
      type = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      type = randomType();
    }
    row.push(type);
  }
  return row;
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(null);
    grid.push(row);
  }

  for (let r = ROWS - START_ROWS; r < ROWS; r++) {
    const below = r < ROWS - 1 ? grid[r + 1] : null;
    grid[r] = generateClusteredRow(below);
  }
  needsResolve = true;
}

// ===== MAIN LOOP =====
let lastTime = 0;
function loop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (needsResolve) {
    resolveAllMatches();
    needsResolve = false;
  }

  updatePushAnim(dt);
  updateVanishEffects(dt);

  drawBackground();
  drawVignette();
  drawBoardFrame();
  drawGrid();
  drawVanishOverlay();
  drawSwipeHint();

  requestAnimationFrame(loop);
}

// ===== BACKGROUND =====
function drawBackground() {
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  const grad = ctx.createRadialGradient(
    w / 2, h * 0.15, 0,
    w / 2, h / 2, h
  );
  grad.addColorStop(0, "#020617");
  grad.addColorStop(0.4, "#020617");
  grad.addColorStop(1, "#020617");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawVignette() {
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.3,
    w / 2, h / 2, Math.max(w, h) * 0.9
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.6)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ===== BOARD FRAME =====
function drawBoardFrame() {
  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;

  const x = offsetX - 14;
  const y = offsetY - 14;
  const w = boardW + 28;
  const h = boardH + 28;
  const radius = 20;

  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.9)";
  ctx.shadowBlur = 36;
  ctx.fillStyle = "rgba(15,23,42,0.98)";
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(148,163,184,0.4)";
  ctx.lineWidth = 1.5;
  roundedRectPath(ctx, x + 2, y + 2, w - 4, h - 4, radius - 4);
  ctx.stroke();
  ctx.restore();
}

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

// ===== GRID RENDER =====
function drawGrid() {
  const pushOffset = pushAnim.active ? pushAnim.offset : 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      const baseX = offsetX + c * SIZE;
      const baseY = offsetY + r * SIZE + pushOffset;

      const tilePadding = 3;
      const tileX = baseX + tilePadding;
      const tileY = baseY + tilePadding;
      const tileSize = SIZE - tilePadding * 2;
      const radius = tileSize * 0.2;

      ctx.fillStyle = "rgba(15,23,42,0.95)";
      roundedRectPath(ctx, tileX, tileY, tileSize, tileSize, radius);
      ctx.fill();

      ctx.strokeStyle = "rgba(51,65,85,0.85)";
      ctx.lineWidth = 1;
      roundedRectPath(ctx, tileX + 1, tileY + 1, tileSize - 2, tileSize - 2, radius - 2);
      ctx.stroke();

      if (t === null) continue;

      const iconSize = tileSize * 0.88;
      const ix = tileX + (tileSize - iconSize) / 2;
      const iy = tileY + (tileSize - iconSize) / 2;

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
    }
  }
}

// ===== SWIPE HINT =====
function drawSwipeHint() {
  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;
  const centerX = offsetX + boardW / 2;
  const yBase = offsetY + boardH + 20;

  const width = SIZE * 0.7;
  const gap = 6;

  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, yBase);
  ctx.lineTo(centerX + width / 2, yBase);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, yBase + gap);
  ctx.lineTo(centerX + width / 2, yBase + gap);
  ctx.stroke();

  ctx.restore();
}

// ===== VANISH EFFECTS =====
function updateVanishEffects(dt) {
  const duration = 220;
  for (const eff of vanishEffects) {
    eff.progress += dt / duration;
  }
  vanishEffects = vanishEffects.filter(e => e.progress < 1);
}

function drawVanishOverlay() {
  if (!vanishEffects.length) return;

  for (const eff of vanishEffects) {
    const { r, c, type, progress } = eff;

    const baseX = offsetX + c * SIZE;
    const baseY = offsetY + r * SIZE;

    const tilePadding = 3;
    const tileX = baseX + tilePadding;
    const tileY = baseY + tilePadding;
    const tileSize = SIZE - tilePadding * 2;

    const iconBaseSize = tileSize * 0.88;

    const alpha = 1 - progress;
    const iconSize = iconBaseSize * (1 - 0.25 * progress);
    const ix = tileX + (tileSize - iconSize) / 2;
    const iy = tileY + (tileSize - iconSize) / 2;

    const cx = tileX + tileSize / 2;
    const cy = tileY + tileSize / 2;
    const cloudRadius = tileSize * (0.45 + 0.15 * progress);

    ctx.save();

    // jemná lokálna para
    ctx.globalAlpha = alpha * 0.6;
    const grad = ctx.createRadialGradient(
      cx, cy, cloudRadius * 0.25,
      cx, cy, cloudRadius
    );
    grad.addColorStop(0, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, cloudRadius, 0, Math.PI * 2);
    ctx.fill();

    // ikonka mizne
    ctx.globalAlpha = alpha;
    ctx.drawImage(ICONS[type], ix, iy, iconSize, iconSize);

    ctx.restore();
  }
}

// ===== PUSH ANIM =====
function startPushAnim() {
  pushAnim.active = true;
  pushAnim.t = 0;
  pushAnim.offset = -10;
}

function updatePushAnim(dt) {
  if (!pushAnim.active) return;
  pushAnim.t += dt;
  const p = Math.min(pushAnim.t / pushAnim.duration, 1);
  const eased = 1 - Math.pow(1 - p, 2);
  pushAnim.offset = -10 * (1 - eased);
  if (p >= 1) {
    pushAnim.active = false;
    pushAnim.offset = 0;
  }
}

// ===== INPUT HELPERS =====
function getBoardCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const boardLeft = offsetX;
  const boardTop = offsetY;
  const boardRight = offsetX + COLS * SIZE;
  const boardBottom = offsetY + ROWS * SIZE;

  const inBoard =
    x >= boardLeft && x < boardRight &&
    y >= boardTop && y < boardBottom;

  const col = Math.floor((x - boardLeft) / SIZE);
  const row = Math.floor((y - boardTop) / SIZE);

  return { inBoard, col, row, x, y, boardTop, boardBottom };
}

// ===== INPUT – POINTER =====
canvas.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch") return;
  pointerSwipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!pointerSwipeStart || e.pointerType === "touch") return;

  const dx = e.clientX - pointerSwipeStart.x;
  const dy = e.clientY - pointerSwipeStart.y;

  handleSingleSwipe(dx, dy, pointerSwipeStart.x, pointerSwipeStart.y);
  pointerSwipeStart = null;
});

// ===== INPUT – TOUCH =====
canvas.addEventListener("touchstart", e => {
  e.preventDefault();

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

  if (e.touches.length === 2 && multiTouchStart) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const startAvgY =
      (multiTouchStart[0].y + multiTouchStart[1].y) / 2;
    const currentAvgY =
      (t1.clientY + t2.clientY) / 2;
    const avgDy = currentAvgY - startAvgY;

    const rect = canvas.getBoundingClientRect();
    const startBoard = getBoardCoords(
      (multiTouchStart[0].x + multiTouchStart[1].x) / 2,
      startAvgY
    );

    const hintTop = startBoard.boardBottom + 10;
    const hintBottom = hintTop + SIZE * 0.8;

    if (startAvgY >= hintTop && startAvgY <= hintBottom && avgDy < -25) {
      doPushUp();
      multiTouchStart = [
        { x: t1.clientX, y: t1.clientY },
        { x: t2.clientX, y: t2.clientY }
      ];
    }
  }
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();

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

// ===== SINGLE SWIPE – SWAP alebo PUSH-UP =====
function handleSingleSwipe(dx, dy, startClientX, startClientY) {
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;

  const rect = canvas.getBoundingClientRect();
  const boardCoords = getBoardCoords(startClientX, startClientY);
  const { inBoard, col, row, boardBottom } = boardCoords;

  const hintTop = boardBottom + 10;
  const hintBottom = hintTop + SIZE * 0.8;
  const startYCanvas = startClientY - rect.top;

  // PUSH-UP (1 prst)
  if (
    startYCanvas >= hintTop &&
    startYCanvas <= hintBottom &&
    dy < -25 &&
    Math.abs(dy) > Math.abs(dx)
  ) {
    doPushUp();
    return;
  }

  // SWAP
  if (inBoard) {

    // ❗ Horný riadok nesmie ísť hore
    if (row === 0 && dy < 0 && Math.abs(dy) > Math.abs(dx)) {
      return;
    }

    if (row < 0 || row >= ROWS || col < 0 || col
