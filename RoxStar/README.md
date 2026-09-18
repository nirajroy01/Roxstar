# RoxStar

Production-structured assessment project with a Node.js backend, Expo React Native app, and native Android audio module.

## Workspaces

- backend/
- mobile/
- native-audio/

## Quick start

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

### Native Android audio

Open the module in Android Studio and build the CMake project. The C++ layer is structured around Android Oboe and local WAV capture.

## Notes

- MongoDB remains the persistent source of truth.
- Audio upload and retrieval are GridFS-oriented.
- The backend owns spin elimination state instead of the frontend.
