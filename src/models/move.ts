import { ChessRegExp, DefaultData, Offsets } from '../utils/constants';
import {
    getEnemyColor,
    getKingChar,
    getPieceColor,
    isBlack,
    isWhite,
} from '../utils/functions';

import {
    Color,
    GameState,
    Piece,
    Square,
    CastlingSetup,
    EnPassant,
} from './types';
import { Board, RawBoard } from './board';
import { MoveCommand, MoveFactory } from '../models/commands';
import { UCIMove } from '../utils/moves';

interface IPiece {
    name: Piece | null;
    square: Square;
}

export interface ExecutedMove {
    command: MoveCommand;
    stateBefore: GameState;
}

const COLUMNS = DefaultData.colunms.split('');
const ROWS = DefaultData.rows.split('');

export function squareToCoords(square: Square): { col: number; row: number } {
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

function isEnemyPiece(piece1: Piece | null, piece2: Piece | null): boolean {
    if (!piece1 || !piece2) return false;
    const p1White = piece1 === piece1.toUpperCase();
    const p2White = piece2 === piece2.toUpperCase();
    return p1White !== p2White;
}

function validMove(piece: Piece, to: Square, board: Board): boolean {
    let another = board.getPieceAt(to);
    return isEnemyPiece(piece, another as Piece) || another === null;
}

export function getPseudoMoves(state: GameState, from: Square): UCIMove[] {
    const moves: UCIMove[] = [];
    const board = state.board;
    const enPassant =
        state.enPassant !== '-' ? (state.enPassant as Square) : null;

    const piece = board.getPieceAt(from);

    if (piece === null || piece === undefined) {
        return [];
    }

    let coords = squareToCoords(from);

    if (ChessRegExp.pieces.pawn.test(piece)) {
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
            right_capture !== undefined &&
            isEnemyPiece(
                piece,
                board.getPieceAt(right_capture as Square) as Piece,
            )
        ) {
            moves.push({ from: from, to: right_capture });
        }

        if (
            left_capture &&
            isEnemyPiece(
                piece,
                board.getPieceAt(left_capture as Square) as Piece,
            )
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
                    (sq) => board.getPieceAt(sq) !== null,
                );

                if (index === -1) {
                    moves.push(
                        ...dir.map((sq) => ({ from: from, to: sq as Square })),
                    );
                } else {
                    let another = board.getPieceAt(dir[index]);
                    if (isEnemyPiece(piece, another as Piece)) {
                        index += 1;
                    }
                    moves.push(
                        ...dir.slice(0, index).map((sq) => ({
                            from: from,
                            to: sq as Square,
                        })),
                    );
                }
            });
    }
    return moves;
}

function findKing(board: RawBoard, color: Color): Square | null {
    const kingPiece = getKingChar(color);
    for (const square of Object.keys(board)) {
        if (board[square] === kingPiece) {
            return square as Square;
        }
    }
    return null;
}

function getPieces(board: RawBoard): IPiece[] {
    return Object.entries(board)
        .map(([square, piece]) => ({
            name: piece,
            square: square,
        }))
        .filter((piece) => piece && piece.name !== null);
}

export { getPieces };

export function getWhitePieces(board: RawBoard): IPiece[] {
    return getPieces(board).filter(
        (piece) => piece && isWhite(piece?.name as Piece),
    );
}

export function getBlackPieces(board: RawBoard): IPiece[] {
    return getPieces(board).filter(
        (piece) => piece && isBlack(piece?.name as Piece),
    );
}

export function getEnemyPieces(board: RawBoard, color: Color): IPiece[] {
    if (color === DefaultData.white) {
        return getBlackPieces(board);
    }
    return getWhitePieces(board);
}

