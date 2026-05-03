import { BoardView } from "./src/boardView";
import { ChessGame } from "./src/gameController";

const root = document.getElementById("root");
const game = new ChessGame();
const board = new BoardView(game);

root?.appendChild(board.getView());
