/**
 * roxstar_audio_jni.cpp
 *
 * JNI bridge between the Kotlin AudioModule and the C++ AudioEngine + Oboe.
 *
 * Architecture:
 *   JS  →  AudioModule.kt (Expo Module)  →  JNI  →  Oboe (capture)
 *                                                  →  AudioEngine (WAV write)
 */
#include <jni.h>
#include <oboe/Oboe.h>
#include <android/log.h>
#include "AudioEngine.h"

#include <memory>
#include <string>

#define LOG_TAG "RoxstarAudio"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static roxstar::AudioEngine g_engine;
static std::shared_ptr<oboe::AudioStream> g_stream;

class RecordingCallback : public oboe::AudioStreamDataCallback {
public:
    explicit RecordingCallback(roxstar::AudioEngine& engine) : engine_(engine) {}

    oboe::DataCallbackResult onAudioReady(
            oboe::AudioStream* /*stream*/,
            void* audioData,
            int32_t numFrames) override {
        engine_.writeSamples(static_cast<int16_t*>(audioData), static_cast<size_t>(numFrames));
        return oboe::DataCallbackResult::Continue;
    }

private:
    roxstar::AudioEngine& engine_;
};

static std::unique_ptr<RecordingCallback> g_callback;

static std::string jstringToStd(JNIEnv* env, jstring jstr) {
    const char* c = env->GetStringUTFChars(jstr, nullptr);
    std::string s(c);
    env->ReleaseStringUTFChars(jstr, c);
    return s;
}

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeStartRecording(JNIEnv* env, jobject, jstring jpath) {
    std::string path = jstringToStd(env, jpath);
    LOGI("startRecording: %s", path.c_str());

    if (!g_engine.startRecording(path)) { LOGE("AudioEngine::startRecording failed"); return JNI_FALSE; }

    g_callback = std::make_unique<RecordingCallback>(g_engine);
    oboe::AudioStreamBuilder builder;
    builder.setDirection(oboe::Direction::Input)
           ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
           ->setSharingMode(oboe::SharingMode::Exclusive)
           ->setFormat(oboe::AudioFormat::I16)
           ->setChannelCount(oboe::ChannelCount::Mono)
           ->setSampleRate(48000)
           ->setDataCallback(g_callback.get());

    oboe::Result r = builder.openStream(g_stream);
    if (r != oboe::Result::OK) { g_engine.cancelRecording(); g_callback.reset(); return JNI_FALSE; }

    r = g_stream->requestStart();
    if (r != oboe::Result::OK) { g_stream->close(); g_stream.reset(); g_engine.cancelRecording(); g_callback.reset(); return JNI_FALSE; }

    return JNI_TRUE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeStopRecording(JNIEnv*, jobject) {
    if (g_stream) { g_stream->requestStop(); g_stream->close(); g_stream.reset(); }
    g_callback.reset();
    return g_engine.stopRecording() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeCancelRecording(JNIEnv*, jobject) {
    if (g_stream) { g_stream->requestStop(); g_stream->close(); g_stream.reset(); }
    g_callback.reset();
    return g_engine.cancelRecording() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeIsRecording(JNIEnv*, jobject) {
    return g_engine.isRecording() ? JNI_TRUE : JNI_FALSE;
}

} // extern "C"

