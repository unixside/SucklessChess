import { Board, EmptyBoard } from "./board";
import { ViewData } from "./constants";
import { getSquareColor } from "./functions";
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

function createDiv(cls: string, id: string, size: number): HTMLElement {
	const div = document.createElement("div");
	div.setAttribute("class", cls);
	div.setAttribute("id", id);
	div.style.width = size + "px";
	div.style.height = size + "px";
	return div;
}

function createImage(src: string) {
	const image = new Image();
	image.src = src;
	image.style.width = "100%";
	image.style.height = "100%";
	image.style.objectFit = "cover";
	return image;
}

export function BoardView(board: Board): HTMLElement {
	const boardContainer = createDiv(
		"board",
		"board_container",
		ViewData.board_size * 1.1,
	);

	const boardView = createDiv("board", "board", ViewData.board_size);
	Object.keys(EmptyBoard).forEach((square) => {
		const cls = `square-${getSquareColor(square)}`;
		const squareDiv = createDiv(cls, square, ViewData.square_size);
		const piece = board.getPieceAt(square);
		if (
			piece !== null &&
			piece !== undefined &&
			Pieces.includes(piece as Piece)
		) {
			const pieceSrc = pieces[piece];
			const pieceImage = createImage(pieceSrc);
			squareDiv.appendChild(pieceImage);
		}
		boardView.appendChild(squareDiv);
	});

	boardContainer.appendChild(boardView);
	return boardContainer;
}
