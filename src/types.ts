import { DefaultData } from "./constants";

export const Pieces = [...DefaultData.pieces.split("")] as const;
export const Columns = [...DefaultData.colunms.split("")] as const;
export const Rows = [...DefaultData.rows.split("")] as const;

export type Piece = (typeof Pieces)[number];
export type Column = (typeof Columns)[number];
export type Row = (typeof Rows)[number];

export type Color = "w" | "b";

export type Board = Record<string, string | null>;

export type Square = `${Column}${Row}`;
export type EnPassant = Square | "-";
export type HalfMove = Exclude<string, number>;

export type Move = {
    from: Square;
    to: Square;
    promotion?: Piece;
};

export type MoveType =
    | "normal"
    | "capture"
    | "enPassant"
    | "castle"
    | "promotion";

export type MoveInfo = Move & {
    type: MoveType;
    notation: string;
};

export type GameState = {
    board: Board;
    activeColor: string;
    availableCastlings: string;
    enPassant: string;
    halfMove: number;
    fullMove: number;
};
