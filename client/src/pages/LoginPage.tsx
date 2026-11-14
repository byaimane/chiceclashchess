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
      <div className="w-full rounded border border-[#DDD6C8] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#1C1917]">Log in to ChoiceCLASH</h1>
        <p className="mt-1.5 text-sm text-[#57534E]">
          Enter your email or username to step into the lobby.
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="player@example.com"
              className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded border border-[#14472B] bg-[#1B5E3A] py-2.5 text-sm font-semibold text-white transition hover:bg-[#14472B] disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#57534E]">
          New to ChoiceCLASH?{' '}
          <Link to="/signup" className="font-semibold text-[#1B5E3A] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
