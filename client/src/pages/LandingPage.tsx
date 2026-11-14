import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C4A2D]">
            2D Online Chess Club
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[#1C1917] sm:text-5xl">
            Every move counts on the{' '}
            <span className="text-[#1B5E3A]">ChoiceCLASH</span> board.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#57534E]">
            A straightforward, distraction-free 2D chess table. Open a private
            room for a friend, queue into Quick Match, and keep a clean record
            of every game you play.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                to="/lobby"
                className="inline-flex items-center gap-2 rounded border border-[#14472B] bg-[#1B5E3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#14472B]"
              >
                Go to Lobby
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded border border-[#14472B] bg-[#1B5E3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#14472B]"
                >
                  Play Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="rounded border border-[#D6CEC0] bg-white px-6 py-3 text-sm font-semibold text-[#1C1917] transition hover:bg-[#EFEAE0]"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Flat 2D Decorative Chessboard Preview */}
        <div className="mx-auto w-full max-w-[340px] border-2 border-[#1C1917] bg-white p-2">
          <div className="grid aspect-square grid-cols-8 grid-rows-8 border border-[#1C1917]">
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
                    isDark ? 'bg-[#769656]' : 'bg-[#EEEED2]'
                  }`}
                >
                  {pieces[idx] ?? ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-20 grid gap-6 border-t border-[#DDD6C8] pt-12 sm:grid-cols-3">
        <div className="rounded border border-[#DDD6C8] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1B5E3A]">
            01 / Live Sync
          </p>
          <h3 className="mt-2 text-base font-bold text-[#1C1917]">
            Real-Time Multiplayer
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">
            Instant two-player turns over Socket.io with server-side move
            validation and checkmate detection.
          </p>
        </div>

        <div className="rounded border border-[#DDD6C8] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1B5E3A]">
            02 / Club Ledger
          </p>
          <h3 className="mt-2 text-base font-bold text-[#1C1917]">
            Match History
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">
            Every completed match updates your Wins, Losses, and Draws and saves
            the move notation.
          </p>
        </div>

        <div className="rounded border border-[#DDD6C8] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1B5E3A]">
            03 / Classic 2D
          </p>
          <h3 className="mt-2 text-base font-bold text-[#1C1917]">
            Clean 2D Board
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">
            Tournament green-and-cream 2D squares, captured material count,
            draw/resign controls, and table chat.
          </p>
        </div>
      </div>
    </div>
  );
}
