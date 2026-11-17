package com.choiceclash.chess.chess

data class OpeningInfo(
  val eco: String,
  val name: String,
  val idea: String,
  val moves: List<String>,
)

object OpeningsBook {
  private val openings = listOf(
    OpeningInfo("C50", "Italian Game: Giuoco Piano", "Rapidly develops pieces toward f7 and contests the center.", listOf("e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5")),
    OpeningInfo("C55", "Italian Game: Two Knights", "Black counterattacks e4 immediately instead of mirroring Bc5.", listOf("e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6")),
    OpeningInfo("C50", "Italian Game", "Targets the vulnerable f7 square and prepares fast castling.", listOf("e4", "e5", "Nf3", "Nc6", "Bc4")),
    OpeningInfo("C65", "Ruy Lopez: Berlin Defense", "Solid endgame-oriented defense putting pressure on e4.", listOf("e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6")),
    OpeningInfo("C70", "Ruy Lopez: Morphy Defense", "Questions the bishop immediately to gain queenside space.", listOf("e4", "e5", "Nf3", "Nc6", "Bb5", "a6")),
    OpeningInfo("C60", "Ruy Lopez (Spanish)", "Applies long-term pressure on the c6 knight defending e5.", listOf("e4", "e5", "Nf3", "Nc6", "Bb5")),
    OpeningInfo("C45", "Scotch Game", "Opens the center early to seize space and active piece play.", listOf("e4", "e5", "Nf3", "Nc6", "d4")),
    OpeningInfo("C42", "Petrov Defense", "Symmetrical counterattack on White's e4 pawn.", listOf("e4", "e5", "Nf3", "Nf6")),
    OpeningInfo("B90", "Sicilian Defense: Najdorf", "Sharp, ambitious counterattacking system controlling b5.", listOf("e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6")),
    OpeningInfo("B70", "Sicilian Defense: Dragon", "Fianchettoes the dark-squared bishop on g7.", listOf("e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6")),
    OpeningInfo("B20", "Sicilian Defense", "Fights for central imbalance from move one.", listOf("e4", "c5")),
    OpeningInfo("C00", "French Defense", "Solid structure preparing ...d5 to challenge e4.", listOf("e4", "e6")),
    OpeningInfo("B10", "Caro-Kann Defense", "Ultra-solid defense supporting ...d5 without blocking c8.", listOf("e4", "c6")),
    OpeningInfo("B01", "Scandinavian Defense", "Immediately challenges White's e4 pawn for open lines.", listOf("e4", "d5")),
    OpeningInfo("D37", "Queen's Gambit Declined", "Classical struggle for central control and piece harmony.", listOf("d4", "d5", "c4", "e6")),
    OpeningInfo("D10", "Slav Defense", "Supports d5 with c6 while keeping the c8 bishop free.", listOf("d4", "d5", "c4", "c6")),
    OpeningInfo("D06", "Queen's Gambit", "Offers c4 to deflect Black from the d5 central square.", listOf("d4", "d5", "c4")),
    OpeningInfo("D02", "London System", "Reliable pyramid setup with Bf4 and e3.", listOf("d4", "d5", "Bf4")),
    OpeningInfo("E60", "King's Indian Defense", "Dynamic counterattacking setup aiming for ...e5.", listOf("d4", "Nf6", "c4", "g6")),
    OpeningInfo("A10", "English Opening", "Flexible flank opening exerting long-term pressure on d5.", listOf("c4")),
    OpeningInfo("C20", "King's Pawn Game", "Classical opening staking an immediate claim in the center.", listOf("e4")),
    OpeningInfo("D00", "Queen's Pawn Game", "Solid central control with long-term strategic focus.", listOf("d4")),
  )

  fun detect(history: List<String>): OpeningInfo? {
    if (history.isEmpty()) return null
    var best: OpeningInfo? = null
    for (op in openings) {
      if (history.size < op.moves.size) continue
      if (op.moves.indices.all { history[it] == op.moves[it] }) {
        if (best == null || op.moves.size > best.moves.size) best = op
      }
    }
    return best
  }
}
