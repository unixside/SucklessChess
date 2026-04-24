import { Piece } from "./types";

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
