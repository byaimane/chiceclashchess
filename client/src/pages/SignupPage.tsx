import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/lobby" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(username.trim(), email.trim(), password);
      navigate('/lobby', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded border border-[#DDD6C8] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#1C1917]">Join ChoiceCLASH</h1>
        <p className="mt-1.5 text-sm text-[#57534E]">
          Register a player handle to start playing live 2D chess.
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="club_player"
              className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded border border-[#14472B] bg-[#1B5E3A] py-2.5 text-sm font-semibold text-white transition hover:bg-[#14472B] disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#57534E]">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#1B5E3A] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
