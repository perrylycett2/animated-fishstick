const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const comboEl = document.getElementById('combo');
const peakComboEl = document.getElementById('peakCombo');
const energyEl = document.getElementById('energy');
const energyBar = document.getElementById('energyBar');
const tideBar = document.getElementById('tideBar');
const tideCountdownEl = document.getElementById('tideCountdown');
const resetBtn = document.getElementById('reset');

const HIGH_SCORE_KEY = 'animatedFishstickHighScore';
const BEST_COMBO_KEY = 'animatedFishstickBestCombo';
const MAX_ENERGY = 130;
const MAX_COMBO = 5;
const DASH_ACTIVE_TIME = 260;

function readStoredHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch (err) {
    return 0;
  }
}

function writeStoredHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, value.toString());
  } catch (err) {
    /* no-op */
  }
}

function readStoredBestCombo() {
  try {
    return Number(localStorage.getItem(BEST_COMBO_KEY)) || 1;
  } catch (err) {
    return 1;
  }
}

function writeStoredBestCombo(value) {
  try {
    localStorage.setItem(BEST_COMBO_KEY, value.toString());
  } catch (err) {
    /* no-op */
  }
}

const savedHighScore = readStoredHighScore();
const savedBestCombo = readStoredBestCombo();

const state = {
  running: true,
  score: 0,
  highScore: savedHighScore,
  energy: MAX_ENERGY,
  combo: 1,
  bestCombo: savedBestCombo,
  comboTimer: 0,
  lastTime: 0,
  dashTimer: 0,
  dashActive: 0,
  inputs: new Set(),
  sparks: [],
  hazards: [],
  bubbles: [],
  currents: [],
  oilTides: [],
  nextTide: 0,
  tideWindow: 1,
};

const player = {
  x: 100,
  y: 200,
  w: 60,
  h: 22,
  vx: 0,
  vy: 0,
};

function scheduleNextTide() {
  state.tideWindow = 6500 + Math.random() * 4500;
  state.nextTide = state.tideWindow;
}

function resetOcean() {
  state.running = true;
  state.score = 0;
  state.energy = MAX_ENERGY;
  state.combo = 1;
  state.comboTimer = 0;
  state.dashTimer = 0;
  state.dashActive = 0;
  state.sparks = [];
  state.hazards = [];
  state.bubbles = [];
  state.currents = [];
  state.oilTides = [];
  scheduleNextTide();
  player.x = 100;
  player.y = canvas.height / 2;
  player.vx = 0;
  player.vy = 0;
  updateHud();
}

resetBtn.addEventListener('click', resetOcean);

window.addEventListener('keydown', (ev) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) {
    ev.preventDefault();
  }
  state.inputs.add(ev.key.toLowerCase());
  if (!state.running && ev.key.toLowerCase() === 'r') {
    resetOcean();
  }
});

window.addEventListener('keyup', (ev) => {
  state.inputs.delete(ev.key.toLowerCase());
});

function spawnSpark() {
  state.sparks.push({
    x: canvas.width + Math.random() * 100,
    y: 80 + Math.random() * (canvas.height - 160),
    r: 8 + Math.random() * 6,
    speed: 1 + Math.random() * 1.5,
    life: 10,
  });
}

function spawnHazard() {
  state.hazards.push({
    x: canvas.width + Math.random() * 120,
    y: 60 + Math.random() * (canvas.height - 120),
    r: 14 + Math.random() * 12,
    speed: 1.5 + Math.random() * 1.5,
    wobble: Math.random() * Math.PI * 2,
  });
}

function spawnBubble() {
  state.bubbles.push({
    x: Math.random() * canvas.width,
    y: canvas.height + 20,
    r: 4 + Math.random() * 8,
    speed: 0.3 + Math.random() * 0.6,
  });
}

