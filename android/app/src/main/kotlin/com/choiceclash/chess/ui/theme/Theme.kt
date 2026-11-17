package com.choiceclash.chess.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val RoyalEmeraldColorScheme = darkColorScheme(
  primary = BrushedGold,
  onPrimary = EmeraldVoid,
  primaryContainer = EmeraldElevated,
  onPrimaryContainer = GoldSoft,
  secondary = EmeraldSuccess,
  onSecondary = EmeraldVoid,
  background = EmeraldVoid,
  onBackground = WarmIvory,
  surface = EmeraldSurface,
  onSurface = WarmIvory,
  surfaceVariant = EmeraldElevated,
  onSurfaceVariant = MutedSage,
  outline = EmeraldBorder,
  error = CrimsonAlert,
  onError = WarmIvory,
)

@Composable
fun ChoiceCLASHTheme(content: @Composable () -> Unit) {
  val view = LocalView.current
  if (!view.isInEditMode) {
    SideEffect {
      val window = (view.context as? Activity)?.window
      if (window != null) {
        window.statusBarColor = EmeraldVoid.toArgb()
        window.navigationBarColor = EmeraldSurface.toArgb()
        WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
      }
    }
  }

  MaterialTheme(
    colorScheme = RoyalEmeraldColorScheme,
    typography = Typography,
    content = content,
  )
}
