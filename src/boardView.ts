import { Board, EmptyBoard } from "./board";
import { ViewData } from "./constants";
import { getSquareColor } from "./functions";
import { ChessGame } from "./gameController";
import { Piece, Pieces, Square } from "./types";

const pieces: Record<string, string> = {
	P: "./pieces/white-pawn.png",
	N: "./pieces/white-knight.png",
	B: "./pieces/white-bishop.png",
	R: "./pieces/white-rook.png",
	Q: "./pieces/white-queen.png",
	K: "./pieces/white-king.png",
	p: "./pieces/black-pawn.png",
	n: "./pieces/black-knight.png",
	b: "./pieces/black-bishop.png",
	r: "./pieces/black-rook.png",
	q: "./pieces/black-queen.png",
	k: "./pieces/black-king.png",
};

function createDiv(cls: string, id: string, size: number): HTMLDivElement {
	const div = document.createElement("div");
	div.setAttribute("class", cls);
	div.setAttribute("id", id);
	div.style.width = size + "px";
	div.style.height = size + "px";
	return div;
}

function createImage(src: string, id: string): HTMLImageElement {
	const image = new Image();
	image.id = id;
	image.src = src;
	image.style.width = "100%";
	image.style.height = "100%";
	image.style.objectFit = "cover";
	image.draggable = true;
	return image;
}

export class BoardView {
	private game: ChessGame;
	private view: HTMLDivElement;
	private squares: HTMLDivElement[] = [];
	private pieces: HTMLImageElement[] = [];

	constructor(game: ChessGame) {
		this.game = game;
		this.view = createDiv("board", "board", ViewData.board_size);

		Object.keys(EmptyBoard).forEach((square) => {
			const square_div = createDiv(
				`square-${getSquareColor(square)}`,
				square,
				ViewData.square_size,
			);

			const piece = this.game.getBoard().getPieceAt(square);

			if (piece !== null && piece !== undefined) {
				const image = createImage(pieces[piece], `${piece}-${square}`);
				square_div.appendChild(image);
				this.pieces.push(image);

				image.addEventListener("dragstart", (e: DragEvent) => {
					const targetId = (e.target as HTMLElement).id;
					const [piece, square] = targetId.split("-");
					const moves = game.getMoves(square).map((m) => m.to);
					e.dataTransfer?.setData("text/plain", targetId);
					if (moves.length) {
						this.squares.forEach((sq) => {
							if (moves.includes(sq.id)) {
								sq.classList.add("circle");
								sq.addEventListener(
									"dragover",
									(e: DragEvent) => e.preventDefault(),
								);
								sq.addEventListener("drop", this.dropHandle);
							}
						});
					}
				});

				image.addEventListener("dragend", this.cleanSquares);
			}
			this.squares.push(square_div);
			this.view.appendChild(square_div);
		});
	}

	private dropHandle = (event: DragEvent): void => {
		event.preventDefault();
		const dropedElementId = event.dataTransfer?.getData("text/plain");
		const target = event.target as HTMLDivElement;

		if (dropedElementId) {
			const [piece, origin] = dropedElementId.split("-");
			const dropedElement = document.getElementById(dropedElementId);
			if (dropedElement) {
				dropedElement.id = `${piece}-${target.id}`;
				target.appendChild(dropedElement);
				this.game.makeMove({
					from: origin,
					to: target.id,
				});
			}
		}
		this.cleanSquares();
	};

	private cleanSquares = () => {
		this.squares
			.filter((square) => square.classList.contains("circle"))
			.forEach((square) => {
				square.classList.remove("circle");
				square.removeEventListener("drop", this.dropHandle);
			});
	};

	public getView(): HTMLDivElement {
		return this.view;
	}
}
