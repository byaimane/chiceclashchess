import { useEffect, useRef } from 'react';

export function MoveHistory({ history }: { history: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length]);

  const pairs: Array<{ moveNumber: number; white: string; black?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="flex h-48 flex-col rounded border border-[#2A313F] bg-[#151921]">
      <div className="border-b border-[#2A313F] bg-[#1B202A] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
        Move Sheet
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 text-sm">
        {pairs.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#6B7280]">
            No moves recorded yet.
          </p>
        ) : (
          <div className="space-y-1">
            {pairs.map((pair) => (
              <div
                key={pair.moveNumber}
                className="grid grid-cols-[2.2rem_1fr_1fr] items-center rounded px-1.5 py-0.5 font-mono text-xs odd:bg-[#1B202A]"
              >
                <span className="text-[#6B7280]">{pair.moveNumber}.</span>
                <span className="font-semibold text-[#F5F0E6]">{pair.white}</span>
                <span className="font-medium text-[#D1D5DB]">{pair.black ?? ''}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
