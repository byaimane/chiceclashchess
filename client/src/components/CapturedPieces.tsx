import type { PlayerColor } from '../types';

const INITIAL_COUNTS: Record<string, number> = {
  q: 1,
  r: 2,
  b: 2,
  n: 2,
  p: 8,
};

const PIECE_VALUES: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

function computeCaptured(fen: string) {
  const boardPart = fen.split(' ')[0] || '';
  const presentWhite: Record<string, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };
  const presentBlack: Record<string, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };

  for (const ch of boardPart) {
    const lower = ch.toLowerCase();
    if (!(lower in INITIAL_COUNTS)) continue;
    if (ch === ch.toUpperCase()) {
      presentWhite[lower] += 1;
    } else {
      presentBlack[lower] += 1;
    }
  }

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  let whiteScore = 0;
  let blackScore = 0;

  for (const piece of ['q', 'r', 'b', 'n', 'p']) {
    const missingBlack = Math.max(0, INITIAL_COUNTS[piece] - presentBlack[piece]);
    for (let i = 0; i < missingBlack; i++) {
      capturedByWhite.push(PIECE_SYMBOLS.b[piece]);
      whiteScore += PIECE_VALUES[piece];
    }

    const missingWhite = Math.max(0, INITIAL_COUNTS[piece] - presentWhite[piece]);
    for (let i = 0; i < missingWhite; i++) {
      capturedByBlack.push(PIECE_SYMBOLS.w[piece]);
      blackScore += PIECE_VALUES[piece];
    }
  }

  return {
    capturedByWhite,
    capturedByBlack,
    advantageWhite: whiteScore - blackScore,
  };
}

export function CapturedPieces({
  fen,
  forColor,
}: {
  fen: string;
  forColor: PlayerColor;
}) {
  const { capturedByWhite, capturedByBlack, advantageWhite } = computeCaptured(fen);
  const pieces = forColor === 'w' ? capturedByWhite : capturedByBlack;
  const advantage = forColor === 'w' ? advantageWhite : -advantageWhite;

  return (
    <div className="flex min-h-[24px] items-center gap-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-0.5 leading-none text-[#1C1917]">
        {pieces.length > 0 ? (
          pieces.map((symbol, idx) => (
            <span key={`${symbol}-${idx}`} className="text-base">
              {symbol}
            </span>
          ))
        ) : (
          <span className="text-xs text-[#78716C]">No captures</span>
        )}
      </div>
      {advantage > 0 && (
        <span className="rounded border border-[#DDD6C8] bg-[#F6F3EC] px-1.5 py-0.5 text-xs font-semibold text-[#1B5E3A]">
          +{advantage}
        </span>
      )}
    </div>
  );
}
