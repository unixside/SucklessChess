export namespace DefaultData {
    export const colunms = "abcdefgh";
    export const rows = "87654321";
    export const pieces = "pnbrqkPNBRQK";
    export const num_squares = 64;
    export const white = "w";
    export const black = "b";
    export const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
}

export namespace Offsets {
    export const Pawn = {
        P: {
            always: [0, 1],
            only_first: [0, 2],
            right_capture: [1, 1],
            left_capture: [-1, 1],
            init_row: 2,
        },
        p: {
            always: [0, -1],
            only_first: [0, -2],
            right_capture: [1, -1],
            left_capture: [-1, -1],
            init_row: 7,
        },
    };

    export const KN = {
        n: [
            [-1, -2],
            [1, -2],
            [2, -1],
            [2, 1],
            [1, 2],
            [-1, 2],
            [-2, 1],
            [-2, -1],
        ] as [number, number][],
        k: [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
        ] as [number, number][],
    };

    export const BRQ = {
        b: [
            [
                [1, 1],
                [2, 2],
                [3, 3],
                [4, 4],
                [5, 5],
                [6, 6],
                [7, 7],
            ],
            [
                [-1, 1],
                [-2, 2],
                [-3, 3],
                [-4, 4],
                [-5, 5],
                [-6, 6],
                [-7, 7],
            ],
            [
                [1, -1],
                [2, -2],
                [3, -3],
                [4, -4],
                [5, -5],
                [6, -6],
                [7, -7],
            ],
            [
                [-1, -1],
                [-2, -2],
                [-3, -3],
                [-4, -4],
                [-5, -5],
                [-6, -6],
                [-7, -7],
            ],
        ],
        r: [
            [
                [-1, 0],
                [-2, 0],
                [-3, 0],
                [-4, 0],
                [-5, 0],
                [-6, 0],
                [-7, 0],
            ],
            [
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
                [6, 0],
                [7, 0],
            ],
            [
                [0, -1],
                [0, -2],
                [0, -3],
                [0, -4],
                [0, -5],
                [0, -6],
                [0, -7],
            ],
            [
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [0, 5],
                [0, 6],
                [0, 7],
            ],
        ],
        q: [
            // Bishop directions
            [
                [1, 1],
                [2, 2],
                [3, 3],
                [4, 4],
                [5, 5],
                [6, 6],
                [7, 7],
            ],
            [
                [-1, 1],
                [-2, 2],
                [-3, 3],
                [-4, 4],
                [-5, 5],
                [-6, 6],
                [-7, 7],
            ],
            [
                [1, -1],
                [2, -2],
                [3, -3],
                [4, -4],
                [5, -5],
                [6, -6],
                [7, -7],
            ],
            [
                [-1, -1],
                [-2, -2],
                [-3, -3],
                [-4, -4],
                [-5, -5],
                [-6, -6],
                [-7, -7],
            ],
            // Rook directions
            [
                [-1, 0],
                [-2, 0],
                [-3, 0],
                [-4, 0],
                [-5, 0],
                [-6, 0],
                [-7, 0],
            ],
            [
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
                [6, 0],
                [7, 0],
            ],
            [
                [0, -1],
                [0, -2],
                [0, -3],
                [0, -4],
                [0, -5],
                [0, -6],
                [0, -7],
            ],
            [
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [0, 5],
                [0, 6],
                [0, 7],
            ],
        ],
    };
}

export namespace ChessRegExp {
    export const white = /^[w]$/;
    export const black = /^[b]$/;
    export const pawn = /^[pP]$/;

    export const KN = /^[nNkK]$/;
    export const BRQ = /^[bBrRqQ]$/;

    // FEN section
    export const piecePlacement = /^([\/]?[pnbrqkPNBRQK1-8]{1,8}[\/]?){8}$/;
    export const activeColor = /^[wb-]$/;
    export const AvailableCastling = /^([K]?[Q]?[k]?[Q]?)|-$/;
    export const enPassant = /^[a-h][1-8]$/;
    export const halfMove = /^([0-9]|[1-4][0-9]|50)$/;
    export const fullMove = /^[1-9]\d*$/;

    // UCI Move (standard chess)
    export const UCIMove = /^[a-h][1-8][a-h][1-8]$/;
    // UCI Move with promotion
    export const UCIMovePromotion = /^[a-h][1-8][a-h][1-8][nbrqNBRQ]$/;

    // Chess 960 castling (king moves 2+ squares)
    export const castling = /^[a-h][1-8][a-h][1-8]$/;

    // Standard castling notation (K=king-side, Q= queen-side)
    export const castlingStandard = /^[KQ]?[kq]?$/;
}
