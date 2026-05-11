import { Board } from "./board";
import { ChessRegExp } from "./constants";
import { getPieceColor } from "./functions";
import { PseudoMove } from "./move";
import { Color, Piece, Square } from "./types";

export interface MoveCommand {
	execute(board: Board): void;
	undo(board: Board): void;
}

export class NormalMove implements MoveCommand {
	constructor(
		private piece: Piece,
		private from: Square,
		private to: Square,
		private captured?: Piece,
	) {}

	execute(board: Board): void {
		const targetPiece = board.getPieceAt(this.to);
		if (targetPiece !== null) {
			this.captured = targetPiece;
		}
		board.setSquare(this.from, null);
		board.setSquare(this.to, this.piece);
	}

	undo(board: Board): void {
		board.setSquare(this.from, this.piece);
		if (this.captured !== undefined) {
			board.setSquare(this.to, this.captured);
		} else {
			board.setSquare(this.to, null);
		}
	}
}

export class CaptureMove implements MoveCommand {
	constructor(
		private piece: Piece,
		private from: Square,
		private to: Square,
		private captured: Piece,
	) {}

	execute(board: Board): void {
		board.setSquare(this.from, null);
		board.setSquare(this.to, this.piece);
	}

	undo(board: Board): void {
		board.setSquare(this.from, this.piece);
		board.setSquare(this.to, this.captured);
	}
}

export class EnPassantMove implements MoveCommand {
	constructor(
		private piece: Piece,
		private from: Square,
		private to: Square,
		private capturedPawnSquare: Square,
		private capturedPawn: Piece,
	) {}

	execute(board: Board): void {
		this.capturedPawn = board.getPieceAt(this.capturedPawnSquare) as Piece;
		board.setSquare(this.from, null);
		board.setSquare(this.to, this.piece);
		board.setSquare(this.capturedPawnSquare, null);
	}

	undo(board: Board): void {
		board.setSquare(this.from, this.piece);
		board.setSquare(this.to, null);
		board.setSquare(this.capturedPawnSquare, this.capturedPawn);
	}

	public getCapturedPawnSquare(): Square {
		return this.capturedPawnSquare;
	}

	public getTo(): Square {
		return this.to;
	}
}

export class CastlingMove implements MoveCommand {
	constructor(
		private king: Piece,
		private kingFrom: Square,
		private kingTo: Square,
		private rook: Piece,
		private rookFrom: Square,
		private rookTo: Square,
	) {}

	execute(board: Board): void {
		board.setSquare(this.kingFrom, null);
		board.setSquare(this.kingTo, this.king);
		board.setSquare(this.rookFrom, null);
		board.setSquare(this.rookTo, this.rook);
	}

	undo(board: Board): void {
		board.setSquare(this.kingFrom, this.king);
		board.setSquare(this.kingTo, null);
		board.setSquare(this.rookFrom, this.rook);
		board.setSquare(this.rookTo, null);
	}

	public getRookFrom(): Square {
		return this.rookFrom;
	}

	public getRookTo(): Square {
		return this.rookTo;
	}

	public getKingFrom(): Square {
		return this.kingFrom;
	}

	public getKingTo(): Square {
		return this.kingTo;
	}

	public getKingPiece(): Piece {
		return this.king;
	}

	public getRookPiece(): Piece {
		return this.rook;
	}
}

export class PromotionMove implements MoveCommand {
	constructor(
		private from: Square,
		private to: Square,
		private pawn: Piece,
		private promotedPiece: Piece,
		private captured?: Piece,
	) {}

	execute(board: Board): void {
		const targetPiece = board.getPieceAt(this.to);
		if (targetPiece !== null) {
			this.captured = targetPiece;
		}
		board.setSquare(this.from, null);
		board.setSquare(this.to, this.promotedPiece);
	}

	undo(board: Board): void {
		board.setSquare(this.from, this.pawn);
		if (this.captured !== undefined) {
			board.setSquare(this.to, this.captured);
		} else {
			board.setSquare(this.to, null);
		}
	}

	public getPromotedPiece(): Piece {
		return this.promotedPiece;
	}

	public getTo(): Square {
		return this.to;
	}
}

