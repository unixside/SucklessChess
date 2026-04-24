import { Board, Pieces } from "./types";

// prettier-ignore
export const EmptyBoard: Board = {
    a8: null, b8: null, c8: null, d8: null, e8: null, f8: null, g8: null, h8: null,
    a7: null, b7: null, c7: null, d7: null, e7: null, f7: null, g7: null, h7: null,
    a6: null, b6: null, c6: null, d6: null, e6: null, f6: null, g6: null, h6: null,
    a5: null, b5: null, c5: null, d5: null, e5: null, f5: null, g5: null, h5: null,
    a4: null, b4: null, c4: null, d4: null, e4: null, f4: null, g4: null, h4: null,
    a3: null, b3: null, c3: null, d3: null, e3: null, f3: null, g3: null, h3: null,
    a2: null, b2: null, c2: null, d2: null, e2: null, f2: null, g2: null, h2: null,
    a1: null, b1: null, c1: null, d1: null, e1: null, f1: null, g1: null, h1: null,
};

export function indexToSquareName(index: number): string | undefined {
    return Object.keys(EmptyBoard)[index];
}

export function squareNameToIndex(name: string): number | undefined {
    return Object.keys(EmptyBoard).indexOf(name);
}

export function cloneBoard(board: Board): Board {
    return JSON.parse(JSON.stringify(board));
}

export function createBoard(piecePlacement?: string[]): Board {
    const board: Board = cloneBoard(EmptyBoard);

    if (piecePlacement !== undefined) {
        piecePlacement.forEach((value, index) => {
            if (Pieces.includes(value)) {
                let square_name: string | undefined = indexToSquareName(index);
                if (square_name !== undefined) {
                    board[square_name] = value;
                }
            }
        });
    }
    return board;
}
