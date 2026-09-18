cmake_minimum_required(VERSION 3.16)
project(roxstar_native_audio LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(roxstar_native_audio STATIC
    AudioEngine.cpp
)

target_include_directories(roxstar_native_audio
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/../include
)
