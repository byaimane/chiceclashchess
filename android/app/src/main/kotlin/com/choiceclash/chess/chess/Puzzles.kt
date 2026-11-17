package com.choiceclash.chess.chess

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class TacticalPuzzle(
  val id: String,
  val title: String,
  val theme: String,
  val difficulty: String,
  val fen: String,
  val solutionSan: String,
  val hint: String,
  val explanation: String,
)

data class PuzzleStats(
  val solvedCount: Int = 0,
  val streak: Int = 0,
  val bestStreak: Int = 0,
)

object PuzzlesRepository {
  val dailyPuzzles: List<TacticalPuzzle> = listOf(
    TacticalPuzzle(
      id = "puz-backrank",
      title = "Back-Rank Strike",
      theme = "Back-Rank Mate",
      difficulty = "Beginner",
      fen = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
      solutionSan = "Ra8#",
      hint = "The black king is trapped behind its own pawns on the 8th rank.",
      explanation = "Ra8# delivers an immediate back-rank checkmate because f7, g7, and h7 block the king.",
    ),
    TacticalPuzzle(
      id = "puz-arabian",
      title = "Arabian Mate",
      theme = "Rook & Knight Mate",
      difficulty = "Beginner",
      fen = "7k/8/5N1K/8/8/8/8/7R w - - 0 1",
      solutionSan = "Rh8#",
      hint = "Your knight on f6 and king on h6 cover g8 and g7—finish with the rook.",
      explanation = "Rh8# is the classic Arabian Mate pattern with Rook + Knight!",
    ),
    TacticalPuzzle(
      id = "puz-ladder",
      title = "Ladder Checkmate",
      theme = "Endgame Technique",
      difficulty = "Beginner",
      fen = "3k4/R7/1R6/8/8/8/8/4K3 w - - 0 1",
      solutionSan = "Rb8#",
      hint = "Your rook on a7 already cuts off the 7th rank.",
      explanation = "Rb8# completes the rook-roller (ladder) checkmate.",
    ),
    TacticalPuzzle(
      id = "puz-fork-double",
      title = "Royal Knight Fork",
      theme = "Knight Fork",
      difficulty = "Intermediate",
      fen = "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
      solutionSan = "Nc7+",
      hint = "Look for a square where your knight attacks both the king and the rook.",
      explanation = "Nc7+ forks the Black king on e8 and the rook on a8!",
    ),
    TacticalPuzzle(
      id = "puz-queen-fork",
      title = "Queen Double Attack",
      theme = "Double Attack",
      difficulty = "Intermediate",
      fen = "r3k3/8/8/8/3Q4/8/8/4K3 w - - 0 1",
      solutionSan = "Qh8+",
      hint = "Check the king on the h8-a1 diagonal or 8th rank to win the rook.",
      explanation = "Qh8+ checks the king and skewers the a8 rook on the 8th rank!",
    ),
    TacticalPuzzle(
      id = "puz-promotion",
      title = "Decisive Promotion",
      theme = "Pawn Endgame",
      difficulty = "Beginner",
      fen = "4k3/1P6/8/8/8/8/8/4K3 w - - 0 1",
      solutionSan = "b8=Q+",
      hint = "Push the passed pawn to the 8th rank with check!",
      explanation = "b8=Q+ promotes with check and a winning queen endgame.",
    ),
    TacticalPuzzle(
      id = "puz-mate-queen",
      title = "Queen & King Net",
      theme = "Mate in 1",
      difficulty = "Advanced",
      fen = "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
      solutionSan = "Qg7#",
      hint = "Your king on g6 supports the queen right next to the Black king.",
      explanation = "Qg7# is checkmate—the White king defends g7 and covers h7.",
    ),
  )

  private const val PREFS_NAME = "choiceclash_puzzles"
  private const val KEY_MISTAKES = "mistake_puzzles"
  private const val KEY_SOLVED = "solved_count"
  private const val KEY_STREAK = "streak"
  private const val KEY_BEST_STREAK = "best_streak"

  fun loadStats(context: Context): PuzzleStats {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return PuzzleStats(
      solvedCount = prefs.getInt(KEY_SOLVED, 0),
      streak = prefs.getInt(KEY_STREAK, 0),
      bestStreak = prefs.getInt(KEY_BEST_STREAK, 0),
    )
  }

  fun recordSolve(context: Context, correct: Boolean): PuzzleStats {
    val current = loadStats(context)
    val next = if (correct) {
      PuzzleStats(
        solvedCount = current.solvedCount + 1,
        streak = current.streak + 1,
        bestStreak = maxOf(current.bestStreak, current.streak + 1),
      )
    } else {
      current.copy(streak = 0)
    }
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
      .putInt(KEY_SOLVED, next.solvedCount)
      .putInt(KEY_STREAK, next.streak)
      .putInt(KEY_BEST_STREAK, next.bestStreak)
      .apply()
    return next
  }

  fun loadMistakes(context: Context): List<MistakePuzzle> {
    val raw = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(KEY_MISTAKES, null) ?: return emptyList()
    return try {
      val arr = JSONArray(raw)
      buildList {
        for (i in 0 until arr.length()) {
          val o = arr.getJSONObject(i)
          add(
            MistakePuzzle(
              id = o.getString("id"),
              fen = o.getString("fen"),
              playerColor = if (o.getString("color") == "b") PieceColor.BLACK else PieceColor.WHITE,
              playedSan = o.getString("playedSan"),
              bestSan = o.getString("bestSan"),
              bestFrom = o.getString("bestFrom"),
              bestTo = o.getString("bestTo"),
              theme = o.getString("theme"),
              explanation = o.getString("explanation"),
              solved = o.optBoolean("solved", false),
            )
          )
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  fun saveMistakes(context: Context, newMistakes: List<MistakePuzzle>) {
    if (newMistakes.isEmpty()) return
    val existing = loadMistakes(context)
    val seen = existing.map { it.fen }.toSet()
    val merged = (newMistakes.filter { it.fen !in seen } + existing).take(40)
    val arr = JSONArray()
    for (m in merged) {
      arr.put(
        JSONObject().apply {
          put("id", m.id)
          put("fen", m.fen)
          put("color", if (m.playerColor == PieceColor.BLACK) "b" else "w")
          put("playedSan", m.playedSan)
          put("bestSan", m.bestSan)
          put("bestFrom", m.bestFrom)
          put("bestTo", m.bestTo)
          put("theme", m.theme)
          put("explanation", m.explanation)
          put("solved", m.solved)
        }
      )
    }
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_MISTAKES, arr.toString())
      .apply()
  }
}
