package com.choiceclash.chess

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Extension
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.SmartToy
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.ui.screens.AiArenaScreen
import com.choiceclash.chess.ui.screens.HomeScreen
import com.choiceclash.chess.ui.screens.OnlineScreen
import com.choiceclash.chess.ui.screens.PuzzlesScreen
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage

private enum class AppTab(val label: String, val icon: ImageVector) {
    HOME("Home", Icons.Rounded.Home),
    AI_ARENA("Play AI", Icons.Rounded.SmartToy),
    PUZZLES("Puzzles", Icons.Rounded.Extension),
    ONLINE("Online", Icons.Rounded.Public),
}

@Composable
fun MainNavigation() {
    var currentTab by remember { mutableStateOf(AppTab.HOME) }

    Scaffold(
        containerColor = EmeraldVoid,
        bottomBar = {
            NavigationBar(
                containerColor = EmeraldSurface,
                contentColor = BrushedGold
            ) {
                AppTab.entries.forEach { tab ->
                    val selected = currentTab == tab
                    NavigationBarItem(
                        selected = selected,
                        onClick = { currentTab = tab },
                        icon = {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.label
                            )
                        },
                        label = {
                            Text(
                                text = tab.label,
                                fontSize = 11.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF0B1F17),
                            selectedTextColor = BrushedGold,
                            indicatorColor = BrushedGold,
                            unselectedIconColor = MutedSage,
                            unselectedTextColor = MutedSage
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (currentTab) {
                AppTab.HOME -> HomeScreen(
                    onOpenAiArena = { currentTab = AppTab.AI_ARENA },
                    onOpenPuzzles = { currentTab = AppTab.PUZZLES },
                    onOpenOnline = { currentTab = AppTab.ONLINE }
                )
                AppTab.AI_ARENA -> AiArenaScreen()
                AppTab.PUZZLES -> PuzzlesScreen()
                AppTab.ONLINE -> OnlineScreen()
            }
        }
    }
}
