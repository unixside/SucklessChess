import { Board } from "./board";
import { Color, Castlings, GameStatus } from "./types";

export interface IGameState {
	board: Board;
	activeColor: Color;
	availableCastlings: Castlings;
	enPassant: string;
	halfMove: number;
	fullMove: number;
}

export class GameStateImpl implements IGameState {
	board: Board;
	activeColor: Color;
	availableCastlings: Castlings;
	enPassant: string;
	halfMove: number;
	fullMove: number;

	constructor(state: IGameState) {
		this.board = state.board;
		this.activeColor = state.activeColor;
		this.availableCastlings = state.availableCastlings;
		this.enPassant = state.enPassant;
		this.halfMove = state.halfMove;
		this.fullMove = state.fullMove;
	}

	public getStatus(): GameStatus {
		return {
			isCheck: false,
			isCheckmate: false,
			isStalemate: false,
			isRepetition: false,
		};
	}

	public clone(): GameStateImpl {
		return new GameStateImpl({
			board: this.board.cloneBoard(),
			activeColor: this.activeColor,
			availableCastlings: { ...this.availableCastlings },
			enPassant: this.enPassant,
			halfMove: this.halfMove,
			fullMove: this.fullMove,
		});
	}
}
