import { AudioPreset } from '@/types/audio';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private audioElement: HTMLAudioElement | null = null;

  initialize(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.gainNode = this.audioContext.createGain();

    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 200;

    this.midFilter = this.audioContext.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1;

    this.trebleFilter = this.audioContext.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 3000;

    this.source
      .connect(this.bassFilter)
      .connect(this.midFilter)
      .connect(this.trebleFilter)
      .connect(this.gainNode)
      .connect(this.analyser)
      .connect(this.audioContext.destination);
  }

  initializeFromStream(audioContext: AudioContext, source: MediaStreamAudioSourceNode) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = audioContext.createGain();

    this.bassFilter = audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 200;

    this.midFilter = audioContext.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1;

    this.trebleFilter = audioContext.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 3000;

    source
      .connect(this.bassFilter)
      .connect(this.midFilter)
      .connect(this.trebleFilter)
      .connect(this.gainNode)
      .connect(this.analyser)
      .connect(audioContext.destination);
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  applyPreset(preset: AudioPreset) {
    if (!this.bassFilter || !this.midFilter || !this.trebleFilter) return;

    switch (preset) {
      case 'bassBoost':
        this.bassFilter.frequency.value = 250; 
        this.bassFilter.gain.value = 8; 
        this.midFilter.gain.value = -2; 
        this.trebleFilter.gain.value = -2; 
        break;
      case 'vocal':
        this.bassFilter.gain.value = -3;
        this.midFilter.gain.value = 6;
        this.trebleFilter.gain.value = 3;
        break;
      case 'flat':
      default:
        this.bassFilter.frequency.value = 200; // Reset frequency
        this.bassFilter.gain.value = 0;
        this.midFilter.gain.value = 0;
        this.trebleFilter.gain.value = 0;
        break;
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

export function normalizeFrequencyData(data: Uint8Array, barCount: number): number[] {
  const normalized: number[] = [];
  const step = Math.floor(data.length / barCount);

  for (let i = 0; i < barCount; i++) {
    const start = i * step;
    const end = start + step;
    const slice = data.slice(start, end);
    const average = slice.reduce((a, b) => a + b, 0) / slice.length;
    normalized.push(average / 255);
  }

  return normalized;
}