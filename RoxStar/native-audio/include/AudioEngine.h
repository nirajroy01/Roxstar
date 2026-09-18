#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace roxstar {

class AudioEngine {
public:
  AudioEngine();
  ~AudioEngine();

  bool startRecording(const std::string& outputPath);
  bool stopRecording();
  bool cancelRecording();

private:
  bool recording_ = false;
  std::string outputPath_;
};

}  // namespace roxstar
