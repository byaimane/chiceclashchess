import { Chess, type Square } from 'chess.js';
import {
  ArrowRight,
  Award,
  Box,
  CheckCircle2,
  Flame,
  Grid2X2,
  Lightbulb,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Link, useSearchParams } from 'react-router-dom';
import { Chessboard3D, type LegalTarget } from '../components/Chessboard3D';
import { MistakePuzzle } from '../lib/chessAi';
import {
  getValidatedPuzzles,
  loadMistakePuzzles,
  loadPuzzleStats,
  markMistakeSolved,
  PuzzleStats,
  recordPuzzleSolve,
  TacticalPuzzle,
} from '../lib/puzzles';

export function PuzzlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'mistakes' ? 'mistakes' : 'daily';
  const [tab, setTab] = useState<'daily' | 'mistakes'>(initialTab);

  const dailyPuzzles = useMemo(() => getValidatedPuzzles(), []);
  const [mistakePuzzles, setMistakePuzzles] = useState<MistakePuzzle[]>(() =>
    loadMistakePuzzles()
  );
  const [stats, setStats] = useState<PuzzleStats>(() => loadPuzzleStats());

  const [dailyIdx, setDailyIdx] = useState(0);
  const [mistakeIdx, setMistakeIdx] = useState(0);

  const activeDaily: TacticalPuzzle | null =
    dailyPuzzles.length > 0 ? dailyPuzzles[dailyIdx % dailyPuzzles.length] : null;
  const activeMistake: MistakePuzzle | null =
    mistakePuzzles.length > 0
      ? mistakePuzzles[mistakeIdx % mistakePuzzles.length]
      : null;

  const activeFen =
    tab === 'daily' ? activeDaily?.fen ?? new Chess().fen() : activeMistake?.fen ?? new Chess().fen();

  const [fen, setFen] = useState(activeFen);
  const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [boardWidth, setBoardWidth] = useState(460);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<LegalTarget[]>([]);

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      if (vw < 420) setBoardWidth(vw - 36);
      else if (vw < 768) setBoardWidth(Math.min(440, vw - 48));
      else setBoardWidth(470);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    setFen(activeFen);
    setStatus('playing');
    setShowHint(false);
    setSelectedSquare(null);
    setLegalTargets([]);
  }, [activeFen, tab, dailyIdx, mistakeIdx]);

  const switchTab = (next: 'daily' | 'mistakes') => {
    setTab(next);
    setSearchParams(next === 'mistakes' ? { tab: 'mistakes' } : {});
  };

  const chess = useMemo(() => new Chess(fen), [fen]);
  const playerColor = chess.turn();

  const expectedSan =
    tab === 'daily' ? activeDaily?.solution[0] ?? '' : activeMistake?.bestSan ?? '';

  const attemptMove = (from: Square, to: Square): boolean => {
    if (status === 'solved') return false;
    const probe = new Chess(fen);
    try {
      const move = probe.move({ from, to, promotion: 'q' });
      if (!move) return false;

      setFen(probe.fen());
      setSelectedSquare(null);
      setLegalTargets([]);

      const normalizedPlayed = move.san.replace(/[+#]/g, '');
      const normalizedExpected = expectedSan.replace(/[+#]/g, '');

      if (
        move.san === expectedSan ||
        normalizedPlayed === normalizedExpected ||
        probe.isCheckmate()
      ) {
        setStatus('solved');
        setStats(recordPuzzleSolve(true));
        if (tab === 'mistakes' && activeMistake) {
          setMistakePuzzles(markMistakeSolved(activeMistake.id));
        }
      } else {
        setStatus('wrong');
        setStats(recordPuzzleSolve(false));
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSquareClick = (square: Square) => {
    if (status === 'solved') return;
    if (selectedSquare && legalTargets.some((t) => t.square === square)) {
      attemptMove(selectedSquare, square);
      return;
    }
    const piece = chess.get(square);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalTargets(
        moves.map((m) => ({ square: m.to as Square, isCapture: Boolean(m.captured) }))
      );
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  };

  const retryCurrent = () => {
    setFen(activeFen);
    setStatus('playing');
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const nextPuzzle = () => {
    if (tab === 'daily') setDailyIdx((i) => i + 1);
    else setMistakeIdx((i) => i + 1);
  };

  const hintSquares = useMemo(() => {
    if (!showHint) return null;
    if (tab === 'mistakes' && activeMistake) {
      return { from: activeMistake.bestFrom, to: activeMistake.bestTo };
    }
    if (tab === 'daily' && activeDaily) {
      const probe = new Chess(activeDaily.fen);
      const m = probe.move(activeDaily.solution[0]);
      if (m) return { from: m.from, to: m.to };
    }
    return null;
  }, [showHint, tab, activeMistake, activeDaily]);

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: 'rgba(212, 175, 55, 0.35)' };
  }
  for (const t of legalTargets) {
    customSquareStyles[t.square] = t.isCapture
      ? { background: 'radial-gradient(circle, transparent 58%, rgba(239, 68, 68, 0.6) 62%)' }
      : { background: 'radial-gradient(circle, rgba(212, 175, 55, 0.55) 22%, transparent 25%)' };
  }
  if (hintSquares) {
    customSquareStyles[hintSquares.from] = {
      backgroundColor: 'rgba(212, 175, 55, 0.55)',
      boxShadow: 'inset 0 0 0 2px #D4AF37',
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header & Stats */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#2A313F] bg-[#14171F] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-editorial text-xl font-bold text-[#F5F0E6]">
              AI Tactical Training &amp; Puzzles
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              Sharpen pattern recognition or replay blunders from your own matches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-1.5 text-xs">
            <Flame className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-[#9CA3AF]">Streak:</span>
            <strong className="text-[#F5F0E6]">{stats.streak}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-1.5 text-xs">
            <Award className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[#9CA3AF]">Solved:</span>
            <strong className="text-[#F5F0E6]">{stats.solvedCount}</strong>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchTab('daily')}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
              tab === 'daily'
                ? 'border-[#B59124] bg-[#D4AF37] text-[#0D0F12]'
                : 'border-[#2A313F] bg-[#14171F] text-[#D1D5DB] hover:bg-[#1B202A]'
            }`}
          >
            Daily Tactical Puzzles ({dailyPuzzles.length})
          </button>
          <button
            type="button"
            onClick={() => switchTab('mistakes')}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
              tab === 'mistakes'
                ? 'border-[#B59124] bg-[#D4AF37] text-[#0D0F12]'
                : 'border-[#2A313F] bg-[#14171F] text-[#D1D5DB] hover:bg-[#1B202A]'
            }`}
          >
            Retry Your Mistakes ({mistakePuzzles.length})
          </button>
        </div>

        <div className="flex overflow-hidden rounded border border-[#2A313F] bg-[#14171F] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-medium transition ${
              viewMode === '2d'
                ? 'bg-[#D4AF37] text-[#0D0F12]'
                : 'text-[#9CA3AF] hover:text-[#F5F0E6]'
            }`}
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            2D
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-medium transition ${
              viewMode === '3d'
                ? 'bg-[#D4AF37] text-[#0D0F12]'
                : 'text-[#9CA3AF] hover:text-[#F5F0E6]'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            3D
          </button>
        </div>
      </div>

      {tab === 'mistakes' && mistakePuzzles.length === 0 ? (
        <div className="rounded-xl border border-[#2A313F] bg-[#14171F] p-10 text-center">
          <Target className="mx-auto h-10 w-10 text-[#D4AF37]" />
          <h2 className="mt-3 font-editorial text-lg font-bold text-[#F5F0E6]">
            No Saved Mistakes Yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-[#9CA3AF]">
            Play a match in the AI Arena or Online Lobby and run{' '}
            <strong className="text-[#F5E199]">AI Game Review</strong>. Any mistakes or
            blunders will automatically appear here as personalized puzzles!
          </p>
          <Link
            to="/ai"
            className="mt-5 inline-flex items-center gap-2 rounded border border-[#B59124] bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
          >
            Play vs. AI Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Board */}
          <div className="flex flex-col items-center">
            <div className="overflow-hidden rounded-lg border-2 border-[#2A313F] bg-[#14171F] shadow-2xl">
              {viewMode === '2d' ? (
                <Chessboard
                  position={fen}
                  boardWidth={boardWidth}
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                  onPieceDrop={(src, dst) => attemptMove(src, dst)}
                  onSquareClick={handleSquareClick}
                  customSquareStyles={customSquareStyles}
                  customDarkSquareStyle={{ backgroundColor: '#1E2530' }}
                  customLightSquareStyle={{ backgroundColor: '#E5DEC9' }}
                />
              ) : (
                <Chessboard3D
                  fen={fen}
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                  boardWidth={boardWidth}
                  lightSquare="#E5DEC9"
                  darkSquare="#1E2530"
                  boardBorder="#2A313F"
                  arenaBg="#0D0F12"
                  selectedSquare={selectedSquare}
                  legalTargets={legalTargets}
                  hintSquares={hintSquares}
                  onSquareClick={handleSquareClick}
                />
              )}
            </div>
          </div>

          {/* Puzzle Info & Controls */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#2A313F] bg-[#14171F] p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#F5E199]">
                  {tab === 'daily' ? activeDaily?.theme : activeMistake?.theme}
                </span>
                <span className="text-xs font-medium text-[#9CA3AF]">
                  {tab === 'daily'
                    ? `Puzzle ${(dailyIdx % dailyPuzzles.length) + 1} of ${dailyPuzzles.length} · ${
                        activeDaily?.difficulty
                      }`
                    : `Mistake ${(mistakeIdx % mistakePuzzles.length) + 1} of ${
                        mistakePuzzles.length
                      }`}
                </span>
              </div>

              <h2 className="mt-3 font-editorial text-xl font-bold text-[#F5F0E6]">
                {tab === 'daily'
                  ? activeDaily?.title
                  : `Find a Better Move Than ${activeMistake?.playedSan}`}
              </h2>

              <p className="mt-1 text-xs text-[#9CA3AF]">
                {playerColor === 'w' ? 'White' : 'Black'} to move. Find the strongest
                tactical continuation.
              </p>

              {/* Status Feedback */}
              {status === 'solved' && (
                <div className="mt-4 rounded-lg border border-[#10B981]/40 bg-[#10B981]/15 p-3.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#34D399]">
                    <CheckCircle2 className="h-4 w-4" />
                    Correct! ({expectedSan})
                  </div>
                  <p className="mt-1 text-xs text-[#F5F0E6]">
                    {tab === 'daily' ? activeDaily?.explanation : activeMistake?.explanation}
                  </p>
                </div>
              )}

              {status === 'wrong' && (
                <div className="mt-4 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 p-3.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#FCA5A5]">
                    <XCircle className="h-4 w-4" />
                    Not the best move — try again!
                  </div>
                </div>
              )}

              {showHint && status !== 'solved' && (
                <div className="mt-4 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3 text-xs text-[#F5E199]">
                  <strong>Hint:</strong>{' '}
                  {tab === 'daily'
                    ? activeDaily?.hint
                    : `Look closely at the highlighted piece on ${activeMistake?.bestFrom}.`}
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  disabled={status === 'solved'}
                  className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3.5 py-2 text-xs font-semibold text-[#F5E199] transition hover:bg-[#D4AF37]/25 disabled:opacity-40"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-[#D4AF37]" />
                  Hint
                </button>

                <button
                  type="button"
                  onClick={retryCurrent}
                  className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-3.5 py-2 text-xs font-medium text-[#F5F0E6] transition hover:bg-[#232A36]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={nextPuzzle}
                  className="ml-auto inline-flex items-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
                >
                  Next Puzzle
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
