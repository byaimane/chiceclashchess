package com.choiceclash.chess.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Campaign
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.Extension
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.SmartToy
import androidx.compose.material.icons.rounded.SystemUpdate
import com.choiceclash.chess.chess.AdventureRepository
import com.choiceclash.chess.chess.PuzzlesRepository
import com.choiceclash.chess.chess.RpgRepository
import com.choiceclash.chess.data.SocketManager
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.data.CURRENT_VERSION_CODE
import com.choiceclash.chess.data.CURRENT_VERSION_NAME
import com.choiceclash.chess.data.RemoteConfigManager
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSuccess
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    onOpenAdventure: () -> Unit,
    onOpenAiArena: () -> Unit,
    onOpenPuzzles: () -> Unit,
    onOpenOnline: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val remoteState by RemoteConfigManager.state.collectAsState()
    var showUpdateDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        RemoteConfigManager.syncAll(context)
    }

    if (showUpdateDialog) {
        val upd = remoteState.updateInfo
        val hasUpdate = upd != null && upd.versionCode > CURRENT_VERSION_CODE
        AlertDialog(
            onDismissRequest = { showUpdateDialog = false },
            containerColor = EmeraldSurface,
            title = {
                Text(
                    text = if (hasUpdate) "Update Available (v${upd?.versionName})"
                    else "ChoiceCLASH is Up to Date",
                    color = WarmIvory,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Installed: v$CURRENT_VERSION_NAME (Build $CURRENT_VERSION_CODE)",
                        fontSize = 12.sp,
                        color = BrushedGold
                    )
                    if (upd != null) {
                        Text(
                            text = if (hasUpdate) "Latest Server Version: v${upd.versionName} (Build ${upd.versionCode})"
                            else "Latest Server Version: v${upd.versionName}",
                            fontSize = 12.sp,
                            color = EmeraldSuccess
                        )
                        if (upd.releaseNotes.isNotBlank()) {
                            Text(
                                text = upd.releaseNotes,
                                fontSize = 12.sp,
                                color = MutedSage
                            )
                        }
                    } else {
                        Text(
                            text = "Could not reach update server. Check your internet connection.",
                            fontSize = 12.sp,
                            color = MutedSage
                        )
                    }
                }
            },
            confirmButton = {
                if (hasUpdate && upd != null) {
                    Button(
                        onClick = {
                            runCatching {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(upd.apkUrl))
                                context.startActivity(intent)
                            }
                            showUpdateDialog = false
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrushedGold,
                            contentColor = Color(0xFF0B1F17)
                        )
                    ) {
                        Text("Download Latest APK", fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showUpdateDialog = false }) {
                    Text("Close", color = BrushedGold)
                }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live Admin Announcement Banner
        remoteState.announcement?.takeIf { it.isNotBlank() }?.let { message ->
            Surface(
                color = BrushedGold.copy(alpha = 0.14f),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BrushedGold.copy(alpha = 0.55f), RoundedCornerShape(14.dp))
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Campaign,
                        contentDescription = "Announcement",
                        tint = BrushedGold,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = message,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = WarmIvory
                    )
                }
            }
        }

        // Royal Hero Banner
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.Transparent,
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BrushedGold.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                .background(
                    Brush.linearGradient(
                        listOf(EmeraldElevated, EmeraldSurface, Color(0xFF0E251B))
                    ),
                    RoundedCornerShape(20.dp)
                )
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(BrushedGold.copy(alpha = 0.16f))
                            .border(1.dp, BrushedGold.copy(alpha = 0.6f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("♔", fontSize = 24.sp, color = BrushedGold)
                    }
                    Column {
                        Text(
                            text = "ChoiceCLASH",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = WarmIvory
                        )
                        Text(
                            text = "Royal Emerald & Ivory Edition",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = BrushedGold
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Master every move with an on-device AI Coach, live evaluation bar, tactical puzzles, and real-time online matches.",
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = MutedSage
                )
            }
        }

        Text(
            text = "CHOOSE YOUR ARENA",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.4.sp,
            color = BrushedGold
        )

        ArenaLaunchCard(
            icon = Icons.Rounded.Map,
            badge = "12-STAGE CAMPAIGN",
            title = "Royal Odyssey Map",
            subtitle = "Travel across 4 realms—every win unlocks the next location, boss & 3-star mastery.",
            accent = BrushedGold,
            onClick = onOpenAdventure
        )

        ArenaLaunchCard(
            icon = Icons.Rounded.SmartToy,
            badge = "AI ENGINE + COACH",
            title = "Play vs. AI",
            subtitle = "4 difficulty tiers, 3 personalities, live Eval Bar, Smart Hints, Interactive AI Coach & Post-Game Review.",
            accent = BrushedGold,
            onClick = onOpenAiArena
        )

        ArenaLaunchCard(
            icon = Icons.Rounded.Extension,
            badge = "TACTICAL TRAINING",
            title = "Puzzles & Mistake Trainer",
            subtitle = "Sharpen pattern recognition with daily tactical mates & forks, plus your saved game mistakes.",
            accent = Color(0xFF4ADE80),
            onClick = onOpenPuzzles
        )

        ArenaLaunchCard(
            icon = Icons.Rounded.Public,
            badge = "LIVE MULTIPLAYER",
            title = "Online Lobby",
            subtitle = "Connect to the live ChoiceCLASH server for Auto Quick Match, private rooms, and table chat.",
            accent = Color(0xFF60A5FA),
            onClick = onOpenOnline
        )

        // Feature Highlights
        Surface(
            color = EmeraldSurface,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, EmeraldBorder, RoundedCornerShape(16.dp))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.AutoAwesome,
                        contentDescription = null,
                        tint = BrushedGold,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Built-in AI Capabilities",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                }
                Text(
                    text = "• Live Evaluation Bar & Opening Book detection\n• Smart Move Hints with square highlights\n• Interactive AI Coach Q&A during any game\n• Full Post-Game Review with accuracy % & mistake export",
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = MutedSage
                )
            }
        }

        // Live Admin Themes & App Update Card
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
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Palette,
                            contentDescription = null,
                            tint = BrushedGold,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Live Admin Board Themes",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = WarmIvory
                        )
                    }
                    Text(
                        text = "v$CURRENT_VERSION_NAME",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrushedGold
                    )
                }

                if (remoteState.themes.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        remoteState.themes.forEach { theme ->
                            val selected = remoteState.selectedTheme?.slug == theme.slug
                            FilterChip(
                                selected = selected,
                                onClick = { RemoteConfigManager.selectTheme(context, theme.slug) },
                                label = { Text(theme.name, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BrushedGold,
                                    selectedLabelColor = Color(0xFF0B1F17),
                                    containerColor = EmeraldElevated,
                                    labelColor = WarmIvory
                                )
                            )
                        }
                    }
                } else {
                    Text(
                        text = "Royal Emerald & Ivory active (tap Sync to fetch Admin themes).",
                        fontSize = 12.sp,
                        color = MutedSage
                    )
                }

                OutlinedButton(
                    onClick = {
                        scope.launch {
                            RemoteConfigManager.syncAll(context)
                            showUpdateDialog = true
                        }
                    },
                    enabled = !remoteState.isSyncing,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Rounded.SystemUpdate,
                        contentDescription = null,
                        tint = BrushedGold,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.size(6.dp))
                    Text(
                        text = if (remoteState.isSyncing) "Syncing..." else "Check for Updates & Sync",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrushedGold
                    )
                }
            }
        }

        // Achievement Badges & Global Leaderboard Card
        val advProgress = remember { AdventureRepository.loadProgress(context) }
        val puzStats = remember { PuzzlesRepository.loadStats(context) }
        val rpgHero = remember { RpgRepository.loadProfile(context) }
        val onlinePlayers by SocketManager.onlinePlayers.collectAsState()

        val badges = remember(advProgress, puzStats, rpgHero) {
            listOf(
                Triple("⚔️ First Odyssey Win", "Clear Stage 1 on the Map", advProgress.completedCount >= 1),
                Triple("🧩 Puzzle Tactician", "Solve 5+ Tactical Puzzles", puzStats.solvedCount >= 5),
                Triple("🔥 3-Puzzle Streak", "Reach a 3+ puzzle streak", puzStats.bestStreak >= 3),
                Triple("🏰 Citadel Conqueror", "Reach Stage 4+ on the Map", advProgress.unlockedLevel >= 4),
                Triple("🛡️ Emerald Paladin", "Reach RPG Hero Level 3+", rpgHero.level >= 3),
                Triple("👑 Grandmaster Crown", "Complete all 12 Odyssey Stages", advProgress.completedCount >= 12)
            )
        }

        val leaderboard = remember(onlinePlayers, rpgHero) {
            val hallOfFame = listOf(
                "GM_MagnusCrown" to 2340,
                "EmeraldWarlord" to 2110,
                "ObsidianArchmage" to 1945,
                "CitadelKnight" to 1760,
                "You (Lv.${rpgHero.level})" to (1200 + rpgHero.xp / 2 + advProgress.totalStars * 15)
            )
            val liveEntries = onlinePlayers.map { it.username to it.rating }
            (liveEntries + hallOfFame)
                .distinctBy { it.first }
                .sortedByDescending { it.second }
                .take(6)
        }

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
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.EmojiEvents,
                        contentDescription = null,
                        tint = BrushedGold,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Achievement Badges (${badges.count { it.third }}/${badges.size})",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = WarmIvory
                    )
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    badges.forEach { (title, desc, unlocked) ->
                        Surface(
                            color = if (unlocked) BrushedGold.copy(alpha = 0.16f) else EmeraldVoid.copy(alpha = 0.6f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.border(
                                1.dp,
                                if (unlocked) BrushedGold else EmeraldBorder.copy(alpha = 0.5f),
                                RoundedCornerShape(10.dp)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                Text(
                                    text = if (unlocked) "$title ✓" else "🔒 $title",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (unlocked) BrushedGold else MutedSage
                                )
                                Text(
                                    text = desc,
                                    fontSize = 10.sp,
                                    color = MutedSage
                                )
                            }
                        }
                    }
                }

                Text(
                    text = "Global Grandmaster Leaderboard",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrushedGold,
                    modifier = Modifier.padding(top = 4.dp)
                )
                leaderboard.forEachIndexed { idx, (name, rating) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(EmeraldVoid.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "#${idx + 1}  $name",
                            fontSize = 12.sp,
                            fontWeight = if (name.startsWith("You")) FontWeight.Bold else FontWeight.Medium,
                            color = if (name.startsWith("You")) BrushedGold else WarmIvory
                        )
                        Text(
                            text = "$rating ELO",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BrushedGold
                        )
                    }
                }
            }
        }

        // Google Play Privacy Policy & Data Deletion Link
        TextButton(
            onClick = {
                runCatching {
                    context.startActivity(
                        Intent(Intent.ACTION_VIEW, Uri.parse("https://choiceclash.vercel.app/privacy"))
                    )
                }
            },
            modifier = Modifier.align(Alignment.CenterHorizontally)
        ) {
            Text(
                text = "Privacy Policy & Account Data Deletion",
                fontSize = 11.sp,
                color = MutedSage
            )
        }
    }
}

@Composable
private fun ArenaLaunchCard(
    icon: ImageVector,
    badge: String,
    title: String,
    subtitle: String,
    accent: Color,
    onClick: () -> Unit
) {
    Surface(
        color = EmeraldSurface,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, EmeraldBorder, RoundedCornerShape(16.dp))
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accent.copy(alpha = 0.14f))
                    .border(1.dp, accent.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = accent,
                    modifier = Modifier.size(26.dp)
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text = badge,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    color = accent
                )
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = WarmIvory
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = MutedSage
                )
            }
        }
    }
}
