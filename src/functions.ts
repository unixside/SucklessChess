import { DefaultData } from "./constants";
import { Color, Piece } from "./types";

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
