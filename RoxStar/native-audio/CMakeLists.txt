cmake_minimum_required(VERSION 3.16)
project(roxstar_audio LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(oboe REQUIRED CONFIG)

add_library(roxstar_audio STATIC
    src/AudioEngine.cpp
    src/EchoEffect.cpp
)
set_target_properties(roxstar_audio PROPERTIES POSITION_INDEPENDENT_CODE ON)

target_include_directories(roxstar_audio
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(roxstar_audio PUBLIC oboe::oboe)
