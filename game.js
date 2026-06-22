// ============================================================
//  FOOTBALL ARENA — HTML5 Canvas 足球竞技场
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- 画布尺寸 ---
const W = 900, H = 600;
canvas.width = W;
canvas.height = H;

// --- 球场参数 ---
const FIELD = { x: 50, y: 50, w: W - 100, h: H - 100 };
const GOAL_W = 16, GOAL_H = 100;
const BALL_R = 8;
const PLAYER_R = 22;

// --- 输入状态 ---
const keys = {};
let mouse = { x: W/2, y: H/2 };

window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (W / rect.width);
  mouse.y = (e.clientY - rect.top) * (H / rect.height);
});

// --- 球 ---
const ball = {
  x: W/2, y: H/2, vx: 0, vy: 0,
  friction: 0.985,
};

// --- 球员 ---
function createPlayer(x, y, color, isHuman) {
  return { x, y, vx: 0, vy: 0, color, isHuman, speed: 3.5 };
}

const human = createPlayer(W * 0.3, H/2, '#e94560', true);
const ai = createPlayer(W * 0.7, H/2, '#0f3460', false);

let score = { human: 0, ai: 0 };

// --- AI 行为 ---
function aiMove() {
  const target = ball;
  const dx = target.x - ai.x;
  const dy = target.y - ai.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 1) {
    ai.vx = (dx / dist) * ai.speed * 0.7;
    ai.vy = (dy / dist) * ai.speed * 0.7;
  }
  // 如果球在 AI 半场，更积极去扑
  if (ball.x > W/2) {
    ai.vx = (dx / dist) * ai.speed * 0.95;
    ai.vy = (dy / dist) * ai.speed * 0.95;
  }
}

// --- 碰撞检测 ---
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function playerBallCollision(player) {
  const d = dist(player, ball);
  if (d < PLAYER_R + BALL_R) {
    // 反弹
    let nx = ball.x - player.x;
    let ny = ball.y - player.y;
    const len = Math.hypot(nx, ny);
    if (len === 0) { nx = 1; ny = 0; } else { nx /= len; ny /= len; }
    
    // 踢球力度 = 球员速度投影 + 基础值
    const kickBase = 4;
    const kickVx = player.vx * 1.5 + nx * kickBase;
    const kickVy = player.vy * 1.5 + ny * kickBase;
    
    ball.vx = kickVx;
    ball.vy = kickVy;
    
    // 分离
    const overlap = PLAYER_R + BALL_R - d;
    if (overlap > 0) {
      ball.x += nx * (overlap + 2);
      ball.y += ny * (overlap + 2);
    }
  }
}

// --- 边界 & 进球 ---
function checkGoal() {
  // 左边球门 (AI 的球门，人类得分)
  const lgx = FIELD.x - GOAL_W * 0.5;
  const lgy = FIELD.y + FIELD.h/2 - GOAL_H/2;
  if (ball.y > lgy && ball.y < lgy + GOAL_H) {
    if (ball.x < FIELD.x) {
      score.human++;
      resetBall();
      return;
    }
  }
  // 右边球门 (人类的球门，AI 得分)
  const rgx = FIELD.x + FIELD.w;
  if (ball.y > lgy && ball.y < lgy + GOAL_H) {
    if (ball.x > rgx) {
      score.ai++;
      resetBall();
      return;
    }
  }
  // 上下边界
  if (ball.y - BALL_R < FIELD.y) { ball.y = FIELD.y + BALL_R; ball.vy *= -0.6; }
  if (ball.y + BALL_R > FIELD.y + FIELD.h) { ball.y = FIELD.y + FIELD.h - BALL_R; ball.vy *= -0.6; }
  // 左右边界（非球门区）
  if (ball.y < lgy || ball.y > lgy + GOAL_H) {
    if (ball.x - BALL_R < FIELD.x) { ball.x = FIELD.x + BALL_R; ball.vx *= -0.6; }
    if (ball.x + BALL_R > FIELD.x + FIELD.w) { ball.x = FIELD.x + FIELD.w - BALL_R; ball.vx *= -0.6; }
  }
}

function resetBall() {
  ball.x = W/2 + (Math.random() - 0.5) * 100;
  ball.y = H/2 + (Math.random() - 0.5) * 100;
  ball.vx = (Math.random() - 0.5) * 3;
  ball.vy = (Math.random() - 0.5) * 3;
}

function clampPlayer(player) {
  const r = PLAYER_R;
  player.x = Math.max(FIELD.x + r, Math.min(FIELD.x + FIELD.w - r, player.x));
  player.y = Math.max(FIELD.y + r, Math.min(FIELD.y + FIELD.h - r, player.y));
}

