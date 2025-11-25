const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const rankingListEl = document.getElementById("rankingList");
const btnRestart = document.getElementById("btnRestart");
const comboEl = document.getElementById("combo");

const toggleNeonPlus = document.getElementById("toggleNeonPlus");
const toggleHard = document.getElementById("toggleHard");
const toggleSound = document.getElementById("toggleSound");
const themeSelect = document.getElementById("themeSelect");

const mobileButtons = document.querySelectorAll(".ctrl-btn");

const tileSize = 24;
const tilesX = canvas.width / tileSize;
const tilesY = canvas.height / tileSize;

let bounds = { minX: 0, minY: 0, maxX: tilesX - 1, maxY: tilesY - 1 };

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 5, y: 5 };
let score = 0;
let highScore = 0;
let gameLoopId = null;
let gameOver = false;

let neonPlusEnabled = false;
let hardModeEnabled = false;

let baseInterval = 140;
let currentInterval = baseInterval;

let lastFoodTime = null;
let comboLevel = 1;

let particles = [];
let trail = [];

const LS_KEY_HIGHSCORE = "snakeNeonHighScore";
const LS_KEY_RANKING = "snakeNeonRanking";

const sounds = {
  eat: new Audio("assets/eat.mp3"),
  death: new Audio("assets/death.mp3")
};
let soundEnabled = true;

const themes = {
  neonGreen: {
    background: "#050505",
    grid: "rgba(0, 255, 204, 0.05)",
    snakeHeadBright: "#00ffcc",
    snakeBody: "rgba(0, 255, 204, 0.65)",
    foodBright: "#ff00aa"
  },
  neonBlue: {
    background: "#030512",
    grid: "rgba(0, 150, 255, 0.06)",
    snakeHeadBright: "#33aaff",
    snakeBody: "rgba(51, 170, 255, 0.7)",
    foodBright: "#ffcc00"
  },
  neonPurple: {
    background: "#06000b",
    grid: "rgba(200, 0, 255, 0.06)",
    snakeHeadBright: "#d400ff",
    snakeBody: "rgba(212, 0, 255, 0.7)",
    foodBright: "#00ffe5"
  },
  matrixGreen: {
    background: "#020902",
    grid: "rgba(0, 255, 0, 0.08)",
    snakeHeadBright: "#00ff00",
    snakeBody: "rgba(0, 255, 0, 0.7)",
    foodBright: "#00ccff"
  },
  vaporwave: {
    background: "#140021",
    grid: "rgba(255, 105, 180, 0.06)",
    snakeHeadBright: "#ff77ff",
    snakeBody: "rgba(255, 119, 255, 0.7)",
    foodBright: "#00ffe5"
  }
};

let activeTheme = themes.neonGreen;

function init() {
  loadHighScore();
  loadRanking();
  attachEvents();
  resetGame();
}

function attachEvents() {
  document.addEventListener("keydown", handleKeyDown);
  btnRestart.addEventListener("click", resetGame);

  toggleNeonPlus.addEventListener("change", () => {
    neonPlusEnabled = toggleNeonPlus.checked;
    comboLevel = 1;
    updateComboUI();
    resetSpeed();
  });

  toggleHard.addEventListener("change", () => {
    hardModeEnabled = toggleHard.checked;
    updateBounds();
    resetGame();
  });

  toggleSound.addEventListener("change", () => {
    soundEnabled = toggleSound.checked;
  });

  themeSelect.addEventListener("change", () => {
    const key = themeSelect.value;
    activeTheme = themes[key] || themes.neonGreen;
    draw();
  });

  mobileButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-dir");
      handleMobileDirection(dir);
    });
  });
}

function updateBounds() {
  if (hardModeEnabled) {
    bounds = { minX: 2, minY: 2, maxX: tilesX - 3, maxY: tilesY - 3 };
  } else {
    bounds = { minX: 0, minY: 0, maxX: tilesX - 1, maxY: tilesY - 1 };
  }
}

