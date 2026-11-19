package com.choiceclash.chess.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.choiceclash.chess.chess.RpgCameraPreset
import com.choiceclash.chess.chess.RpgHeroProfile
import com.choiceclash.chess.chess.RpgRealmEnvironment
import com.choiceclash.chess.chess.RpgRelic
import com.choiceclash.chess.chess.RpgRepository
import com.choiceclash.chess.data.RemoteConfigManager
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.CrimsonAlert
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSuccess
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory

@Composable
fun RpgBossAndHeroHud(
    heroProfile: RpgHeroProfile,
    heroHp: Int,
    bossName: String,
    bossTitle: String,
    bossHp: Int,
    dialogue: String,
    combatBanner: String?,
    modifier: Modifier = Modifier
) {
    val heroPct by animateFloatAsState(
        targetValue = (heroHp.toFloat() / RpgRepository.MAX_ARMY_HP).coerceIn(0.04f, 1f),
        animationSpec = tween(350),
        label = "hero_hp"
    )
    val bossPct by animateFloatAsState(
        targetValue = (bossHp.toFloat() / RpgRepository.MAX_ARMY_HP).coerceIn(0.04f, 1f),
        animationSpec = tween(350),
        label = "boss_hp"
    )

    Surface(
        color = EmeraldSurface,
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, BrushedGold.copy(alpha = 0.45f), RoundedCornerShape(14.dp))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Hero vs Boss HP bars
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Hero side
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "♔ You (Lv.${heroProfile.level})",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = WarmIvory
                        )
                        Text(
                            text = "$heroHp HP",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldSuccess
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(EmeraldVoid)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(heroPct)
                                .fillMaxHeight()
                                .background(EmeraldSuccess)
                        )
                    }
                }

                Text("VS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = BrushedGold)

                // Boss side
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "♚ $bossName",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrushedGold,
                            maxLines = 1
                        )
                        Text(
                            text = "$bossHp HP",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = CrimsonAlert
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(EmeraldVoid)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(bossPct)
                                .fillMaxHeight()
                                .background(CrimsonAlert)
                        )
                    }
                }
            }

            // Boss dialogue or active Combat VFX popup
            if (!combatBanner.isNullOrBlank()) {
                Surface(
                    color = BrushedGold.copy(alpha = 0.18f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BrushedGold.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                ) {
                    Text(
                        text = combatBanner,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrushedGold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            } else {
                Text(
                    text = "$dialogue ($bossTitle)",
                    fontSize = 11.sp,
                    color = MutedSage
                )
            }
        }
    }
}

@Composable
fun RpgCameraAndRealmBar(
    cameraPreset: RpgCameraPreset,
    onSelectCamera: (RpgCameraPreset) -> Unit,
    yawOffset: Float,
    onRotateYaw: (Float) -> Unit,
    realm: RpgRealmEnvironment,
    onSelectRealm: ((RpgRealmEnvironment) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RpgCameraPreset.entries.forEach { preset ->
                val selected = cameraPreset == preset
                FilterChip(
                    selected = selected,
                    onClick = { onSelectCamera(preset) },
                    label = {
                        Text(
                            text = preset.label,
                            fontSize = 11.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrushedGold,
                        selectedLabelColor = Color(0xFF0B1F17),
                        containerColor = EmeraldSurface,
                        labelColor = WarmIvory
                    )
                )
            }

            if (cameraPreset.is3d) {
                Surface(
                    color = EmeraldElevated,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp))
                        .clickable { onRotateYaw((yawOffset - 10f).coerceIn(-35f, 35f)) }
                ) {
                    Text(
                        text = "⟲ Tilt L",
                        fontSize = 11.sp,
                        color = BrushedGold,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                    )
                }
                Surface(
                    color = EmeraldElevated,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp))
                        .clickable { onRotateYaw(0f) }
                ) {
                    Text(
                        text = "Center",
                        fontSize = 11.sp,
                        color = WarmIvory,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                    )
                }
                Surface(
                    color = EmeraldElevated,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp))
                        .clickable { onRotateYaw((yawOffset + 10f).coerceIn(-35f, 35f)) }
                ) {
                    Text(
                        text = "Tilt R ⟳",
                        fontSize = 11.sp,
                        color = BrushedGold,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                    )
                }
            }
        }

        if (onSelectRealm != null && cameraPreset.is3d) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                RpgRealmEnvironment.entries.forEach { env ->
                    val selected = realm == env
                    val accent = RemoteConfigManager.parseHexColor(env.primaryHex, BrushedGold)
                    FilterChip(
                        selected = selected,
                        onClick = { onSelectRealm(env) },
                        label = { Text(env.badge, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = accent.copy(alpha = 0.25f),
                            selectedLabelColor = WarmIvory,
                            containerColor = EmeraldSurface,
                            labelColor = MutedSage
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun RpgRelicActionBar(
    usedRelics: Set<RpgRelic>,
    showChronos: Boolean,
    onActivateRelic: (RpgRelic) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        RpgRelic.entries.filter { it != RpgRelic.CHRONOS_SANDS || showChronos }.forEach { relic ->
            val used = relic in usedRelics
            Surface(
                color = if (used) EmeraldVoid.copy(alpha = 0.5f) else EmeraldElevated,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .weight(1f)
                    .border(
                        1.dp,
                        if (used) EmeraldBorder.copy(alpha = 0.4f) else BrushedGold.copy(alpha = 0.55f),
                        RoundedCornerShape(10.dp)
                    )
                    .clip(RoundedCornerShape(10.dp))
                    .clickable(enabled = !used) { onActivateRelic(relic) }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(text = relic.icon, fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Column {
                        Text(
                            text = if (used) "${relic.title} ✓" else relic.title,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (used) MutedSage else BrushedGold
                        )
                        Text(
                            text = relic.description,
                            fontSize = 9.sp,
                            color = MutedSage,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}
