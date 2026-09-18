#include "AudioEngine.h"

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
  if (outputPath.empty()) {
    return false;
  }

  if (recording_) {
    return false;
  }

  outputPath_ = outputPath;
  resetState();

  stream_.open(outputPath_, std::ios::binary | std::ios::out | std::ios::trunc);
  if (!stream_) {
    resetState();
    return false;
  }

  if (!writeWavHeader()) {
    stream_.close();
    resetState();
    return false;
  }

  recording_ = true;
  return true;
}

bool AudioEngine::stopRecording() {
  if (!recording_ && !stream_.is_open()) {
    return false;
  }

  if (recording_) {
    if (!finalizeWav()) {
      return false;
    }
  }

  stream_.close();
  recording_ = false;
  outputPath_.clear();
  return true;
}

bool AudioEngine::cancelRecording() {
  if (stream_.is_open()) {
    stream_.close();
  }

  if (!outputPath_.empty()) {
    std::remove(outputPath_.c_str());
  }

  recording_ = false;
  resetState();
  return true;
}

bool AudioEngine::writeSamples(const std::int16_t* samples, std::size_t sampleCount) {
  if (!recording_ || !samples || sampleCount == 0) {
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
  return recording_;
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

  const std::uint32_t dataSize = totalSamples_ * channels_ * (bitsPerSample_ / 8);
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
  recording_ = false;
}

}  // namespace roxstar
