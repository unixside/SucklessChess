import { ChessRegExp, DefaultData, Offsets } from "./constants";
import {
    getEnemyColor,
    getKingChar,
    getRookChar,
    isBlack,
    isWhite,
} from "./functions";
import { Board, Color, GameState, Move, Piece, Square } from "./types";

interface IPiece {
    name: Piece | null;
    square: Square;
}

const COLUMNS = DefaultData.colunms.split("");
const ROWS = DefaultData.rows.split("");

function squareToCoords(square: Square): { col: number; row: number } {
    return {
        col: COLUMNS.indexOf(square[0]),
        row: ROWS.indexOf(square[1]),
    };
}

function coordsToSquare(col: number, row: number): Square | null {
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return (COLUMNS[col] + ROWS[row]) as Square;
}

function sumOffset(from: Square, offset: number[]): Square | undefined {
    let { col, row } = squareToCoords(from);

    if (col === undefined || row === undefined) {
        return undefined;
    }

    col = col + offset[0];
    row = row + offset[1];

    let square = coordsToSquare(col, row);

    if (square === null) {
        return undefined;
    }

    return square;
}

function getPieceAt(board: Board, square: Square): Piece | null {
    return board[square] ?? null;
}

function isPieceOfColor(piece: Piece | null, color: Color): boolean {
    if (!piece) return false;
    return color === "w"
        ? piece === piece.toUpperCase()
        : piece === piece.toLowerCase();
}

function isEnemyPiece(piece1: Piece | null, piece2: Piece | null): boolean {
    if (!piece1 || !piece2) return false;
    const p1White = piece1 === piece1.toUpperCase();
    const p2White = piece2 === piece2.toUpperCase();
    return p1White !== p2White;
}

function validMove(piece: Piece, to: Square, board: Board): boolean {
    let another = getPieceAt(board, to);
    return isEnemyPiece(piece, another) || another === null;
}

export function getPseudoMoves(state: GameState, from: Square): Move[] {
    const moves: Move[] = [];
    const board = state.board;
    const enPassant =
        state.enPassant !== "-" ? (state.enPassant as Square) : null;

    const piece = getPieceAt(board, from);

    if (piece === null) {
        return [];
    }

    let coords = squareToCoords(from);

    if (ChessRegExp.pawn.test(piece)) {
        let offsets = Offsets.Pawn[piece as keyof typeof Offsets.Pawn];
        let always = sumOffset(from, offsets?.always);
        let only_first = sumOffset(from, offsets?.only_first);
        let right_capture = sumOffset(from, offsets?.right_capture);
        let left_capture = sumOffset(from, offsets?.left_capture);

        if (always !== undefined) {
            moves.push({ from: from, to: always });
        }

        if (only_first && coords.row === offsets.init_row) {
            moves.push({ from: from, to: only_first });
        }

        if (
            right_capture &&
            isEnemyPiece(piece, getPieceAt(board, right_capture))
        ) {
            moves.push({ from: from, to: right_capture });
        }

        if (
            left_capture &&
            isEnemyPiece(piece, getPieceAt(board, left_capture))
        ) {
            moves.push({ from: from, to: left_capture });
        }

        if (enPassant && !moves.includes({ from: from, to: enPassant })) {
            moves.push({ from: from, to: enPassant });
        }
    }

    if (ChessRegExp.KN.test(piece)) {
        let offset = Offsets.KN[piece.toLowerCase() as keyof typeof Offsets.KN];

        Object.values(offset)
            .map((o) => sumOffset(from, o))
            .filter((sq) => sq !== undefined)
            .filter((sq) => validMove(piece, sq, board))
            .forEach((sq) => moves.push({ from: from, to: sq }));
    }

    if (ChessRegExp.BRQ.test(piece)) {
        let offset =
            Offsets.BRQ[piece.toLowerCase() as keyof typeof Offsets.BRQ];

        Object.values(offset)
            .map((dir) =>
                dir
                    .map((o) => sumOffset(from, o))
                    .filter((sq) => sq !== undefined),
            )
            .forEach((dir) => {
                let index = dir.findIndex(
                    (sq) => getPieceAt(board, sq) !== null,
                );

                if (index === -1) {
                    moves.concat(
                        dir.map((sq) => ({ from: from, to: sq as Square })),
                    );
                } else {
                    let another = getPieceAt(board, dir[index]);
                    if (isEnemyPiece(piece, another)) {
                        index += 1;
                    }
                    dir.slice(0, index).map((sq) => ({
                        from: from,
                        to: sq as Square,
                    }));
                }
            });
    }
    return moves;
}

function findKing(board: Board, color: Color): Square | null {
    const kingPiece = color === "w" ? "K" : "k";
    for (const square in board) {
        if (board[square] === kingPiece) {
            return square as Square;
        }
    }
    return null;
}

function applyMove(board: Board, move: Move): Board {
    const newBoard = { ...board };
    const piece = newBoard[move.from] as Piece;

    newBoard[move.to] = move.promotion ?? piece;
    newBoard[move.from] = null;

    return newBoard;
}

