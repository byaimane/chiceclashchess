import { Chess, type Square } from 'chess.js';
import {
  Box,
  Check,
  Copy,
  Flag,
  Handshake,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate, useParams } from 'react-router-dom';
import { AiReviewPanel } from '../components/AiReviewPanel';
import { CapturedPieces } from '../components/CapturedPieces';
import { Chessboard3D, type LegalTarget } from '../components/Chessboard3D';
import { GameChat } from '../components/GameChat';
import { MoveHistory } from '../components/MoveHistory';
import { PostGameModal } from '../components/PostGameModal';
import { useAuth } from '../context/AuthContext';
import { analyzeGameHistory, type GameReviewReport } from '../lib/chessAi';
import { detectOpening } from '../lib/openings';
import { saveMistakePuzzles } from '../lib/puzzles';
import {
  FALLBACK_THEMES,
  fetchArenaThemes,
  fetchEnabledPlugins,
  getStoredThemeSlug,
  getStoredViewMode,
  parsePluginConfig,
  playChessSound,
  savePreferredTheme,
  setStoredThemeSlug,
  setStoredViewMode,
  type ArenaViewMode,
} from '../lib/arenaConfig';
import { getSocket } from '../lib/socket';
import type {
  ArenaTheme,
  ChatMessage,
  GameOverPayload,
  PluginItem,
  RoomSnapshot,
} from '../types';

