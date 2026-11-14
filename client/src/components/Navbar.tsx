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
    <header className="border-b border-[#2A313F] bg-[#11141B]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5"
        >
          <img
            src="/icon.svg"
            alt="ChoiceCLASH"
            className="h-8 w-8 rounded border border-[#D4AF37]/60"
          />
          <span className="font-editorial text-xl font-bold tracking-tight text-[#F5F0E6]">
            Choice<span className="text-[#D4AF37]">CLASH</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-3 sm:flex">
          <InstallAppButton />
          {user ? (
            <>
              <Link
                to="/lobby"
                className="inline-flex items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-sm font-medium text-[#F5F0E6] transition hover:border-[#2A313F] hover:bg-[#1B202A]"
              >
                <Trophy className="h-4 w-4 text-[#D4AF37]" />
                Lobby
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-sm font-medium text-[#F5E199] transition hover:bg-[#D4AF37]/20"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}

              <span className="text-sm text-[#9CA3AF]">
                Signed in as <strong className="text-[#F5F0E6]">{user.username}</strong>
              </span>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#151921] px-3 py-1.5 text-sm font-medium text-[#F5F0E6] transition hover:bg-[#1B202A]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded px-3.5 py-1.5 text-sm font-medium text-[#D1D5DB] transition hover:bg-[#1B202A] hover:text-[#F5F0E6]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded border border-[#B59124] bg-[#D4AF37] px-4 py-1.5 text-sm font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
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
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#2A313F] bg-[#151921] text-[#F5F0E6] sm:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-[#2A313F] bg-[#151921] px-4 py-3 sm:hidden">
          <div className="mb-2">
            <InstallAppButton
              className="w-full justify-center py-2"
              onAction={() => setMobileOpen(false)}
            />
          </div>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="pb-1 text-xs text-[#9CA3AF]">
                Signed in as <strong className="text-[#F5F0E6]">{user.username}</strong>
              </div>
              <Link
                to="/lobby"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-2 text-sm font-medium text-[#F5F0E6]"
              >
                <Trophy className="h-4 w-4 text-[#D4AF37]" />
                Lobby
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-sm font-medium text-[#F5E199]"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded border border-[#2A313F] bg-[#1B202A] px-3 py-2 text-left text-sm font-medium text-[#F5F0E6]"
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
                className="rounded border border-[#2A313F] bg-[#1B202A] px-3 py-2 text-center text-sm font-medium text-[#F5F0E6]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="rounded border border-[#B59124] bg-[#D4AF37] px-3 py-2 text-center text-sm font-semibold text-[#0D0F12]"
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
