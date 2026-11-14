export interface OpeningInfo {
  eco: string;
  name: string;
  idea: string;
  moves: string[];
}

const OPENINGS: OpeningInfo[] = [
  { eco: 'C50', name: 'Italian Game: Giuoco Piano', idea: 'Rapidly develops pieces toward f7 and contests the center.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
  { eco: 'C55', name: 'Italian Game: Two Knights Defense', idea: 'Black counterattacks e4 immediately instead of mirroring Bc5.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { eco: 'C50', name: 'Italian Game', idea: 'Targets the vulnerable f7 square and prepares fast castling.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', idea: 'Solid endgame-oriented defense putting pressure on e4.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
  { eco: 'C70', name: 'Ruy Lopez: Morphy Defense', idea: 'Questions the bishop immediately to gain queenside space.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'] },
  { eco: 'C60', name: 'Ruy Lopez (Spanish Opening)', idea: 'Applies long-term pressure on the c6 knight defending e5.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { eco: 'C45', name: 'Scotch Game', idea: 'Opens the center early to seize space and active piece play.', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { eco: 'C42', name: 'Petrov Defense', idea: 'Symmetrical counterattack on White’s e4 pawn.', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
  { eco: 'C41', name: 'Philidor Defense', idea: 'Solid pawn chain supporting e5, though slightly passive.', moves: ['e4', 'e5', 'Nf3', 'd6'] },
  { eco: 'C25', name: 'Vienna Game', idea: 'Flexible development preparing f4 or Bc4 without committing Nf3.', moves: ['e4', 'e5', 'Nc3'] },
  { eco: 'C30', name: "King's Gambit", idea: 'Aggressive pawn sacrifice to open the f-file and dominate the center.', moves: ['e4', 'e5', 'f4'] },
  { eco: 'C23', name: "Bishop's Opening", idea: 'Direct focus on f7 while keeping the f-pawn free to advance.', moves: ['e4', 'e5', 'Bc4'] },
  { eco: 'B90', name: 'Sicilian Defense: Najdorf', idea: 'Sharp, ambitious counterattacking system controlling b5 and preparing ...e5.', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
  { eco: 'B70', name: 'Sicilian Defense: Dragon', idea: 'Fianchettoes the dark-squared bishop on g7 to slice across the board.', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
  { eco: 'B33', name: 'Sicilian Defense: Sveshnikov / Open', idea: 'Asymmetrical battle where Black fights for the c-file and central counterplay.', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4'] },
  { eco: 'B23', name: 'Sicilian Defense: Closed', idea: 'Steers away from sharp mainlines toward a slow kingside attack.', moves: ['e4', 'c5', 'Nc3'] },
  { eco: 'B22', name: 'Sicilian Defense: Alapin', idea: 'Prepares d4 with c3 to build a strong central pawn duo.', moves: ['e4', 'c5', 'c3'] },
  { eco: 'B20', name: 'Sicilian Defense', idea: 'Fights for central imbalance from move one by trading a flank pawn for d4.', moves: ['e4', 'c5'] },
  { eco: 'C02', name: 'French Defense: Advance', idea: 'Locks the center and gives White a space advantage; Black targets d4.', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
  { eco: 'C00', name: 'French Defense', idea: 'Solid, resilient structure preparing ...d5 to challenge e4.', moves: ['e4', 'e6'] },
  { eco: 'B12', name: 'Caro-Kann Defense: Advance', idea: 'Gains space for White while Black keeps the light-squared bishop active.', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { eco: 'B10', name: 'Caro-Kann Defense', idea: 'Ultra-solid defense supporting ...d5 without blocking the c8 bishop.', moves: ['e4', 'c6'] },
  { eco: 'B01', name: 'Scandinavian Defense', idea: 'Immediately challenges White’s e4 pawn for open central lines.', moves: ['e4', 'd5'] },
  { eco: 'B07', name: 'Pirc Defense', idea: 'Hypermodern setup inviting White to build a center before striking at it.', moves: ['e4', 'd6', 'd4', 'Nf6'] },
  { eco: 'B02', name: "Alekhine's Defense", idea: 'Lures White’s pawns forward to overextend and target them later.', moves: ['e4', 'Nf6'] },
  { eco: 'D37', name: "Queen's Gambit Declined", idea: 'Classical struggle for central control and solid piece harmony.', moves: ['d4', 'd5', 'c4', 'e6'] },
  { eco: 'D10', name: 'Slav Defense', idea: 'Supports d5 with c6 while keeping the c8 bishop free.', moves: ['d4', 'd5', 'c4', 'c6'] },
  { eco: 'D20', name: "Queen's Gambit Accepted", idea: 'Surrenders the center temporarily for rapid, open piece development.', moves: ['d4', 'd5', 'c4', 'dxc4'] },
  { eco: 'D06', name: "Queen's Gambit", idea: 'Offers the c4 flank pawn to deflect Black from the d5 central square.', moves: ['d4', 'd5', 'c4'] },
  { eco: 'D02', name: 'London System', idea: 'Reliable, solid pyramid setup with Bf4 and e3.', moves: ['d4', 'd5', 'Bf4'] },
  { eco: 'D00', name: 'London System (vs Nf6)', idea: 'Consistent piece-development system resistant to early traps.', moves: ['d4', 'Nf6', 'Bf4'] },
  { eco: 'E20', name: 'Nimzo-Indian Defense', idea: 'Pins the c3 knight to control e4 and create structural imbalances.', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { eco: 'E60', name: "King's Indian Defense", idea: 'Dynamic counterattacking setup aiming for ...e5 and a kingside storm.', moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { eco: 'D80', name: 'Grünfeld Defense', idea: 'Strikes at White’s broad pawn center with ...d5 and fianchettoed pressure.', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },
  { eco: 'A57', name: 'Benko Gambit', idea: 'Long-term positional pawn sacrifice for queenside file pressure.', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5'] },
  { eco: 'A45', name: 'Indian Defense', idea: 'Flexible hypermodern response restraining e4.', moves: ['d4', 'Nf6'] },
  { eco: 'A80', name: 'Dutch Defense', idea: 'Asymmetrical fight for the e4 square and kingside attacking chances.', moves: ['d4', 'f5'] },
  { eco: 'A20', name: 'English Opening: Reversed Sicilian', idea: 'Controls d5 from the flank and leads to rich positional battles.', moves: ['c4', 'e5'] },
  { eco: 'A10', name: 'English Opening', idea: 'Flexible flank opening exerting long-term pressure on d5.', moves: ['c4'] },
  { eco: 'A06', name: 'Réti Opening', idea: 'Hypermodern control of e5 and d4 before committing central pawns.', moves: ['Nf3', 'd5'] },
  { eco: 'A04', name: 'Zukertort / Réti System', idea: 'Flexible knight development keeping all pawn structures open.', moves: ['Nf3'] },
  { eco: 'C20', name: "King's Pawn Game", idea: 'Classical opening staking an immediate claim in the center.', moves: ['e4'] },
  { eco: 'D00', name: "Queen's Pawn Game", idea: 'Solid central control with long-term strategic focus.', moves: ['d4'] },
];

export function detectOpening(history: string[]): OpeningInfo | null {
  if (!history || history.length === 0) return null;
  let bestMatch: OpeningInfo | null = null;
  for (const opening of OPENINGS) {
    if (history.length < opening.moves.length) continue;
    let matches = true;
    for (let i = 0; i < opening.moves.length; i++) {
      if (history[i] !== opening.moves[i]) {
        matches = false;
        break;
      }
    }
    if (matches && (!bestMatch || opening.moves.length > bestMatch.moves.length)) {
      bestMatch = opening;
    }
  }
  return bestMatch;
}
