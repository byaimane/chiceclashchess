import { Chess, type Square } from 'chess.js';
import {
  BookOpen,
  Bot,
  Box,
  Brain,
  Flag,
  Grid2X2,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { AiReviewPanel } from '../components/AiReviewPanel';
import { CapturedPieces } from '../components/CapturedPieces';
import { Chessboard3D, type LegalTarget } from '../components/Chessboard3D';
import { EvalBar } from '../components/EvalBar';
import { GameChat } from '../components/GameChat';
import { MoveHistory } from '../components/MoveHistory';
import { useAuth } from '../context/AuthContext';
import {
  AI_DIFFICULTY_META,
  AI_PERSONALITY_META,
  AiDifficulty,
  AiPersonality,
  analyzeGameHistory,
  askAiCoach,
  evaluatePosition,
  GameReviewReport,
  getBestAiMove,
} from '../lib/chessAi';
import { detectOpening } from '../lib/openings';
import { saveMistakePuzzles } from '../lib/puzzles';
import type { ChatMessage } from '../types';

export function AiArenaPage() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState<AiDifficulty>('club');
  const [personality, setPersonality] = useState<AiPersonality>('balanced');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  const [fen, setFen] = useState<string>(() => new Chess().fen());
  const [history, setHistory] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [boardWidth, setBoardWidth] = useState(480);

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<LegalTarget[]>([]);
  const [hint, setHint] = useState<{
    from: string;
    to: string;
    san: string;
    explanation: string;
  } | null>(null);

  const [isAiThinking, setIsAiThinking] = useState(false);
  const [resigned, setResigned] = useState(false);

  const [coachMessages, setCoachMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-coach',
      senderId: 'ai-coach',
      senderUsername: 'Grandmaster AI Coach',
      text: 'Welcome to the AI Arena! Play a move, request a Smart Hint, or ask me about threats, openings, or your best plan.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewReport, setReviewReport] = useState<GameReviewReport | null>(null);

  // Responsive board width
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      if (vw < 420) setBoardWidth(vw - 36);
      else if (vw < 768) setBoardWidth(Math.min(440, vw - 48));
      else if (vw < 1100) setBoardWidth(430);
      else setBoardWidth(490);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const evaluation = useMemo(() => evaluatePosition(fen), [fen]);
  const opening = useMemo(() => detectOpening(history), [history]);

  const isGameOver =
    resigned ||
    chess.isCheckmate() ||
    chess.isDraw() ||
    chess.isStalemate() ||
    chess.isThreefoldRepetition();

  const gameStatusText = useMemo(() => {
    if (resigned) return 'You resigned — AI wins.';
    if (chess.isCheckmate()) {
      return chess.turn() === playerColor
        ? 'Checkmate — AI wins!'
        : 'Checkmate — You win!';
    }
    if (chess.isStalemate()) return 'Draw by stalemate.';
    if (chess.isThreefoldRepetition()) return 'Draw by threefold repetition.';
    if (chess.isDraw()) return 'Draw.';
    if (isAiThinking) return `${AI_DIFFICULTY_META[difficulty].label} AI is thinking...`;
    return chess.turn() === playerColor ? 'Your turn' : 'AI turn';
  }, [resigned, chess, playerColor, isAiThinking, difficulty]);

  // Trigger AI move whenever it's the AI's turn
  useEffect(() => {
    if (isGameOver) return;
    if (chess.turn() === playerColor) return;

    setIsAiThinking(true);
    const timer = window.setTimeout(() => {
      const aiMove = getBestAiMove(fen, difficulty, personality);
      if (aiMove) {
        const next = new Chess(fen);
        const applied = next.move({
          from: aiMove.from,
          to: aiMove.to,
          promotion: (aiMove.promotion as 'q' | 'r' | 'b' | 'n' | undefined) ?? 'q',
        });
        if (applied) {
          setFen(next.fen());
          setHistory((prev) => [...prev, applied.san]);
          setHint(null);
          setSelectedSquare(null);
          setLegalTargets([]);
        }
      }
      setIsAiThinking(false);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [fen, chess, playerColor, isGameOver, difficulty, personality]);

  const startNewGame = (side: 'w' | 'b' | 'random' = playerColor) => {
    const resolvedSide: 'w' | 'b' =
      side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
    setPlayerColor(resolvedSide);
    setFen(new Chess().fen());
    setHistory([]);
    setSelectedSquare(null);
    setLegalTargets([]);
    setHint(null);
    setResigned(false);
    setReviewReport(null);
    setCoachMessages([
      {
        id: `coach-reset-${Date.now()}`,
        senderId: 'ai-coach',
        senderUsername: 'Grandmaster AI Coach',
        text: `New match started as ${resolvedSide === 'w' ? 'White' : 'Black'} vs ${
          AI_DIFFICULTY_META[difficulty].label
        } (${AI_PERSONALITY_META[personality].label}). Good luck!`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const applyPlayerMove = (from: Square, to: Square): boolean => {
    if (isGameOver || isAiThinking || chess.turn() !== playerColor) return false;
    const next = new Chess(fen);
    try {
      const move = next.move({ from, to, promotion: 'q' });
      if (!move) return false;
      setFen(next.fen());
      setHistory((prev) => [...prev, move.san]);
      setSelectedSquare(null);
      setLegalTargets([]);
      setHint(null);
      return true;
    } catch {
      return false;
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || isAiThinking || chess.turn() !== playerColor) return;

    if (selectedSquare && legalTargets.some((t) => t.square === square)) {
      applyPlayerMove(selectedSquare, square);
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalTargets(
        moves.map((m) => ({
          square: m.to as Square,
          isCapture: Boolean(m.captured),
        }))
      );
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  };

  const handleUndo = () => {
    if (isAiThinking || history.length === 0) return;
    const stepsToUndo =
      chess.turn() === playerColor && history.length >= 2 ? 2 : 1;
    const nextHistory = history.slice(0, history.length - stepsToUndo);
    const rebuilt = new Chess();
    for (const san of nextHistory) {
      rebuilt.move(san);
    }
    setFen(rebuilt.fen());
    setHistory(nextHistory);
    setResigned(false);
    setHint(null);
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const handleSmartHint = () => {
    if (isGameOver || isAiThinking) return;
    const best = getBestAiMove(fen, 'master', 'balanced');
    if (!best) return;
    setHint({
      from: best.from,
      to: best.to,
      san: best.san,
      explanation: best.explanation,
    });
  };

  const handleAskCoach = (question: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      senderId: user?.id ?? 'player',
      senderUsername: user?.username ?? 'You',
      text: question,
      timestamp: new Date().toISOString(),
    };
    const replyText = askAiCoach(fen, history, question);
    const coachMsg: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      senderId: 'ai-coach',
      senderUsername: 'Grandmaster AI Coach',
      text: replyText,
      timestamp: new Date().toISOString(),
    };
    setCoachMessages((prev) => [...prev, userMsg, coachMsg]);
  };

  const handleOpenReview = () => {
    if (history.length === 0) return;
    setReviewOpen(true);
    setIsAnalyzing(true);
    window.setTimeout(() => {
      const report = analyzeGameHistory(history);
      setReviewReport(report);
      if (report.mistakePuzzles.length > 0) {
        saveMistakePuzzles(report.mistakePuzzles);
      }
      setIsAnalyzing(false);
    }, 80);
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(212, 175, 55, 0.35)',
    };
  }
  for (const target of legalTargets) {
    customSquareStyles[target.square] = target.isCapture
      ? {
          background:
            'radial-gradient(circle, transparent 58%, rgba(239, 68, 68, 0.6) 62%)',
        }
      : {
          background:
            'radial-gradient(circle, rgba(212, 175, 55, 0.55) 22%, transparent 25%)',
        };
  }
  if (hint) {
    customSquareStyles[hint.from] = {
      backgroundColor: 'rgba(212, 175, 55, 0.55)',
      boxShadow: 'inset 0 0 0 2px #D4AF37',
    };
    customSquareStyles[hint.to] = {
      backgroundColor: 'rgba(16, 185, 129, 0.45)',
      boxShadow: 'inset 0 0 0 2px #34D399',
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header & Bot Config */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#2A313F] bg-[#14171F] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-editorial text-xl font-bold text-[#F5F0E6]">
              Play vs. ChoiceCLASH AI
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              {gameStatusText} · {AI_DIFFICULTY_META[difficulty].elo}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as AiDifficulty)}
            className="rounded border border-[#2A313F] bg-[#1B202A] px-2.5 py-1.5 text-xs font-medium text-[#F5F0E6] focus:border-[#D4AF37] focus:outline-none"
            aria-label="AI Difficulty"
          >
            {Object.entries(AI_DIFFICULTY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label} ({meta.elo})
              </option>
            ))}
          </select>

          {/* Personality */}
          <select
            value={personality}
            onChange={(e) => setPersonality(e.target.value as AiPersonality)}
            className="rounded border border-[#2A313F] bg-[#1B202A] px-2.5 py-1.5 text-xs font-medium text-[#F5F0E6] focus:border-[#D4AF37] focus:outline-none"
            aria-label="AI Personality"
          >
            {Object.entries(AI_PERSONALITY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                Style: {meta.label}
              </option>
            ))}
          </select>

          {/* Play as */}
          <div className="flex overflow-hidden rounded border border-[#2A313F] bg-[#1B202A] text-xs">
            <button
              type="button"
              onClick={() => startNewGame('w')}
              className={`px-2.5 py-1.5 font-medium transition ${
                playerColor === 'w'
                  ? 'bg-[#D4AF37] text-[#0D0F12]'
                  : 'text-[#D1D5DB] hover:bg-[#232A36]'
              }`}
            >
              White
            </button>
            <button
              type="button"
              onClick={() => startNewGame('b')}
              className={`px-2.5 py-1.5 font-medium transition ${
                playerColor === 'b'
                  ? 'bg-[#D4AF37] text-[#0D0F12]'
                  : 'text-[#D1D5DB] hover:bg-[#232A36]'
              }`}
            >
              Black
            </button>
          </div>

          <button
            type="button"
            onClick={() => startNewGame(playerColor)}
            className="inline-flex items-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
          >
            <Play className="h-3.5 w-3.5" />
            New Match
          </button>
        </div>
      </div>

      {/* Main Arena Grid */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Left: Eval Bar + Board */}
        <div className="flex flex-col items-center gap-3">
          {/* Top Bar: Opening + 2D/3D Toggle */}
          <div className="flex w-full max-w-[530px] flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#14171F] px-2.5 py-1 text-xs">
              <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="font-medium text-[#F5F0E6]">
                {opening ? `${opening.eco}: ${opening.name}` : 'Opening Book: Ready'}
              </span>
            </div>

            <div className="flex overflow-hidden rounded border border-[#2A313F] bg-[#14171F] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('2d')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-medium transition ${
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
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-medium transition ${
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

          <div className="flex items-center gap-3">
            <EvalBar
              evaluation={evaluation}
              orientation={playerColor === 'w' ? 'white' : 'black'}
            />

            <div className="overflow-hidden rounded-lg border-2 border-[#2A313F] bg-[#14171F] shadow-2xl">
              {viewMode === '2d' ? (
                <Chessboard
                  position={fen}
                  boardWidth={boardWidth}
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                  onPieceDrop={(src, dst) => applyPlayerMove(src, dst)}
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
                  hintSquares={hint ? { from: hint.from, to: hint.to } : null}
                  onSquareClick={handleSquareClick}
                />
              )}
            </div>
          </div>

          {/* Smart Hint Banner */}
          {hint && (
            <div className="w-full max-w-[530px] rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3.5 py-2.5 text-xs text-[#F5F0E6]">
              <div className="flex items-center gap-1.5 font-semibold text-[#F5E199]">
                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                Smart Hint: {hint.san} ({hint.from} → {hint.to})
              </div>
              <p className="mt-1 text-[#D1D5DB]">{hint.explanation}</p>
            </div>
          )}

          {/* Action Controls */}
          <div className="flex w-full max-w-[530px] flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSmartHint}
              disabled={isGameOver || isAiThinking}
              className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-2 text-xs font-semibold text-[#F5E199] transition hover:bg-[#D4AF37]/25 disabled:opacity-40"
            >
              <Lightbulb className="h-3.5 w-3.5 text-[#D4AF37]" />
              Smart Hint
            </button>

            <button
              type="button"
              onClick={handleUndo}
              disabled={isAiThinking || history.length === 0}
              className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-2 text-xs font-medium text-[#F5F0E6] transition hover:bg-[#232A36] disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>

            <button
              type="button"
              onClick={() => setResigned(true)}
              disabled={isGameOver}
              className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-2 text-xs font-medium text-[#FCA5A5] transition hover:bg-[#232A36] disabled:opacity-40"
            >
              <Flag className="h-3.5 w-3.5" />
              Resign
            </button>

            <button
              type="button"
              onClick={handleOpenReview}
              disabled={history.length === 0}
              className="ml-auto inline-flex items-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-3.5 py-2 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158] disabled:opacity-40"
            >
              <Brain className="h-3.5 w-3.5" />
              AI Game Review
            </button>
          </div>

          {isGameOver && (
            <div className="flex w-full max-w-[530px] items-center justify-between rounded-lg border border-[#D4AF37]/40 bg-[#14171F] px-4 py-3">
              <span className="text-sm font-semibold text-[#F5E199]">
                {gameStatusText}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenReview}
                  className="rounded border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-[#F5E199]"
                >
                  Review Match
                </button>
                <button
                  type="button"
                  onClick={() => startNewGame(playerColor)}
                  className="inline-flex items-center gap-1 rounded bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0D0F12]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Rematch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Captured Pieces, Move History, Interactive AI Coach */}
        <div className="space-y-4">
          <div className="space-y-1.5 rounded border border-[#2A313F] bg-[#151921] p-3">
            <CapturedPieces fen={fen} forColor={playerColor === 'w' ? 'b' : 'w'} />
            <CapturedPieces fen={fen} forColor={playerColor} />
          </div>
          <MoveHistory history={history} />
          <GameChat
            messages={coachMessages}
            currentUserId={user?.id ?? 'player'}
            onSend={handleAskCoach}
            title="Interactive AI Coach"
            placeholder="Ask about threats, plans, or your last move..."
            emptyText="Ask the AI Coach anything about this position."
            isAiCoach
            quickPrompts={[
              'Best plan?',
              'Any threats?',
              'Why last move?',
              'Explain opening',
            ]}
          />
        </div>
      </div>

      <AiReviewPanel
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        report={reviewReport}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}