function resetGame() {
  snake = [
    { x: Math.floor((bounds.minX + bounds.maxX) / 2) + 1, y: Math.floor((bounds.minY + bounds.maxY) / 2) },
    { x: Math.floor((bounds.minX + bounds.maxX) / 2), y: Math.floor((bounds.minY + bounds.maxY) / 2) },
    { x: Math.floor((bounds.minX + bounds.maxX) / 2) - 1, y: Math.floor((bounds.minY + bounds.maxY) / 2) }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  gameOver = false;
  comboLevel = 1;
  updateComboUI();
  particles = [];
  trail = [];
  lastFoodTime = null;
  resetSpeed();
  placeFood();

  if (gameLoopId) clearInterval(gameLoopId);
  gameLoopId = setInterval(gameLoop, currentInterval);
}

function resetSpeed() {
  baseInterval = 140;
  currentInterval = baseInterval;
  if (gameLoopId) {
    clearInterval(gameLoopId);
    gameLoopId = setInterval(gameLoop, currentInterval);
  }
}

function handleKeyDown(e) {
  const key = e.key;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) {
    e.preventDefault();
  }

  if (gameOver && (key === "Enter" || key === " ")) {
    resetGame();
    return;
  }

  if (key === "ArrowUp" && direction.y !== 1) {
    nextDirection = { x: 0, y: -1 };
  } else if (key === "ArrowDown" && direction.y !== -1) {
    nextDirection = { x: 0, y: 1 };
  } else if (key === "ArrowLeft" && direction.x !== 1) {
    nextDirection = { x: -1, y: 0 };
  } else if (key === "ArrowRight" && direction.x !== -1) {
    nextDirection = { x: 1, y: 0 };
  }
}

function handleMobileDirection(dir) {
  if (dir === "up" && direction.y !== 1) {
    nextDirection = { x: 0, y: -1 };
  } else if (dir === "down" && direction.y !== -1) {
    nextDirection = { x: 0, y: 1 };
  } else if (dir === "left" && direction.x !== 1) {
    nextDirection = { x: -1, y: 0 };
  } else if (dir === "right" && direction.x !== -1) {
    nextDirection = { x: 1, y: 0 };
  }
}

function gameLoop() {
  update();
  draw();
}

function update() {
  if (gameOver) return;

  direction = nextDirection;
  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  if (head.x < bounds.minX || head.x > bounds.maxX || head.y < bounds.minY || head.y > bounds.maxY) {
    endGame();
    return;
  }

  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);
  addTrailPoint(head.x, head.y);

  if (head.x === food.x && head.y === food.y) {
    handleFoodEaten();
  } else {
    snake.pop();
  }

  updateParticles();
  updateTrail();
}

function handleFoodEaten() {
  const now = performance.now();
  if (lastFoodTime === null) {
    comboLevel = 1;
  } else {
    const delta = now - lastFoodTime;
    if (delta < 2500) {
      comboLevel = Math.min(comboLevel + 1, 5);
    } else {
      comboLevel = 1;
    }
  }
  lastFoodTime = now;

  updateComboUI();

  let gained = 10;
  if (neonPlusEnabled) {
    gained = 10 * comboLevel;
  }

  score += gained;
  scoreEl.textContent = score;

  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    saveHighScore();
  }

  if (neonPlusEnabled) {
    increaseSpeed();
  }

  spawnParticles(food.x, food.y, activeTheme.foodBright, 12);
  playSound("eat");
  placeFood();
}

function updateComboUI() {
  if (!comboEl) return;
  if (!neonPlusEnabled) {
    comboEl.textContent = "x1";
    comboEl.style.opacity = "0.5";
  } else {
    comboEl.textContent = "x" + comboLevel;
    comboEl.style.opacity = comboLevel > 1 ? "1" : "0.7";
  }
}

function increaseSpeed() {
  const targetInterval = Math.max(60, baseInterval - Math.floor(score / 40) * 5);
  if (targetInterval !== currentInterval) {
    currentInterval = targetInterval;
    if (gameLoopId) {
      clearInterval(gameLoopId);
    }
    gameLoopId = setInterval(gameLoop, currentInterval);
  }
}

function placeFood() {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1)) + bounds.minX,
      y: Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1)) + bounds.minY
    };
    const onSnake = snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
    if (!onSnake) break;
  }
  food = newFood;
  spawnParticles(food.x, food.y, activeTheme.foodBright, 10);
}

function draw() {
  ctx.fillStyle = activeTheme.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = activeTheme.grid;
  for (let x = 0; x <= tilesX; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileSize, 0);
    ctx.lineTo(x * tileSize, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= tilesY; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileSize);
    ctx.lineTo(canvas.width, y * tileSize);
    ctx.stroke();
  }

  if (hardModeEnabled) {
    const pad = 1.5;
    ctx.strokeStyle = "rgba(255, 0, 136, 0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      (bounds.minX + pad) * tileSize - tileSize * pad,
      (bounds.minY + pad) * tileSize - tileSize * pad,
      (bounds.maxX - bounds.minX + 1 - pad * 2) * tileSize + tileSize * pad * 2,
      (bounds.maxY - bounds.minY + 1 - pad * 2) * tileSize + tileSize * pad * 2
    );
    ctx.lineWidth = 1;
  }

  drawTrail();

  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    const isHead = i === 0;
    const x = segment.x * tileSize;
    const y = segment.y * tileSize;

    if (isHead) {
      const gradient = ctx.createRadialGradient(
        x + tileSize / 2,
        y + tileSize / 2,
        4,
        x + tileSize / 2,
        y + tileSize / 2,
        tileSize
      );
      gradient.addColorStop(0, activeTheme.snakeHeadBright);
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.strokeStyle = activeTheme.snakeHeadBright;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = activeTheme.snakeBody;
      ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
    }
  }

  const fx = food.x * tileSize;
  const fy = food.y * tileSize;
  const fGradient = ctx.createRadialGradient(
    fx + tileSize / 2,
    fy + tileSize / 2,
    3,
    fx + tileSize / 2,
    fy + tileSize / 2,
    tileSize
  );
  fGradient.addColorStop(0, activeTheme.foodBright);
  fGradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fGradient;
  ctx.fillRect(fx, fy, tileSize, tileSize);

  drawParticles();
}

