import { Board } from "./board";
import { DefaultData } from "./constants";
import { GameStateImpl, IGameState } from "./gameState";
import {
	PseudoMove,
	applyMoveCommand,
	MoveHistory,
	ExecutedMove,
} from "./move";
import { FenValidations } from "./validations";

export class ChessGame {
	private white?: string;
	private black?: string;

	private state: GameStateImpl;
	private moveHistory: MoveHistory;

	constructor(fen?: string) {
		const fenString = fen || DefaultData.fen;
		const result = FenValidations.fen(fenString);

		if (result.IsFailure()) {
			throw new Error(result.GetError()?.join("\n"));
		}

		const gameState = result.GetValue() as IGameState;
		this.state = new GameStateImpl(gameState);
		this.moveHistory = new MoveHistory();
	}

	public makeMove(move: PseudoMove): boolean {
		const result = applyMoveCommand(this.state, move);
		if (!result) return false;

		const { newState, command } = result;

		const executedMove: ExecutedMove = {
			command,
			stateBefore: this.cloneState(),
		};

		this.state = new GameStateImpl(newState);
		this.moveHistory.add(executedMove);

		return true;
	}

	public undo(): boolean {
		const previousState = this.moveHistory.undo(this.state);
		if (!previousState) return false;

		this.state = new GameStateImpl(previousState);
		return true;
	}

	private cloneState(): IGameState {
		return {
			board: this.state.board.cloneBoard(),
			activeColor: this.state.activeColor,
			availableCastlings: { ...this.state.availableCastlings },
			enPassant: this.state.enPassant,
			halfMove: this.state.halfMove,
			fullMove: this.state.fullMove,
		};
	}

	public getBoard(): Board {
		return this.state.board;
	}

	public getState(): GameStateImpl {
		return this.state;
	}

	public printBoard() {
		console.log(this.state.board.toPiecePlacement());
	}
}
