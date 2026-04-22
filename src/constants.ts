export namespace DefaultData {
    export const colunms = "abcdefgh";
    export const rows = "87654321";
    export const pieces = "pnbrqkPNBRQK";
    export const num_squares = 64;
    export const white = "w";
    export const black = "b";
}

export namespace ChessRegExp {
    export const white = /^[w]$/;
    export const black = /^[b]$/;

    // FEN section
    export const activeColor = /^[wb-]$/;
    export const enPassant = /^[a-h][1-8]$/;
}
