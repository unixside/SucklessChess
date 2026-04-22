const root = document.getElementById("root");
const def_pv = ["b", "w"];
const def_pos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq f6 0 0";
const nboxes = 64;
const bsize = 600;

const pieces = {
    P: "./pieces/white-pawn.png",
    N: "./pieces/white-knight.png",
    B: "./pieces/white-bishop.png",
    R: "./pieces/white-rook.png",
    Q: "./pieces/white-queen.png",
    K: "./pieces/white-king.png",
    p: "./pieces/black-pawn.png",
    n: "./pieces/black-knight.png",
    b: "./pieces/black-bishop.png",
    r: "./pieces/black-rook.png",
    q: "./pieces/black-queen.png",
    k: "./pieces/black-king.png",
};

var pos;
var pointview = [...def_pv];
var rows = "87654321";
var cols = "abcdefgh";
var game;
var game_container;
var controls;

game_container = document.createElement("div");
game_container.setAttribute("class", "game");
game_container.setAttribute("id", "game");
game_container.style.width = bsize + 50 + "px";
game_container.style.height = bsize + 50 + "px";

var posArray;
var selectedPiece = null;

const reverseString = (str) => str.split("").reverse().join("");
const mayus = (c) => c == c.toUpperCase();
const minus = (c) => c == c.toLowerCase();
const inverseCase = (str) =>
    str
        .split("")
        .map((c) => (mayus(c) ? c.toLowerCase() : c.toUpperCase()))
        .join("");

const even = (x) => x % 2 === 0;

const isWhiteBox = (c, r) => {
    return (even(c) && even(r)) || (!even(c) && !even(r));
};

const colorPiece = (p) => (mayus(p.id[0]) ? "w" : "b");
const boxPiece = (p) => p.id.slice(-2);
const intCol = (piece) => cols.indexOf(piece.id[1]);
const intRow = (piece) => rows.indexOf(piece.id[2]);
const inRange = (x, init, end) => x >= init && x <= end;

const fenToHashMap = (fen) => {
    let fenArray = fen.split(" ");
    const map = new Map();
    map.set("pos", fenArray[0]);
    map.set("shift", fenArray[1]);
    map.set("castling", fenArray[2]);
    map.set("passant", fenArray[3]);
    map.set("middle", fenArray[4]);
    map.set("next", fenArray[5]);
    return map;
};

const checkPwCap = (boxId, color) => {
    let box = document.getElementById(boxId);
    if (
        box != undefined &&
        box != null &&
        boxId.length == 2 &&
        box.childElementCount > 0 &&
        colorPiece(box.children[0]) != color
    ) {
        box = boxId;
    } else {
        box = null;
    }
    return box;
};

const pawnMoves = (piece) => {
    let moves = [];
    let passant = posArray.get("passant");

    let col = intCol(piece);
    let row = intRow(piece);

    let capl = null;
    let capr = null;

    // default point view is pointview[0] = "b", pointview[1] = "w"
    // otherwise pointview[0] = "w", pointview[1] = "b"

    switch (colorPiece(piece)) {
        case pointview[0]:
            moves.push(cols[col] + rows[row + 1]);

            if (rows[row] == rows[1]) moves.push(cols[col] + rows[row + 2]);

            capl = cols[col - 1] + rows[row + 1];
            capr = cols[col + 1] + rows[row + 1];
            break;

        case pointview[1]:
            moves.push(cols[col] + rows[row - 1]);

            if (rows[row] == rows[6]) moves.push(cols[col] + rows[row - 2]);

            capl = cols[col - 1] + rows[row - 1];
            capr = cols[col + 1] + rows[row - 1];
            break;

        default:
            break;
    }

    if (passant != "-" && (passant == capl || passant == capr)) {
        moves.push(passant);
    }

    checkPwCap(capl, colorPiece(piece)) != null
        ? moves.push(capl)
        : moves.push();
    checkPwCap(capr, colorPiece(piece)) != null
        ? moves.push(capr)
        : moves.push();

    return moves;
};

const rookMoves = [
    [
        [-1, 0],
        [-2, 0],
        [-3, 0],
        [-4, 0],
        [-5, 0],
        [-6, 0],
        [-7, 0],
    ],
    [
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [7, 0],
    ],
    [
        [0, -1],
        [0, -2],
        [0, -3],
        [0, -4],
        [0, -5],
        [0, -6],
        [0, -7],
    ],
    [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [0, 7],
    ],
];

