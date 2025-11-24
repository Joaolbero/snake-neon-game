const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const rankingListEl = document.getElementById("rankingList");
const btnRestart = document.getElementById("btnRestart");

const tileSize = 24;
const tilesX = canvas.width / tileSize;
const tilesY = canvas.height / tileSize;

let snake = [];
let direction = { x: 1, y: 0 };
let food = { x: 5, y: 5 };
let score = 0;
let highScore = 0;
let gameLoopId = null;
let gameOver = false;

const LS_KEY_HIGHSCORE = "snakeNeonHighScore";
const LS_KEY_RANKING = "snakeNeonRanking";


function init() {
  loadHighScore();
  loadRanking();

  resetGame();
  document.addEventListener("keydown", handleKeyDown);
  btnRestart.addEventListener("click", resetGame);
}

function resetGame() {
  snake = [
    { x: 4, y: 10 },
    { x: 3, y: 10 },
    { x: 2, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  gameOver = false;

  placeFood();

  if (gameLoopId) {
    clearInterval(gameLoopId);
  }

  gameLoopId = setInterval(gameLoop, 120);
}

function handleKeyDown(e) {
  const key = e.key;

  if (gameOver && (key === "Enter" || key === " ")) {
    resetGame();
    return;
  }

  if (key === "ArrowUp" && direction.y !== 1) {
    direction = { x: 0, y: -1 };
  } else if (key === "ArrowDown" && direction.y !== -1) {
    direction = { x: 0, y: 1 };
  } else if (key === "ArrowLeft" && direction.x !== 1) {
    direction = { x: -1, y: 0 };
  } else if (key === "ArrowRight" && direction.x !== -1) {
    direction = { x: 1, y: 0 };
  }
}

function gameLoop() {
  update();
  draw();
}

function update() {
  if (gameOver) return;

  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  if (head.x < 0 || head.x >= tilesX || head.y < 0 || head.y >= tilesY) {
    endGame();
    return;
  }

  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      saveHighScore();
    }
    placeFood();
  } else {
   
    snake.pop();
  }
}

function draw() {
  
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0, 255, 204, 0.05)";
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
      gradient.addColorStop(0, "#00ffcc");
      gradient.addColorStop(1, "rgba(0, 255, 204, 0.1)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    } else {
      ctx.fillStyle = "rgba(0, 255, 204, 0.6)";
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
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
  fGradient.addColorStop(0, "#ff00aa");
  fGradient.addColorStop(1, "rgba(255, 0, 170, 0.05)");

  ctx.fillStyle = fGradient;
  ctx.fillRect(fx, fy, tileSize, tileSize);
}

function placeFood() {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * tilesX),
      y: Math.floor(Math.random() * tilesY)
    };

    const onSnake = snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
    if (!onSnake) break;
  }
  food = newFood;
}

function endGame() {
  gameOver = true;
  clearInterval(gameLoopId);

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
  ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

  ctx.font = "32px 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ff00aa";
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
    console.error("Erro ao carregar ranking:", e);
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

  rankingArray.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} — ${item.score} pts`;
    rankingListEl.appendChild(li);
  });
}

init();