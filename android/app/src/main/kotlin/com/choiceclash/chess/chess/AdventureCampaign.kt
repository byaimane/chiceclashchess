package com.choiceclash.chess.chess

import android.content.Context
import org.json.JSONObject

enum class AdventureNodeType(val badge: String, val iconGlyph: String) {
    DUEL("Duel", "⚔️"),
    BLITZ("Blitz Ambush", "⚡"),
    TRIAL("Gatekeeper Trial", "🧩"),
    BOSS("Realm Boss", "👑"),
}

data class AdventureNode(
    val id: Int,
    val realmNumber: Int,
    val realmName: String,
    val title: String,
    val guardianName: String,
    val subtitle: String,
    val nodeType: AdventureNodeType,
    val difficulty: AiDifficulty,
    val personality: AiPersonality,
    val startFen: String = ChessBoard.START_FEN,
    val timeLimitSec: Int = 0,
    val parPlies: Int = 50,
    val rewardTitle: String? = null,
)

data class AdventureProgress(
    val unlockedLevel: Int = 1,
    val starsByLevel: Map<Int, Int> = emptyMap(),
) {
    val totalStars: Int get() = starsByLevel.values.sum()
    val completedCount: Int get() = starsByLevel.size
}

object AdventureRepository {
    private const val PREFS_ADVENTURE = "choiceclash_adventure_prefs"
    private const val KEY_UNLOCKED = "unlocked_level"
    private const val KEY_STARS_JSON = "stars_json"

    val nodes: List<AdventureNode> = listOf(
        // Realm I: Emerald Courtyard
        AdventureNode(
            id = 1,
            realmNumber = 1,
            realmName = "Emerald Courtyard",
            title = "Squire's Gate",
            guardianName = "Alden the Page",
            subtitle = "Opening duel at the outer gates. Win to enter the Courtyard.",
            nodeType = AdventureNodeType.DUEL,
            difficulty = AiDifficulty.NOVICE,
            personality = AiPersonality.BALANCED,
            parPlies = 56,
        ),
        AdventureNode(
            id = 2,
            realmNumber = 1,
            realmName = "Emerald Courtyard",
            title = "Emerald Watchtower",
            guardianName = "Scout Lyra",
            subtitle = "Italian Game outpost. Seize the diagonal advantage from move 3.",
            nodeType = AdventureNodeType.TRIAL,
            difficulty = AiDifficulty.NOVICE,
            personality = AiPersonality.AGGRESSIVE,
            startFen = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 3 3",
            parPlies = 52,
        ),
        AdventureNode(
            id = 3,
            realmNumber = 1,
            realmName = "Emerald Courtyard",
            title = "Courtyard Keep",
            guardianName = "Warden Garrick",
            subtitle = "Defeat the Courtyard Boss to unlock the Ivory Citadel.",
            nodeType = AdventureNodeType.BOSS,
            difficulty = AiDifficulty.NOVICE,
            personality = AiPersonality.POSITIONAL,
            parPlies = 50,
            rewardTitle = "Courtyard Squire",
        ),

        // Realm II: Ivory Citadel
        AdventureNode(
            id = 4,
            realmNumber = 2,
            realmName = "Ivory Citadel",
            title = "Marble Hall",
            guardianName = "Lady Isolde",
            subtitle = "A disciplined positional match inside the gleaming marble court.",
            nodeType = AdventureNodeType.DUEL,
            difficulty = AiDifficulty.CLUB,
            personality = AiPersonality.POSITIONAL,
            parPlies = 58,
        ),
        AdventureNode(
            id = 5,
            realmNumber = 2,
            realmName = "Ivory Citadel",
            title = "Twin Spires",
            guardianName = "Captain Rowan",
            subtitle = "Blitz ambush! Defeat the Twins within a strict 3-minute clock.",
            nodeType = AdventureNodeType.BLITZ,
            difficulty = AiDifficulty.CLUB,
            personality = AiPersonality.AGGRESSIVE,
            timeLimitSec = 180,
            parPlies = 54,
        ),
        AdventureNode(
            id = 6,
            realmNumber = 2,
            realmName = "Ivory Citadel",
            title = "Citadel Battlement",
            guardianName = "Commander Vane",
            subtitle = "Queen's Gambit siege. Break the citadel defense to march onward.",
            nodeType = AdventureNodeType.BOSS,
            difficulty = AiDifficulty.CLUB,
            personality = AiPersonality.BALANCED,
            startFen = "rnbqkbnr/ppp1pppp/8/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 1 3",
            parPlies = 56,
            rewardTitle = "Citadel Knight",
        ),

        // Realm III: Obsidian Keep
        AdventureNode(
            id = 7,
            realmNumber = 3,
            realmName = "Obsidian Keep",
            title = "Shadow Bridge",
            guardianName = "Sable Duelist",
            subtitle = "Cross the dark bridge against an unforgiving tactical opponent.",
            nodeType = AdventureNodeType.DUEL,
            difficulty = AiDifficulty.MASTER,
            personality = AiPersonality.AGGRESSIVE,
            parPlies = 62,
        ),
        AdventureNode(
            id = 8,
            realmNumber = 3,
            realmName = "Obsidian Keep",
            title = "Alchemy Vault",
            guardianName = "Archmage Kael",
            subtitle = "A sharp symmetric middlegame battle for central control.",
            nodeType = AdventureNodeType.TRIAL,
            difficulty = AiDifficulty.MASTER,
            personality = AiPersonality.BALANCED,
            startFen = "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 4 6",
            parPlies = 56,
        ),
        AdventureNode(
            id = 9,
            realmNumber = 3,
            realmName = "Obsidian Keep",
            title = "Obsidian Spire",
            guardianName = "The Obsidian Tactician",
            subtitle = "Timed 4-minute boss duel guarding the bridge to the Golden Throne.",
            nodeType = AdventureNodeType.BOSS,
            difficulty = AiDifficulty.MASTER,
            personality = AiPersonality.AGGRESSIVE,
            timeLimitSec = 240,
            parPlies = 60,
            rewardTitle = "Obsidian Master",
        ),

        // Realm IV: Golden Throne
        AdventureNode(
            id = 10,
            realmNumber = 4,
            realmName = "Golden Throne",
            title = "Royal Gallery",
            guardianName = "High Strategist Orin",
            subtitle = "Precision endgame & positional calculation at the royal court.",
            nodeType = AdventureNodeType.DUEL,
            difficulty = AiDifficulty.GRANDMASTER,
            personality = AiPersonality.POSITIONAL,
            parPlies = 68,
        ),
        AdventureNode(
            id = 11,
            realmNumber = 4,
            realmName = "Golden Throne",
            title = "Crown Sanctum",
            guardianName = "Royal Guard Captain",
            subtitle = "Final 3-minute blitz trial before the throne doors open.",
            nodeType = AdventureNodeType.BLITZ,
            difficulty = AiDifficulty.GRANDMASTER,
            personality = AiPersonality.AGGRESSIVE,
            timeLimitSec = 180,
            parPlies = 64,
        ),
        AdventureNode(
            id = 12,
            realmNumber = 4,
            realmName = "Golden Throne",
            title = "The Golden Throne",
            guardianName = "The Grandmaster King",
            subtitle = "Final Boss. Claim the crown across the ChoiceCLASH kingdom.",
            nodeType = AdventureNodeType.BOSS,
            difficulty = AiDifficulty.GRANDMASTER,
            personality = AiPersonality.BALANCED,
            timeLimitSec = 300,
            parPlies = 70,
            rewardTitle = "Champion of the Golden Throne",
        ),
    )