export class MoveFactory {
	static create(
		move: PseudoMove,
		board: Board,
		enPassantSquare: Square | null,
	): MoveCommand | null {
		const piece = board.getPieceAt(move.from) as Piece;
		const targetPiece = board.getPieceAt(move.to);

		if (!piece) return null;

		const color = getPieceColor(piece);
		const { col: fromCol, row: fromRow } = this.squareToCoords(move.from);
		const { col: toCol, row: toRow } = this.squareToCoords(move.to);

		if (ChessRegExp.pieces.king.test(piece)) {
			if (Math.abs(fromCol - toCol) === 2) {
				return this.createCastlingMove(move, board, piece, color);
			}
		}

		if (ChessRegExp.pieces.pawn.test(piece)) {
			if (enPassantSquare && move.to === enPassantSquare) {
				return this.createEnPassantMove(move, board, piece, color);
			}

			const isPromotion =
				(ChessRegExp.pieces.pawn.test(piece) &&
					color === "w" &&
					move.to[1] === "8") ||
				(color === "b" && move.to[1] === "1");

			if (isPromotion) {
				return this.createPromotionMove(
					move,
					board,
					piece,
					move.promotion,
				);
			}
		}

		if (targetPiece !== null) {
			return new CaptureMove(
				piece,
				move.from,
				move.to,
				targetPiece as Piece,
			);
		}

		return new NormalMove(piece, move.from, move.to);
	}

	private static findRookFromKingDestination(
		board: Board,
		kingTo: Square,
		direction: 1 | -1,
	): Square | null {
		const kingRow = kingTo[1];
		const destCol = kingTo.charCodeAt(0);

		if (direction === 1) {
			for (let col = destCol + 1; col <= 'h'.charCodeAt(0); col++) {
				const sq = (String.fromCharCode(col) + kingRow) as Square;
				const piece = board.getPieceAt(sq);
				if (piece && ChessRegExp.pieces.rook.test(piece)) {
					return sq;
				}
			}
		} else {
			for (let col = destCol - 1; col >= 'a'.charCodeAt(0); col--) {
				const sq = (String.fromCharCode(col) + kingRow) as Square;
				const piece = board.getPieceAt(sq);
				if (piece && ChessRegExp.pieces.rook.test(piece)) {
					return sq;
				}
			}
		}
		return null;
	}

	private static createCastlingMove(
		move: PseudoMove,
		board: Board,
		king: Piece,
		color: Color,
	): CastlingMove | null {
		const kingFrom = move.from;
		const kingTo = move.to;
		const direction = kingTo[0] > kingFrom[0] ? 1 : -1;

		const rookFrom = this.findRookFromKingDestination(board, kingTo, direction);
		if (!rookFrom) return null;

		const row = kingFrom[1];
		const rookTo: Square =
			direction === 1
				? ((String.fromCharCode(kingTo.charCodeAt(0) - 1) + row) as Square)
				: ((String.fromCharCode(kingTo.charCodeAt(0) + 1) + row) as Square);

		const rook = board.getPieceAt(rookFrom) as Piece;
		return new CastlingMove(king, kingFrom, kingTo, rook, rookFrom, rookTo);
	}

	private static createEnPassantMove(
		move: PseudoMove,
		board: Board,
		pawn: Piece,
		color: Color,
	): EnPassantMove | null {
		const capturedPawnRow =
			color === "w" ? parseInt(move.to[1]) - 1 : parseInt(move.to[1]) + 1;
		const capturedPawnSquare = (move.to[0] +
			capturedPawnRow.toString()) as Square;
		const capturedPawn = board.getPieceAt(capturedPawnSquare) as Piece;

		if (!ChessRegExp.pieces.pawn.test(capturedPawn)) return null;

		return new EnPassantMove(
			pawn,
			move.from,
			move.to,
			capturedPawnSquare,
			capturedPawn,
		);
	}

	private static createPromotionMove(
		move: PseudoMove,
		board: Board,
		pawn: Piece,
		promotionChar?: string,
	): PromotionMove | null {
		const color = getPieceColor(pawn);
		const promotedPiece: Piece = promotionChar
			? (promotionChar as Piece)
			: color === "w"
				? "Q"
				: "q";

		return new PromotionMove(
			move.from,
			move.to,
			pawn,
			promotedPiece,
			undefined,
		);
	}

	private static squareToCoords(square: Square): {
		col: number;
		row: number;
	} {
		const COLUMNS = "abcdefgh";
		const ROWS = "12345678";
		return {
			col: COLUMNS.indexOf(square[0]),
			row: parseInt(square[1]) - 1,
		};
	}
}
