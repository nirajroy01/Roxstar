cmake_minimum_required(VERSION 3.16)
project(roxstar_audio LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(roxstar_audio STATIC
    src/AudioEngine.cpp
)

target_include_directories(roxstar_audio
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Example Android Oboe integration hooks.
# This project is structured for native Android integration and can be wired into Gradle.
