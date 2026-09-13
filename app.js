const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gridSize = 20;
let cellSize;

let snake, direction, nextDirection, food, score, best, running, loopId;
best = parseInt(localStorage.getItem('snakeBest') || '0');

function resize() {
    const size = Math.min(window.innerWidth - 40, window.innerHeight - 180);
    canvas.width = size;
    canvas.height = size;
    cellSize = size / gridSize;
    if (snake) draw();
}

function initGame() {
    snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
    direction = {x: 1, y: 0};
    nextDirection = {x: 1, y: 0};
    score = 0;
    running = true;
    placeFood();
    updateUI();
    document.getElementById('overlay').classList.add('hidden');
    clearInterval(loopId);
    loopId = setInterval(tick, 140);
    draw();
}

function placeFood() {
    do {
        food = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function tick() {
    if (!running) return;
    direction = nextDirection;
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

    // Стены
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        return gameOver();
    }
    // Себя
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateUI();
        placeFood();
        tg.HapticFeedback?.impactOccurred('light');
    } else {
        snake.pop();
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Яблоко
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2 - 2, 0, Math.PI * 2
    );
    ctx.fill();

    // Змейка
    snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#2ecc71' : '#27ae60';
        ctx.fillRect(s.x * cellSize + 1, s.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('best').textContent = best;
}

function gameOver() {
    running = false;
    clearInterval(loopId);
    tg.HapticFeedback?.notificationOccurred('error');

    if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        updateUI();
    }

    document.getElementById('overlay-title').textContent = 'Игра окончена';
    document.getElementById('overlay-text').textContent = 'Ваш счёт: ' + score;
    document.getElementById('overlay').classList.remove('hidden');

    // Отправляем результат боту (если он есть)
    tg.sendData(JSON.stringify({ game: 'snake', score }));
}

// Свайпы
let touchStart = null;
document.addEventListener('touchstart', e => {
    touchStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
}, {passive: true});

document.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    let dir;
    if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? {x: 1, y: 0} : {x: -1, y: 0};
    } else {
        dir = dy > 0 ? {x: 0, y: 1} : {x: 0, y: -1};
    }
    // Запрет разворота на 180°
    if (direction.x + dir.x === 0 && direction.y + dir.y === 0) return;
    nextDirection = dir;
}, {passive: true});

document.getElementById('restart-btn').addEventListener('click', initGame);

window.addEventListener('resize', resize);

// Старт
resize();
initGame();