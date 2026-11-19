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
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
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
import com.choiceclash.chess.audio.ChessSoundEffects
import com.choiceclash.chess.chess.AiDifficulty
import com.choiceclash.chess.chess.AiPersonality
import com.choiceclash.chess.chess.ChessAiEngine
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.GameReviewReport
import com.choiceclash.chess.chess.OpeningsBook
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PositionEvaluation
import com.choiceclash.chess.chess.PuzzlesRepository
import com.choiceclash.chess.chess.RpgCameraPreset
import com.choiceclash.chess.chess.RpgRealmEnvironment
import com.choiceclash.chess.chess.RpgRepository
import com.choiceclash.chess.ui.components.AiReviewDialog
import com.choiceclash.chess.ui.components.CapturedPiecesBar
import com.choiceclash.chess.ui.components.ChessboardView
import com.choiceclash.chess.ui.components.EvalBarView
import com.choiceclash.chess.ui.components.MoveHistoryStrip
import com.choiceclash.chess.ui.components.RpgBossAndHeroHud
import com.choiceclash.chess.ui.components.RpgCameraAndRealmBar
import com.choiceclash.chess.ui.components.formatClockSeconds
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

private enum class TimeControl(val label: String, val initialSec: Int, val incrementSec: Int) {
    UNTIMED("Untimed", 0, 0),
    BLITZ("3+2", 180, 2),
    RAPID("10+0", 600, 0),
}

