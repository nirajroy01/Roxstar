cmake_minimum_required(VERSION 3.16)
project(roxstar_native_audio LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(oboe REQUIRED CONFIG)

add_library(roxstar_native_audio STATIC
    AudioEngine.cpp
    EchoEffect.cpp
)
set_target_properties(roxstar_native_audio PROPERTIES POSITION_INDEPENDENT_CODE ON)

target_include_directories(roxstar_native_audio
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/../include
)

target_link_libraries(roxstar_native_audio PUBLIC oboe::oboe)
