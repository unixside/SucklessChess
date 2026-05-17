import { ChessRegExp } from '../utils/constants';
import {
    compareInterfaces,
    getEnemyColor,
    getPieceColor,
    sameColor,
} from '../utils/functions';
import { Ok, Fail, Result } from './result';
import {
    CastlingSetup,
    Color,
    Column,
    Columns,
    GameState,
    Piece,
    Pieces,
    Row,
    Rows,
    Square,
} from '../models/types';
import {
    applyMoveCommand,
    getLegalMoves,
    isInCheckMate,
    isKingInCheck,
    squareToCoords,
} from '../models/move';
// import { Board } from '../models/board';
import { GameStateImpl } from '../models/gameState';
// import { squareNameToIndex } from '../models/board';
// import { MoveFactory } from '../models/commands';

const SanPieces = ['N', 'B', 'R', 'Q', 'K', 'n', 'b', 'r', 'q', 'k'] as const;
type SanCastling = 'O-O' | 'O-O-O';
type SanPromotion = '=B' | '=N' | '=R' | '=Q';
type SanPiece = `${(typeof SanPieces)[number]}`;
type Take = 'x';
type Check = '+';
type Mate = '#';
type UCIPromotion = 'N' | 'B' | 'R' | 'Q';

export interface SanMove {
    piece?: SanPiece;
    from?: Column | Row | Square;
    take?: Take;
    to: Square;
    promotion?: SanPromotion;
    suffix?: Check | Mate;
}

export interface SanMoveCast {
    prefix: SanCastling;
    suffix?: Check | Mate;
}

export interface UCIMove {
    from: Square;
    to: Square;
    promotion?: UCIPromotion;
}

export namespace Move {
    function getSanSuffix(
        state: GameState,
        color: Color,
    ): Check | Mate | false {
        if (isInCheckMate(state, color)) {
            return '#';
        }

        if (isKingInCheck(state, color)) {
            return '+';
        }

        return false;
    }

    export class SAN {
        public static parse(move: string): Result<SanMove | SanMoveCast> {
            const pattern: RegExp =
                /(?<piece>[NBRQK]?)(?<from>[a-h]?[1-8]?)(?<take>[x]?)(?<to>[a-h][1-8])(?<promotion>=[BNRQ])?(?<suffix>\+|#)?/;
            const cast_pattern: RegExp =
                /(?<preffix>O-O|O-O-O)(?<suffix>\+|#)?/;
            const piece_move = pattern.exec(move);
            const cast_move = cast_pattern.exec(move);

            if (piece_move?.groups) {
                const { piece, from, take, to, promotion, suffix } =
                    piece_move.groups;

                return Ok({
                    piece: piece,
                    from: from,
                    take: take,
                    to: to,
                    promotion: promotion,
                    suffix: suffix,
                } as SanMove);
            }

            if (cast_move?.groups) {
                const { prefix, suffix } = cast_move.groups;

                return Ok({ prefix: prefix, suffix: suffix } as SanMoveCast);
            }

            return Fail('Failed to parse move, unknown error');
        }
    }

    export class UCI {
        public static parse(move: string): Result<UCIMove> {
            const pattern: RegExp =
                /(?<from>[a-h][1-8])(?<to>[a-h][1-8])(?<promotion>[BNRQ])?/;
            const result = pattern.exec(move);

            if (!result?.groups) {
                return Fail(`Failed parse to move: ${move}`);
            }

            const { from, to, promotion } = result.groups;

            return Ok({ from: from, to: to, promotion: promotion } as UCIMove);
        }

        public static toSan(
            uci: UCIMove,
            state: GameStateImpl,
        ): Result<SanMove | SanMoveCast> {
            let errors: string[] = [];
            const piece = state.board.getPieceAt(uci.from);
            const enemy = state.board.getPieceAt(uci.to);

            if (
                piece === undefined ||
                piece === null ||
                !Pieces.includes(piece as Piece)
            ) {
                errors.push(`Invalid piece origin: ${uci.from}`);
            }

            if (enemy === undefined) {
                errors.push(`Invalid destiny for piece: ${uci.to}`);
            }

            if (enemy && sameColor(piece as Piece, enemy as Piece)) {
                errors.push('Invalid move, try take same color piece');
            }

            if (
                uci.promotion &&
                !ChessRegExp.pieces.pawn.test(piece as Piece)
            ) {
                errors.push('Invalid move with promotion, piece not is a pawn');
            }

            if (errors.length) {
                return Fail(errors);
            }

            const color = getPieceColor(piece as Piece);
            const enemyColor = getEnemyColor(color);
            const legalMoves = getLegalMoves(state, uci.from);
            const result = applyMoveCommand(state, uci);

            if (!result) {
                return Fail(`Invalid move: ${uci}`);
            }

            if (
                !legalMoves.find((legal_move) =>
                    compareInterfaces(legal_move, uci),
                )
            ) {
                return Fail(`Ilegal Move: ${uci}`);
            }

            let from: string | undefined = undefined;

            if (ChessRegExp.pieces.king.test(piece as Piece)) {
                const castlings: CastlingSetup[] =
                    state.findValidCastlings(color);

                for (const castling of castlings) {
                    let prefix = '';
                    let suffix: Check | Mate | false;

                    if (
                        castling.kingFrom === uci.from &&
                        castling.kingTo === uci.to
                    ) {
                        prefix = castling.direction === 1 ? 'O-O' : 'O-O-O';
                        suffix = getSanSuffix(result.newState, enemyColor);

                        return Ok({
                            prefix: prefix,
                            suffix: suffix ? suffix : undefined,
                        } as SanMoveCast);
                    }
                }
            }

            const sq_another = Object.keys(state.board.raw()).find(
                (sq) => state.board.getPieceAt(sq) === piece && sq !== uci.from,
            );

            const movements = sq_another
                ? getLegalMoves(state, sq_another)
                : undefined;

            if (
                movements &&
                (movements as UCIMove[]).find(
                    (move: UCIMove) => move.to === uci.to,
                )
            ) {
                if (ChessRegExp.pieces.knight.test(piece as Piece)) {
                    from = Columns[squareToCoords(uci.from).col];
                }

                if (ChessRegExp.pieces.rook.test(piece as Piece)) {
                    const coords = squareToCoords(uci.from);
                    const another_coords = squareToCoords(sq_another as Square);
                    if (coords.col === another_coords.col) {
                        from = Rows[coords.row];
                    }

                    if (coords.row === another_coords.row) {
                        from = Columns[coords.col];
                    }
                }
            }

            const suffix = getSanSuffix(result.newState, enemyColor);

            return Ok({
                piece: !ChessRegExp.pieces.pawn.test(piece as SanPiece)
                    ? piece
                    : undefined,
                from: undefined,
                take: from,
                to: uci.to,
                promotion: uci.promotion,
                suffix: suffix ? suffix : undefined,
            } as SanMove);
        }

        public static toSanString(
            uci: UCIMove,
            state: GameStateImpl,
        ): string | null {
            const result = this.toSan(uci, state);

            if (result.IsFailure()) {
                console.error(result.GetError()?.join('\n'));
                return null;
            }

            const value = result.value;
            const strings = Object.values(
                value as SanMove | SanMoveCast,
            ).filter((value) => value);

            return strings.length > 1 ? strings.join('') : strings[0];
        }
    }
}
