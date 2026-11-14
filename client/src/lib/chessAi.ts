import { Chess, Move, PieceSymbol } from 'chess.js';
import { detectOpening, OpeningInfo } from './openings';

export type AiDifficulty = 'novice' | 'club' | 'master' | 'grandmaster';
export type AiPersonality = 'balanced' | 'aggressive' | 'positional';
export type MoveClassification = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface PositionEvaluation {
  scoreCp: number; // from White's perspective (+ = White advantage, - = Black advantage)
  mateIn: number | null;
  displayScore: string;
  whiteAdvantagePct: number; // 5..95 for EvalBar
}

export interface AiMoveResult {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  evalCp: number;
  explanation: string;
}

export interface MoveReviewItem {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  fenBefore: string;
  fenAfter: string;
  evalBeforeCp: number;
  evalAfterCp: number;
  cpLoss: number;
  bestMoveSan: string;
  bestMoveFrom: string;
  bestMoveTo: string;
  classification: MoveClassification;
  comment: string;
}

export interface MistakePuzzle {
  id: string;
  fen: string;
  playerColor: 'w' | 'b';
  playedSan: string;
  bestSan: string;
  bestFrom: string;
  bestTo: string;
  classification: 'mistake' | 'blunder';
  cpLoss: number;
  theme: string;
  explanation: string;
  createdAt: string;
  solved?: boolean;
}

export interface GameReviewReport {
  moves: MoveReviewItem[];
  whiteAccuracy: number;
  blackAccuracy: number;
  opening: OpeningInfo | null;
  turningPoint: MoveReviewItem | null;
  coachSummary: string;
  mistakePuzzles: MistakePuzzle[];
  counts: {
    w: Record<MoveClassification, number>;
    b: Record<MoveClassification, number>;
  };
}

export const AI_DIFFICULTY_META: Record<
  AiDifficulty,
  { label: string; elo: string; description: string; depth: number }
> = {
  novice: {
    label: 'Novice',
    elo: '~650 ELO',
    description: 'Makes occasional tactical slips. Great for learning the ropes.',
    depth: 1,
  },
  club: {
    label: 'Club Player',
    elo: '~1200 ELO',
    description: 'Solid fundamentals and spots basic 1-2 move tactics.',
    depth: 2,
  },
  master: {
    label: 'Master',
    elo: '~1800 ELO',
    description: 'Sharp tactical calculation and strong positional awareness.',
    depth: 3,
  },
  grandmaster: {
    label: 'Grandmaster',
    elo: '~2200+ ELO',
    description: 'Deep alpha-beta search with ruthless endgame precision.',
    depth: 3,
  },
};

export const AI_PERSONALITY_META: Record<
  AiPersonality,
  { label: string; description: string }
> = {
  balanced: {
    label: 'Balanced',
    description: 'Classical mix of center control, tactics, and king safety.',
  },
  aggressive: {
    label: 'Tactician',
    description: 'Loves forward piece activity, sacrifices, and king-side attacks.',
  },
  positional: {
    label: 'Strategist',
    description: 'Prioritizes pawn structure, outposts, and long-term control.',
  },
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

// Piece-square tables from White's perspective (rank 8 at index 0, rank 1 at index 7)
const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 27, 27, 10, 5, 5],
  [0, 0, 0, 24, 24, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -22, -22, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MID_PST = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getPstValue(type: PieceSymbol, color: 'w' | 'b', row: number, col: number): number {
  const r = color === 'w' ? row : 7 - row;
  switch (type) {
    case 'p':
      return PAWN_PST[r][col];
    case 'n':
      return KNIGHT_PST[r][col];
    case 'b':
      return BISHOP_PST[r][col];
    case 'r':
      return ROOK_PST[r][col];
    case 'q':
      return QUEEN_PST[r][col];
    case 'k':
      return KING_MID_PST[r][col];
  }
}

/** Static evaluation from White's perspective in centipawns */
export function evaluateBoardStatic(
  chess: Chess,
  personality: AiPersonality = 'balanced'
): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99000 : 99000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  const board = chess.board();
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      let value = PIECE_VALUES[piece.type] + getPstValue(piece.type, piece.color, row, col);

      if (personality === 'aggressive') {
        const advancement = piece.color === 'w' ? 7 - row : row;
        if (piece.type !== 'k' && piece.type !== 'p') {
          value += advancement * 4;
        }
      } else if (personality === 'positional') {
        const isCenter = row >= 2 && row <= 5 && col >= 2 && col <= 5;
        if (isCenter) value += 8;
      }

      score += piece.color === 'w' ? value : -value;
    }
  }

  if (chess.inCheck()) {
    score += chess.turn() === 'w' ? -35 : 35;
  }

  return score;
}

