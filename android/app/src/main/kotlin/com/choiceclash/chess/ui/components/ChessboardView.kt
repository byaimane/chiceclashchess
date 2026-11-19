package com.choiceclash.chess.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
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
import com.choiceclash.chess.chess.RpgCameraPreset
import com.choiceclash.chess.chess.RpgRealmEnvironment
import com.choiceclash.chess.chess.parseSquare
import com.choiceclash.chess.data.RemoteConfigManager
import com.choiceclash.chess.ui.theme.BoardDarkSquare
import com.choiceclash.chess.ui.theme.BoardLightSquare
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.CrimsonAlert
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.WarmIvory
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun ChessboardView(
    board: ChessBoard,
    flipped: Boolean = false,
    is3dMode: Boolean = false,
    cameraPreset: RpgCameraPreset? = null,
    yawOffset: Float = 0f,
    realmEnvironment: RpgRealmEnvironment = RpgRealmEnvironment.EMERALD_COURTYARD,
    interactive: Boolean = true,
    allowedColor: PieceColor? = null,
    lastMoveFrom: String? = null,
    lastMoveTo: String? = null,
    hintFrom: String? = null,
    hintTo: String? = null,
    onMoveSelected: (ChessMove) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeCamera = cameraPreset
        ?: if (is3dMode) RpgCameraPreset.CLASSIC_3D else RpgCameraPreset.TACTICAL_2D
    val render3d = activeCamera.is3d

    val density = LocalDensity.current.density
    val haptic = LocalHapticFeedback.current
    val remoteState by RemoteConfigManager.state.collectAsState()

    val lightSqColor = remember(remoteState.selectedTheme) {
        RemoteConfigManager.parseHexColor(remoteState.selectedTheme?.lightSquareHex, BoardLightSquare)
    }
    val darkSqColor = remember(remoteState.selectedTheme) {
        RemoteConfigManager.parseHexColor(remoteState.selectedTheme?.darkSquareHex, BoardDarkSquare)
    }
    val borderColor = remember(remoteState.selectedTheme, realmEnvironment, render3d) {
        if (render3d) {
            RemoteConfigManager.parseHexColor(realmEnvironment.primaryHex, EmeraldBorder)
        } else {
            RemoteConfigManager.parseHexColor(remoteState.selectedTheme?.boardBorderHex, EmeraldBorder)
        }
    }
    val realmPrimary = remember(realmEnvironment) {
        RemoteConfigManager.parseHexColor(realmEnvironment.primaryHex, BrushedGold)
    }
    val realmSecondary = remember(realmEnvironment) {
        RemoteConfigManager.parseHexColor(realmEnvironment.secondaryHex, WarmIvory)
    }
    val plinthTop = remember(realmEnvironment) {
        RemoteConfigManager.parseHexColor(realmEnvironment.plinthTopHex, EmeraldBorder)
    }
    val plinthBottom = remember(realmEnvironment) {
        RemoteConfigManager.parseHexColor(realmEnvironment.plinthBottomHex, Color(0xFF06130E))
    }

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
        targetValue = activeCamera.pitchDeg,
        animationSpec = tween(durationMillis = 380),
        label = "board_tilt_x"
    )
    val boardYawZ by animateFloatAsState(
        targetValue = if (render3d) activeCamera.yawDeg + yawOffset else 0f,
        animationSpec = tween(durationMillis = 380),
        label = "board_yaw_z"
    )
    val boardScale by animateFloatAsState(
        targetValue = activeCamera.scale,
        animationSpec = tween(durationMillis = 380),
        label = "board_scale"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "rpg_arena_fx")
    val particlePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.283185f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 5200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "particle_phase"
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
                Text("Ascend Unit (Promote Pawn)", color = WarmIvory, fontWeight = FontWeight.Bold)
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

    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        // 3D RPG Realm Particle Atmosphere & Sanctum Glow
        if (render3d) {
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
            ) {
                val center = Offset(size.width / 2f, size.height / 2f)
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            realmPrimary.copy(alpha = 0.22f),
                            realmSecondary.copy(alpha = 0.08f),
                            Color.Transparent
                        ),
                        center = center,
                        radius = size.minDimension * 0.56f
                    ),
                    radius = size.minDimension * 0.56f,
                    center = center
                )

                // 14 orbiting realm fireflies / embers
                for (i in 0 until 14) {
                    val angle = particlePhase + (i * 0.45f)
                    val radiusX = size.width * (0.34f + (i % 4) * 0.04f)
                    val radiusY = size.height * (0.28f + (i % 3) * 0.05f)
                    val px = center.x + cos(angle) * radiusX
                    val py = center.y + sin(angle * 1.3f) * radiusY
                    val dotColor = if (i % 2 == 0) realmPrimary else realmSecondary
                    drawCircle(
                        color = dotColor.copy(alpha = 0.55f),
                        radius = (3.5f + (i % 3) * 1.5f),
                        center = Offset(px, py)
                    )
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .graphicsLayer {
                    rotationX = boardTiltX
                    rotationZ = boardYawZ
                    scaleX = boardScale
                    scaleY = boardScale
                    cameraDistance = 15f * density
                },
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f),
                shape = RoundedCornerShape(14.dp),
                color = EmeraldSurface,
                tonalElevation = if (render3d) 14.dp else 4.dp,
                shadowElevation = if (render3d) 20.dp else 2.dp
            ) {
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxSize()
                        .border(if (render3d) 2.5.dp else 2.dp, borderColor, RoundedCornerShape(14.dp))
                        .padding(4.dp)
                        .clip(RoundedCornerShape(10.dp))
                ) {
                    val cellSize = maxWidth / 8f
                    val pieceFontSize = (cellSize.value * (if (render3d) 0.58f else 0.64f)).sp

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

                                    val baseBg = if (isLight) lightSqColor else darkSqColor
                                    val overlayColor = when {
                                        isCheckedKing -> CrimsonAlert.copy(alpha = 0.68f)
                                        isSelected -> BrushedGold.copy(alpha = 0.58f)
                                        isHint -> BrushedGold.copy(alpha = 0.44f)
                                        isLastMove -> realmPrimary.copy(alpha = 0.30f)
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
                                                color = if (isLight) darkSqColor else lightSqColor,
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
                                                color = if (isLight) darkSqColor else lightSqColor,
                                                modifier = Modifier
                                                    .align(Alignment.BottomEnd)
                                                    .padding(end = 2.dp, bottom = 1.dp)
                                            )
                                        }

                                        // Impact ring on latest target square in 3D RPG mode
                                        if (render3d && idx == lastToIdx) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxSize(0.90f)
                                                    .border(
                                                        width = 1.5.dp,
                                                        color = if (inCheck) CrimsonAlert else realmPrimary,
                                                        shape = CircleShape
                                                    )
                                            )
                                        }

                                        // Legal move dot or capture target ring
                                        if (isLegalTarget) {
                                            if (piece != null) {
                                                Box(
                                                    modifier = Modifier
                                                        .fillMaxSize(0.88f)
                                                        .border(3.dp, CrimsonAlert.copy(alpha = 0.88f), CircleShape)
                                                )
                                            } else {
                                                Box(
                                                    modifier = Modifier
                                                        .size(cellSize * 0.30f)
                                                        .clip(CircleShape)
                                                        .background(BrushedGold.copy(alpha = 0.78f))
                                                )
                                            }
                                        }

                                        // Piece rendering (2D vs 3D RPG Pedestal Figurine)
                                        if (piece != null) {
                                            val pieceColor = if (piece.color == PieceColor.WHITE) {
                                                Color(0xFFFFFCF2)
                                            } else {
                                                Color(0xFF101C16)
                                            }
                                            if (render3d) {
                                                val isWhite = piece.color == PieceColor.WHITE
                                                val pedestalRim = when (piece.type) {
                                                    PieceType.KING -> BrushedGold
                                                    PieceType.QUEEN -> Color(0xFFC084FC)
                                                    PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT ->
                                                        if (isWhite) realmPrimary else CrimsonAlert
                                                    PieceType.PAWN ->
                                                        if (isWhite) Color(0xFFD6CEBF) else Color(0xFF2D4A3E)
                                                }
                                                val pedestalFill = if (isWhite) {
                                                    Color(0xFF233D31)
                                                } else {
                                                    Color(0xFFE6DEC8)
                                                }
                                                val liftPx = if (isSelected) -cellSize.value * 0.22f else -cellSize.value * 0.10f

                                                // Ground shadow oval
                                                Box(
                                                    modifier = Modifier
                                                        .padding(top = cellSize * 0.44f)
                                                        .size(width = cellSize * 0.74f, height = cellSize * 0.26f)
                                                        .clip(CircleShape)
                                                        .background(Color(0x88000000))
                                                )
                                                // 3D Sculpted RPG Pedestal Token Base
                                                Box(
                                                    modifier = Modifier
                                                        .padding(top = cellSize * 0.30f)
                                                        .size(width = cellSize * 0.72f, height = cellSize * 0.36f)
                                                        .clip(CircleShape)
                                                        .background(pedestalFill)
                                                        .border(1.5.dp, pedestalRim, CircleShape)
                                                )
                                                // Upright Counter-Tilted Figurine Shadow
                                                Text(
                                                    text = piece.glyph(),
                                                    fontSize = pieceFontSize,
                                                    color = Color(0xAA07130E),
                                                    modifier = Modifier
                                                        .padding(top = 2.dp, start = 1.5.dp)
                                                        .graphicsLayer {
                                                            rotationX = -16f
                                                            rotationZ = -boardYawZ * 0.45f
                                                            scaleY = 1.18f
                                                            translationY = liftPx
                                                        }
                                                )
                                                // Upright Counter-Tilted Figurine
                                                Text(
                                                    text = piece.glyph(),
                                                    fontSize = pieceFontSize,
                                                    color = pieceColor,
                                                    modifier = Modifier.graphicsLayer {
                                                        rotationX = -16f
                                                        rotationZ = -boardYawZ * 0.45f
                                                        scaleY = 1.18f
                                                        translationY = liftPx - 2f
                                                    }
                                                )
                                            } else {
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

            if (render3d) {
                // Upper 3D Temple Slab Edge
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.96f)
                        .height(10.dp)
                        .clip(RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp))
                        .background(
                            Brush.verticalGradient(listOf(plinthTop, plinthBottom))
                        )
                        .border(
                            width = 1.dp,
                            color = realmPrimary.copy(alpha = 0.55f),
                            shape = RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp)
                        )
                )
                // Lower 3D Sanctum Pedestal Step
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.90f)
                        .height(6.dp)
                        .clip(RoundedCornerShape(bottomStart = 10.dp, bottomEnd = 10.dp))
                        .background(plinthBottom)
                        .border(
                            width = 1.dp,
                            color = BrushedGold.copy(alpha = 0.35f),
                            shape = RoundedCornerShape(bottomStart = 10.dp, bottomEnd = 10.dp)
                        )
                )
            }
        }
    }
}
