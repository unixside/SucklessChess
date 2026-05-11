import { EmptyBoard } from "./board";
import { ViewData } from "./constants";
import { getSquareColor } from "./functions";
import { ChessGame } from "./gameController";
import { MoveResult } from "./types";

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
    image.className = "piece";
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
	let target = event.target as HTMLDivElement;

    if (target.className === "piece") {
        console.log("Droped on a piece");
        const square = target.id.slice(-2);
        target = document.getElementById(square) as HTMLDivElement;
    }

		if (dropedElementId) {
			const [piece, origin] = dropedElementId.split("-");
			const dropedElement = document.getElementById(dropedElementId);

			if (dropedElement) {
				const moveResult = this.game.makeMove({
					from: origin as any,
					to: target.id as any,
				});

				if (moveResult.success) {
					dropedElement.id = `${piece}-${target.id}`;

					if (target.childElementCount && target.firstElementChild?.className === "piece") {
						const child = target.firstChild;
						if (child) target.replaceChild(dropedElement, child);
					} else {
						target.appendChild(dropedElement);
					}

					if (moveResult.specialEffect) {
						this.handleSpecialEffect(moveResult);
					}
				}
			}
		}
		this.cleanSquares();
	};

	private handleSpecialEffect(result: MoveResult): void {
		if (!result.specialEffect) return;

		const effect = result.specialEffect;

		switch (effect.type) {
			case "castling":
				this.handleCastling(effect.pieces, result.move);
				break;
			case "promotion":
				this.handlePromotion(effect.pieces);
				break;
			case "enpassant":
				this.handleEnPassant(effect.pieces);
				break;
		}
	}

	private handleCastling(pieces: { from: string; to: string; piece: string }[], move: { from: string; to: string }): void {
		for (const p of pieces) {
			if (p.from === move.from) continue;

			const rookElement = document.getElementById(`${p.piece}-${p.from}`);
			if (rookElement) {
				rookElement.id = `${p.piece}-${p.to}`;
				const targetSquare = this.squares.find((sq) => sq.id === p.to);
				if (targetSquare) {
					targetSquare.appendChild(rookElement);
				}
			}
		}
	}

	private handlePromotion(pieces: { from: string; to: string; piece: string }[]): void {
		for (const p of pieces) {
			const element = document.getElementById(`${p.from[0]}z-${p.to}`);
			if (element) {
				element.id = `${p.piece}-${p.to}`;
				const targetSquare = this.squares.find((sq) => sq.id === p.to);
				if (targetSquare && targetSquare.firstChild) {
					targetSquare.replaceChildren(targetSquare.firstChild);
				}
			}
		}
	}

	private handleEnPassant(pieces: { from: string; to: string; piece: string }[]): void {
		const capturedPawn = pieces.find((p) => p.from !== p.to);
		if (capturedPawn) {
			const capturedElement = document.getElementById(`${capturedPawn.piece}-${capturedPawn.from}`);
			if (capturedElement && capturedElement.parentElement) {
				capturedElement.parentElement.removeChild(capturedElement);
			}
		}
	}

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
