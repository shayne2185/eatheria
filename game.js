const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const COLS = 5;
const ROWS = 7;
const SIZE = Math.min(canvas.width / COLS, canvas.height / (ROWS + 1));

const elements = ["leaf", "stone", "fire", "water", "air"];
const colors = {
  leaf: "#5fa96b",
  stone: "#555",
  fire: "#d66",
  water: "#5aa",
  air: "#eee"
};

let grid = [];
let selected = null;
let animating = false;

// ---------- START ----------

function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  initGrid();
  requestAnimationFrame(loop);
}

// ---------- GRID ----------

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(randomElement());
    }
    grid.push(row);
  }
}

function randomElement() {
  return elements[Math.floor(Math.random() * elements.length)];
}

// ---------- DRAW ----------

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  requestAnimationFrame(loop);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c]) continue;

      drawOrb(
        grid[r][c],
        c * SIZE + SIZE / 2,
        canvas.height - (r + 1) * SIZE
      );
    }
  }
}

function drawOrb(type, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, SIZE * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = colors[type];
  ctx.shadowColor = colors[type];
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ---------- INPUT ----------

canvas.addEventListener("pointerdown", e => {
  if (animating) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = canvas.height - (e.clientY - rect.top);

  const c = Math.floor(x / SIZE);
  const r = Math.floor(y / SIZE);

  if (grid[r] && grid[r][c]) {
    selected = { r, c };
  }
});

canvas.addEventListener("pointerup", e => {
  if (!selected || animating) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = canvas.height - (e.clientY - rect.top);

  const c = Math.floor(x / SIZE);
  const r = Math.floor(y / SIZE);

  const dr = r - selected.r;
  const dc = c - selected.c;

  if (Math.abs(dr) + Math.abs(dc) === 1) {
    swap(selected.r, selected.c, r, c);
    checkMatches();
  }

  selected = null;
});

// ---------- MATCH ----------

function swap(r1, c1, r2, c2) {
  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
}

function checkMatches() {
  let matches = [];

  // horizontal
  for (let r = 0; r < ROWS; r++) {
    let count = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && grid[r][c] === grid[r][c - 1]) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ r, c: c - 1 - i });
          }
        }
        count = 1;
      }
    }
  }

  // vertical
  for (let c = 0; c < COLS; c++) {
    let count = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (r < ROWS && grid[r][c] === grid[r - 1][c]) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ r: r - 1 - i, c });
          }
        }
        count = 1;
      }
    }
  }

  if (matches.length) dissolve(matches);
}

// ---------- DISSOLVE ----------

function dissolve(matches) {
  animating = true;

  matches.forEach(m => {
    grid[m.r][m.c] = null;
  });

  setTimeout(() => {
    collapse();
    animating = false;
  }, 300);
}

// ---------- BOTTOM-UP FILL ----------

function collapse() {
  for (let c = 0; c < COLS; c++) {
    let stack = [];
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c]) stack.push(grid[r][c]);
    }

    while (stack.length < ROWS) {
      stack.unshift(randomElement());
    }

    for (let r = 0; r < ROWS; r++) {
      grid[r][c] = stack[r];
    }
  }

  setTimeout(checkMatches, 100);
}
