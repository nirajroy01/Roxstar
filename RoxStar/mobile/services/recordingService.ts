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
import { Directory, File, Paths } from 'expo-file-system';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';
import AudioModule, { type RecordingEffect } from '../modules/roxstar-audio';
import type { Draft } from '../types/draft';

export type { RecordingEffect };

// ─── Active player singleton ─────────────────────────────────────────────────
let activePlayer: AudioPlayer | null = null;
const LOCAL_DRAFT_FILES_KEY = 'roxstar.local-draft-files';

type LocalDraftFiles = Record<string, string>;

const readLocalDraftFiles = async (): Promise<LocalDraftFiles> => {
  const stored = await SecureStore.getItemAsync(LOCAL_DRAFT_FILES_KEY);
  if (!stored) return {};

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
};

const writeLocalDraftFiles = async (files: LocalDraftFiles): Promise<void> => {
  await SecureStore.setItemAsync(LOCAL_DRAFT_FILES_KEY, JSON.stringify(files));
};

export const attachLocalDraftFiles = async (drafts: Draft[]): Promise<Draft[]> => {
  const files = await readLocalDraftFiles();
  const activeFiles: LocalDraftFiles = {};

  for (const [draftId, localFileUri] of Object.entries(files)) {
    if (new File(localFileUri).exists) {
      activeFiles[draftId] = localFileUri;
    }
  }

  const hydratedDrafts = drafts.map((draft) => {
    const localFileUri = activeFiles[draft._id];
    if (!localFileUri) {
      return draft;
    }

    return { ...draft, localFileUri };
  });

  if (Object.keys(activeFiles).length !== Object.keys(files).length) {
    await writeLocalDraftFiles(activeFiles);
  }

  return hydratedDrafts;
};

export const saveLocalDraftFile = async (draftId: string, localFileUri: string): Promise<void> => {
  const files = await readLocalDraftFiles();
  files[draftId] = localFileUri;
  await writeLocalDraftFiles(files);
};

export const removeLocalDraftFile = async (draftId: string): Promise<void> => {
  const files = await readLocalDraftFiles();
  if (!(draftId in files)) return;
  delete files[draftId];
  await writeLocalDraftFiles(files);
};

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
export const startRecording = async (effect: RecordingEffect = 'clean'): Promise<string> => {
  const granted = await requestMicrophonePermission();
  if (!granted) throw new Error('Microphone permission denied');

  if (!AudioModule.setEffect(effect)) {
    throw new Error(`Unable to configure recording effect: ${effect}`);
  }

  ensureRecordingDir();
  const file = buildRecordingFile();

  const nativePath = decodeURIComponent(file.uri.replace(/^file:\/\//, ''));
  const ok = await AudioModule.startRecording(nativePath);
  if (!ok) {
    if (file.exists) file.delete();
    throw new Error('AudioEngine failed to open recording stream');
  }

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

/** Duration of the last successfully finalized recording, measured from native PCM frames. */
export const getLastRecordingDuration = (): number =>
  AudioModule.getLastRecordingDuration();

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

