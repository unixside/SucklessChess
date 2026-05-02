import { ChessRegExp, DefaultData, Offsets } from "./constants";
import {
	getEnemyColor,
	getKingChar,
	getPieceColor,
	isBlack,
	isWhite,
} from "./functions";

import { Color, GameState, Piece, Square } from "./types";
import { Board } from "./board";
import { MoveCommand, MoveFactory } from "./commands";

interface IPiece {
	name: Piece | null;
	square: Square;
}

export interface PseudoMove {
	from: Square;
	to: Square;
	promotion?: string;
}

export interface ExecutedMove {
	command: MoveCommand;
	stateBefore: GameState;
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
	let another = board.getPieceAt(to);
	return isEnemyPiece(piece, another as Piece) || another === null;
}

export function getPseudoMoves(state: GameState, from: Square): PseudoMove[] {
	const moves: PseudoMove[] = [];
	const board = state.board;
	const enPassant =
		state.enPassant !== "-" ? (state.enPassant as Square) : null;

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
					moves.concat(
						dir.map((sq) => ({ from: from, to: sq as Square })),
					);
				} else {
					let another = board.getPieceAt(dir[index]);
					if (isEnemyPiece(piece, another as Piece)) {
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
	const kingPiece = getKingChar(color);
	for (const square in board) {
		if (board.getPieceAt(square) === kingPiece) {
			return square as Square;
		}
	}
	return null;
}

function getPieces(board: Board): IPiece[] {
	return Object.entries(board)
		.map(([square, piece]) => ({
			name: piece,
			square: square,
		}))
		.filter((piece) => piece.name !== null);
}

export function getWhitePieces(board: Board): IPiece[] {
	return getPieces(board).filter((piece) => isWhite(piece?.name as Piece));
}

export function getBlackPieces(board: Board): IPiece[] {
	return getPieces(board).filter((piece) => isBlack(piece?.name as Piece));
}

export function getEnemyPieces(board: Board, color: Color): IPiece[] {
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

export function getLegalMoves(state: GameState, from?: Square): PseudoMove[] {
	const color = state.activeColor as Color;
	const board = state.board;
	const legalMoves: PseudoMove[] = [];

	if (from !== undefined) {
		const pseudoMoves = getPseudoMoves(state, from);
		pseudoMoves.forEach((move) => {
			const result = applyMoveCommand(state, move);
			if (!result) return;

			const { newState } = result;
			if (!isKingInCheck(newState, color)) {
				legalMoves.push(move);
			}
		});
	} else {
		Object.entries(board).forEach(([square, piece]) => {
			if (piece !== null && isPieceOfColor(piece, color)) {
				legalMoves.push(...getLegalMoves(state, square as Square));
			}
		});
	}
	return legalMoves;
}

export function applyMoveCommand(
	state: GameState,
	move: PseudoMove,
): { newState: GameState; newBoard: Board; command: MoveCommand } | null {
	const board = state.board;
	const enPassantSquare =
		state.enPassant !== "-" ? (state.enPassant as Square) : null;

	const command = MoveFactory.create(move, board, enPassantSquare);
	if (!command) return null;

	const newBoard = board.cloneBoard();
	command.execute(newBoard);

	const newState: GameState = {
		...state,
		board: newBoard,
		activeColor: getEnemyColor(state.activeColor),
		enPassant: "-",
	};

	return { newState, newBoard, command };
}

function cretateCastlingMove(
	from: Square,
	to: Square,
	state: GameState,
): PseudoMove | undefined {
	const board = state.board;
	const king = board.getPieceAt(from);
	const rook = board.getPieceAt(to);

	if (
		!ChessRegExp.fromCastling.test(from) ||
		!ChessRegExp.toCastling.test(to) ||
		!ChessRegExp.pieces.king.test(king as string) ||
		!ChessRegExp.pieces.rook.test(rook as string)
	) {
		return undefined;
	}

	const [kingCol, kingRow] = Object.values(squareToCoords(from));
	const rookCol = squareToCoords(to).col;
	const kingColor = getPieceColor(king as Piece);

	let flag = true;
	const result = applyMoveCommand(state, { from: from, to: to });
	if (!result) return undefined;
	const { newBoard, newState } = result;

	const enemyMoves = getEnemyPieces(board, kingColor)
		.map((piece) => getPseudoMoves(newState, piece.square))
		.flat()
		.map((move) => move.to);

	const [pos_min, pos_max] =
		kingCol < rookCol ? [kingCol, rookCol] : [rookCol, kingCol];

	for (let i = pos_min; i < pos_max; ++i) {
		let square = coordsToSquare(i, kingRow as number) as Square;
		let piece = board.getPieceAt(square);
		flag = flag && piece === null;
		flag = flag && !enemyMoves.includes(square);
	}

	if (!flag) return undefined;

	return { from: from, to: to };
}

export function getCastleMoves(state: GameState): PseudoMove[] {
	const moves: PseudoMove[] = [];
	const board = state.board;
	const color = state.activeColor as Color;
	const kingSquare = findKing(board, color);

	if (isKingInCheck(state, color)) {
		return moves;
	}

	const { Q, K, q, k } = state.availableCastlings;

	const pieces =
		color === DefaultData.white
			? getWhitePieces(board)
			: getBlackPieces(board);

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
	return moves;
}

export function getAllPseudoMoves(state: GameState): PseudoMove[] {
	const moves: PseudoMove[] = [];
	const color = state.activeColor as Color;
	const board = state.board;

	const pieces =
		color === DefaultData.white
			? getWhitePieces(board)
			: getBlackPieces(board);

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

	public clear(): void {
		this.history = [];
	}

	public length(): number {
		return this.history.length;
	}
}
