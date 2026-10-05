// Game state
const game = {
  score: 0,
  highScore: 0,
  velocity: 0,
  gameOver: false,
  started: false,
  plane: { x: 80, y: 0, rotation: 0 },
  obstacles: [],
  coins: [],
  clouds: [],
};

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const startBtn = document.getElementById("startBtn");
const flapBtn = document.getElementById("flapBtn");

// Sound
let audioCtx = null;
function playSound(freq, duration, type = "sine", volume = 0.3) {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration,
    );
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// Canvas resize
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  if (!game.started) {
    game.plane.y = canvas.height / 2;
  }
}
window.addEventListener("resize", resizeCanvas);

// Load high score
try {
  game.highScore = parseInt(localStorage.getItem("planeGameHighScore")) || 0;
} catch (e) {
  game.highScore = 0;
}
highScoreEl.textContent = `High: ${game.highScore}`;

// Create clouds
function createCloud(x) {
  return {
    x: x,
    y: 30 + Math.random() * (canvas.height * 0.5),
    size: 20 + Math.random() * 40,
    speed: 0.5 + Math.random() * 0.5,
  };
}

// Create obstacles (pipes)
function createObstacle() {
  const gapSize = 140;
  const gapY = 80 + Math.random() * (canvas.height - gapSize - 160);
  return {
    x: canvas.width + 50,
    gapY: gapY,
    gapSize: gapSize,
    width: 60,
    passed: false,
  };
}

// Create coins
function createCoin(x, y) {
  return { x: x, y: y, radius: 12, collected: false };
}

// Draw functions
function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawClouds() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  game.clouds.forEach((cloud) => {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.arc(
      cloud.x + cloud.size * 0.8,
      cloud.y - cloud.size * 0.3,
      cloud.size * 0.7,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      cloud.x + cloud.size * 1.6,
      cloud.y,
      cloud.size * 0.8,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
}

function drawObstacles() {
  ctx.fillStyle = "#4CAF50";
  game.obstacles.forEach((obs) => {
    // Top pipe
    ctx.fillRect(obs.x, 0, obs.width, obs.gapY);
    // Bottom pipe
    ctx.fillRect(
      obs.x,
      obs.gapY + obs.gapSize,
      obs.width,
      canvas.height - obs.gapY - obs.gapSize,
    );
    // Pipe caps
    ctx.fillStyle = "#388E3C";
    ctx.fillRect(obs.x - 5, obs.gapY - 15, obs.width + 10, 15);
    ctx.fillRect(obs.x - 5, obs.gapY + obs.gapSize, obs.width + 10, 15);
    ctx.fillStyle = "#4CAF50";
  });
}

function drawCoins() {
  game.coins.forEach((coin) => {
    if (!coin.collected) {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFA500";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Dollar sign
      ctx.fillStyle = "#FFA500";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", coin.x, coin.y);
    }
  });
}

function drawPlane() {
  ctx.save();
  ctx.translate(game.plane.x, game.plane.y);
  ctx.rotate(game.plane.rotation);

  // Plane body
  ctx.fillStyle = "#E74C3C";
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = "#C0392B";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-25, -20);
  ctx.lineTo(10, -5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-25, 20);
  ctx.lineTo(10, 5);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.fillStyle = "#C0392B";
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-45, -15);
  ctx.lineTo(-40, 0);
  ctx.lineTo(-45, 15);
  ctx.closePath();
  ctx.fill();

  // Window
  ctx.fillStyle = "#87CEEB";
  ctx.beginPath();
  ctx.arc(15, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${game.score}`, canvas.width / 2, canvas.height / 2);

  ctx.font = "20px Arial";
  ctx.fillText(
    `High Score: ${game.highScore}`,
    canvas.width / 2,
    canvas.height / 2 + 40,
  );

  ctx.font = "18px Arial";
  ctx.fillText("Tap to restart", canvas.width / 2, canvas.height / 2 + 80);
}

function draw() {
  drawSky();
  drawClouds();
  drawObstacles();
  drawCoins();
  drawPlane();

  if (game.gameOver) {
    drawGameOver();
  }
}