function getPieces(board: Board): IPiece[] {
    return Object.entries(board)
        .map(([square, piece]) => ({
            name: piece,
            square: square,
        }))
        .filter((piece) => piece.name !== null);
}

function getWhitePieces(board: Board): IPiece[] {
    return getPieces(board).filter((piece) => isWhite(piece?.name as Piece));
}

function getBlackPieces(board: Board): IPiece[] {
    return getPieces(board).filter((piece) => isBlack(piece?.name as Piece));
}

function getEnemyPieces(board: Board, color: Color): IPiece[] {
    if (color === DefaultData.white) {
        return getBlackPieces(board);
    }
    return getWhitePieces(board);
}

export function isKingInCheck(state: GameState, color: Color): boolean {
    const board = state.board;
    const kingSquare = findKing(board, color);

    if (!kingSquare) return false;

    const enemyColor = getEnemyColor(color);
    const enemyPieces: IPiece[] = getEnemyPieces(board, color);

    if (enemyPieces.length === 0) return false;

    const pseudoState: GameState = {
        ...state,
        board,
        activeColor: enemyColor,
    };

    const enemyMoves = enemyPieces
        .map((piece) => getPseudoMoves(pseudoState, piece.square))
        .flat()
        .map((move) => move.to);

    return enemyMoves.includes(kingSquare);
}

export function getLegalMoves(state: GameState, from?: Square): Move[] {
    const color = state.activeColor as Color;
    const board = state.board;

    if (from) {
        const pseudoMoves = getPseudoMoves(state, from);
        const legalMoves: Move[] = [];

        for (const move of pseudoMoves) {
            const newBoard = applyMove(board, move);
            const newState: GameState = {
                ...state,
                board: newBoard,
                activeColor: getEnemyColor(color),
            };

            if (!isKingInCheck(newState, color)) {
                legalMoves.push(move);
            }
        }

        return legalMoves;
    } else {
        const legalMoves: Move[] = [];

        for (const square in board) {
            const piece = board[square];
            if (piece && isPieceOfColor(piece, color)) {
                const pieceMoves = getLegalMoves(state, square as Square);
                legalMoves.push(...pieceMoves);
            }
        }

        return legalMoves;
    }
}

export function getCastleMoves(state: GameState): Move[] {
    const moves: Move[] = [];
    const board = state.board;
    const color = state.activeColor as Color;
    const castlings = state.availableCastlings;
    const enemyColor = getEnemyColor(color);

    if (isKingInCheck(state, color)) {
        return moves;
    }

    const kingPiece = getKingChar(color);
    const rookPiece = getRookChar(color);

    let kingSquare: Square | null = null;
    for (const square in board) {
        if (board[square] === kingPiece) {
            kingSquare = square as Square;
            break;
        }
    }

    if (!kingSquare) return moves;

    const { col: kingCol, row: kingRow } = squareToCoords(kingSquare);

    if (color === "w" && kingRow === 0 && kingCol === 4) {
        if (castlings.includes("K")) {
            const kingSideRook = board["h1"];
            if (kingSideRook === rookPiece && !board["f1"] && !board["g1"]) {
                const intermediateState: GameState = {
                    ...state,
                    board: { ...board, f1: "K", e1: null },
                    activeColor: enemyColor,
                };
                if (!isKingInCheck(intermediateState, color)) {
                    moves.push({ from: "e1", to: "g1" });
                }
            }
        }
        if (castlings.includes("Q")) {
            const queenSideRook = board["a1"];
            if (
                queenSideRook === rookPiece &&
                !board["b1"] &&
                !board["c1"] &&
                !board["d1"]
            ) {
                const intermediateState: GameState = {
                    ...state,
                    board: { ...board, d1: "K", e1: null },
                    activeColor: enemyColor,
                };
                if (!isKingInCheck(intermediateState, color)) {
                    moves.push({ from: "e1", to: "c1" });
                }
            }
        }
    } else if (color === "b" && kingRow === 7 && kingCol === 4) {
        if (castlings.includes("k")) {
            const kingSideRook = board["h8"];
            if (kingSideRook === rookPiece && !board["f8"] && !board["g8"]) {
                moves.push({ from: "e8", to: "g8" });
            }
        }
        if (castlings.includes("q")) {
            const queenSideRook = board["a8"];
            if (
                queenSideRook === rookPiece &&
                !board["b8"] &&
                !board["c8"] &&
                !board["d8"]
            ) {
                moves.push({ from: "e8", to: "c8" });
            }
        }
    }

    return moves;
}

export function getAllPseudoMoves(state: GameState): Move[] {
    const moves: Move[] = [];
    const color = state.activeColor as Color;
    const board = state.board;

    for (const square in board) {
        const piece = board[square];
        if (piece && isPieceOfColor(piece, color)) {
            const pieceMoves = getPseudoMoves(state, square as Square);
            moves.push(...pieceMoves);
        }
    }

    moves.push(...getCastleMoves(state));

    return moves;
}
