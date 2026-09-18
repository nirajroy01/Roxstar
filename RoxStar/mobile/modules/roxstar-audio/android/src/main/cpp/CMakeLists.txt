cmake_minimum_required(VERSION 3.22)
project(roxstar_audio_jni LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(oboe REQUIRED CONFIG)

set(NATIVE_AUDIO_DIR
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../native-audio")

add_library(roxstar_audio STATIC
    ${NATIVE_AUDIO_DIR}/src/AudioEngine.cpp
)
set_target_properties(roxstar_audio PROPERTIES POSITION_INDEPENDENT_CODE ON)
target_include_directories(roxstar_audio PUBLIC ${NATIVE_AUDIO_DIR}/include)

add_library(roxstar_audio_jni SHARED roxstar_audio_jni.cpp)
target_link_libraries(roxstar_audio_jni roxstar_audio oboe::oboe log android)