package com.roxstar.app

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RoxstarAudio")

    AsyncFunction("startRecording") { path: String ->
      nativeStartRecording(path)
    }

    AsyncFunction("stopRecording") {
      nativeStopRecording()
    }

    AsyncFunction("cancelRecording") {
      nativeCancelRecording()
    }

    Function("setEffect") { effect: String ->
      nativeSetEffect(effect)
    }

    Function("isRecording") {
      nativeIsRecording()
    }

    Function("getLastRecordingDuration") {
      nativeGetLastRecordingDuration()
    }

    OnDestroy {
      nativeCancelRecording()
    }
  }

  private external fun nativeStartRecording(path: String): Boolean
  private external fun nativeStopRecording(): Boolean
  private external fun nativeCancelRecording(): Boolean
  private external fun nativeSetEffect(effect: String): Boolean
  private external fun nativeIsRecording(): Boolean
  private external fun nativeGetLastRecordingDuration(): Double

  companion object {
    init {
      System.loadLibrary("roxstar_audio_jni")
    }
  }
}