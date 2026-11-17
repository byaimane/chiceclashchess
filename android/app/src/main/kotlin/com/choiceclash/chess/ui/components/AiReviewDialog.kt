package com.choiceclash.chess.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.choiceclash.chess.chess.GameReviewReport
import com.choiceclash.chess.chess.MoveClassification
import com.choiceclash.chess.chess.PieceColor
import com.choiceclash.chess.ui.theme.AmberWarning
import com.choiceclash.chess.ui.theme.BrushedGold
import com.choiceclash.chess.ui.theme.CrimsonAlert
import com.choiceclash.chess.ui.theme.EmeraldBorder
import com.choiceclash.chess.ui.theme.EmeraldElevated
import com.choiceclash.chess.ui.theme.EmeraldSuccess
import com.choiceclash.chess.ui.theme.EmeraldSurface
import com.choiceclash.chess.ui.theme.EmeraldVoid
import com.choiceclash.chess.ui.theme.MutedSage
import com.choiceclash.chess.ui.theme.WarmIvory
import kotlin.math.roundToInt

@Composable
fun AiReviewDialog(
    report: GameReviewReport,
    mistakesSaved: Boolean,
    onSaveMistakes: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = EmeraldSurface,
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BrushedGold.copy(alpha = 0.45f), RoundedCornerShape(18.dp))
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Post-Game AI Review",
                    style = MaterialTheme.typography.titleLarge,
                    color = BrushedGold,
                    fontWeight = FontWeight.Bold
                )

                // Accuracy row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    AccuracyCard(
                        label = "White Accuracy",
                        accuracy = report.whiteAccuracy,
                        modifier = Modifier.weight(1f)
                    )
                    AccuracyCard(
                        label = "Black Accuracy",
                        accuracy = report.blackAccuracy,
                        modifier = Modifier.weight(1f)
                    )
                }

                // Opening & Coach summary
                Surface(
                    color = EmeraldElevated,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        report.opening?.let { op ->
                            Text(
                                text = "${op.eco} • ${op.name}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = BrushedGold
                            )
                        }
                        Text(
                            text = report.coachSummary,
                            fontSize = 13.sp,
                            color = WarmIvory
                        )
                        report.turningPoint?.let { tp ->
                            val side = if (tp.color == PieceColor.WHITE) "White" else "Black"
                            Text(
                                text = "Turning Point: ${tp.moveNumber}. $side played ${tp.san} (best: ${tp.bestMoveSan})",
                                fontSize = 12.sp,
                                color = AmberWarning,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                // Move list
                Text(
                    text = "Move Breakdown (${report.moves.size} plies)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MutedSage
                )

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 220.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(report.moves) { item ->
                        val badgeColor = when (item.classification) {
                            MoveClassification.BEST -> EmeraldSuccess
                            MoveClassification.GOOD -> Color(0xFF4CA984)
                            MoveClassification.INACCURACY -> BrushedGold
                            MoveClassification.MISTAKE -> AmberWarning
                            MoveClassification.BLUNDER -> CrimsonAlert
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(EmeraldVoid.copy(alpha = 0.65f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 7.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                val prefix = if (item.color == PieceColor.WHITE) "${item.moveNumber}." else "${item.moveNumber}..."
                                Text(
                                    text = "$prefix ${item.san}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = WarmIvory
                                )
                                if (item.classification != MoveClassification.BEST && item.bestMoveSan != item.san) {
                                    Text(
                                        text = "Best: ${item.bestMoveSan} (-${item.cpLoss} cp)",
                                        fontSize = 11.sp,
                                        color = MutedSage
                                    )
                                }
                            }
                            Surface(
                                color = badgeColor.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.border(1.dp, badgeColor.copy(alpha = 0.6f), RoundedCornerShape(6.dp))
                            ) {
                                Text(
                                    text = item.classification.label,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = badgeColor,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                }

                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (report.mistakePuzzles.isNotEmpty()) {
                        Button(
                            onClick = onSaveMistakes,
                            enabled = !mistakesSaved,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrushedGold,
                                contentColor = Color(0xFF0B1F17)
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = if (mistakesSaved) "Saved to Trainer ✓"
                                else "Save ${report.mistakePuzzles.size} Mistake(s)",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                    TextButton(onClick = onDismiss) {
                        Text("Close", color = BrushedGold)
                    }
                }
            }
        }
    }
}

@Composable
private fun AccuracyCard(
    label: String,
    accuracy: Double,
    modifier: Modifier = Modifier
) {
    Surface(
        color = EmeraldElevated,
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.border(1.dp, EmeraldBorder, RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, fontSize = 11.sp, color = MutedSage)
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${accuracy.roundToInt()}%",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = BrushedGold
            )
        }
    }
}