const bishopMoves = [
    [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [5, 5],
        [6, 6],
        [7, 7],
    ],
    [
        [-1, 1],
        [-2, 2],
        [-3, 3],
        [-4, 4],
        [-5, 5],
        [-6, 6],
        [-7, 7],
    ],
    [
        [1, -1],
        [2, -2],
        [3, -3],
        [4, -4],
        [5, -5],
        [6, -6],
        [7, -7],
    ],
    [
        [-1, -1],
        [-2, -2],
        [-3, -3],
        [-4, -4],
        [-5, -5],
        [-6, -6],
        [-7, -7],
    ],
];

const queenMoves = bishopMoves.concat(rookMoves);

const knightMoves = (piece) => {
    let array_m = [
        [-1, -2],
        [1, -2],
        [-2, -1],
        [2, -1],
        [-2, 1],
        [-1, 2],
        [1, 2],
        [2, 1],
    ];

    let dam = [];
    let color = colorPiece(piece);
    let c = cols.indexOf(piece.id[1]);
    let r = rows.indexOf(piece.id[2]);

    array_m.forEach((move) => {
        let col = c + move[0];
        let row = r + move[1];
        if (inRange(col, 0, 7) && inRange(row, 0, 7)) {
            let box = document.getElementById(cols[col] + rows[row]);
            if (box.childElementCount > 0) {
                if (color != colorPiece(box.children[0])) {
                    dam.push(box.id);
                }
            } else {
                dam.push(box.id);
            }
        }
    });
    return dam;
};

const initKingMoves = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
];

const colRowOk = (c, r) => cols[c] != undefined && rows[r] != undefined;

function movesOk(c, r, moves) {
    return moves.filter((m) => colRowOk(c + m[0], r + m[1]));
}

function sameColor(p1, p2) {
    return colorPiece(p1) == colorPiece(p2);
}

// Get the pieces of the same color
function getPieces(piece, pieces) {
    return pieces.filter((p) => sameColor(p, piece) && p != piece);
}

// Get the pieces of the different color
function getRivalsPieces(piece, pieces) {
    return pieces.filter((p) => !sameColor(p, piece));
}

function intColRowtoBox(c, r) {
    return cols[c] + rows[r];
}

// Filters the boxes occupied by pieces of the same color.
function filterOccBoxes(piece, pieces, moves) {
    let myPieces = getPieces(piece, pieces);
    let occBoxes = myPieces.map((p) => boxPiece(p));
    return moves.filter((m) => occBoxes.indexOf(m) == -1);
}

function possibleMovesToBoxs(c, r, moves) {
    let boxArray = [];
    let movesArray = movesOk(c, r, moves);
    movesArray.forEach((m) =>
        boxArray.push(intColRowtoBox(c + m[0], r + m[1])),
    );
    return boxArray;
}

function emptyBox(box) {
    return document.getElementById(box).childElementCount == 0;
}

function isCapture(piece, box) {
    if (emptyBox(box)) {
        return false;
    }
    return !sameColor(piece, document.getElementById(box).children[0]);
}

function getKing(pieces) {
    return pieces.find((piece) => piece.id[0].toUpperCase() == "K");
}

// Get the possible movements of Bishop, Rook or Queen.
function brqMoves(piece, moves) {
    let c = cols.indexOf(boxPiece(piece)[0]);
    let r = rows.indexOf(boxPiece(piece)[1]);

    return moves
        .map((direction) => {
            let boxes = possibleMovesToBoxs(c, r, direction);
            let array = [];
            let next = true;

            boxes.forEach((box) => {
                if (next && (emptyBox(box) || isCapture(piece, box)))
                    array.push(box);

                next = next && isCapture(piece, box);
            });
            return array;
        })
        .flat();
}

const kingMoves = (piece, pieces) => {
    let moves = [];
    let rivalPieces = getRivalsPieces(piece, pieces);
    let kingRival = null;
    let myInitMoves = null;
    let myPiecesBoxs = getPieces(piece, pieces).map((p) => boxPiece(p));

    if (rivalPieces != null) {
        kingRival = getKing(rivalPieces);
        rivalPieces = rivalPieces.filter((p) => p != kingRival);

        moves = rivalPieces.map((p) => getMovements(p, pieces)).flat();

        let c = intCol(kingRival);
        let r = intRow(kingRival);

        moves = moves.concat(possibleMovesToBoxs(c, r, initKingMoves));
    }

    let c = intCol(piece);
    let r = intRow(piece);

    myInitMoves = possibleMovesToBoxs(c, r, initKingMoves);
    myInitMoves = myInitMoves.filter((move) => !moves.includes(move));

    return myInitMoves.filter((move) => !myPiecesBoxs.includes(move));
};

function protectingKing(piece, king) {
    return possibleMovesToBoxs(
        intCol(king),
        intRow(king),
        initKingMoves,
    ).includes(boxPiece(piece));
}

