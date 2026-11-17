package com.choiceclash.chess.data

import io.socket.client.Ack
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject

data class OnlinePlayer(
    val id: String,
    val username: String,
    val rating: Int,
    val status: String = "online"
)

data class RoomPlayer(
    val id: String,
    val username: String,
    val rating: Int
)

data class ChatMessage(
    val sender: String,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class RoomState(
    val roomCode: String = "",
    val fen: String = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    val turn: String = "w",
    val status: String = "waiting",
    val white: RoomPlayer? = null,
    val black: RoomPlayer? = null,
    val historySan: List<String> = emptyList(),
    val lastMoveFrom: String? = null,
    val lastMoveTo: String? = null,
    val winner: String? = null,
    val reason: String? = null,
    val drawOfferFrom: String? = null
)

object SocketManager {
    private var socket: Socket? = null
    private var connectedToken: String? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _onlinePlayers = MutableStateFlow<List<OnlinePlayer>>(emptyList())
    val onlinePlayers: StateFlow<List<OnlinePlayer>> = _onlinePlayers.asStateFlow()

    private val _roomState = MutableStateFlow<RoomState?>(null)
    val roomState: StateFlow<RoomState?> = _roomState.asStateFlow()

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    private val _isSearchingMatch = MutableStateFlow(false)
    val isSearchingMatch: StateFlow<Boolean> = _isSearchingMatch.asStateFlow()

    private val _socketError = MutableStateFlow<String?>(null)
    val socketError: StateFlow<String?> = _socketError.asStateFlow()

    fun connect(token: String) {
        if (socket?.connected() == true && connectedToken == token) return
        disconnect()
        connectedToken = token

        val opts = IO.Options.builder()
            .setAuth(mapOf("token" to token))
            .setReconnection(true)
            .build()

        val s = IO.socket(API_BASE_URL, opts)
        socket = s

        s.on(Socket.EVENT_CONNECT) {
            _isConnected.value = true
            _socketError.value = null
            s.emit("online:request")
        }

        s.on(Socket.EVENT_DISCONNECT) {
            _isConnected.value = false
        }

        s.on(Socket.EVENT_CONNECT_ERROR) { args ->
            _isConnected.value = false
            val err = args.firstOrNull()?.toString() ?: "Socket connection failed"
            _socketError.value = err
        }

        s.on("online:list") { args ->
            val arr = args.firstOrNull() as? JSONArray ?: return@on
            val players = buildList {
                for (i in 0 until arr.length()) {
                    val obj = arr.optJSONObject(i) ?: continue
                    add(
                        OnlinePlayer(
                            id = obj.optString("id", obj.optString("userId", "$i")),
                            username = obj.optString("username", "Player"),
                            rating = obj.optInt("rating", 1200),
                            status = obj.optString("status", "online")
                        )
                    )
                }
            }
            _onlinePlayers.value = players
        }

        s.on("matchmaking:matched") { args ->
            _isSearchingMatch.value = false
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            val code = obj.optString("roomCode")
            if (code.isNotBlank()) {
                joinRoom(code) { _ -> }
            }
        }

        s.on("room:state") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            _roomState.value = parseRoomState(obj)
        }

        s.on("game:over") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            val current = _roomState.value
            if (current != null) {
                _roomState.value = current.copy(
                    status = "finished",
                    winner = obj.optString("winner").takeIf { it.isNotBlank() && it != "null" },
                    reason = obj.optString("reason").takeIf { it.isNotBlank() && it != "null" }
                )
            }
        }

        s.on("chat:message") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            val sender = obj.optString("sender", obj.optString("username", "Player"))
            val text = obj.optString("text", obj.optString("message", ""))
            if (text.isNotBlank()) {
                _chatMessages.value = _chatMessages.value + ChatMessage(sender = sender, text = text)
            }
        }

        s.connect()
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        connectedToken = null
        _isConnected.value = false
        _isSearchingMatch.value = false
        _roomState.value = null
        _chatMessages.value = emptyList()
    }

    fun requestOnlineList() {
        socket?.emit("online:request")
    }

    fun toggleMatchmaking() {
        val s = socket ?: return
        if (_isSearchingMatch.value) {
            s.emit("matchmaking:leave")
            _isSearchingMatch.value = false
        } else {
            s.emit("matchmaking:join")
            _isSearchingMatch.value = true
        }
    }

    fun createRoom(onResult: (Result<String>) -> Unit) {
        val s = socket ?: return onResult(Result.failure(IllegalStateException("Not connected")))
        _chatMessages.value = emptyList()
        s.emit("room:create", Ack { args ->
            val obj = args.firstOrNull() as? JSONObject
            val code = obj?.optString("roomCode").orEmpty()
            val err = obj?.optString("error").orEmpty()
            if (code.isNotBlank()) {
                onResult(Result.success(code))
            } else {
                onResult(Result.failure(IllegalStateException(err.ifBlank { "Could not create room" })))
            }
        })
    }

    fun joinRoom(roomCode: String, onResult: (Result<Unit>) -> Unit) {
        val s = socket ?: return onResult(Result.failure(IllegalStateException("Not connected")))
        _chatMessages.value = emptyList()
        val payload = JSONObject().put("roomCode", roomCode.trim().uppercase())
        s.emit("room:join", payload, Ack { args ->
            val obj = args.firstOrNull() as? JSONObject
            val ok = obj?.optBoolean("ok", false) == true
            val err = obj?.optString("error").orEmpty()
            if (ok) {
                onResult(Result.success(Unit))
            } else {
                onResult(Result.failure(IllegalStateException(err.ifBlank { "Could not join room" })))
            }
        })
    }

    fun leaveRoomLocal() {
        _roomState.value = null
        _chatMessages.value = emptyList()
    }

    fun sendMove(roomCode: String, from: String, to: String, promotion: String? = null) {
        val payload = JSONObject()
            .put("roomCode", roomCode)
            .put("from", from)
            .put("to", to)
        if (promotion != null) payload.put("promotion", promotion)
        socket?.emit("game:move", payload)
    }

    fun resign(roomCode: String) {
        socket?.emit("game:resign", JSONObject().put("roomCode", roomCode))
    }

    fun offerDraw(roomCode: String) {
        socket?.emit("game:draw:offer", JSONObject().put("roomCode", roomCode))
    }

    fun respondDraw(roomCode: String, accept: Boolean) {
        val payload = JSONObject()
            .put("roomCode", roomCode)
            .put("accept", accept)
        socket?.emit("game:draw:respond", payload)
    }

    fun sendChat(roomCode: String, text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        val payload = JSONObject()
            .put("roomCode", roomCode)
            .put("text", trimmed)
        socket?.emit("chat:send", payload)
    }

    fun clearError() {
        _socketError.value = null
    }

    private fun parseRoomState(obj: JSONObject): RoomState {
        val historyArr = obj.optJSONArray("history") ?: obj.optJSONArray("moves")
        val history = buildList {
            if (historyArr != null) {
                for (i in 0 until historyArr.length()) {
                    val item = historyArr.opt(i)
                    when (item) {
                        is String -> add(item)
                        is JSONObject -> {
                            val san = item.optString("san")
                            if (san.isNotBlank()) add(san)
                        }
                    }
                }
            }
        }
        val lastMove = obj.optJSONObject("lastMove")
        val playersObj = obj.optJSONObject("players")
        val whiteObj = obj.optJSONObject("white") ?: playersObj?.optJSONObject("w")
        val blackObj = obj.optJSONObject("black") ?: playersObj?.optJSONObject("b")

        return RoomState(
            roomCode = obj.optString("roomCode", obj.optString("code", "")),
            fen = obj.optString("fen", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
            turn = obj.optString("turn", "w"),
            status = obj.optString("status", "playing"),
            white = parseRoomPlayer(whiteObj),
            black = parseRoomPlayer(blackObj),
            historySan = history,
            lastMoveFrom = lastMove?.optString("from")?.takeIf { it.isNotBlank() },
            lastMoveTo = lastMove?.optString("to")?.takeIf { it.isNotBlank() },
            winner = obj.optString("winner").takeIf { it.isNotBlank() && it != "null" },
            reason = obj.optString("reason").takeIf { it.isNotBlank() && it != "null" },
            drawOfferFrom = obj.optString("drawOfferFrom").takeIf { it.isNotBlank() && it != "null" }
        )
    }

    private fun parseRoomPlayer(obj: JSONObject?): RoomPlayer? {
        if (obj == null) return null
        val username = obj.optString("username")
        if (username.isBlank()) return null
        return RoomPlayer(
            id = obj.optString("id", obj.optString("userId", "")),
            username = username,
            rating = obj.optInt("rating", 1200)
        )
    }
}
