import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/lobby';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/lobby'} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded border border-[#2A313F] bg-[#151921] p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-[#F5F0E6]">Log in to ChoiceCLASH</h1>
        <p className="mt-1.5 text-sm text-[#9CA3AF]">
          Enter your email or username to step into the lobby.
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="player@example.com"
              className="w-full rounded border border-[#2A313F] bg-[#0D0F12] px-3.5 py-2.5 text-sm text-[#F5F0E6] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded border border-[#2A313F] bg-[#0D0F12] px-3.5 py-2.5 text-sm text-[#F5F0E6] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded border border-[#B59124] bg-[#D4AF37] py-2.5 text-sm font-semibold text-[#0D0F12] transition hover:bg-[#E5C158] disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9CA3AF]">
          New to ChoiceCLASH?{' '}
          <Link to="/signup" className="font-semibold text-[#D4AF37] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
