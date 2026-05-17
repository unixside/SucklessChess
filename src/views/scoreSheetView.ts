import { ChessGame } from '../gameController';
import { ViewData } from '../utils/constants';
import { createDiv } from './htmlElements';

interface RowTable {
    move: string;
    white?: string;
    black?: string;
}

function createCell(
    text: string,
    className: string,
    id: string,
): HTMLDivElement {
    const cell = createDiv(
        className,
        id,
        ViewData.cell_width,
        ViewData.cell_height,
    );
    cell.innerText = text;

    return cell;
}

function createRowTable(row: RowTable): HTMLDivElement {
    const move = createCell(row.move, 'cell-move', `move-${row.move}`);
    const white = createCell(
        row.white ? row.white : '',
        'cell-san',
        `move-${row.move}`,
    );
    const black = createCell(
        row.black ? row.black : '',
        'cell-san',
        `move-${row.move}`,
    );

    const rowTable = createDiv(
        'row-table',
        `row-${row.move}`,
        ViewData.scoresheet_width,
        ViewData.cell_height,
    );

    rowTable.appendChild(move);
    rowTable.appendChild(white);
    rowTable.appendChild(black);

    return rowTable;
}

function createTable(white: string, black: string): HTMLDivElement {
    const table = document.createElement('div');
    table.className = 'moves-table';
    const firstRow = createRowTable({
        move: 'Move',
        white: white ? white : 'white',
        black: black ? black : 'black',
    });
    table.appendChild(firstRow);

    return table;
}

export class ScoreSheetView {
    private game: ChessGame;
    private view: HTMLDivElement = createDiv(
        'scoresheet',
        'scoresheet',
        ViewData.board_size * 0.6,
        ViewData.board_size,
    );
    private table: HTMLTableElement;

    constructor(game: ChessGame) {
        this.game = game;
        this.table = createTable('white', 'black');
        this.view.appendChild(this.table);
    }

    public getView() {
        return this.view;
    }
}
