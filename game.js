alert("game.js sa načítal");
//Eatheria Zen – Aurora Feint–style endless zen match-3

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menuEl = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const hudEl = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const menuBtn = document.getElementById("menuBtn");
const overlayMessage = document.getElementById("overlayMessage");

let width = window.innerWidth;
let height = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

canvas.style.width = width + "px";
canvas.style.height = height + "px";
canvas.width = width * dpr;
canvas.height = height * dpr;
ctx.scale(dpr, dpr);

// Grid config
const COLS = 8;
const ROWS = 10;
const COLORS = [
  { base: "#22c55e", glow: "#bbf7d0" },
  { base: "#38bdf8", glow: "#e0f2fe" },
  { base: "#a855f7", glow: "#f3e8ff" },
  { base: "#f97316", glow: "#ffedd5" },
  { base: "#facc15", glow: "#fef9c3" }
];

let cellSize;
let gridOffsetX;
let gridOffsetY;

let grid = [];
let isAnimating = false;
let isInputLocked = false;
let dragging = null;

let score = 0;
let combo = 1;
let lastMatchTime = 0;

// Utility
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function now() {
  return performance.now();
}

// Layout
function computeLayout() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const padding = 16;
  const maxGridWidth = width - padding * 2;
  const maxGridHeight = height - padding * 2 - 80; // leave room for HUD

  const cellSizeX = maxGridWidth / COLS;
  const cellSizeY = maxGridHeight / ROWS;
  cellSize = Math.floor(Math.min(cellSizeX, cellSizeY));

  const gridW = cellSize * COLS;
  const gridH = cellSize * ROWS;

  gridOffsetX = (width - gridW) / 2;
  gridOffsetY = (height - gridH) / 2 + 20;
}

// Grid init
function createRandomGem() {
  const type = randInt(0, COLORS.length - 1);
  return {
    type,
    removing: false,
    removeProgress: 0,
    fallOffset: 0
  };
}

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(createRandomGem());
    }
    grid.push(row);
  }
}

// Match detection
function findMatches() {
  const matches = [];
  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let runStart = 0;
    for (let c = 1; c <= COLS; c++) {
      const current = c < COLS ? grid[r][c] : null;
      const prev = grid[r][c - 1];
      if (!current || current.type !== prev.type) {
        const runLength = c - runStart;
        if (runLength >= 3) {
          const cells = [];
          for (let cc = runStart; cc < c; cc++) {
            cells.push({ r, c: cc });
          }
          matches.push(cells);
        }
        runStart = c;
      }
    }
  }
  // vertical
  for (let c = 0; c < COLS; c++) {
    let runStart = 0;
    for (let r = 1; r <= ROWS; r++) {
      const current = r < ROWS ? grid[r][c] : null;
      const prev = grid[r - 1][c];
      if (!current || current.type !== prev.type) {
        const runLength = r - runStart;
        if (runLength >= 3) {
          const cells = [];
          for (let rr = runStart; rr < r; rr++) {
            cells.push({ r: rr, c });
          }
          matches.push(cells);
        }
        runStart = r;
      }
    }
  }
  return matches;
}

// Mark matches for removal
function markMatches(matches) {
  if (!matches.length) return 0;
  const unique = new Set();
  for (const group of matches) {
    for (const cell of group) {
      const key = `${cell.r}-${cell.c}`;
      unique.add(key);
    }
  }
  for (const key of unique) {
    const [r, c] = key.split("-").map(Number);
    const gem = grid[r][c];
    if (gem && !gem.removing) {
      gem.removing = true;
      gem.removeProgress = 0;
    }
  }
  return unique.size;
}

// Remove + collapse
function collapseGrid() {
  // for each column, move non-removed gems down
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const gem = grid[r][c];
      if (!gem.removing) {
        if (writeRow !== r) {
          grid[writeRow][c] = gem;
          grid[r][c] = null;
          gem.fallOffset = (writeRow - r) * -cellSize;
        }
        writeRow--;
      }
    }
    // Fill new gems at top
    for (let r = writeRow; r >= 0; r--) {
      const gem = createRandomGem();
      gem.fallOffset = (r - writeRow - 1) * -cellSize - cellSize * 1.5;
      grid[r][c] = gem;
    }
  }
}

// Score & combo
function applyScoring(clearedCount) {
  const nowTime = now();
  if (nowTime - lastMatchTime < 1600) {
    combo = Math.min(combo + 1, 9);
  } else {
    combo = 1;
  }
  lastMatchTime = nowTime;

  const base = clearedCount * 10;
  const gained = base * combo;
  score += gained;

  scoreEl.textContent = score;
  comboEl.textContent = "x" + combo;

  if (clearedCount >= 6) {
    showOverlayMessage("Deep flow");
  } else if (clearedCount >= 4) {
    showOverlayMessage("Soft cascade");
  }
}

// Overlay messages
let overlayTimeout = null;
function showOverlayMessage(text) {
  overlayMessage.textContent = text;
  overlayMessage.classList.remove("hidden");
  overlayMessage.style.opacity = "1";

  if (overlayTimeout) clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => {
    overlayMessage.style.opacity = "0";
  }, 900);
}

// Animation loop variables
let lastFrameTime = 0;

