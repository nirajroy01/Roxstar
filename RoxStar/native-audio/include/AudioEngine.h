#pragma once

#include <cstddef>
#include <cstdint>
#include <fstream>
#include <string>

namespace roxstar {

class AudioEngine {
public:
  AudioEngine();
  ~AudioEngine();

  bool startRecording(const std::string& outputPath);
  bool stopRecording();
  bool cancelRecording();
  bool writeSamples(const std::int16_t* samples, std::size_t sampleCount);
  bool isRecording() const;

private:
  bool writeWavHeader();
  bool finalizeWav();
  void resetState();

  bool recording_ = false;
  std::string outputPath_;
  std::ofstream stream_;
  std::uint32_t sampleRate_ = 48000;
  std::uint16_t channels_ = 1;
  std::uint16_t bitsPerSample_ = 16;
  std::uint32_t totalSamples_ = 0;
};

}  // namespace roxstar
