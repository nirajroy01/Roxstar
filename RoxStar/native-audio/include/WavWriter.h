#pragma once

#include <fstream>
#include <string>
#include <vector>

namespace roxstar {

class WavWriter {
public:
  static bool write(const std::string& path, const std::vector<int16_t>& samples, int sampleRate = 48000);
};

}  // namespace roxstar
