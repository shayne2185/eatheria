const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DPR = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// GRID PARAMS
const COLS = 5;
const ROWS = 6;
const START_ROWS = 3; // spodné 3 riadky

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = []; // hodnoty 0..4 alebo null

let running = false;
let animating = false;

// AUTO PUSH
let lastTime = 0;
let autoAccumulator = 0;
const AUTO_PUSH_INTERVAL = 5000; // ms – pomalé, zenové

// INPUT
let pointerSwipeStart = null;
let singleTouchStart = null;
let multiTouchStart = null;

// ANIMÁCIE
let pushAnim = null;         // { offset, duration, t, active }
let vanishEffects = [];      // { r, c, type, progress }
let spawnEffects = [];       // { r, c, type, progress }

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
  resolveMatches(); // odstráni prípadné auto-match už na štarte
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

// Spodné 3 riadky vyplnené, zvyšok prázdny
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      if (r >= ROWS - START_ROWS) {
        const t = randomType();
        row.push(t);
        spawnEffects.push({ r, c, type: t, progress: 0 });
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }
}

// zaplnenosť gridu 0..1
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
  if (animating || (pushAnim && pushAnim.active)) return false;
  return getFillRatio() < 0.85;
}

// ===== MAIN LOOP =====
function loop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // auto push
  autoAccumulator += dt;
  if (autoAccumulator >= AUTO_PUSH_INTERVAL) {
    autoAccumulator = 0;
    if (canAutoPush()) {
      doPushUp(true);
    }
  }

  // animácie
  updatePushAnim(dt);
  updateVanishEffects(dt);
  updateSpawnEffects(dt);

  drawBackground();
  drawVignette();
  drawBoardFrame();
  drawGrid();
  drawVanishOverlay();
  drawSpawnOverlay();

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

// jemná vinieta
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

// ===== DRAW GRID =====
function drawGrid() {
  const pushOffset = (pushAnim && pushAnim.active) ? pushAnim.offset : 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      const baseX = offsetX + c * SIZE;
      const baseY = offsetY + r * SIZE + pushOffset; // plynulý posun

      const tilePadding = 4; // veľké kocky
      const tileX = baseX + tilePadding;
      const tileY = baseY + tilePadding;
      const tileSize = SIZE - tilePadding * 2;
      const radius = tileSize * 0.22;

      // podklad dlaždice
      ctx.fillStyle = "rgba(15,23,42,0.92)";
      roundedRectPath(ctx, tileX, tileY, tileSize, tileSize, radius);
      ctx.fill();

      // jemný vnútorný rámik
      ctx.strokeStyle = "rgba(51,65,85,0.85)";
      ctx.lineWidth = 1;
      roundedRectPath(ctx, tileX + 1, tileY + 1, tileSize - 2, tileSize - 2, radius - 2);
      ctx.stroke();

      if (t === null || t === undefined) continue;

      const iconSize = tileSize * 0.78;
      const ix = tileX + (tileSize - iconSize) / 2;
      const iy = tileY + (tileSize - iconSize) / 2;

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
    }
  }
}

// ===== VANISH EFFECTS =====
function updateVanishEffects(dt) {
  const duration = 260;
  for (const eff of vanishEffects) {
    eff.progress += dt / duration;
  }
  vanishEffects = vanishEffects.filter(eff => eff.progress < 1);
}

