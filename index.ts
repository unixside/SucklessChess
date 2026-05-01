import { ChessGame } from "./src/gameController";

const game = new ChessGame();
const board = game.getBoard();

if (board !== undefined) {
    console.log(board);
    console.log(game.getMoves("g1"));
} else {
    console.error("Board is undefined");
}
