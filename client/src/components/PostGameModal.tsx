import { Award, Handshake, RotateCcw } from 'lucide-react';
import type { GameOverPayload } from '../types';

const REASON_LABELS: Record<string, string> = {
  checkmate: 'by Checkmate',
  resignation: 'by Resignation',
  draw_agreement: 'by Mutual Agreement',
  stalemate: 'by Stalemate',
  threefold_repetition: 'by Threefold Repetition',
  insufficient_material: 'by Insufficient Material',
  fifty_move_rule: 'by Fifty-Move Rule',
};

export function PostGameModal({
  gameOver,
  currentUserId,
  yourColor,
  onReturnToLobby,
  onClose,
}: {
  gameOver: GameOverPayload;
  currentUserId: string;
  yourColor?: 'w' | 'b' | null;
  onReturnToLobby: () => void;
  onClose: () => void;
}) {
  const isDraw = gameOver.result === 'DRAW';
  const didWin = gameOver.winnerId === currentUserId;
  const reasonText = REASON_LABELS[gameOver.reason] || gameOver.reason;
  const earnedPts =
    yourColor === 'w'
      ? gameOver.pointsAwarded?.white
      : yourColor === 'b'
      ? gameOver.pointsAwarded?.black
      : undefined;

  let title = 'Game Over';
  let subtitle = '';
  if (isDraw) {
    title = 'Draw';
    subtitle = `Game ended in a draw ${reasonText}.`;
  } else if (didWin) {
    title = 'Victory';
    subtitle = `You won ${reasonText}. Your club record has been updated.`;
  } else {
    title = `${gameOver.winnerUsername ?? 'Opponent'} Wins`;
    subtitle = `Game ended ${reasonText}.`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4">
      <div className="w-full max-w-md rounded border border-[#1C1917] bg-white p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded border border-[#DDD6C8] bg-[#F6F3EC] text-[#1B5E3A]">
          {isDraw ? (
            <Handshake className="h-6 w-6" />
          ) : (
            <Award className="h-6 w-6" />
          )}
        </div>
        <h2 className="text-center text-2xl font-bold text-[#1C1917]">{title}</h2>
        <p className="mt-2 text-center text-sm text-[#57534E]">{subtitle}</p>
        {earnedPts !== undefined && (
          <div className="mx-auto mt-3 w-fit rounded border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 px-3 py-1 text-xs font-semibold text-[#1B5E3A]">
            +{earnedPts} Points &amp; XP earned
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            onClick={onReturnToLobby}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-[#14472B] bg-[#1B5E3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14472B]"
          >
            <RotateCcw className="h-4 w-4" />
            Back to Lobby
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-[#D6CEC0] bg-[#F6F3EC] px-4 py-2.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#EAE3D5]"
          >
            Review Board
          </button>
        </div>
      </div>
    </div>
  );
}
