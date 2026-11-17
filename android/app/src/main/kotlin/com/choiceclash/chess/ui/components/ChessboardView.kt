package com.choiceclash.chess.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.audio.ChessSoundEffects
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.ChessMove
import com.choiceclash.chess.chess.ChessPiece
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PieceType
import com.choiceclash.chess.chess.parseSquare
import com.choiceclash.chess.ui.theme.BoardDarkSquare
import com.choiceclash.chess.ui.theme.BoardLightSquare
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.CrimsonAlert
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.WarmIvory

@Composable
fun ChessboardView(
    board: ChessBoard,
    flipped: Boolean = false,
    is3dMode: Boolean = false,
    interactive: Boolean = true,
    allowedColor: PieceColor? = null,
    lastMoveFrom: String? = null,
    lastMoveTo: String? = null,
    hintFrom: String? = null,
    hintTo: String? = null,
    onMoveSelected: (ChessMove) -> Unit,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current.density
    val haptic = LocalHapticFeedback.current
    fun triggerMoveFeedback(move: ChessMove) {
        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        val after = board.applyMoveUnchecked(move)
        when {
            after.isGameOver() -> ChessSoundEffects.playGameOver()
            after.inCheck() -> ChessSoundEffects.playCheck()
            move.isCastleKingside || move.isCastleQueenside -> ChessSoundEffects.playCastle()
            move.captured != null || move.isEnPassant -> ChessSoundEffects.playCapture()
            else -> ChessSoundEffects.playMove()
        }
    }
    val boardTiltX by animateFloatAsState(
        targetValue = if (is3dMode) 26f else 0f,
        animationSpec = tween(durationMillis = 360),
        label = "board_tilt_x"
    )
    val boardScale by animateFloatAsState(
        targetValue = if (is3dMode) 0.95f else 1f,
        animationSpec = tween(durationMillis = 360),
        label = "board_scale"
    )
    var selectedSquare by remember(board) { mutableStateOf<Int?>(null) }
    var pendingPromotionMoves by remember(board) { mutableStateOf<List<ChessMove>>(emptyList()) }

    val legalMovesForSelected = remember(board, selectedSquare) {
        val sq = selectedSquare
        if (sq == null) emptyList() else board.legalMoves(sq)
    }

    val lastFromIdx = remember(lastMoveFrom) { lastMoveFrom?.let { parseSquare(it) } ?: -1 }
    val lastToIdx = remember(lastMoveTo) { lastMoveTo?.let { parseSquare(it) } ?: -1 }
    val hintFromIdx = remember(hintFrom) { hintFrom?.let { parseSquare(it) } ?: -1 }
    val hintToIdx = remember(hintTo) { hintTo?.let { parseSquare(it) } ?: -1 }
    val inCheck = remember(board) { board.inCheck() }

    if (pendingPromotionMoves.isNotEmpty()) {
        AlertDialog(
            onDismissRequest = { pendingPromotionMoves = emptyList() },
            containerColor = EmeraldSurface,
            title = {
                Text("Promote Pawn", color = WarmIvory, fontWeight = FontWeight.Bold)
            },
            text = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    pendingPromotionMoves.forEach { move ->
                        val promoType = move.promotion ?: PieceType.QUEEN
                        val promoPiece = ChessPiece(promoType, board.turn)
                        Surface(
                            color = EmeraldElevated,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .size(56.dp)
                                .border(1.dp, BrushedGold.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                                .clickable {
                                    pendingPromotionMoves = emptyList()
                                    selectedSquare = null
                                    triggerMoveFeedback(move)
                                    onMoveSelected(move)
                                }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = promoPiece.glyph(),
                                    fontSize = 30.sp,
                                    color = if (board.turn == PieceColor.WHITE) Color(0xFFFFFBF0) else Color(0xFF0E1813)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { pendingPromotionMoves = emptyList() }) {
                    Text("Cancel", color = BrushedGold)
                }
            }
        )
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer {
                rotationX = boardTiltX
                scaleX = boardScale
                scaleY = boardScale
                cameraDistance = 14f * density
            },
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f),
            shape = RoundedCornerShape(12.dp),
            color = EmeraldSurface,
            tonalElevation = if (is3dMode) 12.dp else 4.dp,
            shadowElevation = if (is3dMode) 16.dp else 2.dp
        ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .border(2.dp, EmeraldBorder, RoundedCornerShape(12.dp))
                .padding(3.dp)
                .clip(RoundedCornerShape(8.dp))
        ) {
            val cellSize = maxWidth / 8f
            val pieceFontSize = (cellSize.value * 0.64f).sp

            Column(modifier = Modifier.fillMaxSize()) {
                for (visualRow in 0 until 8) {
                    val boardRow = if (flipped) 7 - visualRow else visualRow
                    Row(modifier = Modifier.weight(1f).fillMaxWidth()) {
                        for (visualCol in 0 until 8) {
                            val boardCol = if (flipped) 7 - visualCol else visualCol
                            val idx = boardRow * 8 + boardCol
                            val isLight = (boardRow + boardCol) % 2 == 0
                            val piece = board.squares[idx]
                            val isSelected = selectedSquare == idx
                            val matchingMoves = legalMovesForSelected.filter { it.to == idx }
                            val isLegalTarget = matchingMoves.isNotEmpty()
                            val isLastMove = idx == lastFromIdx || idx == lastToIdx
                            val isHint = idx == hintFromIdx || idx == hintToIdx
                            val isCheckedKing = inCheck &&
                                piece?.type == PieceType.KING &&
                                piece.color == board.turn

                            val baseBg = if (isLight) BoardLightSquare else BoardDarkSquare
                            val overlayColor = when {
                                isCheckedKing -> CrimsonAlert.copy(alpha = 0.65f)
                                isSelected -> BrushedGold.copy(alpha = 0.55f)
                                isHint -> BrushedGold.copy(alpha = 0.42f)
                                isLastMove -> BrushedGold.copy(alpha = 0.28f)
                                else -> Color.Transparent
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxSize()
                                    .background(baseBg)
                                    .background(overlayColor)
                                    .clickable(enabled = interactive) {
                                        if (isLegalTarget) {
                                            if (matchingMoves.size > 1 && matchingMoves.any { it.promotion != null }) {
                                                pendingPromotionMoves = matchingMoves
                                            } else {
                                                selectedSquare = null
                                                val chosen = matchingMoves.first()
                                                triggerMoveFeedback(chosen)
                                                onMoveSelected(chosen)
                                            }
                                        } else if (piece != null &&
                                            piece.color == board.turn &&
                                            (allowedColor == null || piece.color == allowedColor)
                                        ) {
                                            selectedSquare = if (selectedSquare == idx) null else idx
                                        } else {
                                            selectedSquare = null
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                // Rank label on left-most column
                                if (visualCol == 0) {
                                    val rankLabel = (8 - boardRow).toString()
                                    Text(
                                        text = rankLabel,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isLight) BoardDarkSquare else BoardLightSquare,
                                        modifier = Modifier
                                            .align(Alignment.TopStart)
                                            .padding(start = 2.dp, top = 1.dp)
                                    )
                                }

                                // File label on bottom-most row
                                if (visualRow == 7) {
                                    val fileLabel = ('a' + boardCol).toString()
                                    Text(
                                        text = fileLabel,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isLight) BoardDarkSquare else BoardLightSquare,
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .padding(end = 2.dp, bottom = 1.dp)
                                    )
                                }

                                // Legal move dot or capture ring
                                if (isLegalTarget) {
                                    if (piece != null) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize(0.88f)
                                                .border(3.dp, BrushedGold.copy(alpha = 0.85f), CircleShape)
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .size(cellSize * 0.30f)
                                                .clip(CircleShape)
                                                .background(BrushedGold.copy(alpha = 0.72f))
                                        )
                                    }
                                }

                                // Piece glyph
                                if (piece != null) {
                                    val pieceColor = if (piece.color == PieceColor.WHITE) {
                                        Color(0xFFFFFCF2)
                                    } else {
                                        Color(0xFF101C16)
                                    }
                                    if (is3dMode) {
                                        // 3D Staunton base shadow + upright counter-tilt
                                        Box(
                                            modifier = Modifier
                                                .padding(top = cellSize * 0.42f)
                                                .size(width = cellSize * 0.62f, height = cellSize * 0.18f)
                                                .clip(CircleShape)
                                                .background(Color(0x66000000))
                                        )
                                        Text(
                                            text = piece.glyph(),
                                            fontSize = pieceFontSize,
                                            color = Color(0x880B1F17),
                                            modifier = Modifier
                                                .padding(top = 3.dp, start = 1.5.dp)
                                                .graphicsLayer {
                                                    rotationX = -14f
                                                    scaleY = 1.12f
                                                }
                                        )
                                        Text(
                                            text = piece.glyph(),
                                            fontSize = pieceFontSize,
                                            color = pieceColor,
                                            modifier = Modifier.graphicsLayer {
                                                rotationX = -14f
                                                scaleY = 1.12f
                                                translationY = -cellSize.value * 0.08f
                                            }
                                        )
                                    } else {
                                        // Subtle shadow for white pieces on light squares
                                        if (piece.color == PieceColor.WHITE) {
                                            Text(
                                                text = piece.glyph(),
                                                fontSize = pieceFontSize,
                                                color = Color(0x660B1F17),
                                                modifier = Modifier.padding(top = 1.5.dp, start = 1.dp)
                                            )
                                        }
                                        Text(
                                            text = piece.glyph(),
                                            fontSize = pieceFontSize,
                                            color = pieceColor
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
        if (is3dMode) {
            // 3D sculpted board slab edge
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.96f)
                    .height(10.dp)
                    .clip(RoundedCornerShape(bottomStart = 10.dp, bottomEnd = 10.dp))
                    .background(
                        Brush.verticalGradient(
                            listOf(EmeraldBorder, Color(0xFF06130E))
                        )
                    )
                    .border(
                        width = 1.dp,
                        color = BrushedGold.copy(alpha = 0.45f),
                        shape = RoundedCornerShape(bottomStart = 10.dp, bottomEnd = 10.dp)
                    )
            )
        }
    }
}
