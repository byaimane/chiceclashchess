package com.choiceclash.chess.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

const val API_BASE_URL = "https://choiceclash-api-production.up.railway.app"
private const val PREFS_AUTH = "choiceclash_auth_prefs"
private const val KEY_TOKEN = "jwt_token"

data class UserProfile(
    val id: String,
    val username: String,
    val email: String = "",
    val rating: Int = 1200,
    val wins: Int = 0,
    val losses: Int = 0,
    val draws: Int = 0
)

data class GameHistoryItem(
    val id: String,
    val whiteUsername: String,
    val blackUsername: String,
    val winner: String?,
    val resultReason: String?,
    val movesSan: List<String>,
    val createdAt: String
)

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val message: String) : ApiResult<Nothing>()
}

object ApiClient {
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    fun getToken(context: Context): String? =
        context.getSharedPreferences(PREFS_AUTH, Context.MODE_PRIVATE)
            .getString(KEY_TOKEN, null)

    fun saveToken(context: Context, token: String?) {
        context.getSharedPreferences(PREFS_AUTH, Context.MODE_PRIVATE)
            .edit()
            .apply {
                if (token == null) remove(KEY_TOKEN) else putString(KEY_TOKEN, token)
            }
            .apply()
    }

    suspend fun login(context: Context, email: String, password: String): ApiResult<UserProfile> =
        withContext(Dispatchers.IO) {
            val payload = JSONObject()
                .put("email", email.trim())
                .put("password", password)
                .toString()
            val req = Request.Builder()
                .url("$API_BASE_URL/api/auth/login")
                .post(payload.toRequestBody(jsonMediaType))
                .build()
            executeAuthRequest(context, req)
        }

    suspend fun signup(
        context: Context,
        username: String,
        email: String,
        password: String
    ): ApiResult<UserProfile> = withContext(Dispatchers.IO) {
        val payload = JSONObject()
            .put("username", username.trim())
            .put("email", email.trim())
            .put("password", password)
            .toString()
        val req = Request.Builder()
            .url("$API_BASE_URL/api/auth/signup")
            .post(payload.toRequestBody(jsonMediaType))
            .build()
        executeAuthRequest(context, req)
    }

    suspend fun fetchMe(context: Context): ApiResult<UserProfile> = withContext(Dispatchers.IO) {
        val token = getToken(context) ?: return@withContext ApiResult.Error("Not signed in")
        val req = Request.Builder()
            .url("$API_BASE_URL/api/auth/me")
            .header("Authorization", "Bearer $token")
            .get()
            .build()
        try {
            client.newCall(req).execute().use { res ->
                val body = res.body?.string().orEmpty()
                val json = runCatching { JSONObject(body) }.getOrNull()
                if (!res.isSuccessful) {
                    if (res.code == 401) saveToken(context, null)
                    val msg = json?.optString("error")?.takeIf { it.isNotBlank() }
                        ?: "Session expired (${res.code})"
                    return@withContext ApiResult.Error(msg)
                }
                val userObj = json?.optJSONObject("user") ?: json
                    ?: return@withContext ApiResult.Error("Invalid profile response")
                ApiResult.Success(parseUser(userObj))
            }
        } catch (e: Exception) {
            ApiResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun fetchGameHistory(context: Context): ApiResult<List<GameHistoryItem>> =
        withContext(Dispatchers.IO) {
            val token = getToken(context) ?: return@withContext ApiResult.Error("Not signed in")
            val req = Request.Builder()
                .url("$API_BASE_URL/api/games/history")
                .header("Authorization", "Bearer $token")
                .get()
                .build()
            try {
                client.newCall(req).execute().use { res ->
                    val body = res.body?.string().orEmpty()
                    val json = runCatching { JSONObject(body) }.getOrNull()
                    if (!res.isSuccessful) {
                        val msg = json?.optString("error")?.takeIf { it.isNotBlank() }
                            ?: "Could not load history (${res.code})"
                        return@withContext ApiResult.Error(msg)
                    }
                    val arr = json?.optJSONArray("games")
                        ?: return@withContext ApiResult.Success(emptyList())
                    val items = buildList {
                        for (i in 0 until arr.length()) {
                            val obj = arr.optJSONObject(i) ?: continue
                            val movesArr = obj.optJSONArray("moves")
                                ?: obj.optJSONArray("history")
                            val moves = buildList {
                                if (movesArr != null) {
                                    for (j in 0 until movesArr.length()) {
                                        val entry = movesArr.opt(j)
                                        when (entry) {
                                            is String -> add(entry)
                                            is JSONObject -> {
                                                val san = entry.optString("san")
                                                if (san.isNotBlank()) add(san)
                                            }
                                        }
                                    }
                                }
                            }
                            val whiteObj = obj.optJSONObject("white")
                            val blackObj = obj.optJSONObject("black")
                            add(
                                GameHistoryItem(
                                    id = obj.optString("id", obj.optString("_id", "$i")),
                                    whiteUsername = whiteObj?.optString("username")
                                        ?: obj.optString("whiteUsername", "White"),
                                    blackUsername = blackObj?.optString("username")
                                        ?: obj.optString("blackUsername", "Black"),
                                    winner = obj.optString("winner").takeIf { it.isNotBlank() && it != "null" },
                                    resultReason = obj.optString("reason")
                                        .takeIf { it.isNotBlank() && it != "null" },
                                    movesSan = moves,
                                    createdAt = obj.optString("createdAt", "")
                                )
                            )
                        }
                    }
                    ApiResult.Success(items)
                }
            } catch (e: Exception) {
                ApiResult.Error(e.localizedMessage ?: "Network error")
            }
        }

    private fun executeAuthRequest(context: Context, req: Request): ApiResult<UserProfile> {
        return try {
            client.newCall(req).execute().use { res ->
                val body = res.body?.string().orEmpty()
                val json = runCatching { JSONObject(body) }.getOrNull()
                if (!res.isSuccessful) {
                    val msg = json?.optString("error")?.takeIf { it.isNotBlank() }
                        ?: "Authentication failed (${res.code})"
                    return ApiResult.Error(msg)
                }
                val token = json?.optString("token").orEmpty()
                if (token.isNotBlank()) saveToken(context, token)
                val userObj = json?.optJSONObject("user")
                    ?: return ApiResult.Error("Missing user in response")
                ApiResult.Success(parseUser(userObj))
            }
        } catch (e: Exception) {
            ApiResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    private fun parseUser(obj: JSONObject): UserProfile = UserProfile(
        id = obj.optString("id", obj.optString("_id", "")),
        username = obj.optString("username", "Player"),
        email = obj.optString("email", ""),
        rating = obj.optInt("rating", 1200),
        wins = obj.optInt("wins", 0),
        losses = obj.optInt("losses", 0),
        draws = obj.optInt("draws", 0)
    )
}
