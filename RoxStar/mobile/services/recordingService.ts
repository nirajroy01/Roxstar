/**
 * recordingService.ts
 *
 * Bridge between the JS layer and the native Oboe AudioEngine via
 * the RoxstarAudio Expo native module.
 *
 * Recording:  native Oboe (C++) → WAV file written to Paths.document/recordings/
 * Playback:   expo-audio player  → local file URI
 * Deletion:   expo-file-system File class
 *
 * Audio sharing between devices is TEMPORARILY DISABLED.
 * localFileUri must never be exposed as a remotely accessible URL.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { Directory, File, Paths } from 'expo-file-system';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

// Native module exposed by AudioModule.kt (expo-modules-core auto-registration)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AudioModule = requireNativeModule<{
  startRecording: (path: string) => Promise<boolean>;
  stopRecording: () => Promise<boolean>;
  cancelRecording: () => Promise<void>;
  isRecording: () => boolean;
}>('RoxstarAudio');

// ─── Active player singleton ─────────────────────────────────────────────────
let activePlayer: AudioPlayer | null = null;

// ─── Recordings directory ────────────────────────────────────────────────────
const getRecordingsDir = (): Directory =>
  new Directory(Paths.document, 'recordings');

const ensureRecordingDir = (): void => {
  const dir = getRecordingsDir();
  if (!dir.exists) {
    dir.create();
  }
};

const buildRecordingFile = (): File => {
  const dir = getRecordingsDir();
  return new File(dir, `recording_${Date.now()}.wav`);
};

// ─── Permissions ─────────────────────────────────────────────────────────────

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone Access',
      message: 'RoxStar needs your microphone to record voice drafts.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return status === PermissionsAndroid.RESULTS.GRANTED;
};

// ─── Recording ───────────────────────────────────────────────────────────────

/**
 * Start Oboe recording. Returns the local WAV file URI.
 * Throws if permission is denied or the engine fails to open the stream.
 */
export const startRecording = async (): Promise<string> => {
  const granted = await requestMicrophonePermission();
  if (!granted) throw new Error('Microphone permission denied');

  ensureRecordingDir();
  const file = buildRecordingFile();

  const ok = await AudioModule.startRecording(file.uri);
  if (!ok) throw new Error('AudioEngine failed to open recording stream');

  return file.uri;
};

/**
 * Stop the active Oboe stream and finalise the WAV file.
 * Returns true on success.
 */
export const stopRecording = async (): Promise<boolean> =>
  AudioModule.stopRecording();

/**
 * Cancel the active recording and delete the partial WAV file.
 */
export const cancelRecording = async (): Promise<void> =>
  AudioModule.cancelRecording();

/** Synchronously query whether the engine is currently recording. */
export const isRecording = (): boolean => AudioModule.isRecording();

// ─── Playback ────────────────────────────────────────────────────────────────

/**
 * Play a local WAV file. Stops any currently active player first.
 */
export const playLocalDraft = async (localFileUri: string): Promise<void> => {
  stopLocalPlayback();
  activePlayer = createAudioPlayer({ uri: localFileUri });
  activePlayer.play();
};

/** Stop local playback and release the player. */
export const stopLocalPlayback = (): void => {
  if (activePlayer) {
    activePlayer.remove();
    activePlayer = null;
  }
};

// ─── Deletion ────────────────────────────────────────────────────────────────

/**
 * Delete a local recording file from device storage.
 * Safe to call if the file is already gone.
 */
export const deleteLocalRecording = (localFileUri: string): void => {
  if (!localFileUri) return;
  const file = new File(localFileUri);
  if (file.exists) {
    file.delete();
  }
};