// --- 绘制 ---
function drawField() {
  // 草地渐变
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a3d0a');
  grad.addColorStop(0.5, '#1a6b1a');
  grad.addColorStop(1, '#0a3d0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  
  // 球场
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
  
  // 中线
  ctx.beginPath();
  ctx.moveTo(W/2, FIELD.y);
  ctx.lineTo(W/2, FIELD.y + FIELD.h);
  ctx.stroke();
  
  // 中圈
  ctx.beginPath();
  ctx.arc(W/2, H/2, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  // 中圈点
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(W/2, H/2, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // 球门区
  const gy = FIELD.y + FIELD.h/2 - GOAL_H/2;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  // 左门
  ctx.strokeRect(FIELD.x - GOAL_W, gy, GOAL_W, GOAL_H);
  // 右门
  ctx.strokeRect(FIELD.x + FIELD.w, gy, GOAL_W, GOAL_H);
  
  // 禁区
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(FIELD.x, FIELD.y + FIELD.h/2 - 90, 100, 180);
  ctx.strokeRect(FIELD.x + FIELD.w - 100, FIELD.y + FIELD.h/2 - 90, 100, 180);
}

function drawPlayer(p) {
  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(p.x + 2, p.y + 2, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  
  // 身体
  const grad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, PLAYER_R);
  grad.addColorStop(0, p.color);
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  
  // 边框
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 号码
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.isHuman ? 'P1' : 'AI', p.x, p.y);
  
  // 方向指示线
  if (Math.abs(p.vx) > 0.5 || Math.abs(p.vy) > 0.5) {
    const angle = Math.atan2(p.vy, p.vx);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(angle) * PLAYER_R * 1.3, p.y + Math.sin(angle) * PLAYER_R * 1.3);
    ctx.stroke();
  }
}

function drawBall() {
  // 尾迹
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(ball.x + 1, ball.y + 1, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  
  // 足球
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // 五边形花纹
  ctx.fillStyle = '#333';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + ball.vx * 0.02;
    ctx.beginPath();
    ctx.arc(
      ball.x + Math.cos(a) * BALL_R * 0.5,
      ball.y + Math.sin(a) * BALL_R * 0.5,
      BALL_R * 0.22, 0, Math.PI * 2
    );
    ctx.fill();
  }
}

function drawScore() {
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`玩家: ${score.human}`, 20, 50);
  
  ctx.fillStyle = '#0f3460';
  ctx.textAlign = 'right';
  ctx.fillText(`AI: ${score.ai}`, W - 20, 50);
}

// --- 更新循环 ---
function update() {
  // 人类玩家输入
  if (keys['ArrowUp'] || keys['w']) human.vy = -human.speed;
  else if (keys['ArrowDown'] || keys['s']) human.vy = human.speed;
  else human.vy *= 0.8;
  
  if (keys['ArrowLeft'] || keys['a']) human.vx = -human.speed;
  else if (keys['ArrowRight'] || keys['d']) human.vx = human.speed;
  else human.vx *= 0.8;
  
  // AI
  aiMove();
  
  // 更新球员位置
  human.x += human.vx;
  human.y += human.vy;
  ai.x += ai.vx;
  ai.y += ai.vy;
  
  clampPlayer(human);
  clampPlayer(ai);
  
  // 碰撞
  playerBallCollision(human);
  playerBallCollision(ai);
  
  // 球员间碰撞
  if (dist(human, ai) < PLAYER_R * 2) {
    let nx = human.x - ai.x;
    let ny = human.y - ai.y;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const overlap = PLAYER_R * 2 - dist(human, ai);
    human.x += nx * overlap * 0.5;
    human.y += ny * overlap * 0.5;
    ai.x -= nx * overlap * 0.5;
    ai.y -= ny * overlap * 0.5;
  }
  
  // 更新球
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx *= ball.friction;
  ball.vy *= ball.friction;
  if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
  
  checkGoal();
}

// --- 主循环 ---
function draw() {
  drawField();
  drawPlayer(ai);
  drawPlayer(human);
  drawBall();
  drawScore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// --- 启动 ---
resetBall();
gameLoop();

// --- 触摸/移动端支持 ---
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  mouse.x = (touch.clientX - rect.left) * (W / rect.width);
  mouse.y = (touch.clientY - rect.top) * (H / rect.height);
  
  // 简单的触摸控制：手指位置引导球员
  const dx = mouse.x - human.x;
  const dy = mouse.y - human.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 2) {
    human.vx = (dx / dist) * human.speed;
    human.vy = (dy / dist) * human.speed;
  }
}, { passive: false });
