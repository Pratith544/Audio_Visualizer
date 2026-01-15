'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioManager, getFrequencyData, normalizeFrequencyData } from '@/lib/audio';
import { AudioPreset } from '@/types/audio';
import RadialBars from './RadialBars';
import NeonRing from './NeonRings';
import ControlDial from './ControlDial';
import ParticleBackground from './ParticleBackground';
import { motion } from 'framer-motion';

const BAR_COUNT = 64;

export default function CircularVisualizer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [preset, setPreset] = useState<AudioPreset>('flat');
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(BAR_COUNT).fill(0));
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isMicActive, setIsMicActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const animate = useCallback(() => {
    if (audioManagerRef.current) {
      const analyser = audioManagerRef.current.getAnalyser();
      if (analyser) {
        const rawData = getFrequencyData(analyser);
        const normalized = normalizeFrequencyData(rawData, BAR_COUNT);
        setFrequencyData(normalized);
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying || isMicActive) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setFrequencyData(new Array(BAR_COUNT).fill(0));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isMicActive, animate]);

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isMicActive) {
      handleMicToggle();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
        audioManagerRef.current.initialize(audioRef.current);
        audioManagerRef.current.setVolume(volume);
        audioManagerRef.current.applyPreset(preset);
      }
      audioManagerRef.current.resume();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioManagerRef.current) {
      audioManagerRef.current.setVolume(newVolume);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handlePresetChange = (newPreset: AudioPreset) => {
    setPreset(newPreset);
    if (audioManagerRef.current) {
      audioManagerRef.current.applyPreset(newPreset);
    }
  };

  // Apply preset and volume when they change, even if already playing/active
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.applyPreset(preset);
      audioManagerRef.current.setVolume(volume);
    }
    // Also update audio element volume for direct playback
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [preset, volume]);

  const handleFileUpload = async (file: File) => {
    if (isMicActive) {
      handleMicToggle();
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        setAudioUrl(data.url);
        if (audioRef.current) {
          audioRef.current.src = data.url;
          audioRef.current.load();
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleMicToggle = async () => {
    if (isMicActive) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (micSourceRef.current && audioManagerRef.current) {
        audioManagerRef.current.cleanup();
        audioManagerRef.current = null;
        micSourceRef.current = null;
      }
      setIsMicActive(false);
    } else {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        micSourceRef.current = source;

        const audioManager = new AudioManager();
        audioManager.initializeFromStream(audioContext, source);
        audioManager.setVolume(volume);
        audioManager.applyPreset(preset);
        audioManagerRef.current = audioManager;

        setIsMicActive(true);
      } catch (error) {
        console.error('Microphone access failed:', error);
      }
    }
  };

  const avgFrequency = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
  const beatAmplitude = Math.max(...frequencyData); // Use peak frequency for beat detection

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced background with noise texture */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(168,85,247,0.15), transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(34,211,238,0.1), transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(59,130,246,0.08), transparent 50%),
            linear-gradient(135deg, #0a0a0a 0%, #000000 50%, #0a0a0a 100%)
          `,
        }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Radial glow behind center visualizer */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* WebGL Particle Background */}
      <ParticleBackground />
      
      {/* Dark gradient overlay above particles */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <audio ref={audioRef} />

      <div className="relative w-full h-full flex items-center justify-center" style={{ zIndex: 2 }}>
        {/* Multiple concentric rings with different speeds - outer to inner */}
        <NeonRing size={700} intensity={avgFrequency * 0.6} color="purple" animate={isPlaying || isMicActive} rotationSpeed={0.3} opacity={0.2} />
        <NeonRing size={600} intensity={avgFrequency * 0.8} color="purple" animate={isPlaying || isMicActive} rotationSpeed={0.5} opacity={0.25} />
        <NeonRing size={500} intensity={avgFrequency * 1.0} color="cyan" animate={isPlaying || isMicActive} rotationSpeed={0.7} opacity={0.3} />
        <NeonRing size={450} intensity={avgFrequency * 1.2} color="cyan" animate={isPlaying || isMicActive} rotationSpeed={1.0} opacity={0.35} />
        <NeonRing size={400} intensity={avgFrequency * 0.8} color="blue" animate={isPlaying || isMicActive} rotationSpeed={1.5} opacity={0.4} />
        <NeonRing size={350} intensity={avgFrequency * 1.0} color="blue" animate={isPlaying || isMicActive} rotationSpeed={2.0} opacity={0.3} />

        <RadialBars frequencyData={frequencyData} radius={150} barCount={BAR_COUNT} preset={preset} />

        <ControlDial
          isPlaying={isPlaying}
          volume={volume}
          preset={preset}
          onPlayPause={handlePlayPause}
          onVolumeChange={handleVolumeChange}
          onPresetChange={handlePresetChange}
          onFileUpload={handleFileUpload}
          onMicToggle={handleMicToggle}
          isMicActive={isMicActive}
          beatAmplitude={beatAmplitude}
        />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-cyan-400/60 text-sm font-mono">
          {audioUrl ? 'Audio Loaded' : isMicActive ? 'Microphone Active' : 'Upload Audio or Enable Microphone'}
        </p>
      </div>
    </div>
  );
}
