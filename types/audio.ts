export interface AudioMetadata {
  name: string;
  duration: number;
  size: number;
  type: string;
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  preset: AudioPreset;
}

export type AudioPreset = 'flat' | 'bassBoost' | 'vocal';

export interface FrequencyData {
  bass: number[];
  mid: number[];
  treble: number[];
}

export interface UploadResponse {
  success: boolean;
  metadata?: AudioMetadata;
  error?: string;
  url?: string;
}
