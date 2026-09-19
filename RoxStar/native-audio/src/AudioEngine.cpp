#include "AudioEngine.h"

#include <array>
#include <chrono>
#include <cstdio>
#include <fstream>

namespace {

struct WavHeader {
  char riffId[4] = {'R', 'I', 'F', 'F'};
  std::uint32_t riffSize = 0;
  char waveId[4] = {'W', 'A', 'V', 'E'};
  char fmtId[4] = {'f', 'm', 't', ' '};
  std::uint32_t fmtSize = 16;
  std::uint16_t audioFormat = 1;
  std::uint16_t numChannels = 1;
  std::uint32_t sampleRate = 48000;
  std::uint32_t byteRate = 96000;
  std::uint16_t blockAlign = 2;
  std::uint16_t bitsPerSample = 16;
  char dataId[4] = {'d', 'a', 't', 'a'};
  std::uint32_t dataSize = 0;
};

}  // namespace

namespace roxstar {

AudioEngine::AudioEngine() = default;

AudioEngine::~AudioEngine() {
  stopRecording();
}

bool AudioEngine::startRecording(const std::string& outputPath) {
  std::lock_guard<std::mutex> lock(lifecycleMutex_);
  if (outputPath.empty()) {
    return false;
  }

  if (recording_.load(std::memory_order_acquire)) {
    return false;
  }

  resetState();
  echoEffect_.reset();
  lastRecordingDuration_.store(0.0, std::memory_order_release);
  outputPath_ = outputPath;

  stream_.open(outputPath_, std::ios::binary | std::ios::out | std::ios::trunc);
  if (!stream_) {
    resetState();
    return false;
  }

  if (!openAudioStream()) {
    cancelRecordingLocked();
    return false;
  }

  sampleRate_ = static_cast<std::uint32_t>(audioStream_->getSampleRate());
  channels_ = static_cast<std::uint16_t>(audioStream_->getChannelCount());
  echoEffect_.configure(static_cast<float>(sampleRate_));
  if (!writeWavHeader()) {
    cancelRecordingLocked();
    return false;
  }

  if (!startWriter()) {
    cancelRecordingLocked();
    return false;
  }
  recording_.store(true, std::memory_order_release);
  const oboe::Result result = audioStream_->requestStart();
  if (result != oboe::Result::OK) {
    cancelRecordingLocked();
    return false;
  }

  return true;
}

bool AudioEngine::stopRecording() {
  std::lock_guard<std::mutex> lock(lifecycleMutex_);
  if (!recording_.load(std::memory_order_acquire) && !stream_.is_open()) {
    return false;
  }

  recording_.store(false, std::memory_order_release);
  closeAudioStream();
  stopWriter();

  const bool finalized = !writeError_.load(std::memory_order_acquire) &&
      stream_.is_open() && finalizeWav();
  if (finalized) {
    const double denominator = static_cast<double>(sampleRate_) * channels_;
    lastRecordingDuration_.store(totalSamples_ / denominator, std::memory_order_release);
  } else if (!outputPath_.empty()) {
    if (stream_.is_open()) {
      stream_.close();
    }
    std::remove(outputPath_.c_str());
  }

  resetState();
  return finalized;
}

bool AudioEngine::cancelRecording() {
  std::lock_guard<std::mutex> lock(lifecycleMutex_);
  return cancelRecordingLocked();
}

bool AudioEngine::cancelRecordingLocked() {
  recording_.store(false, std::memory_order_release);
  closeAudioStream();
  stopWriter();

  if (stream_.is_open()) {
    stream_.close();
  }

  if (!outputPath_.empty()) {
    std::remove(outputPath_.c_str());
  }

  resetState();
  return true;
}

bool AudioEngine::setEffect(const std::string& effect) {
  std::lock_guard<std::mutex> lock(lifecycleMutex_);
  if (recording_.load(std::memory_order_acquire)) {
    return false;
  }

  if (effect == "clean") {
    effect_ = Effect::Clean;
    return true;
  }
  if (effect == "echo") {
    effect_ = Effect::Echo;
    return true;
  }
  return false;
}

bool AudioEngine::writeSamples(const std::int16_t* samples, std::size_t sampleCount) {
  if (!samples || sampleCount == 0) {
    return false;
  }

  if (!stream_.is_open()) {
    return false;
  }

  stream_.write(reinterpret_cast<const char*>(samples), static_cast<std::streamsize>(sampleCount * sizeof(std::int16_t)));
  if (!stream_) {
    return false;
  }

  totalSamples_ += static_cast<std::uint32_t>(sampleCount);
  return true;
}

bool AudioEngine::isRecording() const {
  return recording_.load(std::memory_order_acquire);
}

double AudioEngine::lastRecordingDuration() const {
  return lastRecordingDuration_.load(std::memory_order_acquire);
}

oboe::DataCallbackResult AudioEngine::onAudioReady(
    oboe::AudioStream* /*stream*/,
    void* audioData,
    std::int32_t numFrames) {
  if (!recording_.load(std::memory_order_acquire) ||
      writeError_.load(std::memory_order_acquire)) {
    return oboe::DataCallbackResult::Stop;
  }

  if (numFrames > 0) {
    auto* samples = static_cast<std::int16_t*>(audioData);
    const auto sampleCount = static_cast<std::size_t>(numFrames) * channels_;
    if (effect_ == Effect::Echo) {
      echoEffect_.process(samples, sampleCount);
    }
    if (!pcmQueue_.push(samples, sampleCount)) {
      writeError_.store(true, std::memory_order_release);
      recording_.store(false, std::memory_order_release);
      return oboe::DataCallbackResult::Stop;
    }
    writerSignal_.notify_one();
  }
  return oboe::DataCallbackResult::Continue;
}

bool AudioEngine::openAudioStream() {
  oboe::AudioStreamBuilder builder;
  builder.setDirection(oboe::Direction::Input)
      ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
      ->setSharingMode(oboe::SharingMode::Exclusive)
      ->setFormat(oboe::AudioFormat::I16)
      ->setChannelCount(oboe::ChannelCount::Mono)
      ->setSampleRate(static_cast<std::int32_t>(sampleRate_))
      ->setDataCallback(this);

  return builder.openStream(audioStream_) == oboe::Result::OK;
}

void AudioEngine::closeAudioStream() {
  if (!audioStream_) {
    return;
  }

  audioStream_->requestStop();
  audioStream_->close();
  audioStream_.reset();
}

bool AudioEngine::startWriter() {
  pcmQueue_.reset();
  writeError_.store(false, std::memory_order_release);
  writerRunning_.store(true, std::memory_order_release);
  try {
    writerThread_ = std::thread(&AudioEngine::writerLoop, this);
  } catch (...) {
    writerRunning_.store(false, std::memory_order_release);
    return false;
  }
  return true;
}

void AudioEngine::stopWriter() {
  writerRunning_.store(false, std::memory_order_release);
  writerSignal_.notify_one();
  if (writerThread_.joinable()) {
    writerThread_.join();
  }
}

void AudioEngine::writerLoop() {
  std::array<std::int16_t, 2048> samples{};
  while (writerRunning_.load(std::memory_order_acquire) || !pcmQueue_.empty()) {
    const std::size_t count = pcmQueue_.pop(samples.data(), samples.size());
    if (count > 0) {
      if (!writeSamples(samples.data(), count)) {
        writeError_.store(true, std::memory_order_release);
        recording_.store(false, std::memory_order_release);
      }
      continue;
    }

    std::unique_lock<std::mutex> lock(writerSignalMutex_);
    writerSignal_.wait_for(lock, std::chrono::milliseconds(10));
  }
}

bool AudioEngine::writeWavHeader() {
  WavHeader header{};
  header.sampleRate = sampleRate_;
  header.numChannels = channels_;
  header.bitsPerSample = bitsPerSample_;
  header.blockAlign = static_cast<std::uint16_t>(channels_ * (bitsPerSample_ / 8));
  header.byteRate = sampleRate_ * channels_ * (bitsPerSample_ / 8);
  header.dataSize = 0;
  header.riffSize = 36 + header.dataSize;

  stream_.write(reinterpret_cast<const char*>(&header), sizeof(header));
  return static_cast<bool>(stream_);
}

bool AudioEngine::finalizeWav() {
  if (!stream_.is_open()) {
    return false;
  }

  stream_.flush();

  const std::uint32_t dataSize = totalSamples_ * (bitsPerSample_ / 8);
  const std::uint32_t riffSize = 36 + dataSize;

  WavHeader header{};
  header.riffSize = riffSize;
  header.sampleRate = sampleRate_;
  header.numChannels = channels_;
  header.bitsPerSample = bitsPerSample_;
  header.byteRate = sampleRate_ * channels_ * (bitsPerSample_ / 8);
  header.blockAlign = static_cast<std::uint16_t>(channels_ * (bitsPerSample_ / 8));
  header.dataSize = dataSize;

  stream_.seekp(0, std::ios::beg);
  stream_.write(reinterpret_cast<const char*>(&header), sizeof(header));
  stream_.flush();

  return static_cast<bool>(stream_);
}

void AudioEngine::resetState() {
  totalSamples_ = 0;
  if (stream_.is_open()) {
    stream_.close();
  }
  outputPath_.clear();
  pcmQueue_.reset();
  writeError_.store(false, std::memory_order_release);
  recording_.store(false, std::memory_order_release);
}

}  // namespace roxstar
