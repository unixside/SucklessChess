import { PieceChar } from "./types";

export function isWhite(piece: PieceChar): boolean {
    return piece === piece.toUpperCase();
}

export function isBlack(piece: PieceChar): boolean {
    return piece === piece.toLowerCase();
}

export function sameColor(piece1: PieceChar, piece2: PieceChar): boolean {
    if (isWhite(piece1)) {
        return isWhite(piece2);
    }
    return isBlack(piece2);
}
