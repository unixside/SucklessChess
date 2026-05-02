import { BoardView } from "./src/boardView";
import { ChessGame } from "./src/gameController";

const root = document.getElementById("root");
const game = new ChessGame();
const board = BoardView(game.getBoard());

root?.appendChild(board);
