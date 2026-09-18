package com.roxstar.app

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * RoxstarAudio — Expo Native Module
 *
 * Exposes the Oboe-backed AudioEngine C++ library to JavaScript via JNI.
 * Consumed in JS with:
 *   import { requireNativeModule } from 'expo-modules-core';
 *   const AudioModule = requireNativeModule('RoxstarAudio');
 */
class AudioModule : Module() {

  override fun definition() = ModuleDefinition {

    Name("RoxstarAudio")

    /**
     * startRecording(path: string) -> boolean
     * Opens an Oboe input stream and begins writing PCM to a WAV file at [path].
     */
    AsyncFunction("startRecording") { path: String ->
      nativeStartRecording(path)
    }

    /**
     * stopRecording() -> boolean
     * Stops the Oboe stream and finalises the WAV header. Returns true on success.
     */
    AsyncFunction("stopRecording") {
      nativeStopRecording()
    }

    /**
     * cancelRecording() -> void
     * Stops the Oboe stream and deletes the partial WAV file.
     */
    AsyncFunction("cancelRecording") {
      nativeCancelRecording()
    }

    /**
     * isRecording() -> boolean
     * Synchronous query — true if a recording is currently active.
     */
    Function("isRecording") {
      nativeIsRecording()
    }
  }

  // ─── JNI declarations ──────────────────────────────────────────────────────

  private external fun nativeStartRecording(path: String): Boolean
  private external fun nativeStopRecording(): Boolean
  private external fun nativeCancelRecording(): Boolean
  private external fun nativeIsRecording(): Boolean

  companion object {
    init {
      System.loadLibrary("roxstar_audio_jni")
    }
  }
}

