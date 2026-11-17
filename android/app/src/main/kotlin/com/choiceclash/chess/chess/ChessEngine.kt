package com.choiceclash.chess.chess

import kotlin.math.abs

enum class PieceColor {
  WHITE,
  BLACK;

  fun opposite(): PieceColor = if (this == WHITE) BLACK else WHITE
  fun fenChar(): Char = if (this == WHITE) 'w' else 'b'
}

enum class PieceType(val fenLetter: Char, val sanLetter: String, val valueCp: Int, val label: String) {
  PAWN('p', "", 100, "pawn"),
  KNIGHT('n', "N", 320, "knight"),
  BISHOP('b', "B", 330, "bishop"),
  ROOK('r', "R", 500, "rook"),
  QUEEN('q', "Q", 900, "queen"),
  KING('k', "K", 20000, "king");
}

data class ChessPiece(val type: PieceType, val color: PieceColor) {
  fun glyph(): String = when (color) {
    PieceColor.WHITE -> when (type) {
      PieceType.KING -> "♔"
      PieceType.QUEEN -> "♕"
      PieceType.ROOK -> "♖"
      PieceType.BISHOP -> "♗"
      PieceType.KNIGHT -> "♘"
      PieceType.PAWN -> "♙"
    }
    PieceColor.BLACK -> when (type) {
      PieceType.KING -> "♚"
      PieceType.QUEEN -> "♛"
      PieceType.ROOK -> "♜"
      PieceType.BISHOP -> "♝"
      PieceType.KNIGHT -> "♞"
      PieceType.PAWN -> "♟"
    }
  }
}

data class ChessMove(
  val from: Int,
  val to: Int,
  val piece: ChessPiece,
  val captured: ChessPiece? = null,
  val promotion: PieceType? = null,
  val isEnPassant: Boolean = false,
  val isCastleKingside: Boolean = false,
  val isCastleQueenside: Boolean = false,
) {
  val fromSquare: String get() = squareName(from)
  val toSquare: String get() = squareName(to)
}

fun squareName(idx: Int): String {
  val file = 'a' + (idx % 8)
  val rank = 8 - (idx / 8)
  return "$file$rank"
}

fun parseSquare(sq: String): Int {
  if (sq.length != 2) return -1
  val file = sq[0] - 'a'
  val rank = 8 - (sq[1] - '0')
  if (file !in 0..7 || rank !in 0..7) return -1
  return rank * 8 + file
}

