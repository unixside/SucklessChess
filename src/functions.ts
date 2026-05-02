import { DefaultData } from "./constants";
import { Square, Color, Piece } from "./types";

export function isWhite(piece: Piece): boolean {
	return piece === piece.toUpperCase();
}

export function isBlack(piece: Piece): boolean {
	return piece === piece.toLowerCase();
}

export function sameColor(piece1: Piece, piece2: Piece): boolean {
	if (isWhite(piece1)) {
		return isWhite(piece2);
	}
	return isBlack(piece2);
}

export function getPieceColor(piece: Piece): Color {
	return isWhite(piece) ? DefaultData.white : DefaultData.black;
}

export function getEnemyColor(color: Color): Color {
	return color === DefaultData.white ? DefaultData.black : DefaultData.white;
}

export function getKingChar(color: Color): Piece {
	return color === DefaultData.white ? "K" : "k";
}

export function getRookChar(color: Color): Piece {
	return color === DefaultData.white ? "R" : "r";
}

function even(n: number): boolean {
	return n % 2 === 0;
}

function odd(n: number): boolean {
	return n % 2 !== 0;
}

export function getSquareColor(name: Square): Color {
	const col = DefaultData.colunms.indexOf(name[0]);
	const row = DefaultData.rows.indexOf(name[1]);

	const white = (even(col) && even(row)) || (odd(col) && odd(row));

	if (white) {
		return DefaultData.white;
	}
	return DefaultData.black;
}