@Composable
fun AiArenaScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var difficulty by remember { mutableStateOf(AiDifficulty.CLUB) }
    var personality by remember { mutableStateOf(AiPersonality.BALANCED) }
    var playerColor by remember { mutableStateOf(PieceColor.WHITE) }
    var isPassAndPlay by remember { mutableStateOf(false) }
    var autoFlipPassAndPlay by remember { mutableStateOf(true) }
    var cameraPreset by remember { mutableStateOf(RpgCameraPreset.ISOMETRIC_RPG) }
    var yawOffset by remember { mutableFloatStateOf(0f) }
    var realmEnvironment by remember { mutableStateOf(RpgRealmEnvironment.EMERALD_COURTYARD) }
    var heroProfile by remember { mutableStateOf(RpgRepository.loadProfile(context)) }
    var combatBanner by remember { mutableStateOf<String?>(null) }
    var soundEnabled by remember { mutableStateOf(ChessSoundEffects.enabled) }
    var timeControl by remember { mutableStateOf(TimeControl.UNTIMED) }
    var whiteTimeSec by remember { mutableIntStateOf(0) }
    var blackTimeSec by remember { mutableIntStateOf(0) }
    var timeoutWinner by remember { mutableStateOf<PieceColor?>(null) }

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

    val isGameOver = resigned || timeoutWinner != null || board.isGameOver()
    val opening = remember(historySan) { OpeningsBook.detect(historySan) }

    fun resetGame(newColor: PieceColor = playerColor, newTc: TimeControl = timeControl) {
        playerColor = newColor
        timeControl = newTc
        whiteTimeSec = newTc.initialSec
        blackTimeSec = newTc.initialSec
        timeoutWinner = null
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

    // Live clock countdown when timed mode is active
    LaunchedEffect(timeControl, board.turn, isGameOver, historySan.size) {
        if (timeControl == TimeControl.UNTIMED || isGameOver || historySan.isEmpty()) return@LaunchedEffect
        while (!isGameOver) {
            delay(1000)
            if (board.turn == PieceColor.WHITE) {
                whiteTimeSec = (whiteTimeSec - 1).coerceAtLeast(0)
                if (whiteTimeSec == 0) {
                    timeoutWinner = PieceColor.BLACK
                    ChessSoundEffects.playGameOver()
                    break
                }
            } else {
                blackTimeSec = (blackTimeSec - 1).coerceAtLeast(0)
                if (blackTimeSec == 0) {
                    timeoutWinner = PieceColor.WHITE
                    ChessSoundEffects.playGameOver()
                    break
                }
            }
        }
    }

    // Update evaluation asynchronously whenever board changes
    LaunchedEffect(board) {
        evaluation = withContext(Dispatchers.Default) {
            ChessAiEngine.evaluatePosition(board)
        }
    }

    // Trigger AI move when it's AI's turn (disabled in Pass & Play 2-player local mode)
    LaunchedEffect(board, playerColor, isGameOver, difficulty, personality, isPassAndPlay) {
        if (!isPassAndPlay && !isGameOver && board.turn != playerColor) {
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
                if (timeControl != TimeControl.UNTIMED && timeControl.incrementSec > 0) {
                    if (playerColor == PieceColor.WHITE) blackTimeSec += timeControl.incrementSec
                    else whiteTimeSec += timeControl.incrementSec
                }
                when {
                    nextBoard.isGameOver() -> ChessSoundEffects.playGameOver()
                    nextBoard.inCheck() -> ChessSoundEffects.playCheck()
                    result.move.captured != null -> ChessSoundEffects.playCapture()
                    else -> ChessSoundEffects.playMove()
                }
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
        timeoutWinner != null -> "${if (timeoutWinner == PieceColor.WHITE) "White" else "Black"} wins on time!"
        resigned -> if (isPassAndPlay) "${if (board.turn == PieceColor.WHITE) "Black" else "White"} wins by resignation" else "You resigned — AI wins"
        board.isCheckmate() -> {
            val winner = if (board.turn == PieceColor.WHITE) "Black" else "White"
            "Checkmate! $winner wins"
        }
        board.isStalemate() -> "Draw by stalemate"
        board.isGameOver() -> "Draw"
        aiThinking -> "AI (${difficulty.label}) is thinking..."
        isPassAndPlay -> "${if (board.turn == PieceColor.WHITE) "White (Player 1)" else "Black (Player 2)"} to move${if (board.inCheck()) " • Check!" else ""}"
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
                    text = if (isPassAndPlay) "2P Pass & Play" else "AI Arena",
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
                    selected = isPassAndPlay,
                    onClick = {
                        isPassAndPlay = !isPassAndPlay
                        resetGame()
                    },
                    label = { Text(if (isPassAndPlay) "👥 2P" else "🤖 AI", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrushedGold,
                        selectedLabelColor = Color(0xFF0B1F17),
                        containerColor = EmeraldSurface,
                        labelColor = WarmIvory
                    )
                )
                FilterChip(
                    selected = soundEnabled,
                    onClick = {
                        soundEnabled = !soundEnabled
                        ChessSoundEffects.enabled = soundEnabled
                    },
                    label = { Text(if (soundEnabled) "🔊" else "🔇", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = EmeraldElevated,
                        selectedLabelColor = BrushedGold,
                        containerColor = EmeraldSurface,
                        labelColor = MutedSage
                    )
                )
                FilterChip(
                    selected = cameraPreset.is3d,
                    onClick = {
                        cameraPreset = if (cameraPreset.is3d) RpgCameraPreset.TACTICAL_2D else RpgCameraPreset.ISOMETRIC_RPG
                    },
                    label = { Text(if (cameraPreset.is3d) "3D RPG" else "2D", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrushedGold,
                        selectedLabelColor = Color(0xFF0B1F17),
                        containerColor = EmeraldSurface,
                        labelColor = BrushedGold
                    )
                )
                if (isPassAndPlay) {
                    FilterChip(
                        selected = autoFlipPassAndPlay,
                        onClick = { autoFlipPassAndPlay = !autoFlipPassAndPlay },
                        label = { Text("Flip", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldElevated,
                            selectedLabelColor = BrushedGold,
                            containerColor = EmeraldSurface,
                            labelColor = MutedSage
                        )
                    )
                } else {
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
            Spacer(modifier = Modifier.width(4.dp))
            TimeControl.entries.forEach { tc ->
                FilterChip(
                    selected = timeControl == tc,
                    onClick = { resetGame(playerColor, tc) },
                    label = { Text(tc.label, fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = EmeraldElevated,
                        selectedLabelColor = BrushedGold,
                        containerColor = EmeraldSurface,
                        labelColor = MutedSage
                    )
                )
            }
        }

        if (timeControl != TimeControl.UNTIMED) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Surface(
                    color = if (board.turn == PieceColor.WHITE && !isGameOver) BrushedGold.copy(alpha = 0.2f) else EmeraldSurface,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp))
                ) {
                    Text(
                        text = "♔ ${formatClockSeconds(whiteTimeSec)}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
                Surface(
                    color = if (board.turn == PieceColor.BLACK && !isGameOver) BrushedGold.copy(alpha = 0.2f) else EmeraldSurface,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp))
                ) {
                    Text(
                        text = "♚ ${formatClockSeconds(blackTimeSec)}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrushedGold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // 3D RPG Camera & Realm Selector + Hero/Boss HP HUD
        RpgCameraAndRealmBar(
            cameraPreset = cameraPreset,
            onSelectCamera = { cameraPreset = it },
            yawOffset = yawOffset,
            onRotateYaw = { yawOffset = it },
            realm = realmEnvironment,
            onSelectRealm = { realmEnvironment = it }
        )

        if (cameraPreset.is3d) {
            val heroHp = remember(board, playerColor) { RpgRepository.calculateArmyHp(board, playerColor) }
            val bossHp = remember(board, playerColor) { RpgRepository.calculateArmyHp(board, playerColor.opposite()) }
            RpgBossAndHeroHud(
                heroProfile = heroProfile,
                heroHp = heroHp,
                bossName = "${difficulty.label} AI",
                bossTitle = personality.label,
                bossHp = bossHp,
                dialogue = "3D RPG Arena • ${realmEnvironment.title}",
                combatBanner = combatBanner
            )
        }

        // Live Eval Bar + Captured Pieces
        EvalBarView(evaluation = evaluation)
        CapturedPiecesBar(board = board)

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
            flipped = if (isPassAndPlay) (autoFlipPassAndPlay && board.turn == PieceColor.BLACK) else (playerColor == PieceColor.BLACK),
            cameraPreset = cameraPreset,
            yawOffset = yawOffset,
            realmEnvironment = realmEnvironment,
            interactive = !isGameOver && !aiThinking && (isPassAndPlay || board.turn == playerColor),
            allowedColor = if (isPassAndPlay) board.turn else playerColor,
            lastMoveFrom = lastMoveFrom,
            lastMoveTo = lastMoveTo,
            hintFrom = hintFrom,
            hintTo = hintTo,
            onMoveSelected = { move ->
                val movingColor = board.turn
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
                combatBanner = RpgRepository.combatPopupForMove(move, nextBoard)
                if (move.captured != null) {
                    heroProfile = RpgRepository.awardRewards(context, xpGain = 15, goldGain = 5)
                }
                if (timeControl != TimeControl.UNTIMED && timeControl.incrementSec > 0) {
                    if (movingColor == PieceColor.WHITE) whiteTimeSec += timeControl.incrementSec
                    else blackTimeSec += timeControl.incrementSec
                }
            }
        )

        MoveHistoryStrip(historySan = historySan)

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
                    if (!isGameOver && (isPassAndPlay || board.turn == playerColor)) {
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
                    val dropCount = if (isPassAndPlay) 1 else 2
                    if (!aiThinking && boardStack.size > dropCount) {
                        val newStack = boardStack.dropLast(dropCount)
                        boardStack = newStack
                        board = newStack.last()
                        historySan = historySan.dropLast(dropCount)
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