export function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const roomCode = (roomId || '').toUpperCase();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [joinError, setJoinError] = useState('');
  const [moveError, setMoveError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewReport, setReviewReport] = useState<GameReviewReport | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ArenaViewMode>(getStoredViewMode);
  const [themes, setThemes] = useState<ArenaTheme[]>(FALLBACK_THEMES);
  const [themeSlug, setThemeSlug] = useState<string>(
    user?.preferredThemeSlug || getStoredThemeSlug()
  );
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const prevHistoryLenRef = useRef<number>(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(560);

  useEffect(() => {
    fetchArenaThemes().then(setThemes);
    fetchEnabledPlugins().then(setPlugins);
  }, []);

  useEffect(() => {
    if (user?.preferredThemeSlug) {
      setThemeSlug(user.preferredThemeSlug);
      setStoredThemeSlug(user.preferredThemeSlug);
    }
  }, [user?.preferredThemeSlug]);

  const activeTheme = useMemo(
    () =>
      themes.find((t) => t.slug === themeSlug) ||
      themes.find((t) => t.isDefault) ||
      FALLBACK_THEMES[0],
    [themes, themeSlug]
  );

  const coordPlugin = plugins.find((p) => p.slug === 'board-coordinates');
  const coordConfig = parsePluginConfig(coordPlugin, { showNotation: true });
  const showBoardNotation = coordPlugin ? coordConfig.showNotation !== false : true;

  const soundPlugin = plugins.find((p) => p.slug === 'move-sounds');
  const soundConfig = parsePluginConfig(soundPlugin, { volume: 0.5 });

  const bannerPlugin = plugins.find((p) => p.slug === 'arena-banner');
  const bannerConfig = parsePluginConfig(bannerPlugin, { message: '' });

  const handleThemeChange = async (slug: string) => {
    setThemeSlug(slug);
    try {
      await savePreferredTheme(slug);
      refreshUser();
    } catch {
      // Saved locally
    }
  };

  const handleViewModeChange = (mode: ArenaViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (arenaRef.current?.requestFullscreen) {
          await arenaRef.current.requestFullscreen();
        }
      } catch {
        // Fallback to CSS fixed fullscreen (e.g., iOS Safari)
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore exit errors
      }
    }
  };

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const maxCap = isFullscreen
        ? Math.min(720, Math.max(260, window.innerHeight - 175))
        : 580;
      const width = Math.min(maxCap, Math.max(260, Math.floor(el.clientWidth - 4)));
      setBoardWidth(width);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [snapshot !== null, isFullscreen]);

  useEffect(() => {
    if (!roomCode) return;
    const socket = getSocket();

    const onRoomState = (data: RoomSnapshot) => {
      if (data.roomCode !== roomCode) return;
      if (soundPlugin && data.history.length > prevHistoryLenRef.current) {
        const lastMove = data.history[data.history.length - 1] || '';
        if (data.inCheck) {
          playChessSound('check', Number(soundConfig.volume) || 0.5);
        } else if (lastMove.includes('x')) {
          playChessSound('capture', Number(soundConfig.volume) || 0.5);
        } else {
          playChessSound('move', Number(soundConfig.volume) || 0.5);
        }
      }
      prevHistoryLenRef.current = data.history.length;
      setSnapshot(data);
      setSelectedSquare(null);
      if (data.gameOver) {
        setShowModal(true);
      }
    };

    const onChatMessage = (message: ChatMessage) => {
      setSnapshot((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
    };

    const onGameOver = (payload: GameOverPayload) => {
      setSnapshot((prev) => (prev ? { ...prev, status: 'COMPLETED', gameOver: payload } : prev));
      setShowModal(true);
      refreshUser();
    };

    socket.on('room:state', onRoomState);
    socket.on('chat:message', onChatMessage);
    socket.on('game:over', onGameOver);

    socket.emit(
      'room:join',
      { roomCode },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setJoinError(res.error || 'Failed to join room.');
        }
      }
    );

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('chat:message', onChatMessage);
      socket.off('game:over', onGameOver);
    };
  }, [roomCode, refreshUser]);

  const chess = useMemo(() => {
    const instance = new Chess();
    if (snapshot?.fen) {
      try {
        instance.load(snapshot.fen);
      } catch {
        // Fallback to start position
      }
    }
    return instance;
  }, [snapshot?.fen]);

  const boardOrientation = snapshot?.yourColor === 'b' ? 'black' : 'white';
  const isMyTurn =
    Boolean(snapshot) &&
    snapshot?.status === 'ACTIVE' &&
    snapshot?.yourColor !== null &&
    snapshot?.turn === snapshot?.yourColor;

  const legalTargets = useMemo<LegalTarget[]>(() => {
    if (!selectedSquare || !isMyTurn) return [];
    return chess.moves({ square: selectedSquare, verbose: true }).map((move) => ({
      square: move.to as Square,
      isCapture: Boolean(move.captured),
    }));
  }, [chess, selectedSquare, isMyTurn]);

  const optionSquares = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!selectedSquare || !isMyTurn) return styles;

    const moves = chess.moves({ square: selectedSquare, verbose: true });
    if (moves.length === 0) return styles;

    styles[selectedSquare] = { background: 'rgba(27, 94, 58, 0.35)' };
    for (const move of moves) {
      styles[move.to] = {
        background: move.captured
          ? 'radial-gradient(circle, rgba(185,28,28,0.55) 65%, transparent 65%)'
          : 'radial-gradient(circle, rgba(27,94,58,0.5) 22%, transparent 25%)',
      };
    }
    return styles;
  }, [chess, selectedSquare, isMyTurn]);

  const attemptMove = (from: string, to: string): boolean => {
    if (!snapshot || !isMyTurn) return false;
    setMoveError('');

    const testGame = new Chess(snapshot.fen);
    try {
      testGame.move({ from, to, promotion: 'q' });
    } catch {
      return false;
    }

    const socket = getSocket();
    socket.emit(
      'game:move',
      { roomCode, from, to, promotion: 'q' },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setMoveError(res.error || 'Move rejected.');
        }
      }
    );
    return true;
  };

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    setSelectedSquare(null);
    return attemptMove(sourceSquare, targetSquare);
  };

  const onPieceDragBegin = (_piece: string, sourceSquare: Square) => {
    if (!isMyTurn) return;
    setSelectedSquare(sourceSquare);
  };

  const onSquareClick = (square: Square) => {
    if (!isMyTurn) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare && selectedSquare !== square) {
      const moved = attemptMove(selectedSquare, square);
      if (moved) {
        setSelectedSquare(null);
        return;
      }
    }

    const piece = chess.get(square);
    if (piece && piece.color === snapshot?.yourColor) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/game/${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  if (joinError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded border border-red-300 bg-[#151921] p-8">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-700" />
          <h2 className="mt-4 text-xl font-bold text-[#F5F0E6]">Unable to Join Room</h2>
          <p className="mt-2 text-sm text-[#9CA3AF]">{joinError}</p>
          <button
            onClick={() => navigate('/lobby')}
            className="mt-6 rounded border border-[#B59124] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0D0F12] hover:bg-[#E5C158]"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      </div>
    );
  }

  const topColor = boardOrientation === 'white' ? 'b' : 'w';
  const bottomColor = boardOrientation === 'white' ? 'w' : 'b';
  const topPlayer = topColor === 'w' ? snapshot.white : snapshot.black;
  const bottomPlayer = bottomColor === 'w' ? snapshot.white : snapshot.black;

  const opponentOfferedDraw =
    snapshot.drawOfferBy !== null &&
    snapshot.yourColor !== null &&
    snapshot.drawOfferBy !== snapshot.yourColor;

  const iOfferedDraw =
    snapshot.drawOfferBy !== null &&
    snapshot.yourColor !== null &&
    snapshot.drawOfferBy === snapshot.yourColor;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Waiting Banner */}
      {snapshot.status === 'WAITING' && (
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded border border-[#D4AF37]/40 bg-[#151921] p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#D4AF37]">
              Waiting for opponent to join...
            </p>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Share room code{' '}
              <span className="rounded border border-[#2A313F] bg-[#1B202A] px-2 py-0.5 font-mono font-bold text-[#F5F0E6]">
                {snapshot.roomCode}
              </span>{' '}
              or copy the invite link.
            </p>
          </div>
          <button
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-2 rounded border border-[#B59124] bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>
        </div>
      )}

      {/* Draw Offer Banner */}
      {opponentOfferedDraw && snapshot.status === 'ACTIVE' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded border border-amber-600/40 bg-amber-50 px-4 py-3">
          <span className="text-sm font-medium text-amber-900">
            Your opponent has offered a draw.
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                getSocket().emit('game:draw:respond', { roomCode, accept: true })
              }
              className="rounded border border-[#B59124] bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0D0F12] hover:bg-[#E5C158]"
            >
              Accept Draw
            </button>
            <button
              onClick={() =>
                getSocket().emit('game:draw:respond', { roomCode, accept: false })
              }
              className="rounded border border-[#2A313F] bg-[#151921] px-3.5 py-1.5 text-xs font-medium text-[#F5F0E6] hover:bg-[#1B202A]"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Flat 2D Board Column */}
        <div
          ref={arenaRef}
          style={isFullscreen ? { backgroundColor: activeTheme.arenaBg } : undefined}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto p-3 sm:p-6'
              : 'flex flex-col items-center'
          }
        >
          <div
            ref={boardContainerRef}
            className={`w-full ${isFullscreen ? 'max-w-[724px]' : 'max-w-[584px]'}`}
          >
            {bannerPlugin && bannerConfig.message && (
              <div className="mb-2 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-center text-xs font-medium text-[#D4AF37]">
                {bannerConfig.message}
              </div>
            )}

            {/* Arena Controls Bar */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-[#9CA3AF]">
                ARENA · {snapshot.roomCode}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex overflow-hidden rounded border border-[#2A313F] bg-[#151921]">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('2d')}
                    className={`px-2.5 py-1 text-xs font-semibold transition ${
                      viewMode === '2d'
                        ? 'bg-[#D4AF37] text-[#0D0F12]'
                        : 'text-[#F5F0E6] hover:bg-[#0D0F12]'
                    }`}
                  >
                    2D
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('3d')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition ${
                      viewMode === '3d'
                        ? 'bg-[#D4AF37] text-[#0D0F12]'
                        : 'text-[#F5F0E6] hover:bg-[#0D0F12]'
                    }`}
                  >
                    <Box className="h-3 w-3" />
                    3D
                  </button>
                </div>
                <select
                  value={activeTheme.slug}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  aria-label="Select Arena Theme"
                  className="rounded border border-[#2A313F] bg-[#151921] px-2 py-1 text-xs font-medium text-[#F5F0E6] focus:border-[#D4AF37] focus:outline-none"
                >
                  {themes.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#151921] px-2.5 py-1 text-xs font-semibold text-[#F5F0E6] transition hover:bg-[#0D0F12]"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen arena'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Fullscreen Arena
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Top Player Bar */}
            <div className="mb-2 flex items-center justify-between rounded border border-[#2A313F] bg-[#151921] px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-3 w-3 rounded-full border ${
                    topColor === 'w'
                      ? 'border-[#D4AF37]/60 bg-[#151921]'
                      : 'border-[#D4AF37]/60 bg-[#1C1917]'
                  }`}
                />
                <span className="font-semibold text-[#F5F0E6]">
                  {topPlayer?.username ?? 'Waiting for player...'}
                </span>
                {topPlayer &&
                  (topPlayer.connected ? (
                    <Wifi className="h-3.5 w-3.5 text-[#D4AF37]" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-700" />
                  ))}
              </div>
              <div className="flex items-center gap-3">
                <CapturedPieces fen={snapshot.fen} forColor={topColor} />
                {snapshot.status === 'ACTIVE' && snapshot.turn === topColor && (
                  <span className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
                    Turn
                  </span>
                )}
              </div>
            </div>

            {/* 2D or 3D Chessboard */}
            <div
              className="touch-none select-none border-2 bg-[#151921]"
              style={{ borderColor: activeTheme.boardBorder }}
            >
              {viewMode === '3d' ? (
                <Chessboard3D
                  fen={snapshot.fen}
                  boardOrientation={boardOrientation}
                  boardWidth={boardWidth}
                  lightSquare={activeTheme.lightSquare}
                  darkSquare={activeTheme.darkSquare}
                  boardBorder={activeTheme.boardBorder}
                  arenaBg={activeTheme.arenaBg}
                  selectedSquare={selectedSquare}
                  legalTargets={legalTargets}
                  onSquareClick={onSquareClick}
                />
              ) : (
                <Chessboard
                  id="multiplayer-board"
                  boardWidth={boardWidth}
                  position={snapshot.fen}
                  boardOrientation={boardOrientation}
                  showBoardNotation={showBoardNotation}
                  onPieceDrop={onPieceDrop}
                  onPieceDragBegin={onPieceDragBegin}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  arePiecesDraggable={isMyTurn}
                  customBoardStyle={{ borderRadius: '0px', boxShadow: 'none', cursor: isMyTurn ? 'pointer' : 'default' }}
                  customDarkSquareStyle={{ backgroundColor: activeTheme.darkSquare }}
                  customLightSquareStyle={{ backgroundColor: activeTheme.lightSquare }}
                  animationDuration={120}
                />
              )}
            </div>

            {/* Bottom Player Bar */}
            <div className="mt-2 flex items-center justify-between rounded border border-[#2A313F] bg-[#151921] px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-3 w-3 rounded-full border ${
                    bottomColor === 'w'
                      ? 'border-[#D4AF37]/60 bg-[#151921]'
                      : 'border-[#D4AF37]/60 bg-[#1C1917]'
                  }`}
                />
                <span className="font-semibold text-[#F5F0E6]">
                  {bottomPlayer?.username ?? 'Waiting...'}
                  {bottomPlayer?.userId === user.id && ' (You)'}
                </span>
                {bottomPlayer &&
                  (bottomPlayer.connected ? (
                    <Wifi className="h-3.5 w-3.5 text-[#D4AF37]" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-700" />
                  ))}
              </div>
              <div className="flex items-center gap-3">
                <CapturedPieces fen={snapshot.fen} forColor={bottomColor} />
                {snapshot.status === 'ACTIVE' && snapshot.turn === bottomColor && (
                  <span className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
                    Your Turn
                  </span>
                )}
              </div>
            </div>

            {moveError && (
              <p className="mt-2 text-center text-xs text-red-700">{moveError}</p>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <aside className="flex flex-col gap-4">
          <div className="rounded border border-[#2A313F] bg-[#151921] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Room {snapshot.roomCode}
              </span>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                  snapshot.status === 'ACTIVE'
                    ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                    : snapshot.status === 'WAITING'
                    ? 'border-amber-600/30 bg-amber-50 text-amber-900'
                    : 'border-[#2A313F] bg-[#1B202A] text-[#9CA3AF]'
                }`}
              >
                {snapshot.status}
              </span>
            </div>

            {snapshot.inCheck && snapshot.status === 'ACTIVE' && (
              <div className="mt-2 rounded border border-red-500/40 bg-red-950/50 px-3 py-1.5 text-center text-xs font-semibold text-red-200">
                Check!
              </div>
            )}

            {snapshot.yourColor && snapshot.status === 'ACTIVE' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => getSocket().emit('game:draw:offer', { roomCode })}
                  disabled={iOfferedDraw}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-2 text-xs font-medium text-[#F5F0E6] transition hover:bg-[#232A36] disabled:opacity-50"
                >
                  <Handshake className="h-3.5 w-3.5" />
                  {iOfferedDraw ? 'Draw Offered' : 'Offer Draw'}
                </button>
                <button
                  onClick={() => getSocket().emit('game:resign', { roomCode })}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-100"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Resign
                </button>
              </div>
            )}
          </div>

          <MoveHistory history={snapshot.history} />

          {snapshot.history.length > 0 && (
            <div className="rounded border border-[#2A313F] bg-[#151921] px-3 py-2 text-xs text-[#9CA3AF]">
              <span className="font-semibold text-[#D4AF37]">Opening: </span>
              {detectOpening(snapshot.history)?.name ?? 'Custom / Out of Book'}
            </div>
          )}

          <GameChat
            messages={snapshot.messages}
            currentUserId={user.id}
            onSend={(text) =>
              getSocket().emit('chat:send', { roomCode, text })
            }
          />
        </aside>
      </div>

      {showModal && snapshot.gameOver && (
        <PostGameModal
          gameOver={snapshot.gameOver}
          currentUserId={user.id}
          yourColor={snapshot.yourColor}
          onReturnToLobby={() => navigate('/lobby')}
          onClose={() => setShowModal(false)}
          onAiReview={() => {
            setShowModal(false);
            setReviewOpen(true);
            setIsAnalyzing(true);
            window.setTimeout(() => {
              const report = analyzeGameHistory(snapshot.history);
              setReviewReport(report);
              if (report.mistakePuzzles.length > 0) {
                saveMistakePuzzles(report.mistakePuzzles);
              }
              setIsAnalyzing(false);
            }, 80);
          }}
        />
      )}

      <AiReviewPanel
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        report={reviewReport}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}
