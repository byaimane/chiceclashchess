import { Box, CheckCircle2, Download, Package, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

const APK_URL = 'https://choiceclash.vercel.app/downloads/ChoiceCLASH.apk';

export function LandingPage() {
  const [preview3d, setPreview3d] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded border border-[#E6B84C]/40 bg-[#112B20] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#E6B84C]">
            <span>&#9818;</span> Official Android Release &bull; v1.3.1
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[#F7F1E3] sm:text-5xl">
            Every move counts on the{' '}
            <span className="text-[#E6B84C]">ChoiceCLASH</span> app.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9CA3AF]">
            ChoiceCLASH is exclusively playable on Android in our{' '}
            <strong className="text-[#F7F1E3]">Royal Emerald &amp; Ivory</strong>{' '}
            edition. Download the release-signed app for the 12-stage{' '}
            <strong className="text-[#F7F1E3]">Royal Odyssey Adventure Map</strong>,
            live online matches, AI Coach, Blitz &amp; Rapid clocks, tactical puzzles,
            and switchable 2D &amp; 3D boards.
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
              Android 8.0+ (Release Signed)
            </span>
            <span>&bull;</span>
            <span>2D &amp; 3D Support</span>
            <span>&bull;</span>
            <span>AI + Online Multiplayer</span>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded border border-[#2A313F] bg-[#151921] px-3.5 py-2 text-xs text-[#9CA3AF]">
            <ShieldCheck className="h-4 w-4 text-[#4ADE80]" />
            Online web play is disabled on this site — install the Android APK to play online &amp; offline.
          </div>
        </div>

        {/* Interactive 2D / 3D Royal Emerald & Ivory Chessboard Preview */}
        <div className="mx-auto flex w-full max-w-[350px] flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E6B84C]">
              <Box className="h-3.5 w-3.5" />
              App Board Preview
            </span>
            <div className="inline-flex rounded border border-[#2E5D47] bg-[#112B20] p-0.5">
              <button
                type="button"
                onClick={() => setPreview3d(false)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  !preview3d
                    ? 'bg-[#E6B84C] text-[#0B1F17]'
                    : 'text-[#9CA3AF] hover:text-[#F7F1E3]'
                }`}
              >
                2D
              </button>
              <button
                type="button"
                onClick={() => setPreview3d(true)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  preview3d
                    ? 'bg-[#E6B84C] text-[#0B1F17]'
                    : 'text-[#9CA3AF] hover:text-[#F7F1E3]'
                }`}
              >
                3D
              </button>
            </div>
          </div>

          <div
            className="w-full transition-transform duration-500"
            style={{
              perspective: '900px',
            }}
          >
            <div
              className="w-full rounded border-2 border-[#E6B84C]/70 bg-[#112B20] p-2.5 shadow-2xl shadow-black/70 transition-transform duration-500"
              style={{
                transform: preview3d ? 'rotateX(24deg) scale(0.96)' : 'rotateX(0deg) scale(1)',
                transformStyle: 'preserve-3d',
              }}
            >
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
                      <span
                        className="transition-transform duration-500"
                        style={{
                          transform: preview3d ? 'translateY(-2px) scaleY(1.12)' : 'none',
                          textShadow: preview3d ? '0 3px 4px rgba(0,0,0,0.45)' : 'none',
                        }}
                      >
                        {pieces[idx] ?? ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {preview3d && (
              <div className="mx-auto h-2.5 w-[94%] rounded-b border-x border-b border-[#E6B84C]/40 bg-gradient-to-b from-[#1E4635] to-[#06130E]" />
            )}
          </div>
        </div>
      </div>

      {/* QR Code + Quick Install Guide */}
      <div className="mt-16 grid gap-6 rounded-xl border border-[#2E5D47] bg-[#112B20]/70 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-[#E6B84C]/40 bg-[#F7F1E3] p-3">
          <QRCodeSVG
            value={APK_URL}
            size={120}
            bgColor="#F7F1E3"
            fgColor="#0B1F17"
            level="M"
          />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B1F17]">
            <QrCode className="h-3.5 w-3.5" />
            Scan to Download
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#E6B84C]/15 px-2.5 py-0.5 text-xs font-bold text-[#E6B84C]">
              Quick Android Install Guide
            </span>
            <span className="text-xs text-[#9CA3AF]">v1.3.1 &bull; Release Build</span>
          </div>
          <h2 className="text-xl font-bold text-[#F7F1E3]">
            Install ChoiceCLASH on Your Phone in 3 Steps
          </h2>
          <div className="grid gap-3 pt-1 sm:grid-cols-3">
            <div className="rounded border border-[#1E4635] bg-[#0B1F17]/70 p-3 text-xs text-[#9CA3AF]">
              <p className="font-bold text-[#E6B84C]">1. Download APK</p>
              <p className="mt-1">Tap &ldquo;Download Android APK&rdquo; or scan the QR code with your phone camera.</p>
            </div>
            <div className="rounded border border-[#1E4635] bg-[#0B1F17]/70 p-3 text-xs text-[#9CA3AF]">
              <p className="font-bold text-[#E6B84C]">2. Allow Install</p>
              <p className="mt-1">Open the downloaded file and allow &ldquo;Install unknown apps&rdquo; when prompted.</p>
            </div>
            <div className="rounded border border-[#1E4635] bg-[#0B1F17]/70 p-3 text-xs text-[#9CA3AF]">
              <p className="inline-flex items-center gap-1 font-bold text-[#4ADE80]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                3. Play 2D &amp; 3D
              </p>
              <p className="mt-1">Launch ChoiceCLASH for the Royal Odyssey Map, AI Coach, Puzzles &amp; Online rooms.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mt-16 grid gap-6 border-t border-[#2A313F] pt-12 sm:grid-cols-3">
        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E6B84C]">
            01 / 2D &amp; 3D Perspective
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F7F1E3]">
            Switchable 3D Board
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Toggle seamlessly between classic 2D notation and a tilted 3D
            Staunton perspective with sound effects &amp; haptics.
          </p>
        </div>

        <div className="rounded border border-[#2A313F] bg-[#151921] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E6B84C]">
            02 / Royal Odyssey Map
          </p>
          <h3 className="mt-2 text-base font-bold text-[#F7F1E3]">
            12-Stage Adventure Campaign
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Travel across 4 realms and unlock new locations, timed blitz
            ambushes, realm bosses &amp; 3-star mastery every time you win.
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
