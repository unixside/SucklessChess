import { DefaultData } from "./constants";

export const PiecesChar = [...DefaultData.pieces.split("")] as const;

export type PieceChar = (typeof PiecesChar)[number];
export type Board = Record<string, string | null>;
