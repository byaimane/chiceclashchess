package com.choiceclash.chess.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.chess.AiDifficulty
import com.choiceclash.chess.chess.AiPersonality
import com.choiceclash.chess.chess.ChessAiEngine
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.GameReviewReport
import com.choiceclash.chess.chess.OpeningsBook
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PositionEvaluation
import com.choiceclash.chess.chess.PuzzlesRepository
import com.choiceclash.chess.ui.components.AiReviewDialog
import com.choiceclash.chess.ui.components.ChessboardView
import com.choiceclash.chess.ui.components.EvalBarView
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun AiArenaScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var difficulty by remember { mutableStateOf(AiDifficulty.CLUB) }
    var personality by remember { mutableStateOf(AiPersonality.BALANCED) }
    var playerColor by remember { mutableStateOf(PieceColor.WHITE) }
    var is3dMode by remember { mutableStateOf(false) }

    var board by remember { mutableStateOf(ChessBoard.start()) }
    var boardStack by remember { mutableStateOf(listOf(ChessBoard.start())) }
    var historySan by remember { mutableStateOf<List<String>>(emptyList()) }
    var lastMoveFrom by remember { mutableStateOf<String?>(null) }
    var lastMoveTo by remember { mutableStateOf<String?>(null) }
    var hintFrom by remember { mutableStateOf<String?>(null) }
    var hintTo by remember { mutableStateOf<String?>(null) }
    var hintText by remember { mutableStateOf<String?>(null) }
    var resigned by remember { mutableStateOf(false) }
    var aiThinking by remember { mutableStateOf(false) }

    var evaluation by remember {
        mutableStateOf(PositionEvaluation(0, "0.0", 0.5f))
    }
    var coachQuestion by remember { mutableStateOf("") }
    var coachAnswer by remember {
        mutableStateOf("Ask me about threats, plans, or the current opening!")
    }
    var reviewReport by remember { mutableStateOf<GameReviewReport?>(null) }
    var mistakesSaved by remember { mutableStateOf(false) }

    val isGameOver = resigned || board.isGameOver()
    val opening = remember(historySan) { OpeningsBook.detect(historySan) }

    fun resetGame(newColor: PieceColor = playerColor) {
        playerColor = newColor
        val start = ChessBoard.start()
        board = start
        boardStack = listOf(start)
        historySan = emptyList()
        lastMoveFrom = null
        lastMoveTo = null
        hintFrom = null
        hintTo = null
        hintText = null
        resigned = false
        aiThinking = false
        reviewReport = null
        mistakesSaved = false
        coachAnswer = "New match started! Ask me for a plan anytime."
    }

    // Update evaluation asynchronously whenever board changes
    LaunchedEffect(board) {
        evaluation = withContext(Dispatchers.Default) {
            ChessAiEngine.evaluatePosition(board)
        }
    }

    // Trigger AI move when it's AI's turn
    LaunchedEffect(board, playerColor, isGameOver, difficulty, personality) {
        if (!isGameOver && board.turn != playerColor) {
            aiThinking = true
            delay(220)
            val result = withContext(Dispatchers.Default) {
                ChessAiEngine.getBestMove(board, difficulty, personality)
            }
            if (result != null) {
                val nextBoard = board.applyMoveUnchecked(result.move)
                board = nextBoard
                boardStack = boardStack + nextBoard
                historySan = historySan + result.san
                lastMoveFrom = result.move.fromSquare
                lastMoveTo = result.move.toSquare
                hintFrom = null
                hintTo = null
                hintText = null
            }
            aiThinking = false
        }
    }

    reviewReport?.let { report ->
        AiReviewDialog(
            report = report,
            mistakesSaved = mistakesSaved,
            onSaveMistakes = {
                val existing = PuzzlesRepository.loadMistakes(context)
                val merged = (report.mistakePuzzles + existing).distinctBy { it.id }.take(30)
                PuzzlesRepository.saveMistakes(context, merged)
                mistakesSaved = true
            },
            onDismiss = { reviewReport = null }
        )
    }

    val statusLabel = when {
        resigned -> "You resigned — AI wins"
        board.isCheckmate() -> {
            val winner = if (board.turn == PieceColor.WHITE) "Black" else "White"
            "Checkmate! $winner wins"
        }
        board.isStalemate() -> "Draw by stalemate"
        board.isGameOver() -> "Draw"
        aiThinking -> "AI (${difficulty.label}) is thinking..."
        board.inCheck() -> "Check! Your move"
        board.turn == playerColor -> "Your turn (${if (playerColor == PieceColor.WHITE) "White" else "Black"})"
        else -> "AI's turn"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Header + Opening badge
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "AI Arena",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = WarmIvory
                )
                Text(
                    text = statusLabel,
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
                PieceColor.entries.forEach { side ->
                    FilterChip(
                        selected = playerColor == side,
                        onClick = { resetGame(side) },
                        label = { Text(if (side == PieceColor.WHITE) "♔ White" else "♚ Black", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrushedGold,
                            selectedLabelColor = Color(0xFF0B1F17),
                            containerColor = EmeraldSurface,
                            labelColor = WarmIvory
                        )
                    )
                }
            }
        }

        // Difficulty & Personality selectors
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            AiDifficulty.entries.forEach { diff ->
                FilterChip(
                    selected = difficulty == diff,
                    onClick = { difficulty = diff },
                    label = { Text(diff.label, fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = EmeraldElevated,
                        selectedLabelColor = BrushedGold,
                        containerColor = EmeraldSurface,
                        labelColor = MutedSage
                    )
                )
            }
            Spacer(modifier = Modifier.width(4.dp))
            AiPersonality.entries.forEach { pers ->
                FilterChip(
                    selected = personality == pers,
                    onClick = { personality = pers },
                    label = { Text(pers.label, fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = EmeraldElevated,
                        selectedLabelColor = BrushedGold,
                        containerColor = EmeraldSurface,
                        labelColor = MutedSage
                    )
                )
            }
        }

        // Live Eval Bar + Opening Badge
        EvalBarView(evaluation = evaluation)

        opening?.let { op ->
            Surface(
                color = EmeraldSurface,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(10.dp))
            ) {
                Text(
                    text = "Opening: ${op.eco} • ${op.name}",
                    fontSize = 12.sp,
                    color = BrushedGold,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }

        // Chessboard
        ChessboardView(
            board = board,
            flipped = playerColor == PieceColor.BLACK,
            is3dMode = is3dMode,
            interactive = !isGameOver && !aiThinking && board.turn == playerColor,
            allowedColor = playerColor,
            lastMoveFrom = lastMoveFrom,
            lastMoveTo = lastMoveTo,
            hintFrom = hintFrom,
            hintTo = hintTo,
            onMoveSelected = { move ->
                val san = board.toSan(move)
                val nextBoard = board.applyMoveUnchecked(move)
                board = nextBoard
                boardStack = boardStack + nextBoard
                historySan = historySan + san
                lastMoveFrom = move.fromSquare
                lastMoveTo = move.toSquare
                hintFrom = null
                hintTo = null
                hintText = null
            }
        )

        hintText?.let { txt ->
            Surface(
                color = EmeraldElevated,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BrushedGold.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            ) {
                Text(
                    text = txt,
                    fontSize = 12.sp,
                    color = BrushedGold,
                    modifier = Modifier.padding(10.dp)
                )
            }
        }

        // Action Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            OutlinedButton(
                onClick = {
                    if (!isGameOver && board.turn == playerColor) {
                        scope.launch {
                            val hint = withContext(Dispatchers.Default) {
                                ChessAiEngine.getBestMove(board, AiDifficulty.MASTER, AiPersonality.BALANCED)
                            }
                            if (hint != null) {
                                hintFrom = hint.move.fromSquare
                                hintTo = hint.move.toSquare
                                hintText = "Smart Hint: ${hint.san} — ${hint.explanation}"
                            }
                        }
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Hint", fontSize = 11.sp, color = BrushedGold)
            }
            OutlinedButton(
                onClick = {
                    if (!aiThinking && boardStack.size >= 3) {
                        val newStack = boardStack.dropLast(2)
                        boardStack = newStack
                        board = newStack.last()
                        historySan = historySan.dropLast(2)
                        lastMoveFrom = null
                        lastMoveTo = null
                        hintFrom = null
                        hintTo = null
                        hintText = null
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Undo", fontSize = 11.sp, color = WarmIvory)
            }
            OutlinedButton(
                onClick = {
                    if (!isGameOver && historySan.isNotEmpty()) resigned = true
                    else resetGame()
                },
                modifier = Modifier.weight(1f)
            ) {
                Text(if (isGameOver) "New" else "Resign", fontSize = 11.sp, color = WarmIvory)
            }
            Button(
                onClick = {
                    if (historySan.isNotEmpty()) {
                        scope.launch {
                            reviewReport = withContext(Dispatchers.Default) {
                                ChessAiEngine.analyzeGameHistory(historySan)
                            }
                        }
                    }
                },
                enabled = historySan.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrushedGold,
                    contentColor = Color(0xFF0B1F17)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text("Review", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Interactive AI Coach
        Surface(
            color = EmeraldSurface,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, EmeraldBorder, RoundedCornerShape(14.dp))
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "AI Coach",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrushedGold
                )
                Text(
                    text = coachAnswer,
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = WarmIvory
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("Best plan?", "Any threats?", "Opening tip", "Endgame advice").forEach { prompt ->
                        FilterChip(
                            selected = false,
                            onClick = {
                                scope.launch {
                                    coachAnswer = withContext(Dispatchers.Default) {
                                        ChessAiEngine.askCoach(board, historySan, prompt)
                                    }
                                }
                            },
                            label = { Text(prompt, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = EmeraldElevated,
                                labelColor = WarmIvory
                            )
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = coachQuestion,
                        onValueChange = { coachQuestion = it },
                        placeholder = { Text("Ask your AI Coach...", fontSize = 12.sp, color = MutedSage) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrushedGold,
                            unfocusedBorderColor = EmeraldBorder,
                            focusedTextColor = WarmIvory,
                            unfocusedTextColor = WarmIvory
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = {
                            val q = coachQuestion.trim()
                            if (q.isNotEmpty()) {
                                coachQuestion = ""
                                scope.launch {
                                    coachAnswer = withContext(Dispatchers.Default) {
                                        ChessAiEngine.askCoach(board, historySan, q)
                                    }
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrushedGold,
                            contentColor = Color(0xFF0B1F17)
                        )
                    ) {
                        Text("Ask", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