class ChessBoard private constructor(
  val squares: Array<ChessPiece?>,
  val turn: PieceColor,
  val castlingRights: String,
  val enPassantSquare: Int,
  val halfMoveClock: Int,
  val fullMoveNumber: Int,
) {
  companion object {
    const val START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    fun start(): ChessBoard = fromFen(START_FEN)

    fun fromFen(fen: String): ChessBoard {
      val parts = fen.trim().split(Regex("\\s+"))
      val board = arrayOfNulls<ChessPiece>(64)
      val rows = parts[0].split("/")
      for (r in 0 until minOf(8, rows.size)) {
        var c = 0
        for (ch in rows[r]) {
          if (ch.isDigit()) {
            c += ch.digitToInt()
          } else {
            val color = if (ch.isUpperCase()) PieceColor.WHITE else PieceColor.BLACK
            val type = when (ch.lowercaseChar()) {
              'p' -> PieceType.PAWN
              'n' -> PieceType.KNIGHT
              'b' -> PieceType.BISHOP
              'r' -> PieceType.ROOK
              'q' -> PieceType.QUEEN
              'k' -> PieceType.KING
              else -> null
            }
            if (type != null && c in 0..7) {
              board[r * 8 + c] = ChessPiece(type, color)
            }
            c++
          }
        }
      }
      val turn = if (parts.getOrNull(1) == "b") PieceColor.BLACK else PieceColor.WHITE
      val castling = parts.getOrNull(2)?.takeIf { it != "-" } ?: ""
      val ep = parts.getOrNull(3)?.takeIf { it != "-" }?.let { parseSquare(it) } ?: -1
      val halfMove = parts.getOrNull(4)?.toIntOrNull() ?: 0
      val fullMove = parts.getOrNull(5)?.toIntOrNull() ?: 1
      return ChessBoard(board, turn, castling, ep, halfMove, fullMove)
    }
  }

  fun toFen(): String {
    val sb = StringBuilder()
    for (r in 0 until 8) {
      var empty = 0
      for (c in 0 until 8) {
        val p = squares[r * 8 + c]
        if (p == null) {
          empty++
        } else {
          if (empty > 0) {
            sb.append(empty)
            empty = 0
          }
          val ch = p.type.fenLetter
          sb.append(if (p.color == PieceColor.WHITE) ch.uppercaseChar() else ch)
        }
      }
      if (empty > 0) sb.append(empty)
      if (r < 7) sb.append('/')
    }
    sb.append(' ').append(turn.fenChar())
    sb.append(' ').append(castlingRights.ifEmpty { "-" })
    sb.append(' ').append(if (enPassantSquare >= 0) squareName(enPassantSquare) else "-")
    sb.append(' ').append(halfMoveClock)
    sb.append(' ').append(fullMoveNumber)
    return sb.toString()
  }

  fun kingSquare(color: PieceColor): Int {
    for (i in 0 until 64) {
      val p = squares[i]
      if (p != null && p.color == color && p.type == PieceType.KING) return i
    }
    return -1
  }

  fun isSquareAttacked(sq: Int, byColor: PieceColor): Boolean {
    val r = sq / 8
    val c = sq % 8

    // Pawns
    val pawnRow = if (byColor == PieceColor.WHITE) r + 1 else r - 1
    if (pawnRow in 0..7) {
      for (dc in listOf(-1, 1)) {
        val pc = c + dc
        if (pc in 0..7) {
          val p = squares[pawnRow * 8 + pc]
          if (p != null && p.color == byColor && p.type == PieceType.PAWN) return true
        }
      }
    }

    // Knights
    val knightOffsets = arrayOf(-2 to -1, -2 to 1, -1 to -2, -1 to 2, 1 to -2, 1 to 2, 2 to -1, 2 to 1)
    for ((dr, dc) in knightOffsets) {
      val nr = r + dr
      val nc = c + dc
      if (nr in 0..7 && nc in 0..7) {
        val p = squares[nr * 8 + nc]
        if (p != null && p.color == byColor && p.type == PieceType.KNIGHT) return true
      }
    }

    // Kings
    for (dr in -1..1) {
      for (dc in -1..1) {
        if (dr == 0 && dc == 0) continue
        val nr = r + dr
        val nc = c + dc
        if (nr in 0..7 && nc in 0..7) {
          val p = squares[nr * 8 + nc]
          if (p != null && p.color == byColor && p.type == PieceType.KING) return true
        }
      }
    }

    // Orthogonal (Rook / Queen)
    val ortho = arrayOf(-1 to 0, 1 to 0, 0 to -1, 0 to 1)
    for ((dr, dc) in ortho) {
      var nr = r + dr
      var nc = c + dc
      while (nr in 0..7 && nc in 0..7) {
        val p = squares[nr * 8 + nc]
        if (p != null) {
          if (p.color == byColor && (p.type == PieceType.ROOK || p.type == PieceType.QUEEN)) return true
          break
        }
        nr += dr
        nc += dc
      }
    }

    // Diagonal (Bishop / Queen)
    val diag = arrayOf(-1 to -1, -1 to 1, 1 to -1, 1 to 1)
    for ((dr, dc) in diag) {
      var nr = r + dr
      var nc = c + dc
      while (nr in 0..7 && nc in 0..7) {
        val p = squares[nr * 8 + nc]
        if (p != null) {
          if (p.color == byColor && (p.type == PieceType.BISHOP || p.type == PieceType.QUEEN)) return true
          break
        }
        nr += dr
        nc += dc
      }
    }

    return false
  }

  fun inCheck(color: PieceColor = turn): Boolean {
    val ks = kingSquare(color)
    return ks >= 0 && isSquareAttacked(ks, color.opposite())
  }

  fun legalMoves(fromSquare: Int? = null): List<ChessMove> {
    val pseudo = mutableListOf<ChessMove>()
    val startIdx = fromSquare ?: 0
    val endIdx = fromSquare ?: 63

    for (idx in startIdx..endIdx) {
      val piece = squares[idx] ?: continue
      if (piece.color != turn) continue
      val r = idx / 8
      val c = idx % 8

      when (piece.type) {
        PieceType.PAWN -> {
          val dir = if (turn == PieceColor.WHITE) -1 else 1
          val startRow = if (turn == PieceColor.WHITE) 6 else 1
          val promoRow = if (turn == PieceColor.WHITE) 0 else 7
          val oneR = r + dir
          if (oneR in 0..7 && squares[oneR * 8 + c] == null) {
            if (oneR == promoRow) {
              for (promo in listOf(PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT)) {
                pseudo.add(ChessMove(idx, oneR * 8 + c, piece, promotion = promo))
              }
            } else {
              pseudo.add(ChessMove(idx, oneR * 8 + c, piece))
              val twoR = r + 2 * dir
              if (r == startRow && squares[twoR * 8 + c] == null) {
                pseudo.add(ChessMove(idx, twoR * 8 + c, piece))
              }
            }
          }
          for (dc in listOf(-1, 1)) {
            val nc = c + dc
            if (oneR in 0..7 && nc in 0..7) {
              val targetIdx = oneR * 8 + nc
              val target = squares[targetIdx]
              if (target != null && target.color != turn) {
                if (oneR == promoRow) {
                  for (promo in listOf(PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT)) {
                    pseudo.add(ChessMove(idx, targetIdx, piece, captured = target, promotion = promo))
                  }
                } else {
                  pseudo.add(ChessMove(idx, targetIdx, piece, captured = target))
                }
              } else if (targetIdx == enPassantSquare) {
                val capIdx = r * 8 + nc
                pseudo.add(ChessMove(idx, targetIdx, piece, captured = squares[capIdx], isEnPassant = true))
              }
            }
          }
        }
        PieceType.KNIGHT -> {
          val offsets = arrayOf(-2 to -1, -2 to 1, -1 to -2, -1 to 2, 1 to -2, 1 to 2, 2 to -1, 2 to 1)
          for ((dr, dc) in offsets) {
            val nr = r + dr
            val nc = c + dc
            if (nr in 0..7 && nc in 0..7) {
              val tIdx = nr * 8 + nc
              val t = squares[tIdx]
              if (t == null || t.color != turn) {
                pseudo.add(ChessMove(idx, tIdx, piece, captured = t))
              }
            }
          }
        }
        PieceType.BISHOP -> addSlidingMoves(idx, piece, arrayOf(-1 to -1, -1 to 1, 1 to -1, 1 to 1), pseudo)
        PieceType.ROOK -> addSlidingMoves(idx, piece, arrayOf(-1 to 0, 1 to 0, 0 to -1, 0 to 1), pseudo)
        PieceType.QUEEN -> addSlidingMoves(
          idx,
          piece,
          arrayOf(-1 to -1, -1 to 1, 1 to -1, 1 to 1, -1 to 0, 1 to 0, 0 to -1, 0 to 1),
          pseudo
        )
        PieceType.KING -> {
          for (dr in -1..1) {
            for (dc in -1..1) {
              if (dr == 0 && dc == 0) continue
              val nr = r + dr
              val nc = c + dc
              if (nr in 0..7 && nc in 0..7) {
                val tIdx = nr * 8 + nc
                val t = squares[tIdx]
                if (t == null || t.color != turn) {
                  pseudo.add(ChessMove(idx, tIdx, piece, captured = t))
                }
              }
            }
          }
          // Castling
          if (!inCheck(turn)) {
            if (turn == PieceColor.WHITE && idx == 60) {
              if ('K' in castlingRights && squares[61] == null && squares[62] == null &&
                !isSquareAttacked(61, PieceColor.BLACK) && !isSquareAttacked(62, PieceColor.BLACK)
              ) {
                pseudo.add(ChessMove(60, 62, piece, isCastleKingside = true))
              }
              if ('Q' in castlingRights && squares[59] == null && squares[58] == null && squares[57] == null &&
                !isSquareAttacked(59, PieceColor.BLACK) && !isSquareAttacked(58, PieceColor.BLACK)
              ) {
                pseudo.add(ChessMove(60, 58, piece, isCastleQueenside = true))
              }
            } else if (turn == PieceColor.BLACK && idx == 4) {
              if ('k' in castlingRights && squares[5] == null && squares[6] == null &&
                !isSquareAttacked(5, PieceColor.WHITE) && !isSquareAttacked(6, PieceColor.WHITE)
              ) {
                pseudo.add(ChessMove(4, 6, piece, isCastleKingside = true))
              }
              if ('q' in castlingRights && squares[3] == null && squares[2] == null && squares[1] == null &&
                !isSquareAttacked(3, PieceColor.WHITE) && !isSquareAttacked(2, PieceColor.WHITE)
              ) {
                pseudo.add(ChessMove(4, 2, piece, isCastleQueenside = true))
              }
            }
          }
        }
      }
    }

    return pseudo.filter { move ->
      val next = applyMoveUnchecked(move)
      !next.inCheck(turn)
    }
  }

  private fun addSlidingMoves(
    idx: Int,
    piece: ChessPiece,
    dirs: Array<Pair<Int, Int>>,
    out: MutableList<ChessMove>
  ) {
    val r = idx / 8
    val c = idx % 8
    for ((dr, dc) in dirs) {
      var nr = r + dr
      var nc = c + dc
      while (nr in 0..7 && nc in 0..7) {
        val tIdx = nr * 8 + nc
        val t = squares[tIdx]
        if (t == null) {
          out.add(ChessMove(idx, tIdx, piece))
        } else {
          if (t.color != turn) out.add(ChessMove(idx, tIdx, piece, captured = t))
          break
        }
        nr += dr
        nc += dc
      }
    }
  }

  fun applyMoveUnchecked(move: ChessMove): ChessBoard {
    val next = squares.copyOf()
    next[move.from] = null
    next[move.to] = if (move.promotion != null) ChessPiece(move.promotion, move.piece.color) else move.piece

    if (move.isEnPassant) {
      val capRow = move.from / 8
      val capCol = move.to % 8
      next[capRow * 8 + capCol] = null
    }
    if (move.isCastleKingside) {
      val row = move.from / 8
      next[row * 8 + 5] = next[row * 8 + 7]
      next[row * 8 + 7] = null
    }
    if (move.isCastleQueenside) {
      val row = move.from / 8
      next[row * 8 + 3] = next[row * 8 + 0]
      next[row * 8 + 0] = null
    }

    var nextCastling = castlingRights
    if (move.piece.type == PieceType.KING) {
      nextCastling = if (move.piece.color == PieceColor.WHITE) {
        nextCastling.replace("K", "").replace("Q", "")
      } else {
        nextCastling.replace("k", "").replace("q", "")
      }
    }
    if (move.from == 63 || move.to == 63) nextCastling = nextCastling.replace("K", "")
    if (move.from == 56 || move.to == 56) nextCastling = nextCastling.replace("Q", "")
    if (move.from == 7 || move.to == 7) nextCastling = nextCastling.replace("k", "")
    if (move.from == 0 || move.to == 0) nextCastling = nextCastling.replace("q", "")

    val nextEp = if (move.piece.type == PieceType.PAWN && abs(move.to / 8 - move.from / 8) == 2) {
      ((move.from / 8 + move.to / 8) / 2) * 8 + (move.from % 8)
    } else -1

    val nextHalf = if (move.piece.type == PieceType.PAWN || move.captured != null) 0 else halfMoveClock + 1
    val nextFull = if (turn == PieceColor.BLACK) fullMoveNumber + 1 else fullMoveNumber

    return ChessBoard(next, turn.opposite(), nextCastling, nextEp, nextHalf, nextFull)
  }

  fun toSan(move: ChessMove): String {
    val next = applyMoveUnchecked(move)
    val suffix = when {
      next.isCheckmate() -> "#"
      next.inCheck() -> "+"
      else -> ""
    }
    if (move.isCastleKingside) return "O-O$suffix"
    if (move.isCastleQueenside) return "O-O-O$suffix"

    val sb = StringBuilder()
    if (move.piece.type == PieceType.PAWN) {
      if (move.captured != null || move.isEnPassant) {
        sb.append('a' + (move.from % 8)).append('x')
      }
      sb.append(move.toSquare)
      if (move.promotion != null) {
        sb.append('=').append(move.promotion.sanLetter)
      }
    } else {
      sb.append(move.piece.type.sanLetter)
      val peers = legalMoves().filter {
        it.to == move.to && it.from != move.from && it.piece.type == move.piece.type
      }
      if (peers.isNotEmpty()) {
        val sameFile = peers.any { it.from % 8 == move.from % 8 }
        val sameRank = peers.any { it.from / 8 == move.from / 8 }
        if (!sameFile) sb.append('a' + (move.from % 8))
        else if (!sameRank) sb.append(8 - (move.from / 8))
        else sb.append(move.fromSquare)
      }
      if (move.captured != null) sb.append('x')
      sb.append(move.toSquare)
    }
    return "$sb$suffix"
  }

  fun moveFromSan(san: String): Pair<ChessMove, ChessBoard>? {
    val targetClean = san.trim().replace("+", "").replace("#", "")
    for (m in legalMoves()) {
      val mSan = toSan(m).replace("+", "").replace("#", "")
      if (mSan == targetClean) {
        return m to applyMoveUnchecked(m)
      }
    }
    return null
  }

  fun isCheckmate(): Boolean = inCheck() && legalMoves().isEmpty()
  fun isStalemate(): Boolean = !inCheck() && legalMoves().isEmpty()

  fun isInsufficientMaterial(): Boolean {
    val pieces = squares.filterNotNull().filter { it.type != PieceType.KING }
    if (pieces.isEmpty()) return true
    if (pieces.size == 1 && (pieces[0].type == PieceType.KNIGHT || pieces[0].type == PieceType.BISHOP)) {
      return true
    }
    return false
  }

  fun isGameOver(): Boolean = isCheckmate() || isStalemate() || isInsufficientMaterial() || halfMoveClock >= 100
}
