import { DefaultData } from "./constants";
import { Board } from "./board";

export const Pieces = [...DefaultData.pieces.split("")] as const;
export const Columns = [...DefaultData.colunms.split("")] as const;
export const Rows = [...DefaultData.rows.split("")] as const;

export type Piece = (typeof Pieces)[number];
export type Column = (typeof Columns)[number];
export type Row = (typeof Rows)[number];

export type Color = "w" | "b";

export type Square = `${Column}${Row}`;
export type EnPassant = Square | "-";
export type HalfMove = Exclude<string, number>;

export interface PseudoMove {
	from: Square;
	to: Square;
	promotion?: string;
}

export type Castlings = { K: boolean; Q: boolean; q: boolean; k: boolean };

export interface CastlingSetup {
	kingFrom: Square;
	kingTo: Square;
	rookFrom: Square;
	rookTo: Square;
	direction: 1 | -1;
}

export interface GameState {
	board: Board;
	activeColor: Color;
	availableCastlings: Castlings;
	enPassant: EnPassant;
	halfMove: number;
	fullMove: number;
}

export interface SpecialEffectPiece {
	from: Square;
	to: Square;
	piece: Piece;
}

export type SpecialEffectType = "promotion" | "castling" | "enpassant";

export interface SpecialEffect {
	type: SpecialEffectType;
	pieces: SpecialEffectPiece[];
}

export interface MoveResult {
	success: boolean;
	move: PseudoMove;
	specialEffect?: SpecialEffect;
}
