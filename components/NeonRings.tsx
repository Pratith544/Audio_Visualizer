'use client';

import { motion } from 'framer-motion';

interface NeonRingProps {
  size: number;
  intensity: number;
  color?: string;
  animate?: boolean;
  rotationSpeed?: number;
  opacity?: number;
}

export default function NeonRing({ 
  size, 
  intensity, 
  color = 'cyan', 
  animate = true,
  rotationSpeed = 1,
  opacity = 0.3
}: NeonRingProps) {
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

  // Pulse scale based on intensity
  const pulseScale = 1 + intensity * 0.05;

  // Create dashed circle pattern for rotation visibility
  const circumference = 2 * Math.PI * (radius - strokeWidth);
  const dashArray = `${circumference * 0.1} ${circumference * 0.05}`;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.svg
        width={size}
        height={size}
        animate={animate ? { 
          rotate: 360, 
          scale: [1, pulseScale, 1]
        } : {}}
        transition={{
          rotate: { 
            duration: 15 / rotationSpeed, 
            repeat: Infinity, 
            ease: 'linear' 
          },
          scale: { 
            duration: 0.5, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }
        }}
        style={{
          transformOrigin: 'center center',
          opacity: opacity + intensity * 0.3,
        }}
      >
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          className={`${colors[color as keyof typeof colors]} ${glowColors[color as keyof typeof glowColors]}`}
        />
      </motion.svg>
    </div>
  );
}