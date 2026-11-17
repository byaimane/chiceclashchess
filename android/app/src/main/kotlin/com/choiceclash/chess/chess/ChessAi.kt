package com.choiceclash.chess.chess

import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.random.Random

enum class AiDifficulty(val label: String, val elo: String, val depth: Int) {
  NOVICE("Novice", "~650 ELO", 1),
  CLUB("Club", "~1200 ELO", 2),
  MASTER("Master", "~1800 ELO", 3),
  GRANDMASTER("Grandmaster", "~2200+ ELO", 3),
}

enum class AiPersonality(val label: String) {
  BALANCED("Balanced"),
  AGGRESSIVE("Tactician"),
  POSITIONAL("Strategist"),
}

enum class MoveClassification(val label: String) {
  BEST("Best"),
  GOOD("Good"),
  INACCURACY("Inaccuracy"),
  MISTAKE("Mistake"),
  BLUNDER("Blunder"),
}

data class PositionEvaluation(
  val scoreCp: Int,
  val displayScore: String,
  val whiteAdvantagePct: Float,
)

data class AiMoveResult(
  val move: ChessMove,
  val san: String,
  val evalCp: Int,
  val explanation: String,
)

data class MoveReviewItem(
  val ply: Int,
  val moveNumber: Int,
  val color: PieceColor,
  val san: String,
  val bestMoveSan: String,
  val bestFrom: String,
  val bestTo: String,
  val fenBefore: String,
  val cpLoss: Int,
  val classification: MoveClassification,
  val comment: String,
)

data class MistakePuzzle(
  val id: String,
  val fen: String,
  val playerColor: PieceColor,
  val playedSan: String,
  val bestSan: String,
  val bestFrom: String,
  val bestTo: String,
  val theme: String,
  val explanation: String,
  val solved: Boolean = false,
)

data class GameReviewReport(
  val moves: List<MoveReviewItem>,
  val whiteAccuracy: Double,
  val blackAccuracy: Double,
  val opening: OpeningInfo?,
  val turningPoint: MoveReviewItem?,
  val coachSummary: String,
  val mistakePuzzles: List<MistakePuzzle>,
)

object ChessAiEngine {
  private val pawnPst = intArrayOf(
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 27, 27, 10, 5, 5,
    0, 0, 0, 24, 24, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -22, -22, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  )

  private val knightPst = intArrayOf(
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  )

  private val bishopPst = intArrayOf(
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  )

  private val rookPst = intArrayOf(
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  )

  private val queenPst = intArrayOf(
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  )

  private val kingPst = intArrayOf(
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  )

  private fun pstBonus(piece: ChessPiece, idx: Int): Int {
    val row = idx / 8
    val col = idx % 8
    val r = if (piece.color == PieceColor.WHITE) row else 7 - row
    val pIdx = r * 8 + col
    return when (piece.type) {
      PieceType.PAWN -> pawnPst[pIdx]
      PieceType.KNIGHT -> knightPst[pIdx]
      PieceType.BISHOP -> bishopPst[pIdx]
      PieceType.ROOK -> rookPst[pIdx]
      PieceType.QUEEN -> queenPst[pIdx]
      PieceType.KING -> kingPst[pIdx]
    }
  }

  fun evaluateStatic(board: ChessBoard, personality: AiPersonality = AiPersonality.BALANCED): Int {
    if (board.isCheckmate()) {
      return if (board.turn == PieceColor.WHITE) -99000 else 99000
    }
    if (board.isStalemate() || board.isInsufficientMaterial()) return 0

    var score = 0
    for (i in 0 until 64) {
      val piece = board.squares[i] ?: continue
      var v = piece.type.valueCp + pstBonus(piece, i)
      val row = i / 8
      val col = i % 8
      if (personality == AiPersonality.AGGRESSIVE && piece.type != PieceType.KING && piece.type != PieceType.PAWN) {
        val adv = if (piece.color == PieceColor.WHITE) 7 - row else row
        v += adv * 4
      } else if (personality == AiPersonality.POSITIONAL && row in 2..5 && col in 2..5) {
        v += 8
      }
      score += if (piece.color == PieceColor.WHITE) v else -v
    }
    if (board.inCheck()) {
      score += if (board.turn == PieceColor.WHITE) -35 else 35
    }
    return score
  }

