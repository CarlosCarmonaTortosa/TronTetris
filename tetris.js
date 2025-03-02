const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas.getContext('2d');
nextPieceContext.scale(20, 20);

// Variable para controlar si el juego está en ejecución
let gameRunning = true;
let initialDropInterval = 1000;
let nextPiece = null;

// Objeto para almacenar los contadores de piezas
const pieceCounters = {
    'T': 0,
    'J': 0,
    'Z': 0,
    'O': 0,
    'S': 0,
    'L': 0,
    'I': 0
};

// Objeto para mantener referencias a los contextos de los canvas de las piezas
const pieceCanvases = {};

// Inicializar los canvas de referencia de piezas
function initPieceCanvases() {
    const pieceTypes = ['T', 'J', 'Z', 'O', 'S', 'L', 'I'];
    
    pieceTypes.forEach(type => {
        const canvas = document.getElementById(`piece-${type}`);
        const context = canvas.getContext('2d');
        context.scale(10, 10);
        pieceCanvases[type] = context;
        
        // Dibujar la pieza en el canvas
        drawPieceInCanvas(type, context);
    });
}

// Dibujar una pieza específica en un canvas
function drawPieceInCanvas(type, ctx) {
    const piece = createPiece(type);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Calcular offset para centrar la pieza
    const offsetX = (6 - piece[0].length) / 2;
    const offsetY = (6 - piece.length) / 2;
    
    piece.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
            }
        });
    });
}

// Actualizar el contador de un tipo de pieza
function updatePieceCounter(type) {
    pieceCounters[type]++;
    document.getElementById(`count-${type}`).textContent = pieceCounters[type];
}

// Resetear todos los contadores de piezas
function resetPieceCounters() {
    for (let type in pieceCounters) {
        pieceCounters[type] = 0;
        document.getElementById(`count-${type}`).textContent = '0';
    }
}

function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
        linesCleared++;
    }
    if (linesCleared > 0) {
        player.lines += linesCleared;
        if (player.lines >= 5) {
            player.lines -= 5;
            player.speed++;
            dropInterval *= 0.9;
            updateSpeed();
        }
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [5, 5, 5],
            [0, 5, 0],
        ];
    } else if (type === 'O') {
        return [
            [7, 7],
            [7, 7],
        ];
    } else if (type === 'L') {
        return [
            [0, 6, 0],
            [0, 6, 0],
            [0, 6, 6],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 4, 0, 0],
            [0, 4, 0, 0],
            [0, 4, 0, 0],
            [0, 4, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 2, 2],
            [2, 2, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawNextPiece() {
    // Limpiar el canvas de la siguiente pieza
    nextPieceContext.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (nextPiece) {
        // Calcular la posición para centrar la pieza
        const offsetX = (4 - nextPiece[0].length) / 2;
        const offsetY = (4 - nextPiece.length) / 2;
        
        // Dibujar la matriz de la siguiente pieza
        nextPiece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextPieceContext.fillStyle = colors[value];
                    nextPieceContext.fillRect(x + offsetX, y + offsetY, 1, 1);
                }
            });
        });
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    // Transponer la matriz
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    // Invertir filas o columnas según la dirección
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    
    if (nextPiece === null) {
        // Primera ejecución del juego, generar la primera pieza y la siguiente
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        player.matrix = createPiece(randomPiece);
        updatePieceCounter(randomPiece); // Contar esta pieza
        
        const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        nextPiece = createPiece(nextRandomPiece);
    } else {
        // Usar la siguiente pieza como la pieza actual
        player.matrix = nextPiece;
        
        // Encontrar qué tipo de pieza es para incrementar su contador
        const pieceType = getPieceType(nextPiece);
        if (pieceType) {
            updatePieceCounter(pieceType);
        }
        
        // Generar una nueva "siguiente pieza"
        const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        nextPiece = createPiece(nextRandomPiece);
    }
    
    // Dibujar la siguiente pieza
    drawNextPiece();
    
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        // Game Over
        gameOver();
    }
}

// Función para identificar el tipo de pieza basado en su matriz
function getPieceType(pieceMatrix) {
    // Identificar pieza por características únicas
    const height = pieceMatrix.length;
    const width = pieceMatrix[0].length;
    
    if (height === 2 && width === 2) return 'O';
    if (height === 4) return 'I';
    
    // Comprobar el color (valor numérico) para identificar el resto
    let value = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pieceMatrix[y][x] !== 0) {
                value = pieceMatrix[y][x];
                break;
            }
        }
        if (value !== 0) break;
    }
    
    // Identificar por el valor numérico
    switch (value) {
        case 1: return 'Z';
        case 2: return 'S';
        case 3: return 'J';
        case 5: return 'T';
        case 6: return 'L';
        default: return null;
    }
}

function gameOver() {
    // Mostrar la pantalla de Game Over
    document.getElementById('game-over').style.display = 'flex';
    gameRunning = false;
}

function resetGame() {
    // Ocultar pantalla de Game Over
    document.getElementById('game-over').style.display = 'none';
    
    // Reiniciar el tablero
    arena.forEach(row => row.fill(0));
    
    // Reiniciar puntuación
    player.score = 0;
    
    // Reiniciar líneas y velocidad
    player.lines = 0;
    player.speed = 0;
    dropInterval = initialDropInterval;
    
    // Reiniciar la siguiente pieza
    nextPiece = null;
    
    // Resetear contadores de piezas
    resetPieceCounters();
    
    // Actualizar UI
    updateScore();
    updateSpeed();
    
    // Reiniciar el juego
    gameRunning = true;
    playerReset();
    
    // Reiniciar animación
    lastTime = 0;
    update();
}

function playerRotate(dir) {
    // Guardar posición actual por si hay que revertir
    const pos = player.pos.x;
    let offset = 1;
    
    // Rotar la matriz de la pieza
    rotate(player.matrix, dir);
    
    // Comprobar si hay colisión y ajustar posición si es necesario
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir); // Revertir rotación
            player.pos.x = pos;          // Revertir posición
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {
    if (!gameRunning) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function updateSpeed() {
    document.getElementById('speed').innerText = player.speed;
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    speed: 0,
};

document.addEventListener('keydown', event => {
    if (!gameRunning && event.keyCode === 32) {
        // Barra espaciadora para reiniciar si el juego terminó
        resetGame();
        return;
    }
    
    if (gameRunning) {
        switch (event.keyCode) {
            case 37: // Flecha izquierda
                playerMove(-1);
                break;
            case 39: // Flecha derecha
                playerMove(1);
                break;
            case 40: // Flecha abajo 
                playerDrop();
                break;
            case 38: // Flecha arriba
                playerRotate(1);
                break;
            case 81: // Tecla Q
                playerRotate(-1);
                break;
            case 87: // Tecla W
                playerRotate(1);
                break;
        }
    }
});

// Añadir evento al botón de reinicio
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('restart-button').addEventListener('click', resetGame);
    initPieceCanvases();
});

// Inicialización
playerReset();
updateScore();
updateSpeed();
update();