export function isKingInCheck(state: GameState, color: Color): boolean {
    const board = state.board;
    const kingSquare = findKing(board.raw(), color);

    if (!kingSquare) return false;

    const enemyColor = getEnemyColor(color);
    const enemyPieces: IPiece[] = getEnemyPieces(board.raw(), color);

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

export function isInCheckMate(state: GameState, color: Color): boolean {
    if (!isKingInCheck(state, color)) {
        return false;
    }

    const board = state.board;
    const king = getKingChar(color);
    const kingSquare = Object.keys(board.raw).find(
        (key) => board.getPieceAt(key) === king,
    );

    const movements = getLegalMoves(state, kingSquare);

    return movements.length === 0;
}

function validSquare(name: Square): boolean {
    return (
        name !== undefined ||
        name !== null ||
        name !== '' ||
        ChessRegExp.square.test(name)
    );
}

export function getLegalMoves(state: GameState, from?: Square): UCIMove[] {
    const color = state.activeColor as Color;
    const board = state.board;

    const legalMoves: UCIMove[] = [];

    if (!validSquare(from as Square)) {
        console.log(`Invalid square name for from: ${from}`);
        return [];
    }

    const piece = board.getPieceAt(from as Square);

    if (piece === null || piece === undefined) {
        return [];
    }

    const pseudoMoves = getPseudoMoves(state, from as Square);
    pseudoMoves.forEach((move) => {
        const result = applyMoveCommand(state, move);
        if (!result) return;

        const { newState } = result;
        if (!isKingInCheck(newState, color)) {
            legalMoves.push(move);
        }
    });

    if (ChessRegExp.pieces.king.test(piece)) {
        const castlings = getCastleMoves(state);
        legalMoves.push(...castlings);
    }
    return legalMoves;
}

export function applyMoveCommand(
    state: GameState,
    move: UCIMove,
): { newState: GameState; newBoard: Board; command: MoveCommand } | null {
    const board = state.board;
    const enPassantSquare =
        state.enPassant !== '-' ? (state.enPassant as Square) : null;

    const command = MoveFactory.create(move, board, enPassantSquare);
    if (!command) return null;

    const newBoard = board.cloneBoard();
    const piece = board.getPieceAt(move.from);
    const captured = board.getPieceAt(move.to);

    command.execute(newBoard);

    const isPawnMove = ChessRegExp.pieces.pawn.test(piece as string);
    const isCapture = captured !== null && captured !== undefined;
    const isTwoSquarePawn =
        isPawnMove &&
        Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2;

    let newHalfMove = state.halfMove + 1;
    if (isPawnMove || isCapture) {
        newHalfMove = 0;
    }

    let newFullMove = state.fullMove;
    if (state.activeColor === 'b') {
        newFullMove += 1;
    }

    let newAvailableCastlings = { ...state.availableCastlings };
    if (state.activeColor === 'w') {
        if (move.from === 'e1') {
            newAvailableCastlings.K = false;
            newAvailableCastlings.Q = false;
        }
        if (move.from === 'a1') newAvailableCastlings.Q = false;
        if (move.from === 'h1') newAvailableCastlings.K = false;
    } else {
        if (move.from === 'e8') {
            newAvailableCastlings.k = false;
            newAvailableCastlings.q = false;
        }
        if (move.from === 'a8') newAvailableCastlings.q = false;
        if (move.from === 'h8') newAvailableCastlings.k = false;
    }

    let newEnPassant: EnPassant = '-';
    if (isTwoSquarePawn) {
        const row =
            state.activeColor === 'w'
                ? String(parseInt(move.from[1]) + 1)
                : String(parseInt(move.from[1]) - 1);
        newEnPassant = (move.from[0] + row) as EnPassant;
    }

    const newState: GameState = {
        ...state,
        board: newBoard,
        activeColor: getEnemyColor(state.activeColor),
        enPassant: newEnPassant,
        halfMove: newHalfMove,
        fullMove: newFullMove,
        availableCastlings: newAvailableCastlings,
    };

    return { newState, newBoard, command };
}

function isStandardCastlingPosition(
    kingFrom: Square,
    rookFrom: Square,
): boolean {
    const standardPositions = [
        { king: 'e1', rooks: ['a1', 'h1'] },
        { king: 'e8', rooks: ['a8', 'h8'] },
    ];

    for (const pos of standardPositions) {
        if (pos.king === kingFrom && pos.rooks.includes(rookFrom)) {
            return true;
        }
    }
    return false;
}

function calculateCastlingDestination(
    kingFrom: Square,
    rookFrom: Square,
): Square {
    const isStandard = isStandardCastlingPosition(kingFrom, rookFrom);

    if (isStandard) {
        const row = kingFrom[1];
        return rookFrom[0] > kingFrom[0] ? 'g' + row : 'c' + row;
    }

    const rookCol = rookFrom.charCodeAt(0);
    const newCol = String.fromCharCode(rookCol + 1);
    return (newCol + kingFrom[1]) as Square;
}

function cretateCastlingMove(
    from: Square,
    to: Square,
    state: GameState,
): UCIMove | undefined {
    const board = state.board;
    const king = board.getPieceAt(from);
    const rook = board.getPieceAt(to);

    if (
        !ChessRegExp.pieces.king.test(king as string) ||
        !ChessRegExp.pieces.rook.test(rook as string)
    ) {
        return undefined;
    }

    let [kingCol, kingRow] = Object.values(squareToCoords(from));
    let rookCol = squareToCoords(to).col;
    const kingColor = getPieceColor(king as Piece);

    let flag = true;
    const result = applyMoveCommand(state, { from: from, to: to });
    if (!result) return undefined;
    const { newBoard, newState } = result;

    const enemyMoves = getEnemyPieces(board.raw(), kingColor)
        .map((piece) => getPseudoMoves(newState, piece.square))
        .flat()
        .map((move) => move.to);

    let [min, max] =
        kingCol < rookCol ? [kingCol, rookCol] : [rookCol, kingCol];

    for (let col = min + 1; col < max; col++) {
        let square = coordsToSquare(col, kingRow as number) as Square;
        let piece = board.getPieceAt(square);
        flag = flag && piece === null;
        flag = flag && !enemyMoves.includes(square);
    }

    if (!flag) return undefined;

    const kingTo = calculateCastlingDestination(from, to);
    return { from: from, to: kingTo };
}

export function getCastleMoves(state: GameState): UCIMove[] {
    const moves: UCIMove[] = [];
    const board = state.board;
    const color = state.activeColor as Color;
    const kingSquare = findKing(board.raw(), color);

    if (isKingInCheck(state, color)) {
        return moves;
    }

    const { Q, K, q, k } = state.availableCastlings;

    const pieces =
        color === DefaultData.white
            ? getWhitePieces(board.raw())
            : getBlackPieces(board.raw());

    const [qCastling, kCastling] =
        color === DefaultData.white ? [Q, K] : [q, k];

    if (qCastling || kCastling) {
        const rooks = pieces.filter((piece) =>
            ChessRegExp.pieces.rook.test(piece.name as string),
        );
        rooks.forEach((rook) => {
            const castling = cretateCastlingMove(
                kingSquare as Square,
                rook.square,
                state,
            );
            if (castling !== undefined) {
                moves.push(castling);
            }
        });
    }

    if (moves.length === 0) {
        const setups = get960CastlingSetups(state, color);
        for (const setup of setups) {
            moves.push({
                from: setup.kingFrom,
                to: setup.kingTo,
            });
        }
    }

    return moves;
}

export function get960CastlingSetups(
    state: GameState,
    color: Color,
): CastlingSetup[] {
    const setups: CastlingSetup[] = [];
    const board = state.board.raw();
    const kingSquare = findKing(board, color);

    if (!kingSquare || isKingInCheck(state, color)) {
        return setups;
    }

    const pieces =
        color === DefaultData.white
            ? getWhitePieces(board)
            : getBlackPieces(board);

    const rooks = pieces.filter((piece) =>
        ChessRegExp.pieces.rook.test(piece.name as string),
    );

    for (const rook of rooks) {
        const setup = create960CastlingSetup(
            kingSquare as Square,
            rook.square,
            board,
            color,
        );
        if (setup && isValid960Castling(board, setup, state, color)) {
            setups.push(setup);
        }
    }

    return setups;
}

function create960CastlingSetup(
    kingFrom: Square,
    rookFrom: Square,
    board: RawBoard,
    color: Color,
): CastlingSetup | null {
    const kCoords = squareToCoords(kingFrom);
    const rCoords = squareToCoords(rookFrom);

    if (!kCoords || !rCoords) return null;
    if (kCoords.row !== rCoords.row) return null;

    const direction = rCoords.col > kCoords.col ? 1 : -1;
    const kingToCol = rCoords.col - direction;
    const rookToCol = kCoords.col + direction;

    const kingTo = coordsToSquare(kingToCol, kCoords.row);
    const rookTo = coordsToSquare(rookToCol, kCoords.row);

    if (!kingTo || !rookTo) return null;

    return {
        kingFrom,
        kingTo,
        rookFrom,
        rookTo,
        direction,
    };
}

function isValid960Castling(
    board: RawBoard,
    setup: CastlingSetup,
    state: GameState,
    color: Color,
): boolean {
    const { kingFrom, kingTo, rookFrom } = setup;
    const kFrom = squareToCoords(kingFrom);
    const kTo = squareToCoords(kingTo);
    const rFrom = squareToCoords(rookFrom);

    if (!kFrom || !kTo || !rFrom) return false;

    const minCol = Math.min(kFrom.col, rFrom.col);
    const maxCol = Math.max(kFrom.col, rFrom.col);

    for (let col = minCol; col <= maxCol; col++) {
        const square = coordsToSquare(col, kFrom.row);
        if (!square) continue;
        if (square !== kingFrom && board[square as Square] !== null) {
            return false;
        }
    }

    const enemyColor = getEnemyColor(color);
    const tempState: GameState = {
        ...state,
        activeColor: enemyColor,
    };
    const enemyMoves = getAllPseudoMoves(tempState);

    const squaresToCheck = [kingFrom];
    for (let col = minCol; col <= maxCol; col++) {
        const sq = coordsToSquare(col, kFrom.row);
        if (sq) squaresToCheck.push(sq);
    }
    squaresToCheck.push(kingTo);

    for (const square of squaresToCheck) {
        if (enemyMoves.some((m) => m.to === square)) {
            return false;
        }
    }

    return true;
}

export function getAllPseudoMoves(state: GameState): UCIMove[] {
    const moves: UCIMove[] = [];
    const color = state.activeColor as Color;
    const board = state.board;

    const pieces =
        color === DefaultData.white
            ? getWhitePieces(board.raw())
            : getBlackPieces(board.raw());

    pieces.forEach((piece) =>
        moves.push(...getPseudoMoves(state, piece.square)),
    );

    moves.push(...getCastleMoves(state));
    return moves;
}

export class MoveHistory {
    private history: ExecutedMove[] = [];

    public add(move: ExecutedMove): void {
        this.history.push(move);
    }

    public undo(state: GameState): GameState | null {
        if (this.history.length === 0) return null;

        const lastMove = this.history.pop()!;
        const board = state.board.cloneBoard();
        lastMove.command.undo(board);

        return lastMove.stateBefore;
    }

    public getHistory(): ExecutedMove[] {
        return this.history;
    }

    public clear(): void {
        this.history = [];
    }

    public length(): number {
        return this.history.length;
    }
}
