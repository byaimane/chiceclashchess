import {
  Award,
  Check,
  KeyRound,
  Loader2,
  LogOut,
  Palette,
  Plus,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  FALLBACK_THEMES,
  fetchArenaThemes,
  fetchEnabledPlugins,
  getStoredThemeSlug,
  getStoredViewMode,
  parsePluginConfig,
  savePreferredTheme,
  setStoredThemeSlug,
  setStoredViewMode,
  type ArenaViewMode,
} from '../lib/arenaConfig';
import { getLevelInfo } from '../lib/progression';
import { getSocket } from '../lib/socket';
import type {
  ArenaTheme,
  MatchHistoryItem,
  OnlineUser,
  PluginItem,
} from '../types';

export function LobbyPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [roomInput, setRoomInput] = useState('');
  const [searching, setSearching] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Arena Themes & Plugins
  const [themes, setThemes] = useState<ArenaTheme[]>(FALLBACK_THEMES);
  const [selectedTheme, setSelectedTheme] = useState<string>(
    user?.preferredThemeSlug || getStoredThemeSlug()
  );
  const [viewMode, setViewMode] = useState<ArenaViewMode>(getStoredViewMode);
  const [savingTheme, setSavingTheme] = useState(false);
  const [plugins, setPlugins] = useState<PluginItem[]>([]);

  useEffect(() => {
    refreshUser();
    fetchArenaThemes().then(setThemes);
    fetchEnabledPlugins().then(setPlugins);
    apiRequest<{ games: MatchHistoryItem[] }>('/api/games/history')
      .then((res) => setHistory(res.games))
      .catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (user?.preferredThemeSlug) {
      setSelectedTheme(user.preferredThemeSlug);
      setStoredThemeSlug(user.preferredThemeSlug);
    }
  }, [user?.preferredThemeSlug]);

  const handleSelectTheme = async (slug: string) => {
    setSelectedTheme(slug);
    setSavingTheme(true);
    try {
      await savePreferredTheme(slug);
      await refreshUser();
    } catch {
      // Stored locally even if offline
    } finally {
      setSavingTheme(false);
    }
  };

  const bannerPlugin = plugins.find((p) => p.slug === 'arena-banner');
  const bannerConfig = parsePluginConfig(bannerPlugin, { message: '', tone: 'info' });

  useEffect(() => {
    const socket = getSocket();

    const onQueued = () => setSearching(true);
    const onCancelled = () => setSearching(false);
    const onMatched = ({ roomCode }: { roomCode: string }) => {
      setSearching(false);
      navigate(`/game/${roomCode}`);
    };
    const onOnlineList = (list: OnlineUser[]) => {
      setOnlineUsers(list);
    };

    socket.on('matchmaking:queued', onQueued);
    socket.on('matchmaking:cancelled', onCancelled);
    socket.on('matchmaking:matched', onMatched);
    socket.on('online:list', onOnlineList);

    socket.emit('online:request');
    socket.emit('matchmaking:join');

    return () => {
      socket.off('matchmaking:queued', onQueued);
      socket.off('matchmaking:cancelled', onCancelled);
      socket.off('matchmaking:matched', onMatched);
      socket.off('online:list', onOnlineList);
      socket.emit('matchmaking:leave');
    };
  }, [navigate]);

  const handleCreateGame = () => {
    setError('');
    setCreating(true);
    const socket = getSocket();
    socket.emit('matchmaking:leave');
    socket.emit('room:create', (res: { roomCode?: string; error?: string }) => {
      setCreating(false);
      if (res.roomCode) {
        navigate(`/game/${res.roomCode}`);
      } else {
        setError(res.error || 'Could not create game room.');
      }
    });
  };

  const handleJoinRoom = (e: FormEvent) => {
    e.preventDefault();
    const code = roomInput.trim().toUpperCase();
    if (!code) return;
    setError('');
    getSocket().emit('matchmaking:leave');
    navigate(`/game/${code}`);
  };

  const handleToggleSearch = () => {
    setError('');
    const socket = getSocket();
    if (searching) {
      socket.emit('matchmaking:leave');
      setSearching(false);
    } else {
      socket.emit('matchmaking:join');
      setSearching(true);
    }
  };

  const handleChallenge = (targetUserId: string) => {
    setError('');
    getSocket().emit(
      'challenge:send',
      { targetUserId },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setError(res.error || 'Could not challenge player.');
        }
      }
    );
  };

  if (!user) return null;

  const otherOnlineUsers = onlineUsers.filter((u) => u.userId !== user.id);
  const levelInfo = getLevelInfo(user.xp ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Player Header & Progression */}
      <div className="rounded border border-[#2A313F] bg-[#151921] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
                <Award className="h-3.5 w-3.5" />
                Level {levelInfo.level} &middot; {levelInfo.rankTitle}
              </span>
              <span className="text-xs font-medium text-[#9CA3AF]">
                {user.xp ?? 0} XP
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">
              {user.username}
            </h1>
            <p className="mt-0.5 text-sm text-[#9CA3AF]">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded border border-[#2A313F] bg-[#0D0F12] px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#D4AF37]">{user.wins}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Wins</div>
            </div>
            <div className="rounded border border-[#2A313F] bg-[#0D0F12] px-3.5 py-2 text-center">
              <div className="text-base font-bold text-red-700">{user.losses}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Losses</div>
            </div>
            <div className="rounded border border-[#2A313F] bg-[#0D0F12] px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#7C4A2D]">{user.draws}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Draws</div>
            </div>
            <div className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#D4AF37]">{user.points ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#D4AF37]">Points</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#151921] px-3.5 py-2.5 text-sm font-medium text-[#F5F0E6] transition hover:bg-[#1B202A]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-5 border-t border-[#EDE7DC] pt-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>
              Next Level ({levelInfo.level + 1}): {user.xp ?? 0} / {levelInfo.nextThreshold} XP
            </span>
            <span className="font-medium text-[#F5F0E6]">
              Win: +100 pts &middot; Draw: +40 pts &middot; Loss: +15 pts
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded border border-[#2A313F] bg-[#1B202A]">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plugin Announcement Banner */}
      {bannerPlugin && bannerConfig.message && (
        <div className="mt-4 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-medium text-[#D4AF37]">
          {bannerConfig.message}
        </div>
      )}

      {/* User Panel: Playing Arena Theme Selector */}
      <div className="mt-6 rounded border border-[#2A313F] bg-[#151921] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#D4AF37]" />
            <h2 className="font-editorial text-lg font-bold text-[#F5F0E6]">
              Playing Arena Theme &amp; View
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex overflow-hidden rounded border border-[#2A313F] bg-[#0D0F12]">
              <button
                type="button"
                onClick={() => {
                  setViewMode('2d');
                  setStoredViewMode('2d');
                }}
                className={`px-3 py-1 text-xs font-semibold transition ${
                  viewMode === '2d'
                    ? 'bg-[#D4AF37] text-[#0D0F12]'
                    : 'text-[#F5F0E6] hover:bg-[#151921]'
                }`}
              >
                2D Board
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('3d');
                  setStoredViewMode('3d');
                }}
                className={`px-3 py-1 text-xs font-semibold transition ${
                  viewMode === '3d'
                    ? 'bg-[#D4AF37] text-[#0D0F12]'
                    : 'text-[#F5F0E6] hover:bg-[#151921]'
                }`}
              >
                3D Arena
              </button>
            </div>
            <span className="text-xs text-[#9CA3AF]">
              {savingTheme ? 'Saving preference...' : 'Choose your board style'}
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((t) => {
            const active = selectedTheme === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => handleSelectTheme(t.slug)}
                className={`flex items-center justify-between gap-3 rounded border p-3 text-left transition ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37]/5 ring-1 ring-[#1B5E3A]'
                    : 'border-[#2A313F] bg-[#0D0F12] hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 grid-cols-2 grid-rows-2 border-2"
                    style={{ borderColor: t.boardBorder }}
                  >
                    <div style={{ backgroundColor: t.lightSquare }} />
                    <div style={{ backgroundColor: t.darkSquare }} />
                    <div style={{ backgroundColor: t.darkSquare }} />
                    <div style={{ backgroundColor: t.lightSquare }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#F5F0E6]">{t.name}</div>
                    <div className="text-[11px] text-[#9CA3AF] line-clamp-1">
                      {t.description || 'Custom 2D arena theme'}
                    </div>
                  </div>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-[#D4AF37]" />}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Play Actions */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded border border-[#D4AF37]/40 bg-[#151921] p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Swords className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#F5F0E6]">Auto Quick Match</h2>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Automatically searches for an opponent and pairs you the moment
              another player is ready.
            </p>
          </div>
          <button
            onClick={handleToggleSearch}
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded border px-4 py-2.5 text-sm font-semibold transition ${
              searching
                ? 'border-amber-600/40 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border-[#B59124] bg-[#D4AF37] text-[#0D0F12] hover:bg-[#E5C158]'
            }`}
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Auto-Searching... (Pause)
                <X className="h-4 w-4" />
              </>
            ) : (
              'Resume Auto-Search'
            )}
          </button>
        </div>

        <div className="flex flex-col justify-between rounded border border-[#2A313F] bg-[#151921] p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#2A313F] bg-[#1B202A] text-[#F5F0E6]">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#F5F0E6]">Create Game</h2>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Generate a unique room code and share the invite link with a friend.
            </p>
          </div>
          <button
            onClick={handleCreateGame}
            disabled={creating}
            className="mt-6 w-full rounded border border-[#D4AF37]/60 bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#332E2A] disabled:opacity-50"
          >
            {creating ? 'Creating Room...' : 'Create Private Room'}
          </button>
        </div>

        <div className="flex flex-col justify-between rounded border border-[#2A313F] bg-[#151921] p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#2A313F] bg-[#1B202A] text-[#F5F0E6]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#F5F0E6]">Join Game</h2>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Enter a room code to sit down at an existing table.
            </p>
          </div>
          <form onSubmit={handleJoinRoom} className="mt-6 flex gap-2">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={8}
              className="min-w-0 flex-1 rounded border border-[#2A313F] bg-[#0D0F12] px-3.5 py-2 font-mono text-sm uppercase tracking-widest text-[#F5F0E6] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded border border-[#2A313F] bg-[#1B202A] px-4 py-2 text-sm font-semibold text-[#F5F0E6] transition hover:bg-[#232A36]"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Online Players & Match History */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-[#2A313F] bg-[#151921] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-[#F5F0E6]">
                Online Players ({onlineUsers.length})
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4AF37]">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              Live
            </span>
          </div>

          {otherOnlineUsers.length === 0 ? (
            <p className="mt-4 text-sm text-[#9CA3AF]">
              No other players online right now. Open another browser window or
              invite a friend to play!
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#EDE7DC]">
              {otherOnlineUsers.map((online) => (
                <div
                  key={online.userId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        online.status === 'searching'
                          ? 'bg-amber-500'
                          : online.status === 'in_game'
                          ? 'bg-[#7C4A2D]'
                          : 'bg-[#D4AF37]'
                      }`}
                    />
                    <span className="font-semibold text-[#F5F0E6]">
                      {online.username}
                    </span>
                    <span className="rounded border border-[#2A313F] bg-[#1B202A] px-2 py-0.5 text-[11px] font-medium text-[#9CA3AF]">
                      {online.status === 'searching'
                        ? 'Searching'
                        : online.status === 'in_game'
                        ? 'In Game'
                        : 'In Lobby'}
                    </span>
                  </div>

                  {online.status !== 'in_game' && (
                    <button
                      onClick={() => handleChallenge(online.userId)}
                      className="rounded border border-[#B59124] bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
                    >
                      Challenge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-[#2A313F] bg-[#151921] p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-[#F5F0E6]">Recent Matches</h2>
          </div>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-[#9CA3AF]">
              No completed matches recorded yet. Play a game to see your history here.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#EDE7DC]">
              {history.map((item) => {
                const isWhite = item.whitePlayer?.id === user.id;
                const opponent = isWhite
                  ? item.blackPlayer?.username ?? 'Unknown'
                  : item.whitePlayer?.username ?? 'Unknown';

                let badge = 'Draw';
                let badgeClass = 'border-[#7C4A2D]/30 bg-[#7C4A2D]/10 text-[#7C4A2D]';
                if (
                  (isWhite && item.result === 'WHITE_WIN') ||
                  (!isWhite && item.result === 'BLACK_WIN')
                ) {
                  badge = 'Win';
                  badgeClass = 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]';
                } else if (item.result !== 'DRAW') {
                  badge = 'Loss';
                  badgeClass = 'border-red-500/40 bg-red-950/50 text-red-200';
                }

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-[#F5F0E6]">vs {opponent}</span>
                      <span className="ml-2 text-xs text-[#9CA3AF]">
                        ({isWhite ? 'White' : 'Black'} &middot; {item.endReason ?? 'completed'})
                      </span>
                    </div>
                    <span className={`rounded border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                      {badge}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
