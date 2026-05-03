import { ChessRegExp } from "./constants";
import { Pieces, Piece, Square } from "./types";
import { FenValidations as validations } from "./validations";

export type RawBoard = Record<Square, Piece | null>;

// prettier-ignore
export const EmptyBoard: RawBoard = {
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

export class Board {
	private squares: Record<Square, Piece | null> = { ...EmptyBoard };
	constructor(piecePlacement: string) {
		let result = validations.piecePlacement(piecePlacement);

		if (result.IsFailure()) {
			throw new Error(result.GetError()?.join("\n"));
		}

		result
			.GetValue()
			?.split("/")
			.join("")
			.split("")
			.map((chr) =>
				Pieces.includes(chr) ? chr : "0".repeat(parseInt(chr)),
			)
			.join("")
			.split("")
			.forEach((chr, i) => {
				let sq_name = indexToSquareName(i);
				if (Pieces.includes(chr) && sq_name !== undefined) {
					this.squares[sq_name] = chr;
				}
			});
	}

	public toPiecePlacement(): string | undefined {
		return Object.values(this.squares)
			.map((piece) => (piece === null ? "0" : piece))
			.join("")
			.match(new RegExp(`.{1,8}`, "g"))
			?.map((chunk) => {
				const chunckArray = chunk.split("");
				let str = "";
				let spaces = 0;

				if (chunckArray.every((chr) => chr === "0")) {
					return "8";
				}

				for (const chr of chunckArray) {
					if (chr === "0") {
						spaces += 1;
						continue;
					}

					if (Pieces.includes(chr)) {
						if (spaces > 0) {
							str += spaces.toString();
							spaces = 0;
						}
						str += chr;
					}
				}

				if (spaces > 0) {
					str += spaces.toString();
				}

				return str;
			})
			.join("/");
	}

	public setSquare(square: Square, value: Piece | null): boolean {
		if (!ChessRegExp.square.test(square)) {
			console.error("Invalid square name");
			return false;
		}

		if (value !== null && !Pieces.includes(value as Piece)) {
			console.error("Invalid piece name");
			return false;
		}

		this.squares[square] = value;
		return true;
	}

	public getPieceAt(from: Square): Piece | null | undefined {
		if (!ChessRegExp.square.test(from)) {
			//console.error("Invalid square name");
			return undefined;
		}
		return this.squares[from];
	}

	public raw(): RawBoard {
		return JSON.parse(JSON.stringify(this.squares));
	}

	public cloneBoard(): Board {
		return new Board(this.toPiecePlacement() as string);
	}
}
