#include <jni.h>
#include <android/log.h>
#include "AudioEngine.h"

#include <string>

#define LOG_TAG "RoxstarAudio"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static roxstar::AudioEngine g_engine;

static std::string jstringToStd(JNIEnv* env, jstring value) {
    if (value == nullptr) {
        return {};
    }

    const char* characters = env->GetStringUTFChars(value, nullptr);
    if (characters == nullptr) {
        return {};
    }

    std::string result(characters);
    env->ReleaseStringUTFChars(value, characters);
    return result;
}

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeStartRecording(JNIEnv* env, jobject, jstring path) {
    std::string nativePath = jstringToStd(env, path);
    LOGI("startRecording: %s", nativePath.c_str());
    const bool started = g_engine.startRecording(nativePath);
    if (!started) {
        LOGE("AudioEngine::startRecording failed");
    }
    return started ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeStopRecording(JNIEnv*, jobject) {
    return g_engine.stopRecording() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeCancelRecording(JNIEnv*, jobject) {
    return g_engine.cancelRecording() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeSetEffect(JNIEnv* env, jobject, jstring effect) {
    return g_engine.setEffect(jstringToStd(env, effect)) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_roxstar_app_AudioModule_nativeIsRecording(JNIEnv*, jobject) {
    return g_engine.isRecording() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jdouble JNICALL
Java_com_roxstar_app_AudioModule_nativeGetLastRecordingDuration(JNIEnv*, jobject) {
    return static_cast<jdouble>(g_engine.lastRecordingDuration());
}

}