const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DPR = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = false;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// GRID PARAMS
const COLS = 5;
const ROWS = 6;
const START_ROWS = 3;      // spodné 3 riadky na začiatku
const AUTO_FILL_ROWS = 4;  // automaticky dopĺňame len spodné 4 riadky

let SIZE = 0;
let offsetX = 0;
let offsetY = 0;

let grid = []; // 0..4 alebo null
let running = false;

// INPUT
let pointerSwipeStart = null;
let singleTouchStart = null;
let multiTouchStart = null;

// Jemná animácia push-up (bump)
let pushAnim = { active: false, offset: 0, t: 0, duration: 120 };

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
  // NEspúšťame resolveAllMatches na štarte – necháme prípadné match-e na hráča
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

// ===== GRID INIT / GENERÁTOR =====
function randomType() {
  return Math.floor(Math.random() * ICONS.length);
}

// silne cluster-friendly generovanie radu
function generateClusteredRow(prevRowBelow) {
  const row = [];
  for (let c = 0; c < COLS; c++) {
    let candidates = [];

    if (c > 0 && row[c - 1] !== null && row[c - 1] !== undefined) {
      candidates.push(row[c - 1]);
    }
    if (prevRowBelow && prevRowBelow[c] !== null && prevRowBelow[c] !== undefined) {
      candidates.push(prevRowBelow[c]);
    }

    let type;
    if (candidates.length > 0 && Math.random() < 0.8) { // silné clustre
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
    for (let c = 0; c < COLS; c++) {
      row.push(null);
    }
    grid.push(row);
  }

  for (let r = ROWS - START_ROWS; r < ROWS; r++) {
    const below = r < ROWS - 1 ? grid[r + 1] : null;
    grid[r] = generateClusteredRow(below);
  }
}

// ===== MAIN LOOP =====
let lastTime = 0;
function loop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  updatePushAnim(dt);

  drawBackground();
  drawVignette();
  drawBoardFrame();
  drawGrid();
  drawSwipeHint(); // vizuálne čiarky pod gridom

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

      if (t === null || t === undefined) continue;

      const iconSize = tileSize * 0.88;
      const ix = tileX + (tileSize - iconSize) / 2;
      const iy = tileY + (tileSize - iconSize) / 2;

      ctx.drawImage(ICONS[t], ix, iy, iconSize, iconSize);
    }
  }
}

// ===== SWIPE HINT POD GRIDOM =====
function drawSwipeHint() {
  const boardW = COLS * SIZE;
  const boardH = ROWS * SIZE;
  const centerX = offsetX + boardW / 2;
  const yBase = offsetY + boardH + 20;

  const width = SIZE * 0.7;
  const gap = 6;

  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.4)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // horná čiarka
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, yBase);
  ctx.lineTo(centerX + width / 2, yBase);
  ctx.stroke();

  // spodná čiarka
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, yBase + gap);
  ctx.lineTo(centerX + width / 2, yBase + gap);
  ctx.stroke();

  ctx.restore();
}

// ===== PUSH ANIM (jemný bump) =====
function startPushAnim() {
  pushAnim.active = true;
  pushAnim.t = 0;
  pushAnim.offset = -10;
  pushAnim.duration = 120;
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

// ===== INPUT – POINTER (myš) =====
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

  // Dvojprstový swipe hore = manuálny push-up, ale len ak začne POD gridom
  if (e.touches.length === 2 && multiTouchStart) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const startAvgY =
      (multiTouchStart[0].y + multiTouchStart[1].y) / 2;
    const currentAvgY =
      (t1.clientY + t2.clientY) / 2;
    const avgDy = currentAvgY - startAvgY;

    const boardBottom = offsetY + ROWS * SIZE;

    if (startAvgY > boardBottom + 10 && avgDy < -20) {
      doPushUp(); // už nespúšťa match engine
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
function handleSingleSwipe(dx, dy, startX, startY) {
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;

  const boardTop = offsetY;
  const boardBottom = offsetY + ROWS * SIZE;

  // 1) Push-up JEDNÝM prstom iba ak swipe začne POD gridom
  if (startY > boardBottom + 10 && dy < -20) {
    doPushUp();  // len posun + nový spodný rad, bez match engine
    return;
  }

  // 2) Ak swipe začal v GRIDe → SWAP (aj hore/dole)
  if (startY >= boardTop && startY <= boardBottom) {
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
}

// ===== MATCH ENGINE =====
function swap(r1, c1, r2, c2) {
  if (grid[r1][c1] === null || grid[r2][c2] === null) return;

  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];

  // MATCH-3 len po swape
  if (!resolveAllMatches()) {
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

function resolveAllMatches() {
  let any = false;
  while (true) {
    const matches = findMatches();
    if (!matches.length) break;
    any = true;
    applyMatches(matches);
  }
  return any;
}

function applyMatches(matches) {
  for (const m of matches) {
    const { r, c } = m;
    if (grid[r] && grid[r][c] !== null && grid[r][c] !== undefined) {
      grid[r][c] = null;
    }
  }

  collapseAndRefill();
}

// ===== COLLAPSE + REFILL (len spodné 4 riadky) =====
function collapseAndRefill() {
  for (let c = 0; c < COLS; c++) {
    const stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = stack.length ? stack.shift() : null;
    }
  }

  const startRow = ROWS - AUTO_FILL_ROWS;
  for (let r = ROWS - 1; r >= startRow; r--) {
    const below = r < ROWS - 1 ? grid[r + 1] : null;
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) {
        let candidates = [];
        if (c > 0 && grid[r][c - 1] !== null) {
          candidates.push(grid[r][c - 1]);
        }
        if (below && below[c] !== null) {
          candidates.push(below[c]);
        }

        let type;
        if (candidates.length > 0 && Math.random() < 0.8) {
          type = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          type = randomType();
        }

        grid[r][c] = type;
      }
    }
  }
}

// ===== PUSH-UP LOGIKA =====
function pushUp() {
  // len posun existujúcich ikoniek o 1 riadok hore
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = grid[r + 1][c];
    }
  }

  // nový spodný rad – cluster-friendly
  const below = ROWS >= 2 ? grid[ROWS - 1] : null;
  grid[ROWS - 1] = generateClusteredRow(below);
}

function doPushUp() {
  pushUp();
  startPushAnim();
  // DÔLEŽITÉ: tu NEVOLÁME resolveAllMatches()
  // match-3 sa rieši LEN po swape hráča
}
