import { Board, GameState, Rows } from "./types";
import { ChessRegExp } from "./constants";
import { createBoard } from "./gameController";

export class Result<T> {
    protected constructor(
        readonly value?: T,
        readonly isSuccess: boolean = true,
        readonly error?: string,
    ) {}

    public IsSuccess(): boolean {
        return this.isSuccess;
    }

    public IsFailure(): boolean {
        return !this.isSuccess;
    }

    public GetError() {
        if (this.IsSuccess()) {
            throw new Error("[Error]: Result is success");
        }
        return this.error;
    }

    public GetValue() {
        if (this.IsFailure()) {
            throw new Error("[Error]: Result is failure")
        }
        return this.value;
    }
}

export class Success<T> extends Result<T> {
    constructor(value: T) {
        super(value, true);
    }
}

export class Failure<E> extends Result<E> {
    constructor(error: string) {
        super(undefined, false, error);
    }
}

export namespace FenValidations {
    function validateWithRegExp(value: string, regexp: RegExp, name: string): Result<string> {
        if (value === undefined || value === null || value === "") {
            return new Failure("Value is undefined, null or empty string");
        }
        
        if (!regexp.test(value)) return new Failure(`Invalid syntax for ${name}`);

        return new Success(value);
        
    }
    
    export function piecePlacement(value?: string): Result<string> {

        if (value === undefined) {
            return new Failure("Value is undefined");
        }

        if (!ChessRegExp.piecePlacement.test(value)) {
            return new Failure("Invalid character in value");
        }        
        
        let whiteKing = RegExp("K", "g").exec(value);
		let blackKing = RegExp("k", "g").exec(value);
        
		if (whiteKing?.length !== 1 || blackKing?.length !== 1) {
			return new  Failure("Invalid number of kings in piece placement");
		}

        let rows = value.split("");

        if (rows.length !== 8) {
            return new Failure("Invalid number of rows");
        }

        for (const row in rows) {
			let number_spaces = 0;
			let number_pieces = 0;

			row.split("").forEach((chr) => {
				if (Rows.includes(chr)) {
					number_spaces += parseInt(chr);
				} else {
					number_pieces + 1;
				}
			});

			if (number_spaces + number_pieces > 8) {
				return new Failure(
                    "Invalid number of spaces or pieces in a row"
				);
			}
		}
      
        return new Success(value)
    }

    export function activeColor(color: string): Result<string> {
        return validateWithRegExp(
            color, ChessRegExp.activeColor, "active color"
        );
    }

    export function availableCastlings(value: string): Result<string> {
        return validateWithRegExp(
            value, ChessRegExp.AvailableCastling, "available castlings"
        );
    }

    export function enPassant(value: string): Result<string> {
        return validateWithRegExp(
            value, ChessRegExp.enPassant, "en passant" 
        )
    }

    export function halfMove(value: string): Result<string> {
        return validateWithRegExp(
            value, ChessRegExp.halfMove, "half move clock"
        )
    }

    export function fullMove(value: string): Result<string> {
        return validateWithRegExp(
            value, ChessRegExp.fullMove, "full move clock"
        )
    }

    export function fen(value: string): Result<GameState> {
        if (value === undefined || value === null || value === "") {
            return new Failure("Value is undefined, null or empty string");
        }

        let [
            piece_placement,
            active_color,
            available_castlings,
            en_passant,
            half_move,
            full_move
        ] = value.split(" ");

        let validations: Array<Result<string>> = [
            piecePlacement(piece_placement),
            activeColor(active_color),
            availableCastlings(available_castlings),
            enPassant(en_passant),
            halfMove(half_move),
            fullMove(full_move)
        ];

        let errors: string[] = [];

        for (const validation of validations) {
            if (validation.IsFailure()) {
                errors.push(String(validation.GetError()))
            }
        }

        if (errors.length > 0) {
            return new Failure(errors.join("\n"));
        }

        let piece_placement_array = piece_placement
            .split("/")
            .join("")
            .split("")
            .map((chr) => {
            if (Rows.includes(chr)) {
                return "0".repeat((parseInt(chr)));
            }
            return chr;
        }).join("").split("")

        let board: Board = createBoard(piece_placement_array);

        return new Success({
            board: board,
            activeColor: active_color,
            availableCastlings: available_castlings,
            enPassant: en_passant,
            halfMove: parseInt(half_move),
            fullMove: parseInt(full_move),
        });
    }
}
