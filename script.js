const boardSize = 10; 
const gameBoard = document.getElementById("game-board");
const statusDiv = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");
const shootUpBtn = document.getElementById("shoot-up");
const shootDownBtn = document.getElementById("shoot-down");
const shootLeftBtn = document.getElementById("shoot-left");
const shootRightBtn = document.getElementById("shoot-right");

let playerPos = { x: 0, y: 0 };
let wumpusPos = { x: 9, y: 9 }; 
let goldPos = { x: 2, y: 2 };
let obstacles = [];
let gameActive = true;
let hasArrow = true;

function createBoard() {
    gameBoard.innerHTML = ''; 
    placeObstacles();
    placePlayerAndGold();
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.id = `cell-${x}-${y}`;
            cell.addEventListener('click', () => movePlayer(x, y));
            gameBoard.appendChild(cell);
        }
    }
    updateBoard();
}

function placePlayerAndGold() {
    // Randomly place the player
    playerPos = getRandomPosition();
    
    // Randomly place the gold ensuring it does not overlap with the player or Wumpus
    do {
        goldPos = getRandomPosition();
    } while (goldPos.x === playerPos.x && goldPos.y === playerPos.y);

    // Ensure Wumpus does not overlap with player or gold
    do {
        wumpusPos = getRandomPosition();
    } while (
        (wumpusPos.x === playerPos.x && wumpusPos.y === playerPos.y) ||
        (wumpusPos.x === goldPos.x && wumpusPos.y === goldPos.y)
    );
}

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * boardSize),
        y: Math.floor(Math.random() * boardSize)
    };
}

function updateBoard() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('player', 'wumpus', 'gold', 'found-gold', 'obstacle');
        cell.textContent = '';
    });

    // Place player
    document.getElementById(`cell-${playerPos.x}-${playerPos.y}`).classList.add('player');
    document.getElementById(`cell-${playerPos.x}-${playerPos.y}`).textContent = 'P';

    // Place obstacles
    obstacles.forEach(obstacle => {
        document.getElementById(`cell-${obstacle.x}-${obstacle.y}`).classList.add('obstacle');
    });

    // Place gold (hidden until found)
    if (playerPos.x === goldPos.x && playerPos.y === goldPos.y) {
        document.getElementById(`cell-${goldPos.x}-${goldPos.y}`).classList.add('found-gold');
        document.getElementById(`cell-${goldPos.x}-${goldPos.y}`).textContent = 'G';
    }

    // Place Wumpus (always visible)
    document.getElementById(`cell-${wumpusPos.x}-${wumpusPos.y}`).classList.add('wumpus');
    document.getElementById(`cell-${wumpusPos.x}-${wumpusPos.y}`).textContent = 'W';
}

function movePlayer(x, y) {
    if (!gameActive) return;

    // Check if the destination is an obstacle
    if (isObstacle(x, y)) {
        statusDiv.textContent = "You can't move there! It's blocked by an obstacle.";
        return;
    }

    playerPos = { x, y };
    checkGameState();

    // Wumpus moves after player
    if (gameActive) {
        wumpusMove();
    }

    updateBoard();
}

function checkGameState() {
    if (playerPos.x === wumpusPos.x && playerPos.y === wumpusPos.y) {
        statusDiv.textContent = "You ran into the Wumpus! You lose!";
        gameActive = false;
    } else if (playerPos.x === goldPos.x && playerPos.y === goldPos.y) {
        statusDiv.textContent = "You found the gold! You win!";
        gameActive = false;
    } else {
        statusDiv.textContent = `Keep hunting! ${hasArrow ? "You still have an arrow." : "You are out of arrows."}`;
    }
}

function wumpusMove() {
    const bestMove = alphaBeta(wumpusPos, 3, -Infinity, Infinity, true);
    wumpusPos = bestMove;
    checkGameState();
}

