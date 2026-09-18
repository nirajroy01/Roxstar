#include "AudioEngine.h"

#include <fstream>

namespace roxstar {

AudioEngine::AudioEngine() = default;

AudioEngine::~AudioEngine() {
  stopRecording();
}

bool AudioEngine::startRecording(const std::string& outputPath) {
  outputPath_ = outputPath;
  recording_ = true;
  return true;
}

bool AudioEngine::stopRecording() {
  recording_ = false;
  return true;
}

bool AudioEngine::cancelRecording() {
  recording_ = false;
  return true;
}

}  // namespace roxstar
