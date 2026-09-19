cmake_minimum_required(VERSION 3.22)
project(roxstar_audio_jni LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(oboe REQUIRED CONFIG)

get_filename_component(
    NATIVE_AUDIO_DIR
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../../native-audio"
    ABSOLUTE
)

add_subdirectory(
    "${NATIVE_AUDIO_DIR}"
    "${CMAKE_CURRENT_BINARY_DIR}/native-audio"
)

add_library(roxstar_audio_jni SHARED roxstar_audio_jni.cpp)
target_link_libraries(roxstar_audio_jni roxstar_audio log android)