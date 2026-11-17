package com.choiceclash.chess.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.chess.ChessAiEngine
import com.choiceclash.chess.chess.ChessBoard
import com.choiceclash.chess.chess.GameReviewReport
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.chess.PositionEvaluation
import com.choiceclash.chess.chess.PuzzlesRepository
import com.choiceclash.chess.data.ApiClient
import com.choiceclash.chess.data.ApiResult
import com.choiceclash.chess.data.GameHistoryItem
import com.choiceclash.chess.data.RoomState
import com.choiceclash.chess.data.SocketManager
import com.choiceclash.chess.data.UserProfile
import com.choiceclash.chess.ui.components.AiReviewDialog
import com.choiceclash.chess.ui.components.ChessboardView
import com.choiceclash.chess.ui.components.EvalBarView
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
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun OnlineScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var currentUser by remember { mutableStateOf<UserProfile?>(null) }
    var isLoadingAuth by remember { mutableStateOf(true) }
    var authError by remember { mutableStateOf<String?>(null) }
    var history by remember { mutableStateOf<List<GameHistoryItem>>(emptyList()) }

    var isSignupMode by remember { mutableStateOf(false) }
    var usernameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var roomCodeInput by remember { mutableStateOf("") }
    var lobbyMessage by remember { mutableStateOf<String?>(null) }

    var reviewReport by remember { mutableStateOf<GameReviewReport?>(null) }
    var mistakesSaved by remember { mutableStateOf(false) }

    val isConnected by SocketManager.isConnected.collectAsState()
    val onlinePlayers by SocketManager.onlinePlayers.collectAsState()
    val roomState by SocketManager.roomState.collectAsState()
    val chatMessages by SocketManager.chatMessages.collectAsState()
    val isSearchingMatch by SocketManager.isSearchingMatch.collectAsState()
    val socketError by SocketManager.socketError.collectAsState()

    fun loadProfileAndConnect() {
        scope.launch {
            isLoadingAuth = true
            when (val res = ApiClient.fetchMe(context)) {
                is ApiResult.Success -> {
                    currentUser = res.data
                    ApiClient.getToken(context)?.let { SocketManager.connect(it) }
                    when (val hist = ApiClient.fetchGameHistory(context)) {
                        is ApiResult.Success -> history = hist.data
                        is ApiResult.Error -> Unit
                    }
                }
                is ApiResult.Error -> {
                    currentUser = null
                }
            }
            isLoadingAuth = false
        }
    }

    LaunchedEffect(Unit) {
        if (ApiClient.getToken(context) != null) {
            loadProfileAndConnect()
        } else {
            isLoadingAuth = false
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

    if (isLoadingAuth) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(EmeraldVoid),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator(color = BrushedGold)
            Spacer(modifier = Modifier.height(10.dp))
            Text("Connecting to ChoiceCLASH...", color = MutedSage, fontSize = 13.sp)
        }
        return
    }

    val user = currentUser
    if (user == null) {
        // Login / Signup Screen
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(EmeraldVoid)
                .verticalScroll(rememberScrollState())
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = if (isSignupMode) "Create ChoiceCLASH Account" else "Sign In to Online Lobby",
                fontSize = 21.sp,
                fontWeight = FontWeight.Bold,
                color = WarmIvory
            )
            Text(
                text = "Play live matches against players worldwide on the ChoiceCLASH server.",
                fontSize = 13.sp,
                color = MutedSage
            )

            Surface(
                color = EmeraldSurface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (isSignupMode) {
                        OutlinedTextField(
                            value = usernameInput,
                            onValueChange = { usernameInput = it },
                            label = { Text("Username", color = MutedSage) },
                            singleLine = true,
                            colors = authTextFieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        label = { Text("Email", color = MutedSage) },
                        singleLine = true,
                        colors = authTextFieldColors(),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = passwordInput,
                        onValueChange = { passwordInput = it },
                        label = { Text("Password", color = MutedSage) },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        colors = authTextFieldColors(),
                        modifier = Modifier.fillMaxWidth()
                    )

                    authError?.let { err ->
                        Text(text = err, color = CrimsonAlert, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            authError = null
                            scope.launch {
                                isLoadingAuth = true
                                val res = if (isSignupMode) {
                                    ApiClient.signup(context, usernameInput, emailInput, passwordInput)
                                } else {
                                    ApiClient.login(context, emailInput, passwordInput)
                                }
                                when (res) {
                                    is ApiResult.Success -> {
                                        currentUser = res.data
                                        ApiClient.getToken(context)?.let { SocketManager.connect(it) }
                                        when (val hist = ApiClient.fetchGameHistory(context)) {
                                            is ApiResult.Success -> history = hist.data
                                            is ApiResult.Error -> Unit
                                        }
                                    }
                                    is ApiResult.Error -> {
                                        authError = res.message
                                    }
                                }
                                isLoadingAuth = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrushedGold,
                            contentColor = Color(0xFF0B1F17)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (isSignupMode) "Sign Up" else "Sign In",
                            fontWeight = FontWeight.Bold
                        )
                    }

                    TextButton(
                        onClick = {
                            isSignupMode = !isSignupMode
                            authError = null
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text(
                            text = if (isSignupMode) "Already have an account? Sign In"
                            else "New to ChoiceCLASH? Create Account",
                            color = BrushedGold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
        return
    }

    val activeRoom = roomState
    if (activeRoom != null) {
        OnlineGameRoomView(
            room = activeRoom,
            currentUser = user,
            chatMessages = chatMessages,
            onReviewGame = { moves ->
                scope.launch {
                    mistakesSaved = false
                    reviewReport = withContext(Dispatchers.Default) {
                        ChessAiEngine.analyzeGameHistory(moves)
                    }
                }
            },
            onLeaveRoom = { SocketManager.leaveRoomLocal() }
        )
        return
    }

    // Online Lobby View
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Player Profile Header
        Surface(
            color = EmeraldSurface,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, EmeraldBorder, RoundedCornerShape(16.dp))
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = user.username,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                    Text(
                        text = "Rating: ${user.rating} • ${user.wins}W / ${user.losses}L / ${user.draws}D",
                        fontSize = 12.sp,
                        color = BrushedGold
                    )
                    Text(
                        text = if (isConnected) "● Live Server Connected" else "○ Reconnecting...",
                        fontSize = 11.sp,
                        color = if (isConnected) EmeraldSuccess else MutedSage
                    )
                }
                OutlinedButton(
                    onClick = {
                        SocketManager.disconnect()
                        ApiClient.saveToken(context, null)
                        currentUser = null
                    }
                ) {
                    Text("Sign Out", fontSize = 11.sp, color = WarmIvory)
                }
            }
        }

        socketError?.let { err ->
            Text(text = err, color = CrimsonAlert, fontSize = 12.sp)
        }
        lobbyMessage?.let { msg ->
            Text(text = msg, color = BrushedGold, fontSize = 12.sp)
        }

        // Matchmaking + Room Controls
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { SocketManager.toggleMatchmaking() },
                enabled = isConnected,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSearchingMatch) CrimsonAlert else BrushedGold,
                    contentColor = if (isSearchingMatch) WarmIvory else Color(0xFF0B1F17)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = if (isSearchingMatch) "Cancel Search" else "Quick Match",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
            OutlinedButton(
                onClick = {
                    SocketManager.createRoom { res ->
                        res.onFailure { lobbyMessage = it.message }
                        res.onSuccess { code -> lobbyMessage = "Created room $code" }
                    }
                },
                enabled = isConnected,
                modifier = Modifier.weight(1f)
            ) {
                Text("Create Room", color = WarmIvory, fontSize = 12.sp)
            }
        }

        // Join Room by Code
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = roomCodeInput,
                onValueChange = { roomCodeInput = it.uppercase() },
                placeholder = { Text("Enter Room Code", fontSize = 12.sp, color = MutedSage) },
                singleLine = true,
                colors = authTextFieldColors(),
                modifier = Modifier.weight(1f)
            )
            Button(
                onClick = {
                    if (roomCodeInput.isNotBlank()) {
                        SocketManager.joinRoom(roomCodeInput) { res ->
                            res.onFailure { lobbyMessage = it.message }
                        }
                    }
                },
                enabled = isConnected && roomCodeInput.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = EmeraldElevated,
                    contentColor = BrushedGold
                )
            ) {
                Text("Join", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }

        // Online Players
        Surface(
            color = EmeraldSurface,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, EmeraldBorder, RoundedCornerShape(14.dp))
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Online Players (${onlinePlayers.size})",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                    TextButton(onClick = { SocketManager.requestOnlineList() }) {
                        Text("Refresh", fontSize = 11.sp, color = BrushedGold)
                    }
                }
                if (onlinePlayers.isEmpty()) {
                    Text("No other players online right now.", fontSize = 12.sp, color = MutedSage)
                } else {
                    onlinePlayers.take(8).forEach { p ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(p.username, fontSize = 13.sp, color = WarmIvory)
                            Text("${p.rating} • ${p.status}", fontSize = 12.sp, color = MutedSage)
                        }
                    }
                }
            }
        }

        // Recent Matches
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
                    text = "Recent Matches (${history.size})",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = WarmIvory
                )
                if (history.isEmpty()) {
                    Text("Play an online game to see match history here.", fontSize = 12.sp, color = MutedSage)
                } else {
                    history.take(8).forEach { game ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(EmeraldVoid.copy(alpha = 0.55f), RoundedCornerShape(10.dp))
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${game.whiteUsername} vs ${game.blackUsername}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = WarmIvory
                                )
                                Text(
                                    text = "${game.movesSan.size} moves • ${game.resultReason ?: game.winner ?: "Completed"}",
                                    fontSize = 11.sp,
                                    color = MutedSage
                                )
                            }
                            if (game.movesSan.isNotEmpty()) {
                                TextButton(onClick = {
                                    scope.launch {
                                        mistakesSaved = false
                                        reviewReport = withContext(Dispatchers.Default) {
                                            ChessAiEngine.analyzeGameHistory(game.movesSan)
                                        }
                                    }
                                }) {
                                    Text("AI Review", fontSize = 11.sp, color = BrushedGold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OnlineGameRoomView(
    room: RoomState,
    currentUser: UserProfile,
    chatMessages: List<com.choiceclash.chess.data.ChatMessage>,
    onReviewGame: (List<String>) -> Unit,
    onLeaveRoom: () -> Unit
) {
    val board = remember(room.fen) { ChessBoard.fromFen(room.fen) }
    var evaluation by remember { mutableStateOf(PositionEvaluation(0, "0.0", 0.5f)) }
    var chatInput by remember { mutableStateOf("") }
    var is3dMode by remember { mutableStateOf(false) }

    LaunchedEffect(board) {
        evaluation = withContext(Dispatchers.Default) {
            ChessAiEngine.evaluatePosition(board)
        }
    }

    val myColor = when {
        room.white?.id == currentUser.id || room.white?.username == currentUser.username -> PieceColor.WHITE
        room.black?.id == currentUser.id || room.black?.username == currentUser.username -> PieceColor.BLACK
        else -> null
    }
    val isFinished = room.status == "finished" || board.isGameOver()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Room ${room.roomCode}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrushedGold
                )
                Text(
                    text = if (isFinished) {
                        "Game Over: ${room.reason ?: room.winner ?: "Finished"}"
                    } else if (room.status == "waiting") {
                        "Waiting for opponent to join..."
                    } else {
                        val turnLabel = if (board.turn == PieceColor.WHITE) "White" else "Black"
                        "$turnLabel to move"
                    },
                    fontSize = 12.sp,
                    color = WarmIvory
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                OutlinedButton(onClick = { is3dMode = !is3dMode }) {
                    Text(if (is3dMode) "3D" else "2D", fontSize = 11.sp, color = BrushedGold, fontWeight = FontWeight.Bold)
                }
                OutlinedButton(onClick = onLeaveRoom) {
                    Text("Leave", fontSize = 11.sp, color = WarmIvory)
                }
            }
        }

        // Players bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "♔ ${room.white?.username ?: "Waiting..."} (${room.white?.rating ?: "-"})",
                fontSize = 12.sp,
                color = WarmIvory
            )
            Text(
                text = "♚ ${room.black?.username ?: "Waiting..."} (${room.black?.rating ?: "-"})",
                fontSize = 12.sp,
                color = MutedSage
            )
        }

        EvalBarView(evaluation = evaluation)

        ChessboardView(
            board = board,
            flipped = myColor == PieceColor.BLACK,
            is3dMode = is3dMode,
            interactive = !isFinished && myColor != null && board.turn == myColor,
            allowedColor = myColor,
            lastMoveFrom = room.lastMoveFrom,
            lastMoveTo = room.lastMoveTo,
            onMoveSelected = { move ->
                SocketManager.sendMove(
                    roomCode = room.roomCode,
                    from = move.fromSquare,
                    to = move.toSquare,
                    promotion = move.promotion?.fenLetter?.toString()
                )
            }
        )

        // Draw offer banner
        if (room.drawOfferFrom != null && room.drawOfferFrom != currentUser.username) {
            Surface(
                color = EmeraldElevated,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BrushedGold, RoundedCornerShape(12.dp))
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Opponent offered a draw", color = WarmIvory, fontSize = 12.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(
                            onClick = { SocketManager.respondDraw(room.roomCode, true) },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess)
                        ) {
                            Text("Accept", fontSize = 11.sp)
                        }
                        OutlinedButton(onClick = { SocketManager.respondDraw(room.roomCode, false) }) {
                            Text("Decline", fontSize = 11.sp, color = WarmIvory)
                        }
                    }
                }
            }
        }

        // Controls
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = { SocketManager.offerDraw(room.roomCode) },
                enabled = !isFinished && myColor != null,
                modifier = Modifier.weight(1f)
            ) {
                Text("Offer Draw", fontSize = 11.sp, color = WarmIvory)
            }
            OutlinedButton(
                onClick = { SocketManager.resign(room.roomCode) },
                enabled = !isFinished && myColor != null,
                modifier = Modifier.weight(1f)
            ) {
                Text("Resign", fontSize = 11.sp, color = CrimsonAlert)
            }
            Button(
                onClick = { onReviewGame(room.historySan) },
                enabled = room.historySan.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrushedGold,
                    contentColor = Color(0xFF0B1F17)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text("AI Review", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Table Chat
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
                Text("Table Chat", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = BrushedGold)
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 120.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(chatMessages) { msg ->
                        Text(
                            text = "${msg.sender}: ${msg.text}",
                            fontSize = 12.sp,
                            color = WarmIvory
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = chatInput,
                        onValueChange = { chatInput = it },
                        placeholder = { Text("Say something...", fontSize = 12.sp, color = MutedSage) },
                        singleLine = true,
                        colors = authTextFieldColors(),
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = {
                            if (chatInput.isNotBlank()) {
                                SocketManager.sendChat(room.roomCode, chatInput)
                                chatInput = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrushedGold,
                            contentColor = Color(0xFF0B1F17)
                        )
                    ) {
                        Text("Send", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun authTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = BrushedGold,
    unfocusedBorderColor = EmeraldBorder,
    focusedTextColor = WarmIvory,
    unfocusedTextColor = WarmIvory
)