  fun evaluatePosition(board: ChessBoard): PositionEvaluation {
    val cp = evaluateStatic(board)
    val display = when {
      cp >= 90000 -> "M"
      cp <= -90000 -> "-M"
      else -> {
        val pawns = cp / 100.0
        if (pawns >= 0) "+${"%.1f".format(pawns)}" else "${"%.1f".format(pawns)}"
      }
    }
    val clamped = max(-1200, min(1200, cp))
    val pct = (0.5f + (clamped / 1200f) * 0.45f).coerceIn(0.05f, 0.95f)
    return PositionEvaluation(cp, display, pct)
  }

  private fun orderMoves(moves: List<ChessMove>, personality: AiPersonality): List<ChessMove> {
    return moves.sortedByDescending { m ->
      var s = 0
      if (m.captured != null) {
        s += 10 * m.captured.type.valueCp - m.piece.type.valueCp
        if (personality == AiPersonality.AGGRESSIVE) s += 80
      }
      if (m.promotion != null) s += m.promotion.valueCp + 500
      if (m.isCastleKingside || m.isCastleQueenside) {
        s += if (personality == AiPersonality.POSITIONAL) 95 else 50
      }
      s
    }
  }

  private fun alphabeta(
    board: ChessBoard,
    depth: Int,
    alphaInit: Int,
    betaInit: Int,
    maximizingWhite: Boolean,
    personality: AiPersonality,
    deadlineMs: Long,
  ): Int {
    if (System.currentTimeMillis() > deadlineMs) return evaluateStatic(board, personality)
    if (board.isCheckmate()) return if (board.turn == PieceColor.WHITE) -99000 - depth * 100 else 99000 + depth * 100
    if (board.isStalemate() || board.isInsufficientMaterial()) return 0
    if (depth <= 0) return evaluateStatic(board, personality)

    var alpha = alphaInit
    var beta = betaInit
    val moves = orderMoves(board.legalMoves(), personality)

    if (maximizingWhite) {
      var best = Int.MIN_VALUE
      for (m in moves) {
        val next = board.applyMoveUnchecked(m)
        val ev = alphabeta(next, depth - 1, alpha, beta, false, personality, deadlineMs)
        if (ev > best) best = ev
        if (ev > alpha) alpha = ev
        if (beta <= alpha) break
      }
      return best
    } else {
      var best = Int.MAX_VALUE
      for (m in moves) {
        val next = board.applyMoveUnchecked(m)
        val ev = alphabeta(next, depth - 1, alpha, beta, true, personality, deadlineMs)
        if (ev < best) best = ev
        if (ev < beta) beta = ev
        if (beta <= alpha) break
      }
      return best
    }
  }

  fun explainMove(boardBefore: ChessBoard, move: ChessMove, san: String): String {
    val next = boardBefore.applyMoveUnchecked(move)
    if (next.isCheckmate()) return "Checkmate! $san delivers the winning blow."
    val reasons = mutableListOf<String>()
    if (move.isCastleKingside || move.isCastleQueenside) {
      reasons.add("tucks the king to safety and connects the rooks")
    }
    if (move.promotion != null) {
      reasons.add("promotes the pawn to a ${move.promotion.label}")
    }
    if (move.captured != null) {
      if (move.captured.type.valueCp > move.piece.type.valueCp) {
        reasons.add("wins material by capturing the ${move.captured.type.label}")
      } else {
        reasons.add("captures the ${move.captured.type.label} on ${move.toSquare}")
      }
    }
    if (san.contains("+")) {
      reasons.add("checks the opponent king to seize initiative")
    }
    val central = setOf("d4", "d5", "e4", "e5", "c4", "c5")
    if (move.toSquare in central && move.captured == null) {
      reasons.add("claims central control on ${move.toSquare}")
    }
    if (reasons.isEmpty()) {
      reasons.add("improves the ${move.piece.type.label}'s position to ${move.toSquare}")
    }
    return "$san ${reasons.take(2).joinToString(" and ")}."
  }

