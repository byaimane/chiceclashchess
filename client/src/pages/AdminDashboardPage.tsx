import {
  Ban,
  CheckCircle2,
  Palette,
  Plug,
  Plus,
  RefreshCw,
  Shield,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import type { ArenaTheme, PluginItem, User } from '../types';

interface AdminOverview {
  totalUsers: number;
  bannedUsers: number;
  totalGames: number;
  completedGames: number;
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
  const [tab, setTab] = useState<'users' | 'games' | 'themes' | 'plugins'>('users');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [rooms, setRooms] = useState<ActiveRoomInfo[]>([]);
  const [themes, setThemes] = useState<ArenaTheme[]>([]);
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [newTheme, setNewTheme] = useState({
    name: '',
    description: '',
    lightSquare: '#EEEED2',
    darkSquare: '#769656',
    boardBorder: '#1C1917',
    arenaBg: '#F6F3EC',
    accentColor: '#1B5E3A',
  });

  const [newPlugin, setNewPlugin] = useState({
    name: '',
    slug: '',
    category: 'gameplay',
    version: '1.0.0',
    description: '',
    configJson: '{}',
  });
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, string>>({});

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
      const [ov, us, gm, rm, th, pl] = await Promise.all([
        apiRequest<AdminOverview>('/api/admin/overview'),
        apiRequest<{ users: User[] }>('/api/admin/users'),
        apiRequest<{ games: AdminGame[] }>('/api/admin/games'),
        apiRequest<{ rooms: ActiveRoomInfo[] }>('/api/admin/rooms'),
        apiRequest<{ themes: ArenaTheme[] }>('/api/admin/themes'),
        apiRequest<{ plugins: PluginItem[] }>('/api/admin/plugins'),
      ]);
      setOverview(ov);
      setUsers(us.users);
      setGames(gm.games);
      setRooms(rm.rooms);
      setThemes(th.themes);
      setPlugins(pl.plugins);
      setPluginConfigs(
        Object.fromEntries(pl.plugins.map((item) => [item.id, item.configJson || '{}']))
      );
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

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A313F] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C4A2D]">
            ChoiceCLASH Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#F5F0E6]">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Signed in as {currentUser?.email}
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border border-[#2A313F] bg-[#151921] px-4 py-2 text-sm font-medium text-[#F5F0E6] transition hover:bg-[#232A36]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Overview Stats */}
      {overview && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded border border-[#2A313F] bg-[#151921] p-4">
            <div className="text-xs uppercase tracking-wider text-[#9CA3AF]">Users</div>
            <div className="mt-1 text-2xl font-bold text-[#F5F0E6]">{overview.totalUsers}</div>
          </div>
          <div className="rounded border border-[#2A313F] bg-[#151921] p-4">
            <div className="text-xs uppercase tracking-wider text-[#9CA3AF]">Banned</div>
            <div className="mt-1 text-2xl font-bold text-red-700">{overview.bannedUsers}</div>
          </div>
          <div className="rounded border border-[#2A313F] bg-[#151921] p-4">
            <div className="text-xs uppercase tracking-wider text-[#9CA3AF]">Live Rooms</div>
            <div className="mt-1 text-2xl font-bold text-[#D4AF37]">{overview.activeRooms}</div>
          </div>
          <div className="rounded border border-[#2A313F] bg-[#151921] p-4">
            <div className="text-xs uppercase tracking-wider text-[#9CA3AF]">Games</div>
            <div className="mt-1 text-2xl font-bold text-[#F5F0E6]">{overview.totalGames}</div>
          </div>
          <div className="rounded border border-[#2A313F] bg-[#151921] p-4">
            <div className="text-xs uppercase tracking-wider text-[#9CA3AF]">Completed</div>
            <div className="mt-1 text-2xl font-bold text-[#7C4A2D]">{overview.completedGames}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-[#2A313F]">
        <button
          onClick={() => setTab('users')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'users'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F5F0E6]'
          }`}
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('games')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'games'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F5F0E6]'
          }`}
        >
          <Shield className="h-4 w-4" />
          Games &amp; Rooms ({games.length})
        </button>
        <button
          onClick={() => setTab('themes')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'themes'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F5F0E6]'
          }`}
        >
          <Palette className="h-4 w-4" />
          Themes ({themes.length})
        </button>
        <button
          onClick={() => setTab('plugins')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'plugins'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F5F0E6]'
          }`}
        >
          <Plug className="h-4 w-4" />
          Plugins ({plugins.length})
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
              className="w-full max-w-sm rounded border border-[#2A313F] bg-[#151921] px-3.5 py-2 text-sm text-[#F5F0E6] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded border border-[#2A313F] bg-[#151921]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#2A313F] bg-[#1B202A] text-xs uppercase tracking-wider text-[#9CA3AF]">
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
                    <tr key={u.id} className="hover:bg-[#0D0F12]">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#F5F0E6]">{u.username}</div>
                        <div className="text-xs text-[#9CA3AF]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isPrimaryAdmin}
                          title={isPrimaryAdmin ? 'Primary admin' : 'Click to toggle role'}
                          className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                            u.role === 'ADMIN'
                              ? 'border-[#7C4A2D]/40 bg-[#7C4A2D]/10 text-[#7C4A2D]'
                              : 'border-[#2A313F] bg-[#1B202A] text-[#9CA3AF]'
                          } disabled:cursor-not-allowed`}
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-950/50 px-2 py-0.5 text-xs font-semibold text-red-200">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-[#F5F0E6]">
                          Lv.{u.level ?? 1} &middot; {u.points ?? 0} pts
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
                              className="w-12 rounded border border-[#2A313F] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.losses}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, losses: Number(e.target.value) }))
                              }
                              title="Losses"
                              className="w-12 rounded border border-[#2A313F] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.draws}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, draws: Number(e.target.value) }))
                              }
                              title="Draws"
                              className="w-12 rounded border border-[#2A313F] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.points}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, points: Number(e.target.value) }))
                              }
                              title="Points"
                              className="w-16 rounded border border-[#2A313F] px-1.5 py-1"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editStats.xp}
                              onChange={(e) =>
                                setEditStats((s) => ({ ...s, xp: Number(e.target.value) }))
                              }
                              title="XP"
                              className="w-16 rounded border border-[#2A313F] px-1.5 py-1"
                            />
                            <button
                              onClick={() => handleSaveStats(u.id)}
                              className="rounded bg-[#D4AF37] px-2 py-1 text-[#0D0F12]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded border border-[#2A313F] px-2 py-1"
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
                            className="rounded border border-transparent px-1.5 py-0.5 hover:border-[#2A313F] hover:bg-[#1B202A]"
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
                            className="rounded border border-[#2A313F] bg-[#151921] px-2.5 py-1 text-xs font-medium text-[#F5F0E6] hover:bg-[#1B202A] disabled:opacity-40"
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isPrimaryAdmin}
                            className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-950/50 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-100 disabled:opacity-40"
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
            <h2 className="mb-3 text-lg font-bold text-[#F5F0E6]">
              Live Rooms ({rooms.length})
            </h2>
            <div className="overflow-x-auto rounded border border-[#2A313F] bg-[#151921]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#2A313F] bg-[#1B202A] text-xs uppercase tracking-wider text-[#9CA3AF]">
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
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-[#6B7280]">
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
                            className="rounded border border-red-500/40 bg-red-950/50 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-100"
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
            <h2 className="mb-3 text-lg font-bold text-[#F5F0E6]">
              Recorded Games ({games.length})
            </h2>
            <div className="overflow-x-auto rounded border border-[#2A313F] bg-[#151921]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#2A313F] bg-[#1B202A] text-xs uppercase tracking-wider text-[#9CA3AF]">
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
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-[#6B7280]">
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
                            className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-950/50 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-100"
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

      {tab === 'themes' && (
        <div className="mt-6 space-y-6">
          {/* Create Theme Form */}
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              setError('');
              try {
                await apiRequest('/api/admin/themes', {
                  method: 'POST',
                  body: JSON.stringify(newTheme),
                });
                setNewTheme({
                  name: '',
                  description: '',
                  lightSquare: '#EEEED2',
                  darkSquare: '#769656',
                  boardBorder: '#1C1917',
                  arenaBg: '#F6F3EC',
                  accentColor: '#1B5E3A',
                });
                await loadAll();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create theme.');
              }
            }}
            className="rounded border border-[#2A313F] bg-[#151921] p-5"
          >
            <h2 className="font-editorial text-lg font-bold text-[#F5F0E6]">
              Add New Arena Theme
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Create custom 2D board and arena color themes that players can select in their User Panel.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF]">Theme Name</label>
                <input
                  type="text"
                  required
                  value={newTheme.name}
                  onChange={(e) => setNewTheme((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Emerald Classic"
                  className="mt-1 w-full rounded border border-[#2A313F] px-3 py-2 text-sm text-[#F5F0E6]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#9CA3AF]">Description</label>
                <input
                  type="text"
                  value={newTheme.description}
                  onChange={(e) => setNewTheme((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short description for players"
                  className="mt-1 w-full rounded border border-[#2A313F] px-3 py-2 text-sm text-[#F5F0E6]"
                />
              </div>
              {(
                [
                  ['lightSquare', 'Light Square'],
                  ['darkSquare', 'Dark Square'],
                  ['boardBorder', 'Board Border'],
                  ['arenaBg', 'Arena Background'],
                  ['accentColor', 'Accent Color'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#9CA3AF]">{label}</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={newTheme[field]}
                      onChange={(e) => setNewTheme((p) => ({ ...p, [field]: e.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded border border-[#2A313F] bg-[#151921] p-0.5"
                    />
                    <input
                      type="text"
                      value={newTheme[field]}
                      onChange={(e) => setNewTheme((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full rounded border border-[#2A313F] px-2.5 py-1.5 font-mono text-xs text-[#F5F0E6]"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-end gap-3">
                <div
                  className="grid h-10 w-10 shrink-0 grid-cols-2 grid-rows-2 border-2"
                  style={{ borderColor: newTheme.boardBorder }}
                >
                  <div style={{ backgroundColor: newTheme.lightSquare }} />
                  <div style={{ backgroundColor: newTheme.darkSquare }} />
                  <div style={{ backgroundColor: newTheme.darkSquare }} />
                  <div style={{ backgroundColor: newTheme.lightSquare }} />
                </div>
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0D0F12] hover:bg-[#E5C158]"
                >
                  <Plus className="h-4 w-4" />
                  Add Theme
                </button>
              </div>
            </div>
          </form>

          {/* Themes List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded border border-[#2A313F] bg-[#151921] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 shrink-0 grid-cols-2 grid-rows-2 border-2"
                      style={{ borderColor: t.boardBorder }}
                    >
                      <div style={{ backgroundColor: t.lightSquare }} />
                      <div style={{ backgroundColor: t.darkSquare }} />
                      <div style={{ backgroundColor: t.darkSquare }} />
                      <div style={{ backgroundColor: t.lightSquare }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-[#F5F0E6]">
                        {t.name}
                        {t.isDefault && (
                          <span className="rounded bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">{t.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE7DC] pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/admin/themes/${t.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ isActive: !t.isActive }),
                        });
                        await loadAll();
                      }}
                      className={`rounded border px-2.5 py-1 text-xs font-semibold ${
                        t.isActive
                          ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-[#2A313F] bg-[#1B202A] text-[#9CA3AF]'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Hidden'}
                    </button>
                    {!t.isDefault && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/admin/themes/${t.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ isDefault: true }),
                          });
                          await loadAll();
                        }}
                        className="inline-flex items-center gap-1 rounded border border-[#2A313F] bg-[#151921] px-2.5 py-1 text-xs font-medium text-[#F5F0E6] hover:bg-[#0D0F12]"
                      >
                        <Star className="h-3 w-3" />
                        Set Default
                      </button>
                    )}
                  </div>
                  {!t.isDefault && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/admin/themes/${t.id}`, { method: 'DELETE' });
                        await loadAll();
                      }}
                      className="rounded border border-red-300 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                      title="Delete theme"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plugins' && (
        <div className="mt-6 space-y-6">
          {/* Add Plugin Form */}
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              setError('');
              try {
                await apiRequest('/api/admin/plugins', {
                  method: 'POST',
                  body: JSON.stringify(newPlugin),
                });
                setNewPlugin({
                  name: '',
                  slug: '',
                  category: 'gameplay',
                  version: '1.0.0',
                  description: '',
                  configJson: '{}',
                });
                await loadAll();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to add plugin.');
              }
            }}
            className="rounded border border-[#2A313F] bg-[#151921] p-5"
          >
            <h2 className="font-editorial text-lg font-bold text-[#F5F0E6]">
              Register Integrated Plugin
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Add and configure platform plugins (UI modules, sound effects, banners, or gameplay extensions).
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF]">Plugin Name</label>
                <input
                  type="text"
                  required
                  value={newPlugin.name}
                  onChange={(e) => setNewPlugin((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Tournament Clock"
                  className="mt-1 w-full rounded border border-[#2A313F] px-3 py-2 text-sm text-[#F5F0E6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF]">Slug (optional)</label>
                <input
                  type="text"
                  value={newPlugin.slug}
                  onChange={(e) => setNewPlugin((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="tournament-clock"
                  className="mt-1 w-full rounded border border-[#2A313F] px-3 py-2 font-mono text-sm text-[#F5F0E6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF]">Category</label>
                <select
                  value={newPlugin.category}
                  onChange={(e) => setNewPlugin((p) => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#2A313F] bg-[#151921] px-3 py-2 text-sm text-[#F5F0E6]"
                >
                  <option value="gameplay">gameplay</option>
                  <option value="ui">ui</option>
                  <option value="moderation">moderation</option>
                  <option value="analytics">analytics</option>
                  <option value="payments">payments</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF]">Version</label>
                <input
                  type="text"
                  value={newPlugin.version}
                  onChange={(e) => setNewPlugin((p) => ({ ...p, version: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#2A313F] px-3 py-2 font-mono text-sm text-[#F5F0E6]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#9CA3AF]">Description</label>
                <input
                  type="text"
                  value={newPlugin.description}
                  onChange={(e) => setNewPlugin((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What this plugin integrates or controls"
                  className="mt-1 w-full rounded border border-[#2A313F] px-3 py-2 text-sm text-[#F5F0E6]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#9CA3AF]">Config JSON</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newPlugin.configJson}
                    onChange={(e) => setNewPlugin((p) => ({ ...p, configJson: e.target.value }))}
                    className="w-full rounded border border-[#2A313F] px-3 py-2 font-mono text-xs text-[#F5F0E6]"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0D0F12] hover:bg-[#E5C158]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Plugin
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Plugins List */}
          <div className="grid gap-4 md:grid-cols-2">
            {plugins.map((pl) => (
              <div
                key={pl.id}
                className="flex flex-col justify-between rounded border border-[#2A313F] bg-[#151921] p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F5F0E6]">{pl.name}</span>
                        <span className="rounded border border-[#2A313F] bg-[#1B202A] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#9CA3AF]">
                          {pl.category} · v{pl.version}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#9CA3AF]">{pl.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/admin/plugins/${pl.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ enabled: !pl.enabled }),
                        });
                        await loadAll();
                      }}
                      className={`shrink-0 rounded border px-2.5 py-1 text-xs font-semibold ${
                        pl.enabled
                          ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-[#2A313F] bg-[#1B202A] text-[#9CA3AF]'
                      }`}
                    >
                      {pl.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Plugin Configuration (JSON)
                    </label>
                    <textarea
                      rows={2}
                      value={pluginConfigs[pl.id] ?? pl.configJson}
                      onChange={(e) =>
                        setPluginConfigs((prev) => ({ ...prev, [pl.id]: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-[#2A313F] bg-[#0D0F12] p-2 font-mono text-xs text-[#F5F0E6]"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EDE7DC] pt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      try {
                        await apiRequest(`/api/admin/plugins/${pl.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({
                            configJson: pluginConfigs[pl.id] ?? pl.configJson,
                          }),
                        });
                        await loadAll();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Invalid JSON config.');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0D0F12] hover:bg-[#E5C158]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Config
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/api/admin/plugins/${pl.id}`, { method: 'DELETE' });
                      await loadAll();
                    }}
                    className="rounded border border-red-300 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                    title="Delete plugin"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