function alphaBeta(pos, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || !gameActive) {
        return pos; // Return current position for leaf nodes
    }

    const possibleMoves = getPossibleMoves(pos);
    
    if (maximizingPlayer) {
        let maxEval = { x: pos.x, y: pos.y };
        for (const move of possibleMoves) {
            const eval = alphaBeta(move, depth - 1, alpha, beta, false);
            const distanceToPlayer = Math.abs(move.x - playerPos.x) + Math.abs(move.y - playerPos.y);
            if (distanceToPlayer < Math.abs(maxEval.x - playerPos.x) + Math.abs(maxEval.y - playerPos.y)) {
                maxEval = move;
            }
            alpha = Math.max(alpha, distanceToPlayer);
            if (beta <= alpha) {
                break; // Beta cut-off
            }
        }
        return maxEval;
    } else {
        let minEval = { x: pos.x, y: pos.y };
        for (const move of possibleMoves) {
            const eval = alphaBeta(move, depth - 1, alpha, beta, true);
            const distanceToPlayer = Math.abs(move.x - playerPos.x) + Math.abs(move.y - playerPos.y);
            if (distanceToPlayer > Math.abs(minEval.x - playerPos.x) + Math.abs(minEval.y - playerPos.y)) {
                minEval = move;
            }
            beta = Math.min(beta, distanceToPlayer);
            if (beta <= alpha) {
                break; // Alpha cut-off
            }
        }
        return minEval;
    }
}

function getRandomMove(pos) {
    const moves = getPossibleMoves(pos);
    return moves[Math.floor(Math.random() * moves.length)];
}

function getPossibleMoves(pos) {
    const moves = [];
    if (pos.x > 0 && !isObstacle(pos.x - 1, pos.y)) moves.push({ x: pos.x - 1, y: pos.y });
    if (pos.x < boardSize - 1 && !isObstacle(pos.x + 1, pos.y)) moves.push({ x: pos.x + 1, y: pos.y });
    if (pos.y > 0 && !isObstacle(pos.x, pos.y - 1)) moves.push({ x: pos.x, y: pos.y - 1 });
    if (pos.y < boardSize - 1 && !isObstacle(pos.x, pos.y + 1)) moves.push({ x: pos.x, y: pos.y + 1 });
    return moves;
}

function isObstacle(x, y) {
    return obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
}

function placeObstacles() {
    obstacles = [];
    for (let i = 0; i < 5; i++) { // Placing 5 obstacles randomly
        let obstaclePos;
        do {
            obstaclePos = getRandomPosition();
        } while (
            (obstaclePos.x === playerPos.x && obstaclePos.y === playerPos.y) || // Avoid player start
            (obstaclePos.x === wumpusPos.x && obstaclePos.y === wumpusPos.y) || // Avoid wumpus start
            (obstaclePos.x === goldPos.x && obstaclePos.y === goldPos.y) ||    // Avoid gold position
            isObstacle(obstaclePos.x, obstaclePos.y)                           // Avoid already placed obstacles
        );
        obstacles.push(obstaclePos);
    }
}

function shoot(direction) {
    if (!hasArrow) {
        statusDiv.textContent = "You have no arrows left!";
        return;
    }

    // Determine the target position based on the direction
    let targetPos;
    switch (direction) {
        case 'up':
            targetPos = { x: playerPos.x, y: playerPos.y - 1 };
            break;
        case 'down':
            targetPos = { x: playerPos.x, y: playerPos.y + 1 };
            break;
        case 'left':
            targetPos = { x: playerPos.x - 1, y: playerPos.y };
            break;
        case 'right':
            targetPos = { x: playerPos.x + 1, y: playerPos.y };
            break;
        default:
            return;
    }

    // Check if the arrow hits the Wumpus
    if (targetPos.x === wumpusPos.x && targetPos.y === wumpusPos.y) {
        statusDiv.textContent = "You hit the Wumpus! You win!";
        gameActive = false;
    } else {
        statusDiv.textContent = "You missed the Wumpus!";
        hasArrow = false; // The arrow is used up
    }

    updateBoard();
}

resetBtn.addEventListener('click', () => {
    gameActive = true;
    hasArrow = true;
    createBoard();
});

shootUpBtn.addEventListener('click', () => shoot('up'));
shootDownBtn.addEventListener('click', () => shoot('down'));
shootLeftBtn.addEventListener('click', () => shoot('left'));
shootRightBtn.addEventListener('click', () => shoot('right'));

createBoard();