function spawnCurrent() {
  state.currents.push({
    x: canvas.width + 100,
    y: 80 + Math.random() * (canvas.height - 160),
    rx: 60 + Math.random() * 50,
    ry: 20 + Math.random() * 15,
    speed: 0.6 + Math.random() * 0.6,
    life: 9000 + Math.random() * 4000,
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnOilTide() {
  const warning = 900 + Math.random() * 600;
  state.oilTides.push({
    x: canvas.width + 120,
    width: 90 + Math.random() * 60,
    gapY: 70 + Math.random() * (canvas.height - 180),
    gapHeight: 100 + Math.random() * 90,
    speed: 0.6 + Math.random() * 0.5,
    warning,
    warningTotal: warning,
    scored: false,
  });
}

function update(delta) {
  if (!state.running) return;

  state.dashTimer = Math.max(0, state.dashTimer - delta);
  state.dashActive = Math.max(0, state.dashActive - delta);

  const accel = 0.0004 * delta;
  if (state.inputs.has('arrowup') || state.inputs.has('w')) player.vy -= accel;
  if (state.inputs.has('arrowdown') || state.inputs.has('s')) player.vy += accel;
  if (state.inputs.has('arrowleft') || state.inputs.has('a')) player.vx -= accel;
  if (state.inputs.has('arrowright') || state.inputs.has('d')) player.vx += accel;

  const spacePressed = state.inputs.has(' ');
  if (spacePressed && state.dashTimer === 0 && state.energy > 5) {
    const dashStrength = 0.0045 * delta;
    player.vx += dashStrength;
    state.energy -= 5;
    state.dashTimer = 800;
    state.dashActive = DASH_ACTIVE_TIME;
  }

  const driftLoss = 0.0002 * delta;
  state.energy = Math.max(0, state.energy - driftLoss);

  player.vx *= 0.985;
  player.vy *= 0.985;
  player.x += player.vx * delta * 0.06;
  player.y += player.vy * delta * 0.06;

  player.x = Math.max(20, Math.min(canvas.width - 80, player.x));
  player.y = Math.max(30, Math.min(canvas.height - 30, player.y));

  handleComboTimer(delta);

  state.nextTide -= delta;
  if (state.nextTide <= 0) {
    spawnOilTide();
    scheduleNextTide();
  }

  if (state.sparks.length < 6 && Math.random() < 0.03) {
    spawnSpark();
  }
  if (state.hazards.length < 4 && Math.random() < 0.02) {
    spawnHazard();
  }
  if (state.currents.length < 2 && Math.random() < 0.01) {
    spawnCurrent();
  }
  if (state.bubbles.length < 20 && Math.random() < 0.08) {
    spawnBubble();
  }

  state.sparks.forEach((spark) => {
    spark.x -= spark.speed * delta * 0.05;
    spark.life -= delta * 0.001;
  });
  state.sparks = state.sparks.filter((spark) => spark.x > -20 && spark.life > 0);

  state.hazards.forEach((hazard) => {
    hazard.x -= hazard.speed * delta * 0.05;
    hazard.wobble += 0.002 * delta;
  });
  state.hazards = state.hazards.filter((hazard) => hazard.x > -30);

  state.bubbles.forEach((bubble) => {
    bubble.y -= bubble.speed * delta * 0.05;
  });
  state.bubbles = state.bubbles.filter((bubble) => bubble.y > -20);

  state.currents.forEach((current) => {
    current.x -= current.speed * delta * 0.05;
    current.life -= delta;
    current.pulse += delta * 0.0015;
  });
  state.currents = state.currents.filter(
    (current) => current.x + current.rx > -40 && current.life > 0
  );

  state.oilTides.forEach((tide) => {
    if (tide.warning > 0) {
      tide.warning -= delta;
    } else {
      tide.x -= tide.speed * delta * 0.05;
    }
  });
  state.oilTides = state.oilTides.filter((tide) => tide.x + tide.width > -60);

  detectCollisions();
  updateHud();

  if (state.energy <= 0) {
    state.energy = 0;
    state.running = false;
  }
}

function handleComboTimer(delta) {
  if (state.combo > 1) {
    state.comboTimer -= delta;
    if (state.comboTimer <= 0) {
      state.combo -= 1;
      if (state.combo > 1) {
        state.comboTimer = 1500;
      } else {
        state.combo = 1;
        state.comboTimer = 0;
      }
    }
  }
}

function detectCollisions() {
  const bounds = getPlayerBounds();
  for (let i = state.sparks.length - 1; i >= 0; i -= 1) {
    const spark = state.sparks[i];
    if (intersectsCircle(spark, player)) {
      awardPoints(5);
      state.energy = Math.min(MAX_ENERGY, state.energy + 7);
      bumpCombo();
      state.sparks.splice(i, 1);
    }
  }

  for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
    const hazard = state.hazards[i];
    if (intersectsCircle(hazard, player)) {
      state.energy -= 18;
      player.vx -= 0.4;
      player.vy -= 0.2;
      state.combo = 1;
      state.comboTimer = 0;
      state.hazards.splice(i, 1);
    }
  }

  for (let i = state.currents.length - 1; i >= 0; i -= 1) {
    const current = state.currents[i];
    if (intersectsCurrent(current, player)) {
      if (state.dashActive > 0) {
        awardPoints(20);
        state.energy = Math.min(MAX_ENERGY, state.energy + 12);
        bumpCombo();
      } else {
        state.energy -= 8;
        state.combo = 1;
        state.comboTimer = 0;
      }
      state.currents.splice(i, 1);
    }
  }

  for (let i = state.oilTides.length - 1; i >= 0; i -= 1) {
    const tide = state.oilTides[i];
    if (tide.warning > 0) {
      continue;
    }

    const overlapsX = bounds.right > tide.x && bounds.left < tide.x + tide.width;
    const hitsTop = bounds.top < tide.gapY;
    const hitsBottom = bounds.bottom > tide.gapY + tide.gapHeight;

    if (overlapsX && (hitsTop || hitsBottom)) {
      if (state.dashActive > 0) {
        awardPoints(35);
        state.energy = Math.min(MAX_ENERGY, state.energy + 18);
        bumpCombo();
      } else {
        state.energy -= 28;
        state.combo = 1;
        state.comboTimer = 0;
      }
      state.oilTides.splice(i, 1);
      continue;
    }

    if (!tide.scored && bounds.left > tide.x + tide.width) {
      awardPoints(10);
      state.energy = Math.min(MAX_ENERGY, state.energy + 4);
      bumpCombo();
      tide.scored = true;
    }
  }
}

function awardPoints(base) {
  const gained = Math.round(base * state.combo);
  state.score += gained;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    writeStoredHighScore(state.highScore);
  }
}

function bumpCombo() {
  state.combo = Math.min(MAX_COMBO, state.combo + 1);
  if (state.combo > 1) {
    state.comboTimer = 2500 + state.combo * 350;
  }
  if (state.combo > state.bestCombo) {
    state.bestCombo = state.combo;
    writeStoredBestCombo(state.bestCombo);
  }
}

function updateHud() {
  scoreEl.textContent = state.score.toString();
  highScoreEl.textContent = state.highScore.toString();
  comboEl.textContent = `x${state.combo}`;
  peakComboEl.textContent = `x${state.bestCombo}`;
  energyEl.textContent = Math.max(0, Math.round(state.energy)).toString();
  const barWidth = Math.max(0, Math.min(1, state.energy / MAX_ENERGY)) * 100;
  energyBar.style.width = `${barWidth}%`;

  tideBar.classList.remove('is-warning', 'is-raging');
  const hasActiveSurge = state.oilTides.some((tide) => tide.warning <= 0);
  const hasWarning = state.oilTides.some((tide) => tide.warning > 0);
  const tideProgress = state.tideWindow
    ? clamp(1 - state.nextTide / state.tideWindow, 0, 1)
    : 0;
  tideBar.style.width = `${(tideProgress * 100).toFixed(1)}%`;

  let tideLabel = 'Calm';
  if (hasActiveSurge) {
    tideLabel = 'Surging';
    tideBar.classList.add('is-raging');
  } else if (hasWarning) {
    tideLabel = 'Warning';
    tideBar.classList.add('is-warning');
  } else if (state.nextTide < 2000) {
    tideLabel = 'Imminent';
    tideBar.classList.add('is-warning');
  } else if (state.nextTide < 4000) {
    tideLabel = 'Forming';
  }
  tideCountdownEl.textContent = tideLabel;
}

function getPlayerBounds() {
  return {
    left: player.x,
    right: player.x + player.w,
    top: player.y - player.h / 2,
    bottom: player.y + player.h / 2,
  };
}

function intersectsCircle(circle, rect) {
  const closestX = clamp(rect.x + rect.w / 2, circle.x - circle.r, circle.x + circle.r);
  const closestY = clamp(rect.y, circle.y - circle.r, circle.y + circle.r);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function intersectsCurrent(current, rect) {
  const px = rect.x + rect.w / 2;
  const py = rect.y;
  const dx = (px - current.x) / current.rx;
  const dy = (py - current.y) / current.ry;
  return dx * dx + dy * dy <= 1;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function drawBackground(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0a4d6a');
  gradient.addColorStop(0.4, '#032233');
  gradient.addColorStop(1, '#01070f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const amplitude = 16 + i * 12;
    const offset = (time * 0.0002 + i) * 100;
    ctx.moveTo(0, 200);
    for (let x = 0; x <= canvas.width; x += 6) {
      const y = 200 + Math.sin((x + offset) * 0.01) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255,255,255,${0.18 - i * 0.05})`;
    ctx.stroke();
  }
  ctx.restore();
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPlayer(time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  const wobble = Math.sin(time * 0.008) * 4;
  const crumbGradient = ctx.createLinearGradient(0, -player.h / 2, player.w, player.h);
  crumbGradient.addColorStop(0, '#f0c77a');
  crumbGradient.addColorStop(0.5, '#d3812b');
  crumbGradient.addColorStop(1, '#a7521c');
  ctx.fillStyle = crumbGradient;
  ctx.strokeStyle = '#ffe7b0';
  ctx.lineWidth = 2;
  roundedRectPath(0, -player.h / 2 + wobble * 0.1, player.w, player.h, 12);
  ctx.fill();
  ctx.stroke();

  const crispTexture = ctx.createLinearGradient(0, 0, player.w, 0);
  crispTexture.addColorStop(0, 'rgba(255,255,255,0.35)');
  crispTexture.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = crispTexture;
  ctx.globalAlpha = 0.6;
  roundedRectPath(6, -player.h / 2 + wobble * 0.15, player.w - 12, player.h - 6, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1b1c2f';
  ctx.beginPath();
  ctx.arc(player.w - 16, -2 + wobble * 0.05, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#71eaff';
  ctx.beginPath();
  ctx.ellipse(10, wobble * 0.15, 12, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCurrents(time) {
  ctx.save();
  state.currents.forEach((current) => {
    ctx.save();
    ctx.translate(current.x, current.y);
    const pulse = 0.7 + Math.sin(time * 0.002 + current.pulse) * 0.15;
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(255, 199, 127, ${0.5 * pulse})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, current.rx * pulse, current.ry * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.ellipse(0, 0, current.rx * 0.7, current.ry * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawTides(time) {
  ctx.save();
  state.oilTides.forEach((tide) => {
    if (tide.warning > 0) {
      const progress = 1 - tide.warning / tide.warningTotal;
      const glowWidth = 10 + progress * 14;
      const gradient = ctx.createLinearGradient(
        canvas.width - glowWidth,
        0,
        canvas.width,
        0
      );
      gradient.addColorStop(0, `rgba(255, 199, 144, ${0.1 + progress * 0.2})`);
      gradient.addColorStop(1, `rgba(255, 88, 54, ${0.3 + progress * 0.4})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(canvas.width - glowWidth, 0, glowWidth, canvas.height);
      return;
    }

    const gradient = ctx.createLinearGradient(tide.x, 0, tide.x + tide.width, 0);
    gradient.addColorStop(0, 'rgba(255, 199, 144, 0.75)');
    gradient.addColorStop(0.45, 'rgba(255, 124, 73, 0.85)');
    gradient.addColorStop(1, 'rgba(209, 53, 57, 0.65)');
    ctx.fillStyle = gradient;
    ctx.fillRect(tide.x, 0, tide.width, tide.gapY);
    const bottomHeight = Math.max(0, canvas.height - (tide.gapY + tide.gapHeight));
    if (bottomHeight > 0) {
      ctx.fillRect(tide.x, tide.gapY + tide.gapHeight, tide.width, bottomHeight);
    }

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff4dc';
    ctx.fillRect(tide.x - 2, tide.gapY - 6, tide.width + 4, 3);
    ctx.fillRect(tide.x - 2, tide.gapY + tide.gapHeight + 3, tide.width + 4, 3);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = '#ff8f56';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(255, 180, 140, 0.4)';
    ctx.strokeRect(tide.x, 0, tide.width, canvas.height);
    ctx.restore();
  });
  ctx.restore();
}

function drawEntities(time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  state.bubbles.forEach((bubble) => {
    ctx.beginPath();
    ctx.globalAlpha = 0.2 + bubble.r * 0.04;
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fillStyle = '#a0ecff';
    ctx.fill();
  });
  ctx.restore();

  drawCurrents(time);
  drawTides(time);

  state.sparks.forEach((spark) => {
    ctx.save();
    ctx.translate(spark.x, spark.y);
    ctx.rotate((spark.life % 1) * Math.PI * 2);
    const gradient = ctx.createLinearGradient(-spark.r, 0, spark.r, 0);
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(1, '#f5b948');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-spark.r, 0);
    ctx.lineTo(0, spark.r);
    ctx.lineTo(spark.r, 0);
    ctx.lineTo(0, -spark.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  state.hazards.forEach((hazard) => {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(Math.sin(hazard.wobble) * 0.5);
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath();
    ctx.arc(0, 0, hazard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#ffd1d1';
    ctx.arc(-hazard.r / 2, -hazard.r / 3, hazard.r / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 10, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff9e8';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px "Trebuchet MS"';
  ctx.fillText('The batter went soggy!', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '20px "Trebuchet MS"';
  ctx.fillText('Press R or Reset Ocean to crisp up again.', canvas.width / 2, canvas.height / 2 + 20);
  ctx.restore();
}

function loop(timestamp) {
  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;

  drawBackground(timestamp);
  update(delta);
  drawEntities(timestamp);
  drawPlayer(timestamp);

  if (!state.running) {
    drawGameOver();
  }

  requestAnimationFrame(loop);
}

resetOcean();
requestAnimationFrame(loop);
