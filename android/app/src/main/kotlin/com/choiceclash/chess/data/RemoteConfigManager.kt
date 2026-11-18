package com.choiceclash.chess.data

import android.content.Context
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

const val CURRENT_VERSION_CODE = 5
const val CURRENT_VERSION_NAME = "1.3.0"
const val VERCEL_VERSION_URL = "https://choiceclash.vercel.app/version.json"

private const val PREFS_REMOTE = "choiceclash_remote_config"
private const val KEY_SELECTED_THEME = "selected_theme_slug"

data class RemoteBoardTheme(
    val slug: String,
    val name: String,
    val lightSquareHex: String,
    val darkSquareHex: String,
    val boardBorderHex: String,
    val accentColorHex: String,
    val isDefault: Boolean = false
)

data class AppUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val releaseNotes: String
)

data class RemoteAppState(
    val themes: List<RemoteBoardTheme> = emptyList(),
    val selectedTheme: RemoteBoardTheme? = null,
    val announcement: String? = null,
    val updateInfo: AppUpdateInfo? = null,
    val isSyncing: Boolean = false,
    val lastSyncMessage: String? = null
)

object RemoteConfigManager {
    private val client = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val _state = MutableStateFlow(RemoteAppState())
    val state: StateFlow<RemoteAppState> = _state.asStateFlow()

    suspend fun syncAll(context: Context): RemoteAppState = withContext(Dispatchers.IO) {
        _state.value = _state.value.copy(isSyncing = true)

        val savedSlug = context.getSharedPreferences(PREFS_REMOTE, Context.MODE_PRIVATE)
            .getString(KEY_SELECTED_THEME, null)

        var loadedThemes: List<RemoteBoardTheme> = _state.value.themes
        var announcement: String? = null
        var pluginUpdate: AppUpdateInfo? = null

        // 1. Fetch active Admin Panel themes
        runCatching {
            val req = Request.Builder().url("$API_BASE_URL/api/config/themes").get().build()
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) {
                    val body = res.body?.string().orEmpty()
                    val arr = JSONObject(body).optJSONArray("themes")
                    if (arr != null) {
                        val list = buildList {
                            for (i in 0 until arr.length()) {
                                val obj = arr.optJSONObject(i) ?: continue
                                add(
                                    RemoteBoardTheme(
                                        slug = obj.optString("slug", "theme-$i"),
                                        name = obj.optString("name", "Theme"),
                                        lightSquareHex = obj.optString("lightSquare", "#E9E3D0"),
                                        darkSquareHex = obj.optString("darkSquare", "#2E5D47"),
                                        boardBorderHex = obj.optString("boardBorder", "#1E4635"),
                                        accentColorHex = obj.optString("accentColor", "#E6B84C"),
                                        isDefault = obj.optBoolean("isDefault", false)
                                    )
                                )
                            }
                        }
                        if (list.isNotEmpty()) loadedThemes = list
                    }
                }
            }
        }

        // 2. Fetch enabled Admin Panel plugins (announcements & optional OTA config)
        runCatching {
            val req = Request.Builder().url("$API_BASE_URL/api/config/plugins").get().build()
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) {
                    val body = res.body?.string().orEmpty()
                    val arr = JSONObject(body).optJSONArray("plugins")
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            val obj = arr.optJSONObject(i) ?: continue
                            val slug = obj.optString("slug", "").lowercase()
                            val category = obj.optString("category", "").lowercase()
                            val desc = obj.optString("description", "")
                            val cfgRaw = obj.optString("configJson", "{}")
                            val cfg = runCatching { JSONObject(cfgRaw) }.getOrNull()

                            val ann = cfg?.optString("announcement")?.takeIf { it.isNotBlank() }
                            if (ann != null) {
                                announcement = ann
                            } else if ((slug.contains("announcement") || category.contains("announcement")) && desc.isNotBlank()) {
                                announcement = desc
                            }

                            val vCode = cfg?.optInt("versionCode", 0) ?: 0
                            if (vCode > 0) {
                                pluginUpdate = AppUpdateInfo(
                                    versionCode = vCode,
                                    versionName = cfg?.optString("versionName", "$vCode") ?: "$vCode",
                                    apkUrl = cfg?.optString("apkUrl", "https://choiceclash.vercel.app/downloads/ChoiceCLASH.apk")
                                        ?.ifBlank { "https://choiceclash.vercel.app/downloads/ChoiceCLASH.apk" }
                                        ?: "https://choiceclash.vercel.app/downloads/ChoiceCLASH.apk",
                                    releaseNotes = cfg?.optString("releaseNotes", "") ?: ""
                                )
                            }
                        }
                    }
                }
            }
        }

        // 3. Fetch latest published app version from Vercel
        var vercelUpdate: AppUpdateInfo? = null
        runCatching {
            val req = Request.Builder().url(VERCEL_VERSION_URL).get().build()
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) {
                    val body = res.body?.string().orEmpty()
                    val json = JSONObject(body)
                    val vCode = json.optInt("versionCode", 0)
                    if (vCode > 0) {
                        vercelUpdate = AppUpdateInfo(
                            versionCode = vCode,
                            versionName = json.optString("versionName", "$vCode"),
                            apkUrl = json.optString("apkUrl", "https://choiceclash.vercel.app/downloads/ChoiceCLASH.apk")
                                .ifBlank { "https://choiceclash.vercel.app/downloads/ChoiceCLASH.apk" },
                            releaseNotes = json.optString("releaseNotes", "")
                        )
                    }
                }
            }
        }

        val resolvedUpdate = listOfNotNull(pluginUpdate, vercelUpdate)
            .maxByOrNull { it.versionCode }

        val selected = loadedThemes.find { it.slug == savedSlug }
            ?: loadedThemes.find { it.isDefault }
            ?: loadedThemes.firstOrNull()

        val next = RemoteAppState(
            themes = loadedThemes,
            selectedTheme = selected,
            announcement = announcement,
            updateInfo = resolvedUpdate,
            isSyncing = false,
            lastSyncMessage = if (loadedThemes.isNotEmpty() || resolvedUpdate != null) {
                "Synced with ChoiceCLASH server"
            } else {
                "Using offline Royal Emerald & Ivory config"
            }
        )
        _state.value = next
        next
    }

    fun selectTheme(context: Context, slug: String) {
        context.getSharedPreferences(PREFS_REMOTE, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_SELECTED_THEME, slug)
            .apply()
        val cur = _state.value
        val found = cur.themes.find { it.slug == slug } ?: return
        _state.value = cur.copy(selectedTheme = found)
    }

    fun parseHexColor(hex: String?, fallback: Color): Color {
        if (hex.isNullOrBlank()) return fallback
        return runCatching {
            val clean = hex.trim()
            val normalized = if (clean.startsWith("#")) clean else "#$clean"
            Color(android.graphics.Color.parseColor(normalized))
        }.getOrDefault(fallback)
    }
}
