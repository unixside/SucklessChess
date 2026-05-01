import { DefaultData } from "./constants";
import { Board, GameState, Move, Square } from "./types";
import { Result } from "./result";
import { FenValidations as validation } from "./validations";
import { getLegalMoves } from "./moves";

export class ChessGame {
    private white?: string;
    private black?: string;

    private state?: GameState;
    private result?: string;

    private isInCheck?: boolean;
    private check_mate?: boolean;
    private winner?: string;

    constructor(fen: string = DefaultData.fen) {
        let result: Result<GameState> = validation.fen(fen);

        if (result.IsFailure()) {
            let errors = ["Failed to create a chess game\n", result.GetError()];
            throw new Error(errors.join(""));
        }

        this.state = result.GetValue();
    }

    public getResult(): string | undefined {
        return this.result;
    }

    public getBoard(): Board | undefined {
        return this.state?.board;
    }

    public gameOver(): boolean {
        if (this.state?.halfMove === 50) {
            this.result = "1/2-1/2";
            return true;
        }

        if (this.check_mate) {
            return true;
        }

        return false;
    }

    public getMoves(from?: Square): Move[] {
        if (this.state === undefined) {
            return [];
        }
        return getLegalMoves(this.state, from);
    }
}
