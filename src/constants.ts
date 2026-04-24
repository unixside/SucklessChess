export namespace DefaultData {
    export const colunms = "abcdefgh";
    export const rows = "87654321";
    export const pieces = "pnbrqkPNBRQK";
    export const num_squares = 64;
    export const white = "w";
    export const black = "b";
    export const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
}

export namespace ChessRegExp {
    export const white = /^[w]$/;
    export const black = /^[b]$/;

    // FEN section
    export const piecePlacement = /^([\/]?[pnbrqkPNBRQK1-8]{1,8}[\/]?){8}$/;
    export const activeColor = /^[wb-]$/;
    export const AvailableCastling = /^([K]?[Q]?[k]?[Q]?)|-$/
    export const enPassant = /^[a-h][1-8]$/;
    export const halfMove = /^([0-9]|[1-4][0-9]|50)$/;
    export const fullMove = /^[1-9]\d*$/;
}
