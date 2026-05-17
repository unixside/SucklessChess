import { BoardView } from './src/views/boardView';
import { ScoreSheetView } from './src/views/scoresSheetView';
import { ChessGame } from './src/gameController';

const root = document.getElementById('root');
const game = new ChessGame();
const board = new BoardView(game);
const scoreSheet = new ScoreSheetView(game);

root?.appendChild(board.getView());
root?.appendChild(scoreSheet.getView());
