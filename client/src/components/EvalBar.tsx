import { PositionEvaluation } from '../lib/chessAi';

interface EvalBarProps {
  evaluation: PositionEvaluation;
  orientation?: 'white' | 'black';
}

export function EvalBar({ evaluation, orientation = 'white' }: EvalBarProps) {
  const whitePct = evaluation.whiteAdvantagePct;
  const whiteWinning = evaluation.scoreCp >= 0;

  // Vertical bar for desktop (side of board)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative flex h-[340px] w-7 flex-col overflow-hidden rounded border border-[#2A313F] bg-[#14171F] shadow-inner sm:h-[440px]"
        title={`Evaluation: ${evaluation.displayScore}`}
      >
        {orientation === 'white' ? (
          <>
            {/* Black portion on top */}
            <div
              className="w-full bg-[#1C212C] transition-all duration-300"
              style={{ height: `${100 - whitePct}%` }}
            />
            {/* White portion on bottom */}
            <div
              className="w-full bg-gradient-to-t from-[#E5DEC9] to-[#F5F0E6] transition-all duration-300"
              style={{ height: `${whitePct}%` }}
            />
          </>
        ) : (
          <>
            {/* White portion on top when flipped */}
            <div
              className="w-full bg-gradient-to-b from-[#E5DEC9] to-[#F5F0E6] transition-all duration-300"
              style={{ height: `${whitePct}%` }}
            />
            <div
              className="w-full bg-[#1C212C] transition-all duration-300"
              style={{ height: `${100 - whitePct}%` }}
            />
          </>
        )}

        {/* Score badge */}
        <span
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 rounded px-1 py-0.5 text-[10px] font-bold tracking-tight ${
            whiteWinning
              ? orientation === 'white'
                ? 'bottom-1.5 bg-[#0D0F12]/80 text-[#F5F0E6]'
                : 'top-1.5 bg-[#0D0F12]/80 text-[#F5F0E6]'
              : orientation === 'white'
              ? 'top-1.5 bg-[#F5F0E6]/90 text-[#0D0F12]'
              : 'bottom-1.5 bg-[#F5F0E6]/90 text-[#0D0F12]'
          }`}
        >
          {evaluation.displayScore}
        </span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
        Eval
      </span>
    </div>
  );
}
