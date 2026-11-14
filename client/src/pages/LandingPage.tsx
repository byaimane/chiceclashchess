import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            <span>&#9818;</span> Grandmaster Chess Arena
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[#F5F0E6] sm:text-5xl">
            Every move counts on the{' '}
            <span className="text-[#D4AF37]">ChoiceCLASH</span> board.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9CA3AF]">
            A tournament-grade 2D &amp; 3D chess club. Open a private room for a
            friend, queue into Quick Match, and switch seamlessly between classic
            2D notation and a live 3D Staunton arena.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                to="/lobby"
                className="inline-flex items-center gap-2 rounded border border-[#B59124] bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
              >
                Go to Lobby
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded border border-[#B59124] bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
                >
                  Play Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="rounded border border-[#2A313F] bg-[#151921] px-6 py-3 text-sm font-semibold text-[#F5F0E6] transition hover:bg-[#1B202A]"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tournament Chessboard Preview */}
        <div className="mx-auto w-full max-w-[340px] rounded border-2 border-[#D4AF37]/70 bg-[#151921] p-2.5 shadow-2xl shadow-black/60">
          <div className="grid aspect-square grid-cols-8 grid-rows-8 border border-[#2A313F]">
            {Array.from({ length: 64 }).map((_, idx) => {
              const row = Math.floor(idx / 8);
              const col = idx % 8;
              const isDark = (row + col) % 2 === 1;
              const pieces: Record<number, string> = {
                0: '♜', 1: '♞', 2: '♝', 3: '♛', 4: '♚', 5: '♝', 6: '♞', 7: '♜',
                8: '♟', 9: '♟', 10: '♟', 11: '♟', 13: '♟', 14: '♟', 15: '♟',
                28: '♟', 36: '♙',
                48: '♙', 49: '♙', 50: '♙', 51: '♙', 53: '♙', 54: '♙', 55: '♙',
                56: '♖', 57: '♘', 58: '♗', 59: '♕', 60: '♔', 61: '♗', 62: '♘', 63: '♖',
              };
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center text-lg leading-none select-none ${
                    isDark
                      ? 'bg-[#8B5A2B] text-[#11141B]'
                      : 'bg-[#EADBC0] text-[#11141B]'
                  }`}
                >
                  {pieces[idx] ?? ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-20 grid gap-6 border-t border-[#2A313F] pt-12 sm:grid-cols-3">
        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            01 / Live Sync
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F5F0E6]">
            Real-Time Multiplayer
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Instant two-player turns over Socket.io with server-side move
            validation and checkmate detection.
          </p>
        </div>

        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            02 / Club Ledger
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F5F0E6]">
            Match History
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Every completed match updates your Wins, Losses, and Draws and saves
            the move notation.
          </p>
        </div>

        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            03 / 2D &amp; 3D Arena
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F5F0E6]">
            Switchable Perspectives
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Play on crisp 2D tournament boards or orbit a sculpted 3D Staunton
            arena with custom themes.
          </p>
        </div>
      </div>
    </div>
  );
}
