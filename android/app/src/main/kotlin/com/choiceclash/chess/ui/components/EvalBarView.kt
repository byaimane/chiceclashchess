package com.choiceclash.chess.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.choiceclash.chess.chess.PositionEvaluation
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.WarmIvory

@Composable
fun EvalBarView(
    evaluation: PositionEvaluation,
    modifier: Modifier = Modifier
) {
    val animatedWhitePct by animateFloatAsState(
        targetValue = evaluation.whiteAdvantagePct.coerceIn(0.05f, 0.95f),
        animationSpec = tween(durationMillis = 320),
        label = "eval_bar_anim"
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(26.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(EmeraldSurface)
            .border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp)),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .weight(animatedWhitePct)
                .fillMaxHeight()
                .background(WarmIvory)
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            if (evaluation.scoreCp >= 0) {
                Text(
                    text = evaluation.displayScore,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0B1F17)
                )
            }
        }
        Box(
            modifier = Modifier
                .weight(1f - animatedWhitePct)
                .fillMaxHeight()
                .background(Color(0xFF102019))
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            if (evaluation.scoreCp < 0) {
                Text(
                    text = evaluation.displayScore,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrushedGold
                )
            }
        }
    }
}