    fun loadProgress(context: Context): AdventureProgress {
        val prefs = context.getSharedPreferences(PREFS_ADVENTURE, Context.MODE_PRIVATE)
        val unlocked = prefs.getInt(KEY_UNLOCKED, 1).coerceIn(1, nodes.size)
        val raw = prefs.getString(KEY_STARS_JSON, "{}") ?: "{}"
        val starsMap = mutableMapOf<Int, Int>()
        runCatching {
            val json = JSONObject(raw)
            val keys = json.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                val id = k.toIntOrNull()
                if (id != null) {
                    starsMap[id] = json.optInt(k, 1).coerceIn(1, 3)
                }
            }
        }
        return AdventureProgress(unlockedLevel = unlocked, starsByLevel = starsMap)
    }

    fun recordVictory(
        context: Context,
        levelId: Int,
        pliesCount: Int,
    ): Pair<AdventureProgress, Int> {
        val current = loadProgress(context)
        val node = nodes.find { it.id == levelId }
        val par = node?.parPlies ?: 50
        val earnedStars = when {
            pliesCount <= par - 12 -> 3
            pliesCount <= par -> 2
            else -> 1
        }

        val updatedStars = current.starsByLevel.toMutableMap()
        val prevBest = updatedStars[levelId] ?: 0
        updatedStars[levelId] = maxOf(prevBest, earnedStars)

        val nextUnlocked = maxOf(
            current.unlockedLevel,
            (levelId + 1).coerceAtMost(nodes.size)
        )

        val json = JSONObject()
        updatedStars.forEach { (id, s) -> json.put(id.toString(), s) }

        context.getSharedPreferences(PREFS_ADVENTURE, Context.MODE_PRIVATE)
            .edit()
            .putInt(KEY_UNLOCKED, nextUnlocked)
            .putString(KEY_STARS_JSON, json.toString())
            .apply()

        return AdventureProgress(unlockedLevel = nextUnlocked, starsByLevel = updatedStars) to earnedStars
    }

    fun currentPlayerTitle(progress: AdventureProgress): String {
        val completed = progress.starsByLevel.keys
        for (node in nodes.asReversed()) {
            if (node.rewardTitle != null && node.id in completed) {
                return node.rewardTitle
            }
        }
        return "Royal Traveler"
    }
}
