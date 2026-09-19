# 🎙️ ROXSTAR

### Real-Time Voice Collaboration & Interactive Multiplayer Platform

ROXSTAR is a full-stack mobile application designed around **real-time voice interaction, audio recording, multiplayer rooms, and synchronized interactive experiences**.

The platform combines a **React Native mobile application**, **Node.js/Express backend**, **MongoDB**, **Socket.IO**, and a dedicated **native C++ audio layer using Oboe** for Android audio processing.

---

## 📌 Overview

ROXSTAR provides a mobile-first experience where users can:

- 🎙️ Record voice
- 🔊 Apply audio effects
- 💾 Save and manage recording drafts
- 👥 Create and join multiplayer rooms
- ⚡ Synchronize room activity in real time
- 🎲 Participate in interactive multiplayer sessions
- 🏆 Receive backend-controlled winner announcements
- 🔐 Authenticate using JWT
- 🗄️ Persist application metadata in MongoDB

The project is structured as a monorepo containing the mobile client, backend services, and native audio processing layer.

---

## 🔗 Repository

**GitHub Repository**

https://github.com/nirajroy01/Roxstar

---

# 🏗️ System Architecture

```text
                         ROXSTAR
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     React Native       Node.js /        Native Audio
       Mobile           Express           Android / C++
          │                 │                 │
          │                 │                 ▼
          │                 │              Oboe
          │                 │                 │
          │                 │                 ▼
          │                 │            Microphone
          │                 │
          │          ┌──────┴──────┐
          │          │             │
          │          ▼             ▼
          │       REST API      Socket.IO
          │          │             │
          │          └──────┬──────┘
          │                 │
          │                 ▼
          │              Mongoose
          │                 │
          │                 ▼
          │              MongoDB
          │
          └──── Native Audio Module
📁 Project Structure
Roxstar5/
└── RoxStar/
    │
    ├── backend/
    │   ├── node_modules/
    │   ├── src/
    │   ├── .dockerignore
    │   ├── .env
    │   ├── docker-compose.yml
    │   ├── Dockerfile
    │   ├── package-lock.json
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── mobile/
    │   ├── .expo/
    │   ├── android/
    │   ├── app/
    │   ├── modules/
    │   ├── node_modules/
    │   ├── services/
    │   ├── types/
    │   ├── app.json
    │   ├── App.tsx
    │   ├── package-lock.json
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── native-audio/
    │   ├── include/
    │   ├── src/
    │   └── CMakeLists.txt
    │
    ├── .gitignore
    ├── backend-zip.zip
    ├── README.md
    └── package-lock.json
🧩 Project Modules
1. Mobile Application

Location:

mobile/

The mobile client is responsible for:

User interface
Authentication screens
Navigation
Recording interface
Draft management
Room management
Multiplayer interaction
Real-time Socket.IO communication
API communication
Native audio module integration
Main directories
mobile/
├── app/
├── modules/
├── services/
└── types/
Native Module

The mobile application contains the custom native module under:

mobile/modules/

This module exposes native Android functionality to React Native.

2. Backend

Location:

backend/

The backend provides the application's server-side functionality.

Responsibilities
Authentication
User management
Room management
Draft metadata
Multiplayer state
Winner management
Real-time communication
MongoDB persistence
API validation
Server-side business logic
Backend structure
backend/
├── src/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
3. Native Audio Engine

Location:

native-audio/

The native audio layer provides low-level Android audio functionality.

React Native
      │
      ▼
Roxstar Native Audio Module
      │
      ▼
C++
      │
      ▼
Oboe
      │
      ▼
Android Audio System
      │
      ▼
Microphone

The native audio layer is separated from the JavaScript application to allow lower-level audio processing and integration with Android's native audio stack.

🎙️ Audio Recording

ROXSTAR uses a dedicated native audio architecture rather than relying entirely on JavaScript-level recording APIs.

Recording flow
User
 │
 ▼
Recording Screen
 │
 ▼
Audio Service
 │
 ▼
RoxstarAudio
 │
 ▼
Native C++ Audio Layer
 │
 ▼
Oboe
 │
 ▼
Microphone
 │
 ▼
Audio Processing
 │
 ▼
Local Audio File
 │
 ▼
Draft Metadata
Supported functionality
Start recording
Stop recording
Cancel recording
Recording duration
Draft creation
Draft naming
Draft deletion
Local audio playback
Audio effects
Implemented Effect
Echo
👥 Multiplayer Rooms

ROXSTAR supports real-time multiplayer rooms.

Users can:

Create rooms
Join rooms using room codes
Leave rooms
View room participants
Share draft metadata
Receive real-time room updates
Reconnect to rooms
Restore room state
⚡ Real-Time Communication

Real-time communication is implemented using Socket.IO.

Event flow
Mobile Client
     │
     ▼
Socket.IO Connection
     │
     ▼
Node.js Socket Server
     │
     ▼
Room State
     │
     ├── user_joined
     ├── user_left
     ├── draft_shared
     ├── spin_started
     ├── user_eliminated
     ├── winner_announced
     └── room_state

The backend is responsible for maintaining the authoritative multiplayer state.

🎲 Interactive Multiplayer

ROXSTAR includes a backend-managed spin and elimination flow.

Spin lifecycle
WAITING
   │
   ▼
RUNNING
   │
   ▼
USER ELIMINATED
   │
   ▼
RUNNING
   │
   ▼
USER ELIMINATED
   │
   ▼
WINNER ANNOUNCED
   │
   ▼
COMPLETED

The backend determines the multiplayer state and winner.

The mobile client is responsible for presenting the state and animation to users.

🔐 Authentication

The backend uses token-based authentication.

Technologies
JWT
bcrypt
Express middleware
Environment configuration
Authentication endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

Passwords are stored as secure hashes rather than plaintext values.

🗄️ Database

ROXSTAR uses:

MongoDB
    │
    ▼
Mongoose

Application data is persisted through MongoDB models.

Main entities
User
Room
RoomMember
Draft
Spin
SpinParticipant
SpinEvent
Data relationship
User
 │
 ├── RoomMember
 │       │
 │       └── Room
 │
 ├── Draft
 │
 └── SpinParticipant
         │
         └── Spin
                │
                └── SpinEvent
💾 Audio Storage Architecture

ROXSTAR keeps recorded audio local to the Android device.

MongoDB stores recording metadata, not the physical audio file.

Android Device
     │
     └── Local Audio File

MongoDB
     │
     └── Draft Metadata

The architecture does not depend on GridFS or cloud object storage for audio recordings.

This also means a local Android file URI is not treated as a remotely accessible audio URL.

🔌 API Architecture

The application follows a REST-based backend architecture.

React Native
     │
     ▼
API Client
     │
     ▼
Express Router
     │
     ▼
Controller / Business Logic
     │
     ▼
Mongoose
     │
     ▼
MongoDB
🏠 Room API

Main room operations include:

POST /api/rooms
POST /api/rooms/:code/join
POST /api/rooms/:roomId/leave
GET  /api/rooms/:roomId
POST /api/rooms/:roomId/drafts
POST /api/rooms/:roomId/spin
🎲 Spin API
GET /api/spins/:spinId
GET /api/spins/:spinId/result

The backend controls the spin lifecycle and winner announcement.

👤 User History

User history is derived from room and multiplayer participation data.

GET /api/users/me/history

The system uses room membership and spin participation records instead of continuously appending data to a single user history array.

❤️ Health & Readiness

The backend exposes service status endpoints:

GET /api/health
GET /api/readiness

These endpoints can be used to verify backend availability and service readiness.

🛠️ Technology Stack
Mobile
Technology	Purpose
React Native	Mobile application
Expo SDK 57	React Native development platform
TypeScript	Type safety
Expo Router	Navigation
Zustand	Application state
Socket.IO Client	Real-time communication
React Native Reanimated	UI animations
Expo Dev Client	Custom native development
Backend
Technology	Purpose
Node.js	Runtime
Express	REST API
TypeScript	Type-safe backend development
Socket.IO	Real-time communication
MongoDB	Database
Mongoose	ODM
JWT	Authentication
bcrypt	Password hashing
Zod	Validation
dotenv	Environment configuration
Native Audio
Technology	Purpose
C++	Native audio implementation
Oboe	Android low-latency audio
CMake	Native build system
Android Native Module	React Native bridge
DevOps
Technology	Purpose
Docker	Containerization
Docker Compose	Local multi-container environment
GitHub Actions	CI/CD automation
🚀 Getting Started
Prerequisites

Install the following:

Node.js 20+
npm
MongoDB
Docker / Docker Compose
Android Studio
Android SDK
Android NDK
Expo development environment
⚙️ Backend Setup

Navigate to the backend:

cd backend

Install dependencies:

npm install

Create a .env file:

PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/roxstar
JWT_SECRET=your_secure_jwt_secret

Start the development server:

npm run dev

Build the backend:

npm run build

Start the production server:

npm start
📱 Mobile Setup

Navigate to the mobile application:

cd mobile

Install dependencies:

npm install

Start the development environment:

npm start

Run Android:

npm run android

Because ROXSTAR uses a custom native audio module, the application requires a development build/native Android environment rather than relying only on Expo Go.

🐳 Docker

The backend contains Docker configuration for containerized development and deployment.

Start the Docker environment:

docker compose up --build

Run in detached mode:

docker compose up --build -d

Check running services:

docker compose ps

View logs:

docker compose logs

Stop containers:

docker compose down
🔄 Reconnection & State Recovery

ROXSTAR is designed to handle temporary network interruptions.

The general recovery flow is:

Socket Disconnect
       │
       ▼
Socket Reconnect
       │
       ▼
Authentication
       │
       ▼
Identify Current Room
       │
       ▼
Fetch Current Room State
       │
       ▼
Restore Participants
       │
       ▼
Restore Shared Draft Metadata
       │
       ▼
Restore Active Multiplayer State
       │
       ▼
Synchronize Mobile UI

The backend remains the source of truth for multiplayer state.

🛡️ Edge Cases

The application handles scenarios such as:

Duplicate room joining
Invalid room codes
Duplicate spin attempts
Insufficient participants
User disconnect/reconnect
Room state recovery
Duplicate winner announcements
Users leaving active rooms
Recording cancellation
Recording cleanup
Authentication errors
Invalid login credentials
🔒 Security Considerations

The project follows common application security practices:

Password hashing using bcrypt
JWT authentication
Protected API endpoints
Environment variables for sensitive configuration
Request validation
CORS configuration
Authentication middleware
No plaintext password storage
Environment files

Sensitive configuration should never be committed to Git.

Example:

.env

should remain excluded through .gitignore.

🧪 Development Checks

Useful development commands include:

Backend build
cd backend
npm run build
Database check
npm run db:check
Mobile lint
cd mobile
npm run lint
📈 Project Engineering Highlights

ROXSTAR demonstrates implementation across multiple software engineering layers:

Frontend Engineering
React Native application architecture
TypeScript
Navigation
State management
API integration
Real-time UI updates
Native module integration
Backend Engineering
REST API development
Authentication
Authorization
Database modeling
Validation
Real-time communication
Server-side multiplayer state management
Database Engineering
MongoDB schema design
Mongoose models
Relationship modeling
Persistent room and multiplayer state
Native Engineering
Android native module integration
C++
Oboe audio layer
CMake
Native audio processing
DevOps
Docker
Docker Compose
Environment configuration
GitHub Actions
📊 Project Status
Component	Status
React Native Mobile App	✅
Expo Integration	✅
TypeScript	✅
Authentication	✅
JWT	✅
MongoDB	✅
Mongoose	✅
REST API	✅
Socket.IO	✅
Multiplayer Rooms	✅
Spin System	✅
Winner Management	✅
Voice Recording	✅
Echo Effect	✅
Native Audio Module	✅
Local Audio Storage	✅
Docker Configuration	✅
GitHub Actions	✅
📂 Repository Components
RoxStar
│
├── backend
│   └── Server-side application
│
├── mobile
│   └── React Native mobile application
│
├── native-audio
│   └── Native C++ / Oboe audio layer
│
├── .gitignore
│
├── README.md
│
└── package-lock.json
🎯 Engineering Objective

ROXSTAR is designed to demonstrate how a production-style mobile system can combine:

Mobile Development
        +
REST APIs
        +
Real-Time Communication
        +
Database Engineering
        +
Authentication
        +
Native Android Development
        +
Audio Processing
        +
Containerization

into a single integrated application.

👨‍💻 Developer
Niraj Roy

Role: Full Stack Developer

GitHub:
https://github.com/nirajroy01

Project Repository:
https://github.com/nirajroy01/Roxstar

📄 License

This project is developed as a software engineering project and candidate submission.

⭐ ROXSTAR

Real-Time Voice Collaboration & Interactive Multiplayer Platform

Built with:

React Native
Expo
TypeScript
Node.js
Express
MongoDB
Mongoose
Socket.IO
JWT
C++
Oboe
CMake
Docker
GitHub Actions
