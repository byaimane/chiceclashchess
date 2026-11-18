import { Download, Shield, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-[#2A313F] bg-[#11141B]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt="ChoiceCLASH"
            className="h-8 w-8 rounded border border-[#D4AF37]/60"
          />
          <span className="font-editorial text-xl font-bold tracking-tight text-[#F5F0E6]">
            Choice<span className="text-[#D4AF37]">CLASH</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-[#9CA3AF] sm:inline-flex">
            <Smartphone className="h-3.5 w-3.5 text-[#E6B84C]" />
            Android App Only
          </span>
          <a
            href="/downloads/ChoiceCLASH.apk"
            download="ChoiceCLASH.apk"
            className="inline-flex items-center gap-1.5 rounded border border-[#B59124] bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158] sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Download APK
          </a>
          <a
            href="/downloads/ChoiceCLASH.aab"
            download="ChoiceCLASH.aab"
            className="hidden rounded border border-[#2E5D47] bg-[#112B20] px-3 py-1.5 text-xs font-semibold text-[#E6B84C] transition hover:border-[#E6B84C] sm:inline-flex sm:text-sm"
          >
            AAB
          </a>
          {user?.role === 'ADMIN' ? (
            <>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1.5 text-xs font-semibold text-[#F5E199] transition hover:bg-[#D4AF37]/20"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded border border-[#2A313F] px-2.5 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F5F0E6]"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 rounded border border-[#2A313F] px-2.5 py-1.5 text-xs font-medium text-[#9CA3AF] transition hover:border-[#D4AF37]/40 hover:text-[#F5F0E6]"
              title="Admin Dashboard"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
