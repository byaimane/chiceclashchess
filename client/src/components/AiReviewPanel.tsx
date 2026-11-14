import { AlertTriangle, Award, Brain, CheckCircle2, Sparkles, Target, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GameReviewReport, MoveClassification } from '../lib/chessAi';

interface AiReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  report: GameReviewReport | null;
  isAnalyzing?: boolean;
}

const CLASS_BADGE: Record<
  MoveClassification,
  { label: string; bg: string; text: string; border: string }
> = {
  best: {
    label: 'Best',
    bg: 'bg-[#10B981]/15',
    text: 'text-[#34D399]',
    border: 'border-[#10B981]/40',
  },
  good: {
    label: 'Good',
    bg: 'bg-[#3B82F6]/15',
    text: 'text-[#93C5FD]',
    border: 'border-[#3B82F6]/40',
  },
  inaccuracy: {
    label: 'Inaccuracy',
    bg: 'bg-[#F59E0B]/15',
    text: 'text-[#FCD34D]',
    border: 'border-[#F59E0B]/40',
  },
  mistake: {
    label: 'Mistake',
    bg: 'bg-[#F97316]/15',
    text: 'text-[#FDBA74]',
    border: 'border-[#F97316]/40',
  },
  blunder: {
    label: 'Blunder',
    bg: 'bg-[#EF4444]/15',
    text: 'text-[#FCA5A5]',
    border: 'border-[#EF4444]/40',
  },
};

export function AiReviewPanel({
  isOpen,
  onClose,
  report,
  isAnalyzing = false,
}: AiReviewPanelProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-[#14171F] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A313F] bg-[#11141B] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Brain className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="font-editorial text-xl font-bold text-[#F5F0E6]">
              Post-Game AI Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#2A313F] bg-[#1B202A] p-1.5 text-[#9CA3AF] transition hover:text-[#F5F0E6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {isAnalyzing || !report ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Sparkles className="h-8 w-8 animate-pulse text-[#D4AF37]" />
              <p className="mt-3 text-sm font-medium text-[#F5F0E6]">
                Analyzing every move with the ChoiceCLASH Engine...
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Calculating centipawn swings, turning points, and accuracy.
              </p>
            </div>
          ) : (
            <>
              {/* Accuracy Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#2A313F] bg-[#191D26] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    White Accuracy
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#F5F0E6]">
                      {report.whiteAccuracy}%
                    </span>
                    <span className="text-xs text-[#D4AF37]">
                      {report.counts.w.best} best · {report.counts.w.blunder} blunders
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2A313F] bg-[#191D26] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Black Accuracy
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#F5F0E6]">
                      {report.blackAccuracy}%
                    </span>
                    <span className="text-xs text-[#D4AF37]">
                      {report.counts.b.best} best · {report.counts.b.blunder} blunders
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Coach Summary */}
              <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5E199]">
                  <Award className="h-4 w-4 text-[#D4AF37]" />
                  AI Coach Summary
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#F5F0E6]">
                  {report.coachSummary}
                </p>
                {report.opening && (
                  <p className="mt-2 text-xs text-[#D1D5DB]">
                    <span className="font-semibold text-[#F5E199]">
                      {report.opening.eco} {report.opening.name}:
                    </span>{' '}
                    {report.opening.idea}
                  </p>
                )}
              </div>

              {/* Turning Point */}
              {report.turningPoint && report.turningPoint.cpLoss >= 60 && (
                <div className="rounded-lg border border-[#F97316]/40 bg-[#F97316]/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FDBA74]">
                    <AlertTriangle className="h-4 w-4" />
                    Key Turning Point — Move {report.turningPoint.moveNumber}
                    {report.turningPoint.color === 'w' ? '.' : '...'} {report.turningPoint.san}
                  </div>
                  <p className="mt-1.5 text-sm text-[#F5F0E6]">
                    {report.turningPoint.comment}
                  </p>
                </div>
              )}

              {/* Mistake Puzzles CTA */}
              {report.mistakePuzzles.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A313F] bg-[#191D26] p-4">
                  <div className="flex items-center gap-2.5">
                    <Target className="h-5 w-5 text-[#D4AF37]" />
                    <div>
                      <div className="text-sm font-semibold text-[#F5F0E6]">
                        {report.mistakePuzzles.length} Mistake
                        {report.mistakePuzzles.length > 1 ? 's' : ''} Saved to Your Trainer
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        Practice finding the winning move from this match.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/puzzles?tab=mistakes');
                    }}
                    className="rounded border border-[#B59124] bg-[#D4AF37] px-3.5 py-2 text-xs font-semibold text-[#0D0F12] transition hover:bg-[#E5C158]"
                  >
                    Retry Your Mistakes
                  </button>
                </div>
              )}

              {/* Move-by-Move Breakdown */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Move-by-Move Analysis ({report.moves.length} plies)
                </h3>
                <div className="max-h-64 divide-y divide-[#2A313F] overflow-y-auto rounded-lg border border-[#2A313F] bg-[#11141B]">
                  {report.moves.map((m) => {
                    const badge = CLASS_BADGE[m.classification];
                    return (
                      <div
                        key={m.ply}
                        className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-10 text-xs font-mono text-[#9CA3AF]">
                            {m.moveNumber}
                            {m.color === 'w' ? '.' : '...'}
                          </span>
                          <span className="w-14 font-semibold text-[#F5F0E6]">
                            {m.san}
                          </span>
                          <span
                            className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] sm:max-w-md sm:text-right">
                          {m.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#2A313F] bg-[#11141B] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded border border-[#2A313F] bg-[#1B202A] px-4 py-2 text-xs font-semibold text-[#F5F0E6] transition hover:bg-[#232936]"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#D4AF37]" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
