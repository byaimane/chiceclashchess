package com.choiceclash.chess.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.audio.ChessSoundEffects
import com.choiceclash.chess.chess.AdventureNode
import com.choiceclash.chess.chess.AdventureProgress
import com.choiceclash.chess.chess.AdventureRepository
import com.choiceclash.chess.chess.AiDifficulty
import com.choiceclash.chess.chess.ChessAiEngine
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PositionEvaluation
import com.choiceclash.chess.chess.RpgCameraPreset
import com.choiceclash.chess.chess.RpgHeroProfile
import com.choiceclash.chess.chess.RpgRealmEnvironment
import com.choiceclash.chess.chess.RpgRelic
import com.choiceclash.chess.chess.RpgRepository
import com.choiceclash.chess.ui.components.CapturedPiecesBar
import com.choiceclash.chess.ui.components.ChessboardView
import com.choiceclash.chess.ui.components.EvalBarView
import com.choiceclash.chess.ui.components.MoveHistoryStrip
import com.choiceclash.chess.ui.components.RpgBossAndHeroHud
import com.choiceclash.chess.ui.components.RpgCameraAndRealmBar
import com.choiceclash.chess.ui.components.RpgRelicActionBar
import com.choiceclash.chess.ui.components.formatClockSeconds
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.CrimsonAlert
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSuccess
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun AdventureScreen() {
    val context = LocalContext.current
    var progress by remember { mutableStateOf(AdventureRepository.loadProgress(context)) }
    var heroProfile by remember { mutableStateOf(RpgRepository.loadProfile(context)) }
    var activeNode by remember { mutableStateOf<AdventureNode?>(null) }

    val node = activeNode
    if (node == null) {
        AdventureWorldMap(
            progress = progress,
            heroProfile = heroProfile,
            onSelectNode = { selected -> activeNode = selected }
        )
    } else {
        AdventureStageBattle(
            node = node,
            heroProfile = heroProfile,
            onHeroProfileUpdated = { heroProfile = it },
            onBackToMap = { activeNode = null },
            onVictoryRecorded = { newProgress ->
                progress = newProgress
            },
            onNextNode = { nextId ->
                activeNode = AdventureRepository.nodes.find { it.id == nextId }
            }
        )
    }
}

