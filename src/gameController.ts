import { Board } from "./board";
import { ChessRegExp, DefaultData } from "./constants";
import { getPieceColor } from "./functions";
import { GameStateImpl, IGameState } from "./gameState";
import {
	PseudoMove,
	applyMoveCommand,
	MoveHistory,
	ExecutedMove,
	getLegalMoves,
	getCastleMoves,
	get960CastlingSetups,
} from "./move";
import { Square } from "./types";
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

	public getMoves(from: Square): PseudoMove[] {
		const piece = this.getBoard().getPieceAt(from);

		if (piece === null || piece === undefined) {
			return [];
		}

		if (getPieceColor(piece) !== this.state.activeColor) {
			return [];
		}

		const moves = getLegalMoves(this.state, from);

		if (ChessRegExp.pieces.king.test(piece)) {
			const castles = getCastleMoves(this.state);
			for (const castle of castles) {
				if (castle.from === from) {
					const exists = moves.some(m => m.from === castle.from && m.to === castle.to);
					if (!exists) {
						moves.push(castle);
					}
				}
			}

			const setups = get960CastlingSetups(this.state, this.state.activeColor);
			for (const setup of setups) {
				if (setup.kingFrom === from) {
					moves.push({
						from: setup.kingFrom,
						to: setup.kingTo,
					});
				}
			}
		}

		return moves;
	}

	public printBoard() {
		console.log(this.state.board.toPiecePlacement());
	}

	public toFen(): string {
		const board = this.state.board.toPiecePlacement() || "";
		const activeColor = this.state.activeColor;
		
		let castlings = "";
		if (this.state.availableCastlings.K) castlings += "K";
		if (this.state.availableCastlings.Q) castlings += "Q";
		if (this.state.availableCastlings.k) castlings += "k";
		if (this.state.availableCastlings.q) castlings += "q";
		if (castlings === "") castlings = "-";

		const enPassant = this.state.enPassant;
		const halfMove = this.state.halfMove;
		const fullMove = this.state.fullMove;

		return `${board} ${activeColor} ${castlings} ${enPassant} ${halfMove} ${fullMove}`;
	}
}