function scoreMoveForOrdering(move: Move, personality: AiPersonality): number {
  let score = 0;
  if (move.captured) {
    // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
    score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
    if (personality === 'aggressive') score += 80;
  }
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] + 500;
  }
  if (move.san.includes('+')) {
    score += 65;
  }
  if (move.san === 'O-O' || move.san === 'O-O-O') {
    score += personality === 'positional' ? 95 : 50;
  }
  return score;
}

function orderMoves(moves: Move[], personality: AiPersonality): Move[] {
  return moves.sort((a, b) => scoreMoveForOrdering(b, personality) - scoreMoveForOrdering(a, personality));
}

function alphabeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingWhite: boolean,
  personality: AiPersonality,
  deadline: number
): number {
  if (Date.now() > deadline) {
    return evaluateBoardStatic(chess, personality);
  }

  if (chess.isCheckmate()) {
    // Prefer faster checkmates
    return chess.turn() === 'w' ? -99000 - depth * 100 : 99000 + depth * 100;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }
  if (depth <= 0) {
    return evaluateBoardStatic(chess, personality);
  }

  const moves = orderMoves(chess.moves({ verbose: true }), personality);

  if (maximizingWhite) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const ev = alphabeta(chess, depth - 1, alpha, beta, false, personality, deadline);
      chess.undo();
      if (ev > maxEval) maxEval = ev;
      if (ev > alpha) alpha = ev;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const ev = alphabeta(chess, depth - 1, alpha, beta, true, personality, deadline);
      chess.undo();
      if (ev < minEval) minEval = ev;
      if (ev < beta) beta = ev;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function evaluatePosition(fen: string): PositionEvaluation {
  const chess = new Chess(fen);
  const scoreCp = evaluateBoardStatic(chess, 'balanced');

  let mateIn: number | null = null;
  if (Math.abs(scoreCp) >= 90000) {
    mateIn = scoreCp > 0 ? 1 : -1;
  }

  let displayScore = '0.0';
  if (mateIn !== null) {
    displayScore = mateIn > 0 ? 'M' : '-M';
  } else {
    const pawns = scoreCp / 100;
    displayScore = pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
  }

  // Sigmoid-like mapping to 5%..95% for visual EvalBar
  const clamped = Math.max(-1200, Math.min(1200, scoreCp));
  const whiteAdvantagePct = Math.round(50 + (clamped / 1200) * 45);

  return {
    scoreCp,
    mateIn,
    displayScore,
    whiteAdvantagePct,
  };
}

export function explainMove(
  fenBefore: string,
  moveSan: string,
  evalBeforeCp?: number,
  evalAfterCp?: number
): string {
  const chess = new Chess(fenBefore);
  const move = chess.move(moveSan);
  if (!move) return `Plays ${moveSan}.`;

  if (chess.isCheckmate()) {
    return `Checkmate! ${move.san} delivers the winning blow.`;
  }

  const reasons: string[] = [];

  if (move.san === 'O-O' || move.san === 'O-O-O') {
    reasons.push('tucks the king to safety and connects the rooks');
  }
  if (move.promotion) {
    reasons.push(`promotes the pawn to a ${PIECE_NAMES[move.promotion]}`);
  }
  if (move.captured) {
    const victimName = PIECE_NAMES[move.captured];
    if (PIECE_VALUES[move.captured] > PIECE_VALUES[move.piece]) {
      reasons.push(`wins material by capturing the opponent's ${victimName} with a ${PIECE_NAMES[move.piece]}`);
    } else {
      reasons.push(`captures the ${victimName} on ${move.to}`);
    }
  }
  if (move.san.includes('+')) {
    reasons.push('puts the opponent king in check to seize initiative');
  }

  // Check if the moved piece now attacks >= 2 valuable opponent pieces (fork / double attack)
  const attackers = chess.moves({ verbose: true }).filter((m) => m.from === move.to && m.captured);
  const valuableTargets = attackers.filter(
    (m) => m.captured && PIECE_VALUES[m.captured] >= 320
  );
  if (valuableTargets.length >= 2) {
    reasons.push(`creates a double attack on ${valuableTargets.map((t) => `${t.to}`).join(' and ')}`);
  }

  const centralSquares = new Set(['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'f4', 'f5']);
  if (centralSquares.has(move.to) && !move.captured) {
    reasons.push(`claims central control on ${move.to}`);
  } else if ((move.piece === 'n' || move.piece === 'b') && (move.from[1] === '1' || move.from[1] === '8')) {
    reasons.push(`develops the ${PIECE_NAMES[move.piece]} into an active square`);
  }

  if (reasons.length === 0) {
    if (typeof evalBeforeCp === 'number' && typeof evalAfterCp === 'number') {
      const swing = move.color === 'w' ? evalAfterCp - evalBeforeCp : evalBeforeCp - evalAfterCp;
      if (swing > 80) {
        reasons.push('improves piece coordination and increases pressure');
      } else {
        reasons.push(`improves the ${PIECE_NAMES[move.piece]}'s position to ${move.to}`);
      }
    } else {
      reasons.push(`repositions the ${PIECE_NAMES[move.piece]} to ${move.to}`);
    }
  }

  const joined = reasons.slice(0, 2).join(' and ');
  return `${move.san} ${joined}.`;
}

export function getBestAiMove(
  fen: string,
  difficulty: AiDifficulty = 'club',
  personality: AiPersonality = 'balanced'
): AiMoveResult | null {
  const chess = new Chess(fen);
  const legalMoves = orderMoves(chess.moves({ verbose: true }), personality);
  if (legalMoves.length === 0) return null;

  const maximizingWhite = chess.turn() === 'w';
  let depth = AI_DIFFICULTY_META[difficulty].depth;

  // Grandmaster gets an extra ply in simplified positions
  if (difficulty === 'grandmaster') {
    const pieceCount = chess
      .board()
      .flat()
      .filter((p) => p !== null).length;
    if (pieceCount <= 12) depth = 4;
  }

  const timeBudgetMs = difficulty === 'grandmaster' ? 1100 : difficulty === 'master' ? 750 : 400;
  const deadline = Date.now() + timeBudgetMs;

  const evalBefore = evaluateBoardStatic(chess, 'balanced');
  const scored: { move: Move; score: number }[] = [];

  for (const move of legalMoves) {
    chess.move(move);
    const score = alphabeta(
      chess,
      depth - 1,
      -Infinity,
      Infinity,
      !maximizingWhite,
      personality,
      deadline
    );
    chess.undo();
    scored.push({ move, score });
  }

  scored.sort((a, b) => (maximizingWhite ? b.score - a.score : a.score - b.score));

  let chosen = scored[0];
  // Novice occasionally picks from top 3 moves so it feels human & beatable
  if (difficulty === 'novice' && scored.length > 1) {
    const poolSize = Math.min(3, scored.length);
    const roll = Math.random();
    if (roll < 0.45) {
      chosen = scored[Math.floor(Math.random() * poolSize)];
    }
  }

  const chessAfter = new Chess(fen);
  chessAfter.move(chosen.move);
  const evalAfter = evaluateBoardStatic(chessAfter, 'balanced');

  return {
    from: chosen.move.from,
    to: chosen.move.to,
    promotion: chosen.move.promotion,
    san: chosen.move.san,
    evalCp: evalAfter,
    explanation: explainMove(fen, chosen.move.san, evalBefore, evalAfter),
  };
}

function classifyCpLoss(cpLoss: number): MoveClassification {
  if (cpLoss <= 18) return 'best';
  if (cpLoss <= 55) return 'good';
  if (cpLoss <= 130) return 'inaccuracy';
  if (cpLoss <= 260) return 'mistake';
  return 'blunder';
}

function cpLossToAccuracy(avgLoss: number): number {
  // Smooth chess-style accuracy curve (0..100)
  const raw = 100 * Math.exp(-0.0038 * Math.max(0, avgLoss));
  return Math.max(12, Math.min(99.5, Math.round(raw * 10) / 10));
}

export function analyzeGameHistory(history: string[]): GameReviewReport {
  const chess = new Chess();
  const opening = detectOpening(history);
  const items: MoveReviewItem[] = [];
  const mistakePuzzles: MistakePuzzle[] = [];

  const counts: GameReviewReport['counts'] = {
    w: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    b: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  };

  let whiteLossSum = 0;
  let whiteMoves = 0;
  let blackLossSum = 0;
  let blackMoves = 0;

  let turningPoint: MoveReviewItem | null = null;
  let maxSwing = -1;

  for (let idx = 0; idx < history.length; idx++) {
    const san = history[idx];
    const fenBefore = chess.fen();
    const color = chess.turn();
    const moveNumber = Math.floor(idx / 2) + 1;

    // Quick depth-2 search for best move at this position
    const best = getBestAiMove(fenBefore, 'club', 'balanced');
    const evalBeforeCp = evaluateBoardStatic(chess, 'balanced');

    const playedMove = chess.move(san);
    if (!playedMove) break;

    const fenAfter = chess.fen();
    const evalAfterCp = evaluateBoardStatic(chess, 'balanced');

    // Compare played move vs best move from mover's perspective
    let bestEvalFromWhite = evalAfterCp;
    if (best) {
      bestEvalFromWhite = best.evalCp;
    }

    const rawLoss =
      color === 'w'
        ? bestEvalFromWhite - evalAfterCp
        : evalAfterCp - bestEvalFromWhite;
    const cpLoss = Math.max(0, Math.round(rawLoss));

    const classification =
      best && best.san === san ? 'best' : classifyCpLoss(cpLoss);

    counts[color][classification] += 1;

    if (color === 'w') {
      whiteLossSum += Math.min(cpLoss, 500);
      whiteMoves += 1;
    } else {
      blackLossSum += Math.min(cpLoss, 500);
      blackMoves += 1;
    }

    const bestMoveSan = best?.san ?? san;
    const bestMoveFrom = best?.from ?? playedMove.from;
    const bestMoveTo = best?.to ?? playedMove.to;

    let comment = '';
    if (classification === 'best') {
      comment = explainMove(fenBefore, san, evalBeforeCp, evalAfterCp);
    } else if (classification === 'good') {
      comment = `Solid choice. ${bestMoveSan !== san ? `Engine slightly preferred ${bestMoveSan}.` : ''}`.trim();
    } else if (classification === 'inaccuracy') {
      comment = `Slight inaccuracy (-${(cpLoss / 100).toFixed(1)}). ${bestMoveSan} kept tighter control.`;
    } else if (classification === 'mistake') {
      comment = `Mistake! Playing ${bestMoveSan} instead would have saved ~${(cpLoss / 100).toFixed(1)} pawns.`;
    } else {
      comment = `Blunder! ${san} dropped major advantage. ${bestMoveSan} was much stronger.`;
    }

    const item: MoveReviewItem = {
      ply: idx + 1,
      moveNumber,
      color,
      san,
      fenBefore,
      fenAfter,
      evalBeforeCp,
      evalAfterCp,
      cpLoss,
      bestMoveSan,
      bestMoveFrom,
      bestMoveTo,
      classification,
      comment,
    };

    items.push(item);

    if (cpLoss > maxSwing) {
      maxSwing = cpLoss;
      turningPoint = item;
    }

    if ((classification === 'mistake' || classification === 'blunder') && best && best.san !== san) {
      mistakePuzzles.push({
        id: `mistake-${Date.now()}-${idx}`,
        fen: fenBefore,
        playerColor: color,
        playedSan: san,
        bestSan: best.san,
        bestFrom: best.from,
        bestTo: best.to,
        classification,
        cpLoss,
        theme: best.san.includes('+')
          ? 'Missed Check / Initiative'
          : best.san.includes('x')
          ? 'Missed Capture / Tactic'
          : 'Positional / Tactical Improvement',
        explanation: `${best.explanation} (You played ${san} instead.)`,
        createdAt: new Date().toISOString(),
        solved: false,
      });
    }
  }

  const whiteAccuracy = whiteMoves > 0 ? cpLossToAccuracy(whiteLossSum / whiteMoves) : 100;
  const blackAccuracy = blackMoves > 0 ? cpLossToAccuracy(blackLossSum / blackMoves) : 100;

  const openingPart = opening
    ? `Opening: ${opening.name} (${opening.eco}).`
    : 'Unconventional opening structure.';
  const tpPart =
    turningPoint && turningPoint.cpLoss >= 90
      ? ` The biggest turning point was move ${turningPoint.moveNumber}${
          turningPoint.color === 'w' ? '.' : '...'
        } ${turningPoint.san} (${turningPoint.classification}), where ${turningPoint.bestMoveSan} was best.`
      : ' Both sides kept the game relatively balanced without massive tactical collapses.';

  const coachSummary = `${openingPart} White played at ${whiteAccuracy}% accuracy and Black at ${blackAccuracy}%.${tpPart}`;

  return {
    moves: items,
    whiteAccuracy,
    blackAccuracy,
    opening,
    turningPoint,
    coachSummary,
    mistakePuzzles,
    counts,
  };
}

export function askAiCoach(
  fen: string,
  history: string[],
  question: string
): string {
  const chess = new Chess(fen);
  const q = question.toLowerCase();
  const evalResult = evaluatePosition(fen);
  const opening = detectOpening(history);
  const bestMove = getBestAiMove(fen, 'master', 'balanced');
  const turnLabel = chess.turn() === 'w' ? 'White' : 'Black';

  // Count material
  const board = chess.board();
  let whiteMat = 0;
  let blackMat = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p || p.type === 'k') continue;
      if (p.color === 'w') whiteMat += PIECE_VALUES[p.type];
      else blackMat += PIECE_VALUES[p.type];
    }
  }
  const matDiff = (whiteMat - blackMat) / 100;

  if (q.includes('opening') || q.includes('book')) {
    if (opening) {
      return `You are in the **${opening.name} (${opening.eco})**. ${opening.idea}`;
    }
    return history.length < 4
      ? 'We are still in the early opening—focus on central pawns (e4/d4), developing knights before bishops, and castling early.'
      : 'The game has left standard opening book lines. Focus on piece coordination, king safety, and pawn breaks.';
  }

  if (q.includes('threat') || q.includes('danger') || q.includes('attack')) {
    const checks = chess.moves({ verbose: true }).filter((m) => m.san.includes('+'));
    const captures = chess
      .moves({ verbose: true })
      .filter((m) => m.captured && PIECE_VALUES[m.captured] >= 300);

    if (chess.inCheck()) {
      return `${turnLabel} is currently **in check**! Prioritize escaping check safely${
        bestMove ? ` — ${bestMove.san} is the strongest response` : ''
      }.`;
    }
    if (checks.length > 0 || captures.length > 0) {
      const topCapture = captures[0];
      const topCheck = checks[0];
      return `${turnLabel} has active tactical options: ${
        topCapture ? `capturing on ${topCapture.to} (${topCapture.san})` : ''
      }${topCapture && topCheck ? ' and ' : ''}${
        topCheck ? `a forcing check with ${topCheck.san}` : ''
      }. Evaluation is ${evalResult.displayScore}.`;
    }
    return `No immediate forcing checks or high-value captures are available for ${turnLabel}. Look for improving your worst-placed piece.`;
  }

  if (q.includes('last move') || q.includes('why') || q.includes('mistake') || q.includes('good')) {
    if (history.length === 0) {
      return 'No moves have been played yet! Playing 1. e4 or 1. d4 is a great way to claim the center.';
    }
    const lastSan = history[history.length - 1];
    return `After **${lastSan}**, the position evaluates to **${evalResult.displayScore}** (material balance: ${
      matDiff === 0 ? 'equal' : matDiff > 0 ? `+${matDiff.toFixed(1)} White` : `${matDiff.toFixed(1)} Black`
    }). ${bestMove ? `For ${turnLabel}'s reply, **${bestMove.explanation}**` : ''}`;
  }

  // Default: "What is my best plan / hint / general advice?"
  const evalText =
    Math.abs(evalResult.scoreCp) < 45
      ? 'The position is roughly equal'
      : evalResult.scoreCp > 0
      ? `White holds an advantage (${evalResult.displayScore})`
      : `Black holds an advantage (${evalResult.displayScore})`;

  return `${evalText}. It is **${turnLabel}'s turn**. ${
    bestMove
      ? `Recommended move: **${bestMove.san}** — ${bestMove.explanation}`
      : 'The game has reached a terminal state.'
  }`;
}
