// ===============================
// EATHERIA ZEN – BOOTSTRAP
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

let running = false;

// -------------------------------
// START BUTTON
// -------------------------------
startBtn.addEventListener("click", () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  startGame();
});

// -------------------------------
// GAME START
// -------------------------------
function startGame() {
  resize();
  running = true;
  requestAnimationFrame(loop);
}

// -------------------------------
// RESIZE
// -------------------------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);

// -------------------------------
// MAIN LOOP
// -------------------------------
function loop() {
  if (!running) return;

  // background
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // test text (IMPORTANT)
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "GAME RUNNING",
    canvas.width / 2,
    canvas.height / 2
  );

  requestAnimationFrame(loop);
}