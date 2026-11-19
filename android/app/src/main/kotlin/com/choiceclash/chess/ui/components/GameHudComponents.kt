package com.choiceclash.chess.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.ChessPiece
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PieceType
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory

private val START_COUNTS = mapOf(
    PieceType.QUEEN to 1,
    PieceType.ROOK to 2,
    PieceType.BISHOP to 2,
    PieceType.KNIGHT to 2,
    PieceType.PAWN to 8
)

@Composable
fun CapturedPiecesBar(
    board: ChessBoard,
    modifier: Modifier = Modifier
) {
    val summary = remember(board) {
        val whiteCounts = mutableMapOf<PieceType, Int>()
        val blackCounts = mutableMapOf<PieceType, Int>()
        var whiteMaterial = 0
        var blackMaterial = 0

        for (piece in board.squares) {
            if (piece == null || piece.type == PieceType.KING) continue
            if (piece.color == PieceColor.WHITE) {
                whiteCounts[piece.type] = (whiteCounts[piece.type] ?: 0) + 1
                whiteMaterial += piece.type.valueCp
            } else {
                blackCounts[piece.type] = (blackCounts[piece.type] ?: 0) + 1
                blackMaterial += piece.type.valueCp
            }
        }

        val capturedBlack = buildString {
            START_COUNTS.forEach { (type, expected) ->
                val missing = (expected - (blackCounts[type] ?: 0)).coerceAtLeast(0)
                repeat(missing) { append(ChessPiece(type, PieceColor.BLACK).glyph()) }
            }
        }
        val capturedWhite = buildString {
            START_COUNTS.forEach { (type, expected) ->
                val missing = (expected - (whiteCounts[type] ?: 0)).coerceAtLeast(0)
                repeat(missing) { append(ChessPiece(type, PieceColor.WHITE).glyph()) }
            }
        }
        val diffPawns = (whiteMaterial - blackMaterial) / 100
        Triple(capturedBlack, capturedWhite, diffPawns)
    }

    val (capturedBlack, capturedWhite, diffPawns) = summary
    if (capturedBlack.isEmpty() && capturedWhite.isEmpty()) return

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(EmeraldSurface, RoundedCornerShape(10.dp))
            .border(1.dp, EmeraldBorder, RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = capturedBlack.ifEmpty { "—" },
                fontSize = 14.sp,
                color = WarmIvory
            )
            if (diffPawns > 0) {
                Text(
                    text = "+$diffPawns",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrushedGold
                )
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (diffPawns < 0) {
                Text(
                    text = "+${-diffPawns}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrushedGold
                )
            }
            Text(
                text = capturedWhite.ifEmpty { "—" },
                fontSize = 14.sp,
                color = MutedSage
            )
        }
    }
}

@Composable
fun MoveHistoryStrip(
    historySan: List<String>,
    modifier: Modifier = Modifier
) {
    if (historySan.isEmpty()) return
    val context = LocalContext.current

    val pairs = remember(historySan) {
        historySan.chunked(2).mapIndexed { idx, chunk ->
            val moveNum = idx + 1
            if (chunk.size == 2) "$moveNum. ${chunk[0]} ${chunk[1]}"
            else "$moveNum. ${chunk[0]}"
        }
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            color = BrushedGold.copy(alpha = 0.2f),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .border(1.dp, BrushedGold.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
                .clip(RoundedCornerShape(8.dp))
                .clickable {
                    sharePgn(context, pairs.joinToString(" "))
                }
        ) {
            Text(
                text = "📋 Share PGN",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = BrushedGold,
                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
            )
        }
        pairs.forEachIndexed { idx, label ->
            val isLatest = idx == pairs.lastIndex
            Surface(
                color = if (isLatest) EmeraldElevated else EmeraldSurface,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.border(
                    width = 1.dp,
                    color = if (isLatest) BrushedGold.copy(alpha = 0.6f) else EmeraldBorder,
                    shape = RoundedCornerShape(8.dp)
                )
            ) {
                Text(
                    text = label,
                    fontSize = 11.sp,
                    fontWeight = if (isLatest) FontWeight.Bold else FontWeight.Normal,
                    color = if (isLatest) BrushedGold else WarmIvory,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

fun sharePgn(context: Context, movesText: String) {
    val pgn = buildString {
        appendLine("[Event \"ChoiceCLASH 3D RPG Chess Match\"]")
        appendLine("[Site \"ChoiceCLASH Android App\"]")
        appendLine()
        append(movesText)
    }
    runCatching {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        clipboard?.setPrimaryClip(ClipData.newPlainText("ChoiceCLASH PGN", pgn))
        Toast.makeText(context, "PGN copied to clipboard!", Toast.LENGTH_SHORT).show()
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "ChoiceCLASH Match PGN")
            putExtra(Intent.EXTRA_TEXT, pgn)
        }
        context.startActivity(Intent.createChooser(sendIntent, "Share Match PGN"))
    }
}

fun formatClockSeconds(seconds: Int): String {
    val safe = seconds.coerceAtLeast(0)
    val m = safe / 60
    val s = safe % 60
    return "%d:%02d".format(m, s)
}
