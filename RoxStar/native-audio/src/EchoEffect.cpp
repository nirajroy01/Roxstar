#include "EchoEffect.h"

#include <algorithm>

namespace {

constexpr float kSampleRate = 48000.0f;
constexpr float kInt16Scale = 32768.0f;

}  // namespace

namespace roxstar {

EchoEffect::EchoEffect(float delayMs, float decay)
    : delayMs_(std::clamp(delayMs, 1.0f, 2000.0f)),
      decay_(std::clamp(decay, 0.0f, 0.95f)) {
  configure(kSampleRate);
}

void EchoEffect::configure(float sampleRate) {
  history_.assign(
      std::max<std::size_t>(
          1,
          static_cast<std::size_t>((delayMs_ / 1000.0f) * sampleRate)),
      0.0f);
  historyIndex_ = 0;
}

void EchoEffect::process(float* buffer, std::size_t frameCount) {
  if (buffer == nullptr) {
    return;
  }

  for (std::size_t index = 0; index < frameCount; ++index) {
    buffer[index] = processSample(buffer[index]);
  }
}

void EchoEffect::process(std::int16_t* buffer, std::size_t sampleCount) {
  if (buffer == nullptr) {
    return;
  }

  for (std::size_t index = 0; index < sampleCount; ++index) {
    const float input = static_cast<float>(buffer[index]) / kInt16Scale;
    const float output = processSample(input);
    buffer[index] = static_cast<std::int16_t>(output * 32767.0f);
  }
}

void EchoEffect::reset() {
  std::fill(history_.begin(), history_.end(), 0.0f);
  historyIndex_ = 0;
}

float EchoEffect::processSample(float sample) {
  const float output = std::clamp(sample + history_[historyIndex_] * decay_, -1.0f, 1.0f);
  history_[historyIndex_] = output;
  historyIndex_ = (historyIndex_ + 1) % history_.size();
  return output;
}

}  // namespace roxstar