  fun getBestMove(
    board: ChessBoard,
    difficulty: AiDifficulty = AiDifficulty.CLUB,
    personality: AiPersonality = AiPersonality.BALANCED,
  ): AiMoveResult? {
    val legal = orderMoves(board.legalMoves(), personality)
    if (legal.isEmpty()) return null

    val maxWhite = board.turn == PieceColor.WHITE
    var depth = difficulty.depth
    if (difficulty == AiDifficulty.GRANDMASTER && board.squares.count { it != null } <= 10) {
      depth = 4
    }
    val budgetMs = when (difficulty) {
      AiDifficulty.GRANDMASTER -> 950L
      AiDifficulty.MASTER -> 650L
      else -> 350L
    }
    val deadline = System.currentTimeMillis() + budgetMs

    val scored = legal.map { m ->
      val next = board.applyMoveUnchecked(m)
      val sc = alphabeta(next, depth - 1, -1000000, 1000000, !maxWhite, personality, deadline)
      m to sc
    }.sortedBy { if (maxWhite) -it.second else it.second }

    val chosen = if (difficulty == AiDifficulty.NOVICE && scored.size > 1 && Random.nextFloat() < 0.45f) {
      scored[Random.nextInt(min(3, scored.size))]
    } else {
      scored.first()
    }

    val san = board.toSan(chosen.first)
    val nextBoard = board.applyMoveUnchecked(chosen.first)
    val evalAfter = evaluateStatic(nextBoard)
    return AiMoveResult(
      move = chosen.first,
      san = san,
      evalCp = evalAfter,
      explanation = explainMove(board, chosen.first, san),
    )
  }

  private fun classifyCpLoss(cpLoss: Int): MoveClassification = when {
    cpLoss <= 18 -> MoveClassification.BEST
    cpLoss <= 55 -> MoveClassification.GOOD
    cpLoss <= 130 -> MoveClassification.INACCURACY
    cpLoss <= 260 -> MoveClassification.MISTAKE
    else -> MoveClassification.BLUNDER
  }

  private fun cpLossToAccuracy(avgLoss: Double): Double {
    val raw = 100.0 * exp(-0.0038 * max(0.0, avgLoss))
    return ((raw.coerceIn(12.0, 99.5)) * 10.0).roundToInt() / 10.0
  }

  fun analyzeGameHistory(history: List<String>): GameReviewReport {
    var board = ChessBoard.start()
    val opening = OpeningsBook.detect(history)
    val items = mutableListOf<MoveReviewItem>()
    val mistakes = mutableListOf<MistakePuzzle>()

    var wLoss = 0
    var wCount = 0
    var bLoss = 0
    var bCount = 0
    var turningPoint: MoveReviewItem? = null
    var maxSwing = -1

    for (idx in history.indices) {
      val san = history[idx]
      val fenBefore = board.toFen()
      val color = board.turn
      val moveNumber = idx / 2 + 1

      val best = getBestMove(board, AiDifficulty.CLUB, AiPersonality.BALANCED)
      val played = board.moveFromSan(san) ?: break
      val nextBoard = played.second
      val evalAfter = evaluateStatic(nextBoard)
      val bestEval = best?.evalCp ?: evalAfter
      val rawLoss = if (color == PieceColor.WHITE) bestEval - evalAfter else evalAfter - bestEval
      val cpLoss = max(0, rawLoss)

      val cls = if (best != null && best.san == san) MoveClassification.BEST else classifyCpLoss(cpLoss)

      if (color == PieceColor.WHITE) {
        wLoss += min(cpLoss, 500)
        wCount++
      } else {
        bLoss += min(cpLoss, 500)
        bCount++
      }

      val bestSan = best?.san ?: san
      val comment = when (cls) {
        MoveClassification.BEST -> explainMove(board, played.first, san)
        MoveClassification.GOOD -> "Solid choice.${if (bestSan != san) " Engine slightly preferred $bestSan." else ""}"
        MoveClassification.INACCURACY -> "Slight inaccuracy (-${"%.1f".format(cpLoss / 100.0)}). $bestSan kept tighter control."
        MoveClassification.MISTAKE -> "Mistake! $bestSan saved ~${"%.1f".format(cpLoss / 100.0)} pawns."
        MoveClassification.BLUNDER -> "Blunder! $san dropped major advantage. $bestSan was much stronger."
      }

      val item = MoveReviewItem(
        ply = idx + 1,
        moveNumber = moveNumber,
        color = color,
        san = san,
        bestMoveSan = bestSan,
        bestFrom = best?.move?.fromSquare ?: played.first.fromSquare,
        bestTo = best?.move?.toSquare ?: played.first.toSquare,
        fenBefore = fenBefore,
        cpLoss = cpLoss,
        classification = cls,
        comment = comment,
      )
      items.add(item)

      if (cpLoss > maxSwing) {
        maxSwing = cpLoss
        turningPoint = item
      }

      if ((cls == MoveClassification.MISTAKE || cls == MoveClassification.BLUNDER) && best != null && best.san != san) {
        mistakes.add(
          MistakePuzzle(
            id = "mistake-${System.currentTimeMillis()}-$idx",
            fen = fenBefore,
            playerColor = color,
            playedSan = san,
            bestSan = best.san,
            bestFrom = best.move.fromSquare,
            bestTo = best.move.toSquare,
            theme = when {
              best.san.contains("+") -> "Missed Check / Initiative"
              best.san.contains("x") -> "Missed Capture / Tactic"
              else -> "Tactical Improvement"
            },
            explanation = "${best.explanation} (You played $san instead.)",
          )
        )
      }

      board = nextBoard
    }

    val wAcc = if (wCount > 0) cpLossToAccuracy(wLoss.toDouble() / wCount) else 100.0
    val bAcc = if (bCount > 0) cpLossToAccuracy(bLoss.toDouble() / bCount) else 100.0
    val opPart = opening?.let { "Opening: ${it.name} (${it.eco})." } ?: "Unconventional opening."
    val tpPart = if (turningPoint != null && turningPoint.cpLoss >= 90) {
      " Biggest turning point: move ${turningPoint.moveNumber}${if (turningPoint.color == PieceColor.WHITE) "." else "..."} ${turningPoint.san} (${turningPoint.classification}), where ${turningPoint.bestMoveSan} was best."
    } else {
      " Both sides kept the game balanced without major collapses."
    }

    return GameReviewReport(
      moves = items,
      whiteAccuracy = wAcc,
      blackAccuracy = bAcc,
      opening = opening,
      turningPoint = turningPoint,
      coachSummary = "$opPart White accuracy: $wAcc%, Black accuracy: $bAcc%.$tpPart",
      mistakePuzzles = mistakes,
    )
  }

