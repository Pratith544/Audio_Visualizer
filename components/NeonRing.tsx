'use client';

import { motion } from 'framer-motion';

interface NeonRingProps {
  size: number;
  intensity: number;
  color?: string;
  animate?: boolean;
}

export default function NeonRing({ size, intensity, color = 'cyan', animate = true }: NeonRingProps) {
  const radius = size / 2;
  const strokeWidth = 2 + intensity * 4;

  const colors = {
    cyan: 'stroke-cyan-400',
    purple: 'stroke-purple-400',
    blue: 'stroke-blue-400',
    pink: 'stroke-pink-400',
  };

  const glowColors = {
    cyan: 'drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
    purple: 'drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]',
    blue: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]',
    pink: 'drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]',
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.svg
        width={size}
        height={size}
        animate={animate ? { 
          rotate: 360, 
          scale: [1, 1.02, 1] 
        } : {}}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
        style={{
          transformOrigin: 'center center'
        }}
      >
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          fill="none"
          strokeWidth={strokeWidth}
          className={`${colors[color as keyof typeof colors]} ${glowColors[color as keyof typeof glowColors]}`}
          opacity={0.3 + intensity * 0.5}
        />
      </motion.svg>
    </div>
  );
}
