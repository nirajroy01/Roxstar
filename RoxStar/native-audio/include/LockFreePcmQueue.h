#pragma once

#include <algorithm>
#include <atomic>
#include <cstddef>
#include <vector>

namespace roxstar {

template <typename T>
class LockFreePcmQueue {
public:
  explicit LockFreePcmQueue(std::size_t capacity = 4096)
      : data_(std::max<std::size_t>(capacity, 2)), capacity_(data_.size()) {}

  bool push(const T* values, std::size_t count) {
    if (values == nullptr || count == 0) {
      return count == 0;
    }

    const std::size_t head = head_.load(std::memory_order_relaxed);
    const std::size_t tail = tail_.load(std::memory_order_acquire);
    const std::size_t available = tail > head
        ? tail - head - 1
        : capacity_ - head + tail - 1;
    if (count > available) {
      return false;
    }

    const std::size_t firstCount = std::min(count, capacity_ - head);
    std::copy_n(values, firstCount, data_.begin() + static_cast<std::ptrdiff_t>(head));
    std::copy_n(values + firstCount, count - firstCount, data_.begin());
    head_.store((head + count) % capacity_, std::memory_order_release);
    return true;
  }

  std::size_t pop(T* values, std::size_t maxCount) {
    if (values == nullptr || maxCount == 0) {
      return 0;
    }

    const std::size_t tail = tail_.load(std::memory_order_relaxed);
    const std::size_t head = head_.load(std::memory_order_acquire);
    const std::size_t available = head >= tail
        ? head - tail
        : capacity_ - tail + head;
    const std::size_t count = std::min(maxCount, available);
    const std::size_t firstCount = std::min(count, capacity_ - tail);
    std::copy_n(data_.begin() + static_cast<std::ptrdiff_t>(tail), firstCount, values);
    std::copy_n(data_.begin(), count - firstCount, values + firstCount);
    tail_.store((tail + count) % capacity_, std::memory_order_release);
    return count;
  }

  bool empty() const {
    return head_.load(std::memory_order_acquire) == tail_.load(std::memory_order_acquire);
  }

  void reset() {
    head_.store(0, std::memory_order_relaxed);
    tail_.store(0, std::memory_order_relaxed);
  }

private:
  std::vector<T> data_;
  std::size_t capacity_;
  std::atomic<std::size_t> head_{0};
  std::atomic<std::size_t> tail_{0};
};

}  // namespace roxstar
