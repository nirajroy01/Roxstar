#pragma once

#include <atomic>
#include <cstddef>
#include <vector>

namespace roxstar {

template <typename T>
class LockFreePcmQueue {
public:
  explicit LockFreePcmQueue(std::size_t capacity = 4096)
      : data_(capacity), capacity_(capacity) {}

  bool push(const T& value) {
    std::size_t current = head_.load(std::memory_order_relaxed);
    std::size_t next = (current + 1) % capacity_;
    if (next == tail_.load(std::memory_order_acquire)) {
      return false;
    }
    data_[current] = value;
    head_.store(next, std::memory_order_release);
    return true;
  }

  bool pop(T& value) {
    std::size_t current = tail_.load(std::memory_order_relaxed);
    if (current == head_.load(std::memory_order_acquire)) {
      return false;
    }
    value = data_[current];
    tail_.store((current + 1) % capacity_, std::memory_order_release);
    return true;
  }

private:
  std::vector<T> data_;
  std::size_t capacity_;
  std::atomic<std::size_t> head_{0};
  std::atomic<std::size_t> tail_{0};
};

}  // namespace roxstar
