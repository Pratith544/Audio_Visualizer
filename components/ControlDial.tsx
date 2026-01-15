'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Upload, Mic } from 'lucide-react';
import { AudioPreset } from '@/types/audio';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ControlDialProps {
  isPlaying: boolean;
  volume: number;
  preset: AudioPreset;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onPresetChange: (preset: AudioPreset) => void;
  onFileUpload: (file: File) => void;
  onMicToggle: () => void;
  isMicActive: boolean;
  beatAmplitude?: number;
}

export default function ControlDial({
  isPlaying,
  volume,
  preset,
  onPlayPause,
  onVolumeChange,
  onPresetChange,
  onFileUpload,
  onMicToggle,
  isMicActive,
  beatAmplitude = 0,
}: ControlDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const volumeDialRef = useRef<SVGSVGElement>(null);

  const updateVolume = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!volumeDialRef.current) return;
    
    const rect = volumeDialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let normalizedAngle = (angle - (3 * Math.PI / 2) + Math.PI * 2) % (Math.PI * 2);
    const newVolume = Math.max(0, Math.min(1, normalizedAngle / (Math.PI * 1.5)));
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateVolume(e);
  }, [updateVolume]);

  const handleVolumeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateVolume(e);
  }, [updateVolume]);

  const handleVolumeMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateVolume(e as any);
    }
  }, [isDragging, updateVolume]);

  const handleVolumeMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleVolumeMouseMove);
      window.addEventListener('mouseup', handleVolumeMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleVolumeMouseMove);
        window.removeEventListener('mouseup', handleVolumeMouseUp);
      };
    }
  }, [isDragging, handleVolumeMouseMove, handleVolumeMouseUp]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

      
  const radius = 115; 
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 0.75) * volume; 

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="relative w-64 h-64">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-cyan-900/40 backdrop-blur-md border border-cyan-500/30"
          whileHover={{ scale: 1.02 }}
          style={{
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.2)',
          }}
        />

        <motion.svg
          ref={volumeDialRef}
          viewBox="0 0 256 256"
          className="absolute inset-0 w-full h-full -rotate-90 cursor-pointer pointer-events-auto"
          onMouseDown={handleVolumeMouseDown}
          onClick={handleVolumeClick}
          style={{ zIndex: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* Invisible clickable area */}
          <circle
            cx="128"
            cy="128"
            r="128"
            fill="transparent"
            stroke="none"
            style={{ 
              pointerEvents: 'all', 
              cursor: 'pointer',
            }}
          />
          
          
          <circle
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="6"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            style={{ pointerEvents: 'none' }}
          />
          
          
          <circle
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="url(#volumeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 ${8 + volume * 12}px rgba(34, 211, 238, ${0.6 + volume * 0.4}))`,
            }}
          />
          
          
          {(() => {
            const angle = (volume * 270) * (Math.PI / 180);
            const dotX = 128 + radius * Math.cos(angle);
            const dotY = 128 + radius * Math.sin(angle);
            return (
              <motion.circle
                cx={dotX}
                cy={dotY}
                r="8"
                fill="url(#volumeGradient)"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.9))',
                  pointerEvents: 'none',
                }}
                animate={{
                  opacity: [0.8, 1, 0.8],
                  r: [7, 9, 7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            );
          })()}
          
          <defs>
            <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </motion.svg>

            
        <div className="absolute top-9 left-1/2 -translate-x-1/2 text-cyan-300 text-sm font-semibold" style={{ zIndex: 5 }}>
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(volume * 100)}%
          </motion.div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 10 }}>
          <motion.button
            onClick={onPlayPause}
            className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={isPlaying ? {
              scale: [1, 1 + beatAmplitude * 0.05, 1],
              boxShadow: [
                `0 0 30px rgba(34, 211, 238, ${0.6 + beatAmplitude * 0.4})`,
                `0 0 ${40 + beatAmplitude * 20}px rgba(34, 211, 238, ${0.8 + beatAmplitude * 0.2})`,
                `0 0 30px rgba(34, 211, 238, ${0.6 + beatAmplitude * 0.4})`,
              ],
            } : {
              boxShadow: '0 0 30px rgba(34, 211, 238, 0.6)',
            }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(34, 211, 238, 0.3))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              pointerEvents: 'auto',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 0 30px rgba(34, 211, 238, 0.6)',
            }}
          >
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1), transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white relative z-10" fill="white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1 relative z-10" fill="white" />
            )}
          </motion.button>
        </div>

        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
          <motion.button
            onClick={() => onPresetChange('flat')}
            className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all ${
              preset === 'flat'
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                : 'bg-gray-900/40 border-gray-700 text-gray-400 hover:border-cyan-400/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: preset === 'flat' ? [1, 1.08, 1] : 1,
              y: preset === 'flat' ? -2 : 0,
            }}
            transition={{ duration: 0.2 }}
            style={{
              boxShadow: preset === 'flat' 
                ? '0 0 20px rgba(34, 211, 238, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)' 
                : 'none',
            }}
          >
            Flat
          </motion.button>
          <motion.button
            onClick={() => onPresetChange('bassBoost')}
            className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all ${
              preset === 'bassBoost'
                ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                : 'bg-gray-900/40 border-gray-700 text-gray-400 hover:border-purple-400/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: preset === 'bassBoost' ? [1, 1.08, 1] : 1,
              y: preset === 'bassBoost' ? -2 : 0,
            }}
            transition={{ duration: 0.2 }}
            style={{
              boxShadow: preset === 'bassBoost' 
                ? '0 0 20px rgba(168, 85, 247, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)' 
                : 'none',
            }}
          >
            Bass
          </motion.button>
          <motion.button
            onClick={() => onPresetChange('vocal')}
            className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all ${
              preset === 'vocal'
                ? 'bg-blue-500/30 border-blue-400 text-blue-300'
                : 'bg-gray-900/40 border-gray-700 text-gray-400 hover:border-blue-400/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: preset === 'vocal' ? [1, 1.08, 1] : 1,
              y: preset === 'vocal' ? -2 : 0,
            }}
            transition={{ duration: 0.2 }}
            style={{
              boxShadow: preset === 'vocal' 
                ? '0 0 20px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)' 
                : 'none',
            }}
          >
            Vocal
          </motion.button>
        </div>

        <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-gradient-to-br from-purple-600/80 to-blue-600/80 backdrop-blur-md border border-purple-400/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
            }}
          >
            <Upload className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            onClick={onMicToggle}
            className={`p-3 rounded-full backdrop-blur-md border ${
              isMicActive
                ? 'bg-gradient-to-br from-cyan-600/80 to-green-600/80 border-cyan-400/50'
                : 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-600/50'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: isMicActive ? '0 0 20px rgba(34, 211, 238, 0.4)' : 'none',
            }}
          >
            <Mic className="w-5 h-5 text-white" />
          </motion.button>
        </div>

      </div>
    </div>
  );
}