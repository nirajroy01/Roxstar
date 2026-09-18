import { requireNativeModule } from 'expo-modules-core';

export interface RoxstarAudioModule {
  startRecording(path: string): Promise<boolean>;
  stopRecording(): Promise<boolean>;
  cancelRecording(): Promise<void>;
  isRecording(): boolean;
}

export default requireNativeModule<RoxstarAudioModule>('RoxstarAudio');