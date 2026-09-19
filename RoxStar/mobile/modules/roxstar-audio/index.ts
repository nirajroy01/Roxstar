import { requireNativeModule } from 'expo-modules-core';

export type RecordingEffect = 'clean' | 'echo';

export interface RoxstarAudioModule {
  startRecording(path: string): Promise<boolean>;
  stopRecording(): Promise<boolean>;
  cancelRecording(): Promise<void>;
  setEffect(effect: RecordingEffect): boolean;
  isRecording(): boolean;
  getLastRecordingDuration(): number;
}

export default requireNativeModule<RoxstarAudioModule>('RoxstarAudio');