@Composable
private fun AdventureWorldMap(
    progress: AdventureProgress,
    heroProfile: RpgHeroProfile,
    onSelectNode: (AdventureNode) -> Unit
) {
    val playerTitle = remember(progress) { AdventureRepository.currentPlayerTitle(progress) }
    val realms = remember { AdventureRepository.nodes.groupBy { it.realmNumber } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // RPG Hero Odyssey Banner
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = Color.Transparent,
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BrushedGold.copy(alpha = 0.45f), RoundedCornerShape(18.dp))
                .background(
                    Brush.linearGradient(
                        listOf(EmeraldElevated, EmeraldSurface, Color(0xFF0E251B))
                    ),
                    RoundedCornerShape(18.dp)
                )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "3D RPG ODYSSEY • LV.${heroProfile.level} ${heroProfile.heroTitle.uppercase()}",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.1.sp,
                            color = BrushedGold
                        )
                        Text(
                            text = playerTitle,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = WarmIvory
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Surface(
                            color = EmeraldVoid.copy(alpha = 0.7f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.border(1.dp, EmeraldBorder, RoundedCornerShape(10.dp))
                        ) {
                            Text(
                                text = "🪙 ${heroProfile.gold}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrushedGold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                            )
                        }
                        Surface(
                            color = BrushedGold.copy(alpha = 0.16f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.border(1.dp, BrushedGold.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                        ) {
                            Text(
                                text = "★ ${progress.totalStars}/${AdventureRepository.nodes.size * 3}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrushedGold,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp)
                            )
                        }
                    }
                }

                // XP Progress Bar
                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Commander XP: ${heroProfile.xpInLevel} / ${heroProfile.xpForNextLevel}",
                            fontSize = 11.sp,
                            color = MutedSage
                        )
                        Text(
                            text = "Stage ${progress.unlockedLevel} of ${AdventureRepository.nodes.size}",
                            fontSize = 11.sp,
                            color = BrushedGold
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(EmeraldVoid)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(
                                    (heroProfile.xpInLevel.toFloat() / heroProfile.xpForNextLevel).coerceIn(0.05f, 1f)
                                )
                                .fillMaxHeight()
                                .background(BrushedGold)
                        )
                    }
                }
            }
        }

        // Winding Kingdom Map by Realm
        realms.forEach { (realmNum, realmNodes) ->
            val realmName = realmNodes.firstOrNull()?.realmName.orEmpty()
            val realmUnlocked = realmNodes.any { it.id <= progress.unlockedLevel }
            val env = RpgRealmEnvironment.forRealm(realmNum)

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "REALM $realmNum • ${realmName.uppercase()}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp,
                        color = if (realmUnlocked) BrushedGold else MutedSage
                    )
                    Text(
                        text = env.badge,
                        fontSize = 11.sp,
                        color = MutedSage
                    )
                }

                realmNodes.forEachIndexed { index, node ->
                    val unlocked = node.id <= progress.unlockedLevel
                    val stars = progress.starsByLevel[node.id] ?: 0
                    val isFrontier = node.id == progress.unlockedLevel

                    val horizontalBias = when (node.id % 4) {
                        1 -> Alignment.Start
                        2 -> Alignment.CenterHorizontally
                        3 -> Alignment.End
                        else -> Alignment.CenterHorizontally
                    }

                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = when (horizontalBias) {
                            Alignment.Start -> Alignment.CenterStart
                            Alignment.End -> Alignment.CenterEnd
                            else -> Alignment.Center
                        }
                    ) {
                        AdventureNodeCard(
                            node = node,
                            unlocked = unlocked,
                            isFrontier = isFrontier,
                            stars = stars,
                            onClick = { if (unlocked) onSelectNode(node) },
                            modifier = Modifier.fillMaxWidth(0.88f)
                        )
                    }

                    if (index < realmNodes.lastIndex || realmNum < realms.size) {
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(3.dp)
                                    .height(14.dp)
                                    .background(
                                        if (node.id < progress.unlockedLevel) BrushedGold
                                        else EmeraldBorder
                                    )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdventureNodeCard(
    node: AdventureNode,
    unlocked: Boolean,
    isFrontier: Boolean,
    stars: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = when {
        isFrontier -> BrushedGold
        stars > 0 -> EmeraldSuccess.copy(alpha = 0.7f)
        unlocked -> EmeraldBorder
        else -> EmeraldBorder.copy(alpha = 0.4f)
    }

    Surface(
        color = if (unlocked) EmeraldSurface else EmeraldVoid.copy(alpha = 0.7f),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
            .border(if (isFrontier) 1.5.dp else 1.dp, borderColor, RoundedCornerShape(16.dp))
            .clip(RoundedCornerShape(16.dp))
            .clickable(enabled = unlocked, onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            isFrontier -> BrushedGold.copy(alpha = 0.22f)
                            stars > 0 -> EmeraldSuccess.copy(alpha = 0.18f)
                            unlocked -> EmeraldElevated
                            else -> Color(0xFF0A1711)
                        }
                    )
                    .border(1.dp, borderColor, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (!unlocked) {
                    Icon(
                        imageVector = Icons.Rounded.Lock,
                        contentDescription = "Locked",
                        tint = MutedSage,
                        modifier = Modifier.size(20.dp)
                    )
                } else {
                    Text(
                        text = if (isFrontier) "♔" else node.nodeType.iconGlyph,
                        fontSize = 22.sp,
                        color = if (isFrontier) BrushedGold else WarmIvory
                    )
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "STAGE ${node.id} • ${node.nodeType.badge.uppercase()}",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isFrontier) BrushedGold else MutedSage
                    )
                    if (node.timeLimitSec > 0) {
                        Text(
                            text = "• ${node.timeLimitSec / 60}m",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = CrimsonAlert
                        )
                    }
                }
                Text(
                    text = node.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (unlocked) WarmIvory else MutedSage
                )
                Text(
                    text = "${node.guardianName} (${node.difficulty.label}) — ${node.subtitle}",
                    fontSize = 11.sp,
                    lineHeight = 15.sp,
                    color = MutedSage
                )
            }

            if (unlocked) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(1.dp)) {
                        for (i in 1..3) {
                            Icon(
                                imageVector = if (i <= stars) Icons.Rounded.Star else Icons.Rounded.StarBorder,
                                contentDescription = null,
                                tint = if (i <= stars) BrushedGold else MutedSage.copy(alpha = 0.5f),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                    Text(
                        text = if (stars > 0) "Replay 3D" else "Battle 3D",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrushedGold
                    )
                }
            }
        }
    }
}