  fun askCoach(board: ChessBoard, history: List<String>, question: String): String {
    val q = question.lowercase()
    val eval = evaluatePosition(board)
    val opening = OpeningsBook.detect(history)
    val best = getBestMove(board, AiDifficulty.MASTER, AiPersonality.BALANCED)
    val turnLabel = if (board.turn == PieceColor.WHITE) "White" else "Black"

    if ("opening" in q || "book" in q) {
      return opening?.let { "You are in the ${it.name} (${it.eco}). ${it.idea}" }
        ?: if (history.size < 4) "Early opening: control the center (e4/d4), develop knights before bishops, and castle early."
        else "Out of standard opening book—focus on piece coordination and king safety."
    }
    if ("threat" in q || "danger" in q || "attack" in q) {
      if (board.inCheck()) {
        return "$turnLabel is in check! Escape safely${best?.let { " — ${it.san} is strongest" } ?: ""}."
      }
      val captures = board.legalMoves().filter { it.captured != null && it.captured.type.valueCp >= 300 }
      if (captures.isNotEmpty()) {
        val top = captures.first()
        return "$turnLabel has tactical captures available such as ${board.toSan(top)} on ${top.toSquare}. Eval: ${eval.displayScore}."
      }
      return "No immediate high-value captures for $turnLabel. Improve your worst-placed piece."
    }
    if ("last" in q || "why" in q || "mistake" in q) {
      if (history.isEmpty()) return "No moves played yet! Start with 1. e4 or 1. d4."
      val last = history.last()
      return "After $last, eval is ${eval.displayScore}. ${best?.let { "For $turnLabel: ${it.explanation}" } ?: ""}"
    }

    val evalText = when {
      kotlin.math.abs(eval.scoreCp) < 45 -> "Position is roughly equal (${eval.displayScore})"
      eval.scoreCp > 0 -> "White holds an advantage (${eval.displayScore})"
      else -> "Black holds an advantage (${eval.displayScore})"
    }
    return "$evalText. $turnLabel to move. ${best?.let { "Recommended: ${it.explanation}" } ?: ""}"
  }
}
