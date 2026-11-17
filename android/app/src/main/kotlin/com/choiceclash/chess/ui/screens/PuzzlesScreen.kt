package com.choiceclash.chess.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PuzzlesRepository
import com.choiceclash.chess.ui.components.ChessboardView
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.CrimsonAlert
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSuccess
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory

private enum class PuzzleTab { DAILY, MISTAKES }

@Composable
fun PuzzlesScreen() {
    val context = LocalContext.current
    var tab by remember { mutableStateOf(PuzzleTab.DAILY) }
    var stats by remember { mutableStateOf(PuzzlesRepository.loadStats(context)) }
    var mistakes by remember { mutableStateOf(PuzzlesRepository.loadMistakes(context)) }
    var dailyIdx by remember { mutableIntStateOf(0) }
    var mistakeIdx by remember { mutableIntStateOf(0) }
    var showHint by remember { mutableStateOf(false) }
    var statusMsg by remember { mutableStateOf<String?>(null) }
    var solvedCurrent by remember { mutableStateOf(false) }
    var is3dMode by remember { mutableStateOf(false) }

    val dailyPuzzles = PuzzlesRepository.dailyPuzzles
    val activeDaily = dailyPuzzles[dailyIdx.coerceIn(0, dailyPuzzles.lastIndex)]
    val activeMistake = mistakes.getOrNull(mistakeIdx.coerceIn(0, (mistakes.size - 1).coerceAtLeast(0)))

    val currentFen = if (tab == PuzzleTab.DAILY) activeDaily.fen else activeMistake?.fen
    var board by remember(tab, dailyIdx, mistakeIdx, mistakes.size) {
        mutableStateOf(currentFen?.let { ChessBoard.fromFen(it) } ?: ChessBoard.start())
    }

    fun resetPuzzle() {
        board = currentFen?.let { ChessBoard.fromFen(it) } ?: ChessBoard.start()
        showHint = false
        statusMsg = null
        solvedCurrent = false
    }

    val hintMove = remember(board, showHint, tab, dailyIdx, mistakeIdx) {
        if (!showHint) null
        else if (tab == PuzzleTab.DAILY) board.moveFromSan(activeDaily.solutionSan)?.first
        else activeMistake?.let { board.moveFromSan(it.bestSan)?.first }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Header + Stats
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Tactical Puzzles",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = WarmIvory
                )
                Text(
                    text = "Solved: ${stats.solvedCount} • Streak: ${stats.streak} 🔥",
                    fontSize = 12.sp,
                    color = BrushedGold
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(
                    selected = is3dMode,
                    onClick = { is3dMode = !is3dMode },
                    label = { Text(if (is3dMode) "3D" else "2D", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrushedGold,
                        selectedLabelColor = Color(0xFF0B1F17),
                        containerColor = EmeraldSurface,
                        labelColor = BrushedGold
                    )
                )
                FilterChip(
                    selected = tab == PuzzleTab.DAILY,
                    onClick = {
                        tab = PuzzleTab.DAILY
                        resetPuzzle()
                    },
                    label = { Text("Daily", fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrushedGold,
                        selectedLabelColor = Color(0xFF0B1F17),
                        containerColor = EmeraldSurface,
                        labelColor = WarmIvory
                    )
                )
                FilterChip(
                    selected = tab == PuzzleTab.MISTAKES,
                    onClick = {
                        mistakes = PuzzlesRepository.loadMistakes(context)
                        tab = PuzzleTab.MISTAKES
                        resetPuzzle()
                    },
                    label = { Text("Mistakes (${mistakes.size})", fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrushedGold,
                        selectedLabelColor = Color(0xFF0B1F17),
                        containerColor = EmeraldSurface,
                        labelColor = WarmIvory
                    )
                )
            }
        }

        if (tab == PuzzleTab.MISTAKES && activeMistake == null) {
            Surface(
                color = EmeraldSurface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "No Saved Mistakes Yet",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                    Text(
                        text = "Finish a game in Play vs. AI or Online Lobby, open the Post-Game AI Review, and tap 'Save Mistakes' to train on your real blunders here.",
                        fontSize = 13.sp,
                        color = MutedSage
                    )
                }
            }
        } else {
            // Puzzle Info Card
            Surface(
                color = EmeraldSurface,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(14.dp))
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (tab == PuzzleTab.DAILY) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${dailyIdx + 1}/${dailyPuzzles.size} • ${activeDaily.title}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = WarmIvory
                            )
                            Text(
                                text = "${activeDaily.theme} • ${activeDaily.difficulty}",
                                fontSize = 11.sp,
                                color = BrushedGold
                            )
                        }
                        Text(
                            text = if (board.turn == PieceColor.WHITE) "White to move — find the winning tactic!"
                            else "Black to move — find the winning tactic!",
                            fontSize = 12.sp,
                            color = MutedSage
                        )
                    } else if (activeMistake != null) {
                        Text(
                            text = "Mistake #${mistakeIdx + 1}/${mistakes.size} • ${activeMistake.theme}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = WarmIvory
                        )
                        Text(
                            text = "You played ${activeMistake.playedSan}. Find the stronger move!",
                            fontSize = 12.sp,
                            color = MutedSage
                        )
                    }
                }
            }

            // Board
            ChessboardView(
                board = board,
                flipped = board.turn == PieceColor.BLACK && !solvedCurrent,
                is3dMode = is3dMode,
                interactive = !solvedCurrent,
                allowedColor = board.turn,
                hintFrom = hintMove?.fromSquare,
                hintTo = hintMove?.toSquare,
                onMoveSelected = { move ->
                    val san = board.toSan(move)
                    val expectedSan = if (tab == PuzzleTab.DAILY) {
                        activeDaily.solutionSan
                    } else {
                        activeMistake?.bestSan.orEmpty()
                    }
                    val normalize = { s: String -> s.replace("+", "").replace("#", "") }
                    if (san == expectedSan || normalize(san) == normalize(expectedSan)) {
                        board = board.applyMoveUnchecked(move)
                        solvedCurrent = true
                        stats = PuzzlesRepository.recordSolve(context, correct = true)
                        statusMsg = if (tab == PuzzleTab.DAILY) {
                            "Brilliant! ${activeDaily.explanation}"
                        } else {
                            "Solved! ${activeMistake?.explanation.orEmpty()}"
                        }
                    } else {
                        stats = PuzzlesRepository.recordSolve(context, correct = false)
                        statusMsg = "Not quite ($san). Try another tactical idea!"
                    }
                }
            )

            // Feedback / Hint Banner
            if (showHint && !solvedCurrent) {
                Surface(
                    color = EmeraldElevated,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BrushedGold.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                ) {
                    Text(
                        text = if (tab == PuzzleTab.DAILY) "Hint: ${activeDaily.hint}"
                        else "Hint: Look closely at ${activeMistake?.bestFrom} → ${activeMistake?.bestTo}",
                        fontSize = 12.sp,
                        color = BrushedGold,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            statusMsg?.let { msg ->
                val color = if (solvedCurrent) EmeraldSuccess else CrimsonAlert
                Surface(
                    color = color.copy(alpha = 0.14f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                ) {
                    Text(
                        text = msg,
                        fontSize = 13.sp,
                        color = WarmIvory,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { showHint = !showHint },
                    modifier = Modifier.weight(1f)
                ) {
                    Text(if (showHint) "Hide Hint" else "Hint", color = BrushedGold, fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = { resetPuzzle() },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Reset", color = WarmIvory, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.width(2.dp))
                Button(
                    onClick = {
                        if (tab == PuzzleTab.DAILY) {
                            dailyIdx = (dailyIdx + 1) % dailyPuzzles.size
                        } else if (mistakes.isNotEmpty()) {
                            mistakeIdx = (mistakeIdx + 1) % mistakes.size
                        }
                        resetPuzzle()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrushedGold,
                        contentColor = Color(0xFF0B1F17)
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Next", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}
