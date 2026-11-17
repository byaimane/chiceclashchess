package com.choiceclash.chess.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin

object ChessSoundEffects {
    @Volatile
    var enabled: Boolean = true

    private val scope = CoroutineScope(Dispatchers.Default)

    fun playMove() = playTone(freqHz = 260.0, durationMs = 45, volume = 0.28)
    fun playCapture() = playTone(freqHz = 185.0, durationMs = 70, volume = 0.42)
    fun playCastle() {
        playTone(freqHz = 280.0, durationMs = 45, volume = 0.30)
        scope.launch {
            kotlinx.coroutines.delay(55)
            playToneSync(freqHz = 340.0, durationMs = 55, volume = 0.30)
        }
    }
    fun playCheck() = playTone(freqHz = 560.0, durationMs = 110, volume = 0.38)
    fun playGameOver() {
        scope.launch {
            playToneSync(freqHz = 440.0, durationMs = 90, volume = 0.35)
            kotlinx.coroutines.delay(95)
            playToneSync(freqHz = 554.0, durationMs = 130, volume = 0.35)
        }
    }

    private fun playTone(freqHz: Double, durationMs: Int, volume: Double) {
        if (!enabled) return
        scope.launch {
            playToneSync(freqHz, durationMs, volume)
        }
    }

    private fun playToneSync(freqHz: Double, durationMs: Int, volume: Double) {
        if (!enabled) return
        runCatching {
            val sampleRate = 22050
            val numSamples = (sampleRate * durationMs) / 1000
            val samples = ShortArray(numSamples)
            for (i in 0 until numSamples) {
                val t = i.toDouble() / sampleRate
                val env = exp(-t * 32.0)
                val wave = sin(2.0 * PI * freqHz * t) * env * volume
                samples[i] = (wave * Short.MAX_VALUE).toInt().toShort()
            }
            val track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(samples.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()
            track.write(samples, 0, samples.size)
            track.play()
            Thread.sleep(durationMs.toLong() + 30L)
            track.stop()
            track.release()
        }
    }
}