function update(dt) {
  const removeSpeed = 1.8; // fade speed
  const fallSpeed = 18 * (cellSize / 64);

  let anyRemoving = false;
  let anyFalling = false;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gem = grid[r][c];
      if (!gem) continue;

      if (gem.removing) {
        anyRemoving = true;
        gem.removeProgress += removeSpeed * dt;
        if (gem.removeProgress >= 1) {
          // remove immediately
          grid[r][c] = { ...gem, removedNow: true };
        }
      } else if (gem.fallOffset < 0) {
        anyFalling = true;
        gem.fallOffset = Math.min(
          0,
          gem.fallOffset + fallSpeed * dt
        );
      }
    }
  }

  if (anyRemoving) {
    // once fade is complete, actually null them and collapse in next phase
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const gem = grid[r][c];
        if (gem && gem.removing && gem.removeProgress >= 1) {
          grid[r][c] = null;
        }
      }
    }
    collapseGrid();
  } else if (!anyFalling && !isInputLocked) {
    // After things settled, auto-check for cascades
    const matches = findMatches();
    if (matches.length) {
      isInputLocked = true;
      const cleared = markMatches(matches);
      applyScoring(cleared);
      // small delay then unlock
      setTimeout(() => {
        isInputLocked = false;
      }, 220);
    }
  }
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.2,
    20,
    width * 0.5,
    height * 0.7,
    Math.max(width, height) * 0.8
  );
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(1, "#000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Render
function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gem = grid[r][c];
      if (!gem) continue;

      const x = gridOffsetX + c * cellSize + cellSize / 2;
      const yBase = gridOffsetY + r * cellSize + cellSize / 2;
      const y = yBase + gem.fallOffset;

      let alpha = 1;
      if (gem.removing) {
        alpha = 1 - Math.min(gem.removeProgress, 1);
      }

      const radius = cellSize * 0.36;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Glow
      const glowRadius = radius * 1.5;
      const g = ctx.createRadialGradient(x, y, radius * 0.2, x, y, glowRadius);
      g.addColorStop(0, COLORS[gem.type].glow);
      g.addColorStop(1, "rgba(15,23,42,0)");

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core orb
      const orb = ctx.createLinearGradient(
        x - radius,
        y - radius,
        x + radius,
        y + radius
      );
      orb.addColorStop(0, COLORS[gem.type].base);
      orb.addColorStop(1, "#0f172a");

      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
      ctx.arc(
        x - radius * 0.3,
        y - radius * 0.3,
        radius * 0.35,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
    }
  }
}

function render(timestamp) {
  const t = timestamp || 0;
  const dt = Math.min((t - lastFrameTime) / 1000, 0.033);
  lastFrameTime = t;

  drawBackground();
  if (grid && grid.length) {
    update(dt);
    drawGrid();
  }

  requestAnimationFrame(render);
}

// Input mapping
function posToCell(x, y) {
  const cx = x - gridOffsetX;
  const cy = y - gridOffsetY;
  if (cx < 0 || cy < 0) return null;
  const col = Math.floor(cx / cellSize);
  const row = Math.floor(cy / cellSize);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return { r: row, c: col };
}

function trySwap(a, b) {
  if (!a || !b) return;
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  if (dr + dc !== 1) return; // must be neighbors

  // Perform temporary swap
  const gemA = grid[a.r][a.c];
  const gemB = grid[b.r][b.c];
  grid[a.r][a.c] = gemB;
  grid[b.r][b.c] = gemA;

  const matches = findMatches();
  if (!matches.length) {
    // No match – gently swap back (still zen, no penalty)
    grid[a.r][a.c] = gemA;
    grid[b.r][b.c] = gemB;
    return;
  }

  // Valid move
  isInputLocked = true;
  const cleared = markMatches(matches);
  applyScoring(cleared);

  setTimeout(() => {
    isInputLocked = false;
  }, 220);
}

// Pointer / touch handling
function startDrag(x, y) {
  if (isInputLocked) return;
  const cell = posToCell(x, y);
  if (!cell) return;
  dragging = {
    startCell: cell,
    lastPos: { x, y }
  };
}

function moveDrag(x, y) {
  if (!dragging || isInputLocked) return;
  const dx = x - dragging.lastPos.x;
  const dy = y - dragging.lastPos.y;

  const threshold = cellSize * 0.4;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
    // horizontal swipe
    const dir = dx > 0 ? 1 : -1;
    const target = { r: dragging.startCell.r, c: dragging.startCell.c + dir };
    trySwap(dragging.startCell, target);
    dragging = null;
  } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
    // vertical swipe
    const dir = dy > 0 ? 1 : -1;
    const target = { r: dragging.startCell.r + dir, c: dragging.startCell.c };
    trySwap(dragging.startCell, target);
    dragging = null;
  }
}

function endDrag() {
  dragging = null;
}

// Mouse events (for desktop testing)
canvas.addEventListener("mousedown", (e) => {
  startDrag(e.clientX, e.clientY);
});
canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  moveDrag(e.clientX, e.clientY);
});
window.addEventListener("mouseup", () => {
  endDrag();
});

// Touch events
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  startDrag(t.clientX, t.clientY);
});
canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  moveDrag(t.clientX, t.clientY);
});
canvas.addEventListener("touchend", () => {
  endDrag();
});

// Menu + flow
function startGame() {
  score = 0;
  combo = 1;
  scoreEl.textContent = "0";
  comboEl.textContent = "x1";

  menuEl.classList.add("hidden");
  hudEl.classList.remove("hidden");

  computeLayout();
  initGrid();

  // First auto-clean to avoid initial accidental matches if chceš:
  const initialMatches = findMatches();
  if (initialMatches.length) {
    markMatches(initialMatches);
    collapseGrid();
  }
}

startBtn.addEventListener("click", () => {
  startGame();
});

menuBtn.addEventListener("click", () => {
  // soft pause – len zobrazi menu, hra beží ďalej (stále zen)
  menuEl.classList.remove("hidden");
  hudEl.classList.add("hidden");
});

window.addEventListener("resize", () => {
  computeLayout();
});

// Kick off render loop
computeLayout();
requestAnimationFrame(render);
