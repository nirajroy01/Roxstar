#pragma once

#include <oboe/Oboe.h>

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <condition_variable>
#include <fstream>
#include <memory>
#include <mutex>
#include <string>
#include <thread>

#include "EchoEffect.h"
#include "LockFreePcmQueue.h"

namespace roxstar {

class AudioEngine : public oboe::AudioStreamDataCallback {
public:
  AudioEngine();
  ~AudioEngine();

  bool startRecording(const std::string& outputPath);
  bool stopRecording();
  bool cancelRecording();
  bool setEffect(const std::string& effect);
  bool writeSamples(const std::int16_t* samples, std::size_t sampleCount);
  bool isRecording() const;
  double lastRecordingDuration() const;

  oboe::DataCallbackResult onAudioReady(
      oboe::AudioStream* stream,
      void* audioData,
      std::int32_t numFrames) override;

private:
  enum class Effect {
    Clean,
    Echo,
  };

  bool openAudioStream();
  void closeAudioStream();
  bool startWriter();
  void stopWriter();
  void writerLoop();
  bool cancelRecordingLocked();
  bool writeWavHeader();
  bool finalizeWav();
  void resetState();

  std::atomic<bool> recording_{false};
  std::atomic<bool> writerRunning_{false};
  std::atomic<bool> writeError_{false};
  std::atomic<double> lastRecordingDuration_{0.0};
  std::shared_ptr<oboe::AudioStream> audioStream_;
  Effect effect_ = Effect::Clean;
  EchoEffect echoEffect_;
  LockFreePcmQueue<std::int16_t> pcmQueue_{96001};
  std::thread writerThread_;
  std::condition_variable writerSignal_;
  std::mutex writerSignalMutex_;
  std::mutex lifecycleMutex_;
  std::string outputPath_;
  std::ofstream stream_;
  std::uint32_t sampleRate_ = 48000;
  std::uint16_t channels_ = 1;
  std::uint16_t bitsPerSample_ = 16;
  std::uint32_t totalSamples_ = 0;
};

}  // namespace roxstar