function endGame() {
  gameOver = true;
  clearInterval(gameLoopId);
  spawnParticles(snake[0].x, snake[0].y, activeTheme.foodBright, 25);
  playSound("death");
  drawGameOverText();

  setTimeout(() => {
    const playerName =
      prompt("Game Over! Digite seu nome para o ranking (ou deixe vazio para 'Player')") ||
      "Player";
    addScoreToRanking(playerName, score);
    renderRanking();
  }, 150);
}

function drawGameOverText() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, canvas.height / 2 - 48, canvas.width, 96);

  ctx.font = "32px 'Segoe UI', sans-serif";
  ctx.fillStyle = activeTheme.foodBright;
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 5);

  ctx.font = "16px 'Segoe UI', sans-serif";
  ctx.fillStyle = "#cccccc";
  ctx.fillText("Pressione Enter ou clique em Restart", canvas.width / 2, canvas.height / 2 + 20);
}

function loadHighScore() {
  const stored = localStorage.getItem(LS_KEY_HIGHSCORE);
  if (stored) {
    highScore = parseInt(stored, 10) || 0;
  } else {
    highScore = 0;
  }
  highScoreEl.textContent = highScore;
}

function saveHighScore() {
  localStorage.setItem(LS_KEY_HIGHSCORE, String(highScore));
}

function loadRanking() {
  const stored = localStorage.getItem(LS_KEY_RANKING);
  if (!stored) {
    renderRanking([]);
    return;
  }
  try {
    const ranking = JSON.parse(stored);
    renderRanking(ranking);
  } catch (e) {
    renderRanking([]);
  }
}

function addScoreToRanking(name, score) {
  const stored = localStorage.getItem(LS_KEY_RANKING);
  let ranking = [];
  if (stored) {
    try {
      ranking = JSON.parse(stored);
    } catch (e) {
      ranking = [];
    }
  }

  ranking.push({
    name,
    score,
    date: new Date().toISOString()
  });

  ranking.sort((a, b) => b.score - a.score);
  ranking = ranking.slice(0, 10);

  localStorage.setItem(LS_KEY_RANKING, JSON.stringify(ranking));
  renderRanking(ranking);
}

function renderRanking(rankingArray) {
  rankingListEl.innerHTML = "";
  if (!rankingArray || rankingArray.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nenhum score ainda. Jogue para entrar no ranking!";
    rankingListEl.appendChild(li);
    return;
  }
  rankingArray.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} — ${item.score} pts`;
    rankingListEl.appendChild(li);
  });
}

function spawnParticles(gridX, gridY, color, amount) {
  const cx = gridX * tileSize + tileSize / 2;
  const cy = gridY * tileSize + tileSize / 2;
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.7 + Math.random() * 1.3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400 + Math.random() * 250,
      color,
      size: 2 + Math.random() * 2,
      created: performance.now()
    });
  }
}

function updateParticles() {
  const now = performance.now();
  particles = particles.filter(p => now - p.created < p.life);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
  });
}

function drawParticles() {
  const now = performance.now();
  particles.forEach(p => {
    const t = (now - p.created) / p.life;
    const alpha = 1 - t;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function addTrailPoint(gridX, gridY) {
  trail.push({
    x: gridX,
    y: gridY,
    created: performance.now()
  });
}

function updateTrail() {
  const now = performance.now();
  trail = trail.filter(t => now - t.created < 500);
}

function drawTrail() {
  const now = performance.now();
  trail.forEach(t => {
    const elapsed = now - t.created;
    const alpha = Math.max(0, 1 - elapsed / 500);
    const x = t.x * tileSize;
    const y = t.y * tileSize;
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = activeTheme.snakeBody;
    ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
    ctx.globalAlpha = 1;
  });
}

function playSound(key) {
  if (!soundEnabled) return;
  const s = sounds[key];
  if (!s) return;
  try {
    s.currentTime = 0;
    s.play();
  } catch (e) {
  }
}

init();