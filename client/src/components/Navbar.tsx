import { LogOut, Menu, Shield, Trophy, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InstallAppButton } from './InstallAppButton';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-[#DDD6C8] bg-[#FFFFFF]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5"
        >
          <img
            src="/icon.svg"
            alt="ChoiceCLASH"
            className="h-8 w-8 rounded border border-[#1C1917]"
          />
          <span className="font-editorial text-xl font-bold tracking-tight text-[#1C1917]">
            Choice<span className="text-[#1B5E3A]">CLASH</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-3 sm:flex">
          <InstallAppButton />
          {user ? (
            <>
              <Link
                to="/lobby"
                className="inline-flex items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-sm font-medium text-[#1C1917] transition hover:border-[#DDD6C8] hover:bg-[#F6F3EC]"
              >
                <Trophy className="h-4 w-4 text-[#1B5E3A]" />
                Lobby
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded border border-[#7C4A2D]/30 bg-[#7C4A2D]/10 px-3 py-1.5 text-sm font-medium text-[#7C4A2D] transition hover:bg-[#7C4A2D]/15"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}

              <span className="text-sm text-[#57534E]">
                Signed in as <strong className="text-[#1C1917]">{user.username}</strong>
              </span>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded border border-[#D6CEC0] bg-white px-3 py-1.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#F6F3EC]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded px-3.5 py-1.5 text-sm font-medium text-[#44403C] transition hover:bg-[#F6F3EC] hover:text-[#1C1917]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded border border-[#14472B] bg-[#1B5E3A] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#14472B]"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#D6CEC0] bg-white text-[#1C1917] sm:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-[#DDD6C8] bg-[#FAF8F4] px-4 py-3 sm:hidden">
          <div className="mb-2">
            <InstallAppButton
              className="w-full justify-center py-2"
              onAction={() => setMobileOpen(false)}
            />
          </div>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="pb-1 text-xs text-[#57534E]">
                Signed in as <strong className="text-[#1C1917]">{user.username}</strong>
              </div>
              <Link
                to="/lobby"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 rounded border border-[#DDD6C8] bg-white px-3 py-2 text-sm font-medium text-[#1C1917]"
              >
                <Trophy className="h-4 w-4 text-[#1B5E3A]" />
                Lobby
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-2 rounded border border-[#7C4A2D]/30 bg-[#7C4A2D]/10 px-3 py-2 text-sm font-medium text-[#7C4A2D]"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded border border-[#D6CEC0] bg-white px-3 py-2 text-left text-sm font-medium text-[#1C1917]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded border border-[#D6CEC0] bg-white px-3 py-2 text-center text-sm font-medium text-[#1C1917]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="rounded border border-[#14472B] bg-[#1B5E3A] px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