function drawVanishOverlay() {
  const pushOffset = (pushAnim && pushAnim.active) ? pushAnim.offset : 0;

  for (const eff of vanishEffects) {
    const { r, c, type, progress } = eff;

    const baseX = offsetX + c * SIZE;
    const baseY = offsetY + r * SIZE + pushOffset;

    const tilePadding = 4;
    const tileX = baseX + tilePadding;
    const tileY = baseY + tilePadding;
    const tileSize = SIZE - tilePadding * 2;

    const iconBaseSize = tileSize * 0.78;

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

// ===== SPAWN EFFECTS =====
function updateSpawnEffects(dt) {
  const duration = 200;
  for (const eff of spawnEffects) {
    eff.progress += dt / duration;
  }
  spawnEffects = spawnEffects.filter(eff => eff.progress < 1);
}

function drawSpawnOverlay() {
  const pushOffset = (pushAnim && pushAnim.active) ? pushAnim.offset : 0;

  for (const eff of spawnEffects) {
    const { r, c, type, progress } = eff;

    const baseX = offsetX + c * SIZE;
    const baseY = offsetY + r * SIZE + pushOffset;

    const tilePadding = 4;
    const tileX = baseX + tilePadding;
    const tileY = baseY + tilePadding;
    const tileSize = SIZE - tilePadding * 2;

    const iconBaseSize = tileSize * 0.78;

    const scale = 0.85 + 0.15 * progress;
    const alpha = 0.4 + 0.6 * progress;

    const iconSize = iconBaseSize * scale;
    const ix = tileX + (tileSize - iconSize) / 2;
    const iy = tileY + (tileSize - iconSize) / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(ICONS[type], ix, iy, iconSize, iconSize);
    ctx.restore();
  }
}

// ===== PUSH ANIM =====
function doPushUp(withMatches) {
  // logický push up
  pushUp();
  // spawn efekt pre nový spodný rad
  const bottomR = ROWS - 1;
  for (let c = 0; c < COLS; c++) {
    const t = grid[bottomR][c];
    if (t !== null) {
      spawnEffects.push({ r: bottomR, c, type: t, progress: 0 });
    }
  }

  // plynulý posun – grid sa opticky zdvihne
  pushAnim = {
    offset: SIZE,
    duration: 200,
    t: 0,
    active: true
  };

  if (withMatches) {
    resolveMatches();
  }
}

function updatePushAnim(dt) {
  if (!pushAnim || !pushAnim.active) return;
  pushAnim.t += dt;
  const p = Math.min(pushAnim.t / pushAnim.duration, 1);
  const eased = 1 - Math.pow(1 - p, 2); // ease-out
  pushAnim.offset = (1 - eased) * SIZE;
  if (p >= 1) {
    pushAnim.active = false;
    pushAnim.offset = 0;
  }
}

// ===== INPUT – POINTER (myš) =====
canvas.addEventListener("pointerdown", e => {
  if (animating || (pushAnim && pushAnim.active)) return;
  if (e.pointerType === "touch") return;
  pointerSwipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", e => {
  if (!pointerSwipeStart || animating || (pushAnim && pushAnim.active)) return;
  if (e.pointerType === "touch") return;

  const dx = e.clientX - pointerSwipeStart.x;
  const dy = e.clientY - pointerSwipeStart.y;

  handleSingleSwipe(dx, dy, pointerSwipeStart.x, pointerSwipeStart.y);
  pointerSwipeStart = null;
});

// ===== INPUT – TOUCH =====
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  if (animating || (pushAnim && pushAnim.active)) return;

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
  if (animating || (pushAnim && pushAnim.active)) return;

  // dvojprstový swipe hore = rýchly pushUp
  if (e.touches.length === 2 && multiTouchStart && canAutoPush()) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const avgDy =
      ((t1.clientY - multiTouchStart[0].clientY) +
       (t2.clientY - multiTouchStart[1].clientY)) / 2;

    if (avgDy < -35) {
      doPushUp(true);
      multiTouchStart = [
        { x: t1.clientX, y: t1.clientY },
        { x: t2.clientX, y: t2.clientY }
      ];
    }
  }
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  if (animating || (pushAnim && pushAnim.active)) return;

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

// ===== SINGLE SWIPE – SWAP =====
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

  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];

  const matches = findMatches();
  if (matches.length) {
    removeMatches(matches);
  } else {
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
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

// collapse – dlaždice padajú dole, nové sa NEVYTVÁRAJÚ
function collapse() {
  for (let c = 0; c < COLS; c++) {
    const stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.length ? stack.shift() : null;
    }
  }
}

// ===== PUSH-UP LOGIKA =====
function pushUp() {
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = grid[r + 1][c];
    }
  }

  const bottomRow = [];
  for (let c = 0; c < COLS; c++) {
    bottomRow.push(randomType());
  }
  grid[ROWS - 1] = bottomRow;
}