const getMovements = (piece, pieces) => {
    let moves = [];
    switch (piece.id[0].toUpperCase()) {
        case "P":
            moves = pawnMoves(piece);
            break;
        case "N":
            moves = knightMoves(piece);
            break;
        case "B":
            moves = brqMoves(piece, bishopMoves);
            break;
        case "R":
            moves = brqMoves(piece, rookMoves);
            break;
        case "Q":
            moves = brqMoves(piece, queenMoves);
            break;
        case "K":
            moves = kingMoves(piece, pieces);
            break;
        default:
            break;
    }
    return moves;
};

function legalMove(piece, move, pieces) {
    let king = getKing(getPieces(piece, pieces));
    let moves = null;

    if (protectingKing(piece, king)) {
        let rivalPieces = getRivalsPieces(piece, pieces).filter((p) =>
            ["B", "R", "Q"].includes(p.id[0].toUpperCase()),
        );
        moves = rivalPieces.map((p) => getMovements(p, pieces)).flat();
    }
    return moves == null || !moves.includes(move);
}

function legalMoves(piece, pieces) {
    let moves = null;
    if (piece.id[0].toUpperCase() != "K") {
        moves = getMovements(piece, pieces);
        return moves.every((m) => legalMove(piece, m, pieces)) ? moves : [];
    } else {
        return getMovements(piece, pieces);
    }
}

const newGame = (game) => {
    let pos = posArray.get("pos");
    let board = createBoard(bsize);
    game.appendChild(board);
    let boxes = createBoxes(Math.floor(bsize / 8));
    boxes.map((box) => board.appendChild(box));
    let pieces = createPieces(pos, boxes);
    return { board, boxes, pieces };
};

const createBoard = (size) => {
    let board = document.createElement("div");
    board.setAttribute("class", "board");
    board.setAttribute("id", "board");
    board.style.width = size + "px";
    board.style.height = size + "px";
    return board;
};

const createBoxes = (size) => {
    let row = 0;
    let col = 0;
    return Array.from({ length: nboxes }, () => {
        let color = isWhiteBox(row, col) ? "White" : "Black";
        let id = cols[col] + rows[row];
        let cls = "box" + color;

        if (col === 7) {
            col = 0;
            row++;
        } else {
            col++;
        }
        return createBox(id, cls, size);
    });
};

const createBox = (id, cls, size) => {
    let box = document.createElement("div");
    box.setAttribute("id", id);
    box.setAttribute("class", cls);
    box.style.width = size + "px";
    box.style.height = size + "px";
    return box;
};

const drawImg = (src, div) => {
    const img = new Image();
    img.src = src;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objetcFit = "cover";
    div.appendChild(img);
};

const pieceContainer = (id, size) => {
    let container = document.createElement("div");
    container.setAttribute("id", id);
    container.setAttribute("class", "piece");
    container.setAttribute("draggable", "true");
    container.style.width = size;
    container.style.height = size;

    container.addEventListener("mouseover", () => {
        container.style.border = "solid 3px white";
    });

    container.addEventListener("mouseout", () => {
        container.style.border = "";
    });

    container.addEventListener("click", () => {
        if (selectedPiece === null) {
            selectedPiece = container;
            selectedPiece.classList.add("selected");
        } else if (selectedPiece) {
            if (selectedPiece === container) {
                selectedPiece.classList.remove("selected");
                selectedPiece = null;
            } else {
                selectedPiece.classList.remove("selected");
                selectedPiece = container;
                selectedPiece.classList.add("selected");
            }
        }
    });

    container.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.id);
    });
    return container;
};

const createPieces = (pos, boxes) => {
    let index = 0;
    let position_array = pos.split("");
    let containers = [];
    position_array.forEach((c) => {
        let box = boxes[index];
        if (pieces.hasOwnProperty(c)) {
            let container = pieceContainer(c + box.id, box.style.width);
            box.appendChild(container);
            drawImg(pieces[c], container);
            index += 1;
            containers.push(container);
        } else if (!isNaN(c)) {
            index += Number(c);
        }
    });
    return containers;
};

const createButton = (text, callback) => {
    let button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", callback);
    return button;
};

const createControls = () => {
    let container = document.createElement("div");
    container.setAttribute("class", "controls");

    container.appendChild(createButton("Undo", () => alert("click undo")));
    container.appendChild(createButton("Reset", () => alert("click resret")));
    container.appendChild(
        createButton("Swap Orientation", () => swapOrientation()),
    );
    return container;
};

function redrawGame() {
    game.board.remove();
    game = newGame(game_container);
}

function swapOrientation() {
    cols = reverseString(cols);
    rows = reverseString(rows);
    posArray.set("pos", reverseString(posArray.get("pos")));
    redrawGame();
}

posArray = fenToHashMap(def_pos);
game = newGame(game_container);
controls = createControls();

root.appendChild(game_container);
root.appendChild(controls);
