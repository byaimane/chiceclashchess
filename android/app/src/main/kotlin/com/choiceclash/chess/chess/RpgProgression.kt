package com.choiceclash.chess.chess

import android.content.Context

enum class RpgRealmEnvironment(
    val realmNumber: Int,
    val title: String,
    val badge: String,
    val primaryHex: String,
    val secondaryHex: String,
    val plinthTopHex: String,
    val plinthBottomHex: String,
) {
    EMERALD_COURTYARD(
        realmNumber = 1,
        title = "Emerald Courtyard",
        badge = "🌲 Courtyard Fireflies",
        primaryHex = "#34D399",
        secondaryHex = "#E6B84C",
        plinthTopHex = "#1E4635",
        plinthBottomHex = "#06130E"
    ),
    IVORY_CITADEL(
        realmNumber = 2,
        title = "Ivory Citadel",
        badge = "🏛️ Sunlit Marble",
        primaryHex = "#F5D77F",
        secondaryHex = "#F7F1E3",
        plinthTopHex = "#5C4D32",
        plinthBottomHex = "#1F1A10"
    ),
    OBSIDIAN_KEEP(
        realmNumber = 3,
        title = "Obsidian Keep",
        badge = "🌋 Magma Embers",
        primaryHex = "#F97316",
        secondaryHex = "#EF4444",
        plinthTopHex = "#4A1D1A",
        plinthBottomHex = "#160706"
    ),
    GOLDEN_THRONE(
        realmNumber = 4,
        title = "Golden Throne",
        badge = "👑 Royal Sanctum",
        primaryHex = "#E6B84C",
        secondaryHex = "#FDE047",
        plinthTopHex = "#6B531E",
        plinthBottomHex = "#231A07"
    );

    companion object {
        fun forRealm(realmNumber: Int): RpgRealmEnvironment =
            entries.find { it.realmNumber == realmNumber } ?: EMERALD_COURTYARD
    }
}

enum class RpgCameraPreset(
    val label: String,
    val pitchDeg: Float,
    val yawDeg: Float,
    val scale: Float,
) {
    TACTICAL_2D("2D", 0f, 0f, 1.0f),
    CLASSIC_3D("3D Arena", 26f, 0f, 0.94f),
    ISOMETRIC_RPG("3D Iso", 31f, -13f, 0.89f),
    WARLORD_CLOSEUP("3D Warlord", 35f, 13f, 0.90f);

    val is3d: Boolean get() = this != TACTICAL_2D
}

enum class RpgRelic(
    val title: String,
    val icon: String,
    val description: String,
) {
    ORACLE_SIGHT("Oracle", "🔮", "Reveals best tactical move"),
    CHRONOS_SANDS("Chronos", "⏳", "+45s bonus clock time"),
    AEGIS_REWIND("Aegis", "🛡️", "Rewinds last turn"),
}

data class RpgHeroProfile(
    val xp: Int = 0,
    val gold: Int = 50,
) {
    val level: Int get() = 1 + (xp / 250)
    val xpInLevel: Int get() = xp % 250
    val xpForNextLevel: Int get() = 250
    val heroTitle: String
        get() = when {
            level >= 15 -> "Sovereign of the Golden Throne"
            level >= 10 -> "Obsidian Archmage"
            level >= 6 -> "Citadel Warlord"
            level >= 3 -> "Emerald Paladin"
            else -> "Vanguard Initiate"
        }
}

object RpgRepository {
    private const val PREFS_RPG = "choiceclash_rpg_prefs"
    private const val KEY_XP = "hero_xp"
    private const val KEY_GOLD = "hero_gold"
    const val MAX_ARMY_HP = 3900

    fun loadProfile(context: Context): RpgHeroProfile {
        val prefs = context.getSharedPreferences(PREFS_RPG, Context.MODE_PRIVATE)
        return RpgHeroProfile(
            xp = prefs.getInt(KEY_XP, 0).coerceAtLeast(0),
            gold = prefs.getInt(KEY_GOLD, 50).coerceAtLeast(0)
        )
    }

    fun awardRewards(context: Context, xpGain: Int, goldGain: Int): RpgHeroProfile {
        val current = loadProfile(context)
        val nextXp = (current.xp + xpGain).coerceAtLeast(0)
        val nextGold = (current.gold + goldGain).coerceAtLeast(0)
        context.getSharedPreferences(PREFS_RPG, Context.MODE_PRIVATE)
            .edit()
            .putInt(KEY_XP, nextXp)
            .putInt(KEY_GOLD, nextGold)
            .apply()
        return RpgHeroProfile(xp = nextXp, gold = nextGold)
    }

    fun calculateArmyHp(board: ChessBoard, color: PieceColor): Int {
        if (board.isCheckmate() && board.turn == color) return 0
        var total = 0
        for (p in board.squares) {
            if (p == null || p.color != color || p.type == PieceType.KING) continue
            total += p.type.valueCp
        }
        return total.coerceIn(0, MAX_ARMY_HP)
    }

    fun pieceRpgClass(type: PieceType): String = when (type) {
        PieceType.KING -> "Warlord"
        PieceType.QUEEN -> "Archmage"
        PieceType.ROOK -> "Siege Golem"
        PieceType.BISHOP -> "High Cleric"
        PieceType.KNIGHT -> "Dragon Lancer"
        PieceType.PAWN -> "Vanguard"
    }

    fun combatPopupForMove(move: ChessMove, afterBoard: ChessBoard): String? = when {
        afterBoard.isCheckmate() -> "👑 FATAL CHECKMATE! VICTORY!"
        afterBoard.inCheck() && move.captured != null ->
            "⚡ CRITICAL CHECK! -${move.captured.type.valueCp} HP (${pieceRpgClass(move.captured.type)})"
        afterBoard.inCheck() -> "🔥 ROYAL CHECK! KING THREATENED!"
        move.promotion != null -> "✨ ASCENSION! PROMOTED TO ${pieceRpgClass(move.promotion).uppercase()}!"
        move.captured != null ->
            "⚔️ SLAIN ${pieceRpgClass(move.captured.type).uppercase()}! -${move.captured.type.valueCp} HP"
        move.isCastleKingside || move.isCastleQueenside -> "🛡️ FORTRESS FORMATION (CASTLE)"
        else -> null
    }

    fun bossDialogue(
        guardianName: String,
        move: ChessMove?,
        afterBoard: ChessBoard
    ): String {
        if (afterBoard.isCheckmate()) {
            return if (afterBoard.turn == PieceColor.BLACK) {
                "$guardianName: \"Impossible... My royal guard has fallen!\""
            } else {
                "$guardianName: \"Kneel before the realm's might!\""
            }
        }
        if (afterBoard.inCheck()) {
            return if (afterBoard.turn == PieceColor.WHITE) {
                "$guardianName: \"Your King is exposed! Guard your throne!\""
            } else {
                "$guardianName: \"A bold strike against my crown...\""
            }
        }
        val cap = move?.captured
        if (cap != null) {
            return if (move.piece.color == PieceColor.WHITE) {
                "$guardianName: \"You struck down my ${pieceRpgClass(cap.type)}! You'll pay for that!\""
            } else {
                "$guardianName: \"Your ${pieceRpgClass(cap.type)} falls to my blade!\""
            }
        }
        return "$guardianName: \"Show me your strategy on the 3D battlefield.\""
    }
}