@Composable
private fun AdventureStageBattle(
    node: AdventureNode,
    heroProfile: RpgHeroProfile,
    onHeroProfileUpdated: (RpgHeroProfile) -> Unit,
    onBackToMap: () -> Unit,
    onVictoryRecorded: (AdventureProgress) -> Unit,
    onNextNode: (Int) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val startBoard = remember(node.id) { ChessBoard.fromFen(node.startFen) }
    var board by remember(node.id) { mutableStateOf(startBoard) }
    var boardStack by remember(node.id) { mutableStateOf(listOf(startBoard)) }
    var historySan by remember(node.id) { mutableStateOf<List<String>>(emptyList()) }
    var lastMoveFrom by remember(node.id) { mutableStateOf<String?>(null) }
    var lastMoveTo by remember(node.id) { mutableStateOf<String?>(null) }
    var hintFrom by remember(node.id) { mutableStateOf<String?>(null) }
    var hintTo by remember(node.id) { mutableStateOf<String?>(null) }
    var hintText by remember(node.id) { mutableStateOf<String?>(null) }

    var cameraPreset by remember { mutableStateOf(RpgCameraPreset.ISOMETRIC_RPG) }
    var yawOffset by remember { mutableFloatStateOf(0f) }
    val realmEnvironment = remember(node.realmNumber) { RpgRealmEnvironment.forRealm(node.realmNumber) }

    var aiThinking by remember(node.id) { mutableStateOf(false) }
    var remainingSec by remember(node.id) { mutableIntStateOf(node.timeLimitSec) }
    var timedOut by remember(node.id) { mutableStateOf(false) }
    var earnedStars by remember(node.id) { mutableIntStateOf(0) }
    var victoryHandled by remember(node.id) { mutableStateOf(false) }
    var evaluation by remember { mutableStateOf(PositionEvaluation(0, "0.0", 0.5f)) }

    var usedRelics by remember(node.id) { mutableStateOf(emptySet<RpgRelic>()) }
    var bossDialogue by remember(node.id) {
        mutableStateOf("${node.guardianName}: \"Welcome to ${node.title}. Prepare your army!\"")
    }
    var combatBanner by remember(node.id) { mutableStateOf<String?>(null) }

    val heroHp = remember(board) { RpgRepository.calculateArmyHp(board, PieceColor.WHITE) }
    val bossHp = remember(board) { RpgRepository.calculateArmyHp(board, PieceColor.BLACK) }

    val playerWon = board.isCheckmate() && board.turn == PieceColor.BLACK
    val isGameOver = timedOut || board.isGameOver()

    fun restartStage() {
        val fresh = ChessBoard.fromFen(node.startFen)
        board = fresh
        boardStack = listOf(fresh)
        historySan = emptyList()
        lastMoveFrom = null
        lastMoveTo = null
        hintFrom = null
        hintTo = null
        hintText = null
        aiThinking = false
        remainingSec = node.timeLimitSec
        timedOut = false
        earnedStars = 0
        victoryHandled = false
        usedRelics = emptySet()
        combatBanner = null
        bossDialogue = "${node.guardianName}: \"Let us clash again at ${node.title}!\""
    }

    // Record victory and unlock next place on map + award RPG XP & Gold
    LaunchedEffect(playerWon) {
        if (playerWon && !victoryHandled) {
            victoryHandled = true
            val (updated, stars) = AdventureRepository.recordVictory(
                context = context,
                levelId = node.id,
                pliesCount = historySan.size
            )
            earnedStars = stars
            onVictoryRecorded(updated)
            val updatedHero = RpgRepository.awardRewards(
                context = context,
                xpGain = 110 + stars * 30,
                goldGain = 35 + stars * 15
            )
            onHeroProfileUpdated(updatedHero)
            ChessSoundEffects.playGameOver()
        }
    }

    // Eval updates
    LaunchedEffect(board) {
        evaluation = withContext(Dispatchers.Default) {
            ChessAiEngine.evaluatePosition(board)
        }
    }

    // Optional Blitz / Boss timer
    LaunchedEffect(node.id, isGameOver, historySan.size) {
        if (node.timeLimitSec <= 0 || isGameOver || historySan.isEmpty()) return@LaunchedEffect
        while (!isGameOver && remainingSec > 0) {
            delay(1000)
            if (board.turn == PieceColor.WHITE) {
                remainingSec = (remainingSec - 1).coerceAtLeast(0)
                if (remainingSec == 0) {
                    timedOut = true
                    ChessSoundEffects.playGameOver()
                }
            }
        }
    }

    // AI guardian turn
    LaunchedEffect(board, isGameOver) {
        if (!isGameOver && board.turn == PieceColor.BLACK) {
            aiThinking = true
            delay(240)
            val result = withContext(Dispatchers.Default) {
                ChessAiEngine.getBestMove(board, node.difficulty, node.personality)
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
                combatBanner = RpgRepository.combatPopupForMove(result.move, nextBoard)
                bossDialogue = RpgRepository.bossDialogue(node.guardianName, result.move, nextBoard)
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        // Header bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(onClick = onBackToMap) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                        contentDescription = "Back to Map",
                        tint = WarmIvory,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Map", fontSize = 11.sp, color = WarmIvory)
                }
                Column {
                    Text(
                        text = "Stage ${node.id}: ${node.title}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                    Text(
                        text = "${realmEnvironment.badge} • ${node.difficulty.label}",
                        fontSize = 11.sp,
                        color = BrushedGold
                    )
                }
            }

            if (node.timeLimitSec > 0) {
                Surface(
                    color = EmeraldSurface,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp))
                ) {
                    Text(
                        text = formatClockSeconds(remainingSec),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (remainingSec <= 20) CrimsonAlert else BrushedGold,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // RPG Boss & Hero HP Bar + Dialogue
        RpgBossAndHeroHud(
            heroProfile = heroProfile,
            heroHp = heroHp,
            bossName = node.guardianName,
            bossTitle = node.nodeType.badge,
            bossHp = bossHp,
            dialogue = bossDialogue,
            combatBanner = combatBanner
        )

        // 3D Camera Orbit & Perspective Bar
        RpgCameraAndRealmBar(
            cameraPreset = cameraPreset,
            onSelectCamera = { cameraPreset = it },
            yawOffset = yawOffset,
            onRotateYaw = { yawOffset = it },
            realm = realmEnvironment
        )

        EvalBarView(evaluation = evaluation)
        CapturedPiecesBar(board = board)

        ChessboardView(
            board = board,
            flipped = false,
            cameraPreset = cameraPreset,
            yawOffset = yawOffset,
            realmEnvironment = realmEnvironment,
            interactive = !isGameOver && !aiThinking && board.turn == PieceColor.WHITE,
            allowedColor = PieceColor.WHITE,
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
                combatBanner = RpgRepository.combatPopupForMove(move, nextBoard)
                bossDialogue = RpgRepository.bossDialogue(node.guardianName, move, nextBoard)
                if (move.captured != null) {
                    val updatedHero = RpgRepository.awardRewards(
                        context = context,
                        xpGain = 15,
                        goldGain = 5
                    )
                    onHeroProfileUpdated(updatedHero)
                }
            }
        )

        // Active RPG Relics Bar
        if (!isGameOver) {
            RpgRelicActionBar(
                usedRelics = usedRelics,
                showChronos = node.timeLimitSec > 0,
                onActivateRelic = { relic ->
                    when (relic) {
                        RpgRelic.ORACLE_SIGHT -> {
                            if (!aiThinking && board.turn == PieceColor.WHITE) {
                                usedRelics = usedRelics + relic
                                scope.launch {
                                    val hint = withContext(Dispatchers.Default) {
                                        ChessAiEngine.getBestMove(board, AiDifficulty.MASTER, node.personality)
                                    }
                                    if (hint != null) {
                                        hintFrom = hint.move.fromSquare
                                        hintTo = hint.move.toSquare
                                        hintText = "🔮 Oracle's Sight: ${hint.san} — ${hint.explanation}"
                                    }
                                }
                            }
                        }
                        RpgRelic.CHRONOS_SANDS -> {
                            if (node.timeLimitSec > 0) {
                                usedRelics = usedRelics + relic
                                remainingSec += 45
                                combatBanner = "⏳ CHRONOS SANDS ACTIVATED! +45s CLOCK BONUS"
                            }
                        }
                        RpgRelic.AEGIS_REWIND -> {
                            if (!aiThinking && boardStack.size >= 3) {
                                usedRelics = usedRelics + relic
                                val newStack = boardStack.dropLast(2)
                                boardStack = newStack
                                board = newStack.last()
                                historySan = historySan.dropLast(2)
                                lastMoveFrom = null
                                lastMoveTo = null
                                combatBanner = "🛡️ AEGIS REWIND! TIME REVERSED 1 TURN"
                            }
                        }
                    }
                }
            )
        }

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

        if (isGameOver) {
            val bannerColor = if (playerWon) EmeraldSuccess else CrimsonAlert
            Surface(
                color = bannerColor.copy(alpha = 0.16f),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, bannerColor.copy(alpha = 0.6f), RoundedCornerShape(14.dp))
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = when {
                            playerWon -> "Victory! ${"★".repeat(earnedStars)} (${earnedStars}/3 Stars) • +${110 + earnedStars * 30} XP"
                            timedOut -> "Time's Up! ${node.guardianName} holds ${node.title}."
                            board.isCheckmate() -> "Defeat — ${node.guardianName} wins this battle."
                            else -> "Draw — You must win to advance on the map!"
                        },
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                    if (playerWon && node.rewardTitle != null) {
                        Text(
                            text = "Unlocked Title: ${node.rewardTitle}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BrushedGold
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { restartStage() },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Retry", color = WarmIvory, fontSize = 12.sp)
                        }
                        if (playerWon && node.id < AdventureRepository.nodes.size) {
                            Button(
                                onClick = { onNextNode(node.id + 1) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = BrushedGold,
                                    contentColor = Color(0xFF0B1F17)
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Next Place →", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        } else {
                            Button(
                                onClick = onBackToMap,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = BrushedGold,
                                    contentColor = Color(0xFF0B1F17)
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Back to Map", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
