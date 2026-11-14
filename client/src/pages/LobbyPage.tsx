import {
  Award,
  Check,
  DollarSign,
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
  parsePluginConfig,
  savePreferredTheme,
  setStoredThemeSlug,
} from '../lib/arenaConfig';
import { formatUsd, getLevelInfo } from '../lib/progression';
import { getSocket } from '../lib/socket';
import type {
  ArenaTheme,
  MatchHistoryItem,
  OnlineUser,
  PayoutRequest,
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

  // Rewards / Cash-Out state
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [redeemPoints, setRedeemPoints] = useState(500);
  const [payoutMethod, setPayoutMethod] = useState('PayPal');
  const [destination, setDestination] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // Arena Themes & Plugins
  const [themes, setThemes] = useState<ArenaTheme[]>(FALLBACK_THEMES);
  const [selectedTheme, setSelectedTheme] = useState<string>(
    user?.preferredThemeSlug || getStoredThemeSlug()
  );
  const [savingTheme, setSavingTheme] = useState(false);
  const [plugins, setPlugins] = useState<PluginItem[]>([]);

  useEffect(() => {
    refreshUser();
    fetchArenaThemes().then(setThemes);
    fetchEnabledPlugins().then(setPlugins);
    apiRequest<{ games: MatchHistoryItem[] }>('/api/games/history')
      .then((res) => setHistory(res.games))
      .catch(() => {});
    apiRequest<{ payouts: PayoutRequest[] }>('/api/rewards/payouts')
      .then((res) => setPayouts(res.payouts))
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

  const handleRedeem = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setRedeemSuccess('');
    setRedeeming(true);
    try {
      const res = await apiRequest<{ payout: PayoutRequest }>('/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          pointsSpent: Number(redeemPoints),
          payoutMethod,
          destination,
        }),
      });
      setPayouts((prev) => [res.payout, ...prev]);
      setDestination('');
      setRedeemSuccess(
        `Submitted ${formatUsd(res.payout.amountCents)} cash-out request (${res.payout.pointsSpent} pts).`
      );
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem points.');
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) return null;

  const otherOnlineUsers = onlineUsers.filter((u) => u.userId !== user.id);
  const levelInfo = getLevelInfo(user.xp ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Player Header & Progression */}
      <div className="rounded border border-[#DDD6C8] bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 px-2 py-0.5 text-xs font-semibold text-[#1B5E3A]">
                <Award className="h-3.5 w-3.5" />
                Level {levelInfo.level} &middot; {levelInfo.rankTitle}
              </span>
              <span className="text-xs font-medium text-[#57534E]">
                {user.xp ?? 0} XP
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold text-[#1C1917] sm:text-3xl">
              {user.username}
            </h1>
            <p className="mt-0.5 text-sm text-[#57534E]">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded border border-[#DDD6C8] bg-[#FAF8F4] px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#1B5E3A]">{user.wins}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#57534E]">Wins</div>
            </div>
            <div className="rounded border border-[#DDD6C8] bg-[#FAF8F4] px-3.5 py-2 text-center">
              <div className="text-base font-bold text-red-700">{user.losses}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#57534E]">Losses</div>
            </div>
            <div className="rounded border border-[#DDD6C8] bg-[#FAF8F4] px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#7C4A2D]">{user.draws}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#57534E]">Draws</div>
            </div>
            <div className="rounded border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#1B5E3A]">{user.points ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#1B5E3A]">Points</div>
            </div>
            <div className="rounded border border-[#7C4A2D]/30 bg-[#7C4A2D]/10 px-3.5 py-2 text-center">
              <div className="text-base font-bold text-[#7C4A2D]">
                {formatUsd(user.walletCents ?? 0)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#7C4A2D]">Earned</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 rounded border border-[#D6CEC0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#F6F3EC]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-5 border-t border-[#EDE7DC] pt-4">
          <div className="flex items-center justify-between text-xs text-[#57534E]">
            <span>
              Next Level ({levelInfo.level + 1}): {user.xp ?? 0} / {levelInfo.nextThreshold} XP
            </span>
            <span className="font-medium text-[#1C1917]">
              Win: +100 pts &middot; Draw: +40 pts &middot; Loss: +15 pts
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded border border-[#DDD6C8] bg-[#F6F3EC]">
            <div
              className="h-full bg-[#1B5E3A] transition-all duration-300"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plugin Announcement Banner */}
      {bannerPlugin && bannerConfig.message && (
        <div className="mt-4 rounded border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 px-4 py-2.5 text-sm font-medium text-[#1B5E3A]">
          {bannerConfig.message}
        </div>
      )}

      {/* User Panel: Playing Arena Theme Selector */}
      <div className="mt-6 rounded border border-[#DDD6C8] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#1B5E3A]" />
            <h2 className="font-editorial text-lg font-bold text-[#1C1917]">
              Playing Arena Theme
            </h2>
          </div>
          <span className="text-xs text-[#57534E]">
            {savingTheme ? 'Saving preference...' : 'Choose your 2D board & arena style'}
          </span>
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
                    ? 'border-[#1B5E3A] bg-[#1B5E3A]/5 ring-1 ring-[#1B5E3A]'
                    : 'border-[#DDD6C8] bg-[#FAF8F4] hover:border-[#1B5E3A]/50'
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
                    <div className="text-sm font-semibold text-[#1C1917]">{t.name}</div>
                    <div className="text-[11px] text-[#57534E] line-clamp-1">
                      {t.description || 'Custom 2D arena theme'}
                    </div>
                  </div>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-[#1B5E3A]" />}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {redeemSuccess && (
        <div className="mt-6 rounded border border-[#1B5E3A]/40 bg-[#1B5E3A]/10 px-4 py-3 text-sm text-[#1B5E3A]">
          {redeemSuccess}
        </div>
      )}

      {/* Play Actions */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded border border-[#1B5E3A]/40 bg-white p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 text-[#1B5E3A]">
              <Swords className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#1C1917]">Auto Quick Match</h2>
            <p className="mt-2 text-sm text-[#57534E]">
              Automatically searches for an opponent and pairs you the moment
              another player is ready.
            </p>
          </div>
          <button
            onClick={handleToggleSearch}
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded border px-4 py-2.5 text-sm font-semibold transition ${
              searching
                ? 'border-amber-600/40 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border-[#14472B] bg-[#1B5E3A] text-white hover:bg-[#14472B]'
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

        <div className="flex flex-col justify-between rounded border border-[#DDD6C8] bg-white p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#DDD6C8] bg-[#F6F3EC] text-[#1C1917]">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#1C1917]">Create Game</h2>
            <p className="mt-2 text-sm text-[#57534E]">
              Generate a unique room code and share the invite link with a friend.
            </p>
          </div>
          <button
            onClick={handleCreateGame}
            disabled={creating}
            className="mt-6 w-full rounded border border-[#1C1917] bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#332E2A] disabled:opacity-50"
          >
            {creating ? 'Creating Room...' : 'Create Private Room'}
          </button>
        </div>

        <div className="flex flex-col justify-between rounded border border-[#DDD6C8] bg-white p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#DDD6C8] bg-[#F6F3EC] text-[#1C1917]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#1C1917]">Join Game</h2>
            <p className="mt-2 text-sm text-[#57534E]">
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
              className="min-w-0 flex-1 rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3.5 py-2 font-mono text-sm uppercase tracking-widest text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded border border-[#D6CEC0] bg-[#F6F3EC] px-4 py-2 text-sm font-semibold text-[#1C1917] transition hover:bg-[#EAE3D5]"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Earn Money from Points */}
      <div className="mt-8 rounded border border-[#DDD6C8] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE7DC] pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#1B5E3A]" />
            <div>
              <h2 className="text-lg font-bold text-[#1C1917]">
                Earn Money from Points
              </h2>
              <p className="text-xs text-[#57534E]">
                Rate: 100 Points = $0.10 &middot; Minimum cash-out: 500 Points ($0.50)
              </p>
            </div>
          </div>
          <div className="text-sm font-semibold text-[#1C1917]">
            Available: <span className="text-[#1B5E3A]">{user.points ?? 0} pts</span> (
            {formatUsd(Math.floor((user.points ?? 0) / 10))})
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleRedeem} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                  Points to Convert
                </label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                  className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1C1917] focus:border-[#1B5E3A] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1C1917] focus:border-[#1B5E3A] focus:outline-none"
                >
                  <option value="PayPal">PayPal</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Gift Card">Gift Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                Payout Email / Account
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="you@example.com or account ID"
                className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={redeeming || (user.points ?? 0) < 500}
              className="rounded border border-[#14472B] bg-[#1B5E3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14472B] disabled:opacity-50"
            >
              {redeeming
                ? 'Submitting...'
                : `Cash Out ${formatUsd(Math.floor(redeemPoints / 10))}`}
            </button>
          </form>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Your Payout Requests
            </h3>
            {payouts.length === 0 ? (
              <p className="mt-3 text-sm text-[#57534E]">
                No cash-out requests yet. Play matches to earn points!
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#EDE7DC] rounded border border-[#DDD6C8] bg-[#FAF8F4]">
                {payouts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#1C1917]">
                        {formatUsd(p.amountCents)}
                      </span>{' '}
                      <span className="text-[#57534E]">
                        ({p.pointsSpent} pts &middot; {p.payoutMethod})
                      </span>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 font-semibold ${
                        p.status === 'APPROVED'
                          ? 'border-[#1B5E3A]/30 bg-[#1B5E3A]/10 text-[#1B5E3A]'
                          : p.status === 'REJECTED'
                          ? 'border-red-300 bg-red-50 text-red-800'
                          : 'border-amber-600/30 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online Players & Match History */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-[#DDD6C8] bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1B5E3A]" />
              <h2 className="text-lg font-bold text-[#1C1917]">
                Online Players ({onlineUsers.length})
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B5E3A]">
              <span className="h-2 w-2 rounded-full bg-[#1B5E3A]" />
              Live
            </span>
          </div>

          {otherOnlineUsers.length === 0 ? (
            <p className="mt-4 text-sm text-[#57534E]">
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
                          : 'bg-[#1B5E3A]'
                      }`}
                    />
                    <span className="font-semibold text-[#1C1917]">
                      {online.username}
                    </span>
                    <span className="rounded border border-[#DDD6C8] bg-[#F6F3EC] px-2 py-0.5 text-[11px] font-medium text-[#57534E]">
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
                      className="rounded border border-[#14472B] bg-[#1B5E3A] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#14472B]"
                    >
                      Challenge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-[#DDD6C8] bg-white p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#1B5E3A]" />
            <h2 className="text-lg font-bold text-[#1C1917]">Recent Matches</h2>
          </div>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-[#57534E]">
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
                  badgeClass = 'border-[#1B5E3A]/30 bg-[#1B5E3A]/10 text-[#1B5E3A]';
                } else if (item.result !== 'DRAW') {
                  badge = 'Loss';
                  badgeClass = 'border-red-300 bg-red-50 text-red-800';
                }

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-[#1C1917]">vs {opponent}</span>
                      <span className="ml-2 text-xs text-[#57534E]">
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
