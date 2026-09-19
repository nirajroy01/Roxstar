#pragma once

#include <cstddef>
#include <cstdint>
#include <vector>

namespace roxstar {

class EchoEffect {
public:
  explicit EchoEffect(float delayMs = 120.0f, float decay = 0.35f);
  void configure(float sampleRate);
  void process(float* buffer, std::size_t frameCount);
  void process(std::int16_t* buffer, std::size_t sampleCount);
  void reset();

private:
  float processSample(float sample);

  float delayMs_;
  float decay_;
  std::vector<float> history_;
  std::size_t historyIndex_ = 0;
};

}  // namespace roxstar
