import {
  Ban,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatUsd } from '../lib/progression';
import type { PayoutRequest, User } from '../types';

interface AdminOverview {
  totalUsers: number;
  bannedUsers: number;
  totalGames: number;
  completedGames: number;
  pendingPayouts: number;
  activeRooms: number;
}

interface AdminGame {
  id: string;
  roomCode: string;
  status: string;
  result: string | null;
  endReason: string | null;
  createdAt: string;
  whitePlayer: { id: string; username: string } | null;
  blackPlayer: { id: string; username: string } | null;
}

interface ActiveRoomInfo {
  roomCode: string;
  status: string;
  moveCount: number;
  whiteUsername: string | null;
  blackUsername: string | null;
}

export function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'users' | 'games' | 'payouts'>('users');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [rooms, setRooms] = useState<ActiveRoomInfo[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStats, setEditStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    xp: 0,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, us, gm, rm, py] = await Promise.all([
        apiRequest<AdminOverview>('/api/admin/overview'),
        apiRequest<{ users: User[] }>('/api/admin/users'),
        apiRequest<{ games: AdminGame[] }>('/api/admin/games'),
        apiRequest<{ rooms: ActiveRoomInfo[] }>('/api/admin/rooms'),
        apiRequest<{ payouts: PayoutRequest[] }>('/api/admin/payouts'),
      ]);
      setOverview(ov);
      setUsers(us.users);
      setGames(gm.games);
      setRooms(rm.rooms);
      setPayouts(py.payouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleToggleBan = async (target: User) => {
    setError('');
    try {
      const res = await apiRequest<{ user: User }>(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isBanned: !target.isBanned }),
      });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? res.user : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ban status.');
    }
  };

  const handleToggleRole = async (target: User) => {
    setError('');
    const nextRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await apiRequest<{ user: User }>(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? res.user : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  const handleSaveStats = async (userId: string) => {
    setError('');
    try {
      const res = await apiRequest<{ user: User }>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(editStats),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stats.');
    }
  };

  const handleDeleteUser = async (target: User) => {
    if (!window.confirm(`Delete user "${target.username}"? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await apiRequest(`/api/admin/users/${target.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    setError('');
    try {
      await apiRequest(`/api/admin/games/${gameId}`, { method: 'DELETE' });
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game.');
    }
  };

  const handleCloseRoom = async (roomCode: string) => {
    setError('');
    try {
      await apiRequest(`/api/admin/rooms/${roomCode}`, { method: 'DELETE' });
      setRooms((prev) => prev.filter((r) => r.roomCode !== roomCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close room.');
    }
  };

  const handleProcessPayout = async (
    payoutId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    setError('');
    try {
      const res = await apiRequest<{ payout: PayoutRequest }>(
        `/api/admin/payouts/${payoutId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );
      setPayouts((prev) => prev.map((p) => (p.id === payoutId ? res.payout : p)));
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payout.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDD6C8] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C4A2D]">
            ChoiceCLASH Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#1C1917]">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[#57534E]">
            Signed in as {currentUser?.email}
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border border-[#D6CEC0] bg-white px-4 py-2 text-sm font-medium text-[#1C1917] transition hover:bg-[#EFEAE0]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Overview Stats */}
      {overview && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded border border-[#DDD6C8] bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-[#57534E]">Users</div>
            <div className="mt-1 text-2xl font-bold text-[#1C1917]">{overview.totalUsers}</div>
          </div>
          <div className="rounded border border-[#DDD6C8] bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-[#57534E]">Banned</div>
            <div className="mt-1 text-2xl font-bold text-red-700">{overview.bannedUsers}</div>
          </div>
          <div className="rounded border border-[#DDD6C8] bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-[#57534E]">Live Rooms</div>
            <div className="mt-1 text-2xl font-bold text-[#1B5E3A]">{overview.activeRooms}</div>
          </div>
          <div className="rounded border border-[#DDD6C8] bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-[#57534E]">Games</div>
            <div className="mt-1 text-2xl font-bold text-[#1C1917]">{overview.totalGames}</div>
          </div>
          <div className="rounded border border-[#DDD6C8] bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-[#57534E]">Completed</div>
            <div className="mt-1 text-2xl font-bold text-[#7C4A2D]">{overview.completedGames}</div>
          </div>
          <div className="rounded border border-[#DDD6C8] bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-[#57534E]">Pending Payouts</div>
            <div className="mt-1 text-2xl font-bold text-amber-800">{overview.pendingPayouts}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-[#DDD6C8]">
        <button
          onClick={() => setTab('users')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'users'
              ? 'border-[#1B5E3A] text-[#1B5E3A]'
              : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('games')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'games'
              ? 'border-[#1B5E3A] text-[#1B5E3A]'
              : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Shield className="h-4 w-4" />
          Games &amp; Rooms ({games.length})
        </button>
        <button
          onClick={() => setTab('payouts')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'payouts'
              ? 'border-[#1B5E3A] text-[#1B5E3A]'
              : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Payouts ({payouts.length})
        </button>
      </div>

      {tab === 'users' && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full max-w-sm rounded border border-[#D6CEC0] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded border border-[#DDD6C8] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#DDD6C8] bg-[#F6F3EC] text-xs uppercase tracking-wider text-[#57534E]">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Level / Pts</th>
                  <th className="px-4 py-3">W / L / D</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7DC]">
                {filteredUsers.map((u) => {
                  const isEditing = editingId === u.id;
                  const isPrimaryAdmin = u.email === 'admin@choiceclash.com';
                  return (
                    <tr key={u.id} className="hover:bg-[#FAF8F4]">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1C1917]">{u.username}</div>
                        <div className="text-xs text-[#57534E]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isPrimaryAdmin}
                          title={isPrimaryAdmin ? 'Primary admin' : 'Click to toggle role'}
                          className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                            u.role === 'ADMIN'
                              ? 'border-[#7C4A2D]/40 bg-[#7C4A2D]/10 text-[#7C4A2D]'
                              : 'border-[#DDD6C8] bg-[#F6F3EC] text-[#57534E]'
                          } disabled:cursor-not-allowed`}
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 px-2 py-0.5 text-xs font-semibold text-[#1B5E3A]">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-[#1C1917]">
                          Lv.{u.level ?? 1} &middot; {u.points ?? 0} pts
                        </div>
                        <div className="text-[#57534E]">
                          Earned {formatUsd(u.walletCents ?? 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={editStats.wins}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, wins: Number(e.target.value) }))
                              }
                              title="Wins"
                              className="w-12 rounded border border-[#D6CEC0] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.losses}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, losses: Number(e.target.value) }))
                              }
                              title="Losses"
                              className="w-12 rounded border border-[#D6CEC0] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.draws}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, draws: Number(e.target.value) }))
                              }
                              title="Draws"
                              className="w-12 rounded border border-[#D6CEC0] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.points}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, points: Number(e.target.value) }))
                              }
                              title="Points"
                              className="w-16 rounded border border-[#D6CEC0] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.xp}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, xp: Number(e.target.value) }))
                              }
                              title="XP"
                              className="w-16 rounded border border-[#D6CEC0] px-1.5 py-1"
                            />
                            <button
                              onClick={() => handleSaveStats(u.id)}
                              className="rounded bg-[#1B5E3A] px-2 py-1 text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded border border-[#D6CEC0] px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(u.id);
                              setEditStats({
                                wins: u.wins,
                                losses: u.losses,
                                draws: u.draws,
                                points: u.points ?? 0,
                                xp: u.xp ?? 0,
                              });
                            }}
                            className="rounded border border-transparent px-1.5 py-0.5 hover:border-[#DDD6C8] hover:bg-[#F6F3EC]"
                            title="Click to edit stats & points"
                          >
                            {u.wins} / {u.losses} / {u.draws}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBan(u)}
                            disabled={isPrimaryAdmin}
                            className="rounded border border-[#D6CEC0] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917] hover:bg-[#F6F3EC] disabled:opacity-40"
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isPrimaryAdmin}
                            className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'games' && (
        <div className="mt-6 space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-bold text-[#1C1917]">
              Live Rooms ({rooms.length})
            </h2>
            <div className="overflow-x-auto rounded border border-[#DDD6C8] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#DDD6C8] bg-[#F6F3EC] text-xs uppercase tracking-wider text-[#57534E]">
                  <tr>
                    <th className="px-4 py-3">Room Code</th>
                    <th className="px-4 py-3">Matchup</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Moves</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE7DC]">
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-[#78716C]">
                        No active rooms in memory.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((r) => (
                      <tr key={r.roomCode}>
                        <td className="px-4 py-3 font-mono font-semibold">{r.roomCode}</td>
                        <td className="px-4 py-3">
                          {r.whiteUsername ?? 'Open'} vs {r.blackUsername ?? 'Open'}
                        </td>
                        <td className="px-4 py-3 text-xs">{r.status}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.moveCount}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCloseRoom(r.roomCode)}
                            className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                          >
                            Close Room
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-[#1C1917]">
              Recorded Games ({games.length})
            </h2>
            <div className="overflow-x-auto rounded border border-[#DDD6C8] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#DDD6C8] bg-[#F6F3EC] text-xs uppercase tracking-wider text-[#57534E]">
                  <tr>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Players</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE7DC]">
                  {games.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-[#78716C]">
                        No games recorded yet.
                      </td>
                    </tr>
                  ) : (
                    games.map((g) => (
                      <tr key={g.id}>
                        <td className="px-4 py-3 font-mono font-semibold">{g.roomCode}</td>
                        <td className="px-4 py-3">
                          {g.whitePlayer?.username ?? 'Deleted'} vs{' '}
                          {g.blackPlayer?.username ?? 'Deleted'}
                        </td>
                        <td className="px-4 py-3 text-xs">{g.status}</td>
                        <td className="px-4 py-3 text-xs">
                          {g.result ?? '—'} {g.endReason ? `(${g.endReason})` : ''}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteGame(g.id)}
                            className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'payouts' && (
        <div className="mt-6 overflow-x-auto rounded border border-[#DDD6C8] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DDD6C8] bg-[#F6F3EC] text-xs uppercase tracking-wider text-[#57534E]">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method &amp; Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE7DC]">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-[#78716C]">
                    No payout requests submitted yet.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1C1917]">
                        {p.user?.username ?? 'Unknown'}
                      </div>
                      <div className="text-xs text-[#57534E]">{p.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1B5E3A]">
                        {formatUsd(p.amountCents)}
                      </div>
                      <div className="text-xs text-[#57534E]">{p.pointsSpent} pts</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-[#1C1917]">{p.payoutMethod}</div>
                      <div className="text-[#57534E]">{p.destination}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{p.status}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'PENDING' ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleProcessPayout(p.id, 'APPROVED')}
                            className="rounded border border-[#14472B] bg-[#1B5E3A] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#14472B]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessPayout(p.id, 'REJECTED')}
                            className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#78716C]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
