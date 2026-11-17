package com.choiceclash.chess.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.rounded.Extension
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.SmartToy
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory

@Composable
fun HomeScreen(
    onOpenAiArena: () -> Unit,
    onOpenPuzzles: () -> Unit,
    onOpenOnline: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldVoid)
            .verticalScroll(rememberScrollState())
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
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
