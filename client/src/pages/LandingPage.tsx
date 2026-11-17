import { Download, Package, ShieldCheck, Smartphone } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded border border-[#E6B84C]/40 bg-[#112B20] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#E6B84C]">
            <span>&#9818;</span> Official Android Release
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[#F7F1E3] sm:text-5xl">
            Every move counts on the{' '}
            <span className="text-[#E6B84C]">ChoiceCLASH</span> app.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9CA3AF]">
            ChoiceCLASH is now exclusively playable on Android in our{' '}
            <strong className="text-[#F7F1E3]">Royal Emerald &amp; Ivory</strong>{' '}
            edition. Download the mobile app to play live online matches,
            challenge the built-in AI Coach, solve tactical puzzles, and switch
            between classic 2D and 3D boards.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/downloads/ChoiceCLASH.apk"
              download="ChoiceCLASH.apk"
              className="inline-flex items-center gap-2 rounded border border-[#B59124] bg-[#E6B84C] px-6 py-3.5 text-sm font-bold text-[#0B1F17] transition hover:bg-[#F2CB6B]"
            >
              <Download className="h-4 w-4" />
              Download Android APK
            </a>
            <a
              href="/downloads/ChoiceCLASH.aab"
              download="ChoiceCLASH.aab"
              className="inline-flex items-center gap-2 rounded border border-[#2E5D47] bg-[#112B20] px-6 py-3.5 text-sm font-semibold text-[#E6B84C] transition hover:border-[#E6B84C] hover:bg-[#17382A]"
            >
              <Package className="h-4 w-4" />
              Download AAB Bundle
            </a>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1.5 text-[#E6B84C]">
              <Smartphone className="h-3.5 w-3.5" />
              Android 8.0+ (2D &amp; 3D Support)
            </span>
            <span>&bull;</span>
            <span>ChoiceCLASH.apk (Direct Install)</span>
            <span>&bull;</span>
            <span>ChoiceCLASH.aab (Play Store Bundle)</span>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded border border-[#2A313F] bg-[#151921] px-3.5 py-2 text-xs text-[#9CA3AF]">
            <ShieldCheck className="h-4 w-4 text-[#4ADE80]" />
            Online web play is disabled on this site — install the Android APK to play online &amp; offline.
          </div>
        </div>

        {/* Royal Emerald & Ivory Chessboard Preview */}
        <div className="mx-auto w-full max-w-[340px] rounded border-2 border-[#E6B84C]/70 bg-[#112B20] p-2.5 shadow-2xl shadow-black/60">
          <div className="grid aspect-square grid-cols-8 grid-rows-8 border border-[#1E4635]">
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
                      ? 'bg-[#2E5D47] text-[#101C16]'
                      : 'bg-[#E9E3D0] text-[#101C16]'
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
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E6B84C]">
            01 / 2D &amp; 3D Perspective
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F7F1E3]">
            Switchable 3D Board
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Toggle seamlessly between classic 2D notation and a tilted 3D
            Staunton perspective inside every match.
          </p>
        </div>

        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E6B84C]">
            02 / AI Coach &amp; Puzzles
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F7F1E3]">
            Built-In Chess AI
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Play against 4 AI tiers, view the live Evaluation Bar, ask the AI
            Coach for plans, and review post-game accuracy.
          </p>
        </div>

        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E6B84C]">
            03 / Mobile Multiplayer
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F7F1E3]">
            Live Online Rooms
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Queue for Quick Match, create private room codes, and chat at the
            table directly from the Android app.
          </p>
        </div>
      </div>
    </div>
  );
}
