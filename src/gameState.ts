import { Board, RawBoard } from "./board";
import { DefaultData } from "./constants";
import { getEnemyColor, getKingChar, getPieceColor } from "./functions";
import { Color, Castlings, CastlingSetup, Piece, Square } from "./types";
import { getPieces, getEnemyPieces, getPseudoMoves, isKingInCheck, squareToCoords } from "./move";

interface GameStatus {
	isCheck: boolean;
	isCheckmate: boolean;
	isStalemate: boolean;
	isRepetition: boolean;
}

function coordsToSquare(col: number, row: number): Square | null {
	if (col < 0 || col > 7 || row < 0 || row > 7) return null;
	return (DefaultData.colunms[col] + DefaultData.rows[row]) as Square;
}

export interface IGameState {
	board: Board;
	activeColor: Color;
	availableCastlings: Castlings;
	enPassant: string;
	halfMove: number;
	fullMove: number;
}

export class GameStateImpl implements IGameState {
	board: Board;
	activeColor: Color;
	availableCastlings: Castlings;
	enPassant: string;
	halfMove: number;
	fullMove: number;

	constructor(state: IGameState) {
		this.board = state.board;
		this.activeColor = state.activeColor;
		this.availableCastlings = state.availableCastlings;
		this.enPassant = state.enPassant;
		this.halfMove = state.halfMove;
		this.fullMove = state.fullMove;
	}

	public getStatus(): GameStatus {
		return {
			isCheck: false,
			isCheckmate: false,
			isStalemate: false,
			isRepetition: false,
		};
	}

	public clone(): GameStateImpl {
		return new GameStateImpl({
			board: this.board.cloneBoard(),
			activeColor: this.activeColor,
			availableCastlings: { ...this.availableCastlings },
			enPassant: this.enPassant,
			halfMove: this.halfMove,
			fullMove: this.fullMove,
		});
	}

	public findValidCastlings(color: Color): CastlingSetup[] {
		const board = this.board.raw();
		const kingSquare = this.findKingSquare(board, color);
		if (!kingSquare) return [];

		const king = board[kingSquare];
		if (!king || getPieceColor(king) !== color) return [];

		if (isKingInCheck(this as any, color)) return [];

		const hasMoved = this.hasPieceMoved(color);
		if (hasMoved) return [];

		const rooks = this.findRookSquares(board, color);
		const validSetups: CastlingSetup[] = [];

		for (const rookSquare of rooks) {
			const rook = board[rookSquare];
			if (!rook || getPieceColor(rook) !== color) continue;
			if (this.hasRookMoved(rookSquare, color)) continue;

			const setup = this.createCastlingSetup(
				kingSquare,
				rookSquare,
				color,
			);
			if (setup && this.isValidCastling(board, setup, color)) {
				validSetups.push(setup);
			}
		}

		return validSetups;
	}

	private findKingSquare(board: RawBoard, color: Color): Square | null {
		const kingPiece = getKingChar(color);
		for (const square of Object.keys(board)) {
			if (board[square as Square] === kingPiece) {
				return square as Square;
			}
		}
		return null;
	}

	private findRookSquares(board: RawBoard, color: Color): Square[] {
		const rookPiece = color === "w" ? "R" : "r";
		const rooks: Square[] = [];
		for (const square of Object.keys(board)) {
			if (board[square as Square] === rookPiece) {
				rooks.push(square as Square);
			}
		}
		return rooks;
	}

	private hasPieceMoved(color: Color): boolean {
		const rooks = this.findRookSquares(this.board.raw(), color);
		const castlings = color === "w"
			? this.availableCastlings
			: this.availableCastlings;

		if (color === "w") {
			if (rooks.some(r => r === "h1") && !this.availableCastlings.K) return true;
			if (rooks.some(r => r === "a1") && !this.availableCastlings.Q) return true;
		} else {
			if (rooks.some(r => r === "h8") && !this.availableCastlings.k) return true;
			if (rooks.some(r => r === "a8") && !this.availableCastlings.q) return true;
		}
		return false;
	}

	private hasRookMoved(rookSquare: Square, color: Color): boolean {
		if (color === "w") {
			if (rookSquare === "h1" && !this.availableCastlings.K) return true;
			if (rookSquare === "a1" && !this.availableCastlings.Q) return true;
		} else {
			if (rookSquare === "h8" && !this.availableCastlings.k) return true;
			if (rookSquare === "a8" && !this.availableCastlings.q) return true;
		}
		return false;
	}

	private createCastlingSetup(
		kingFrom: Square,
		rookFrom: Square,
		color: Color,
	): CastlingSetup | null {
		const kCoords = squareToCoords(kingFrom);
		const rCoords = squareToCoords(rookFrom);

		if (!kCoords || !rCoords) return null;

		const kingRow = kCoords.row;
		const direction = rCoords.col > kCoords.col ? 1 : -1;

		const kingToCol = rCoords.col;
		const rookToCol = kCoords.col + direction;

		const kingTo = coordsToSquare(kingToCol, kingRow);
		const rookTo = coordsToSquare(rookToCol, kingRow);

		if (!kingTo || !rookTo) return null;

		return {
			kingFrom,
			kingTo,
			rookFrom,
			rookTo,
			direction,
		};
	}

	private isValidCastling(
		board: RawBoard,
		setup: CastlingSetup,
		color: Color,
	): boolean {
		const { kingFrom, kingTo, rookFrom } = setup;
		const kFrom = squareToCoords(kingFrom);
		const kTo = squareToCoords(kingTo);
		const rFrom = squareToCoords(rookFrom);

		if (!kFrom || !kTo || !rFrom) return false;

		if (kFrom.row !== rFrom.row) return false;

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
		const enemyPieces = getEnemyPieces(board, color);

		const squaresToCheck = [kingFrom];
		if (kFrom.col !== kTo.col) {
			squaresToCheck.push(coordsToSquare(kTo.col, kFrom.row) as Square);
		}
		for (let col = minCol; col <= maxCol; col++) {
			const sq = coordsToSquare(col, kFrom.row);
			if (sq) squaresToCheck.push(sq);
		}

		const tempState: any = {
			...this,
			board: { raw: () => board },
			activeColor: enemyColor,
		};

		for (const square of squaresToCheck) {
			if (isKingInCheck(tempState as any, color)) {
				return false;
			}

			const enemyMoves = enemyPieces.flatMap((piece) =>
				getPseudoMoves(tempState as any, piece.square),
			);
			if (enemyMoves.some((m: any) => m.to === square)) {
				return false;
			}
		}

		return true;
	}
}
