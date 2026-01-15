'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface RadialBarsProps {
  frequencyData: number[];
  radius: number;
  barCount: number;
  preset: string;
}

export default function RadialBars({ frequencyData, radius, barCount, preset }: RadialBarsProps) {
  const angleStep = (Math.PI * 2) / barCount;
  const minBarHeight = 10;
  const maxBarHeight = 80;

  const weightedData = useMemo(() => {
    return frequencyData.map((value, index) => {
      const ratio = index / barCount;
      
      if (preset === 'bassBoost') {
       
        if (ratio < 0.3) {
          return value * 1.5;
        }
        return value * 0.5;
      }
      
      if (preset === 'vocal') {
       
        if (ratio > 0.3 && ratio < 0.7) {
          return value * 1.5;
        }
        return value * 0.5;
      }
      
    
      return value;
    });
  }, [frequencyData, preset, barCount]);

  const getBarThickness = (index: number) => {
    const ratio = index / barCount;

    if (ratio < 0.3) {
      return 5 + ratio * 1; 
    } else if (ratio < 0.7) {
      return 3.5; 
    } else {
      return 2.5 + (ratio - 0.7) * 0.5; 
    }
  };

  const getBarGradient = (index: number, height: number) => {
    const ratio = index / barCount;
    const intensity = Math.min(1, height);
    
    
    const cyanIntensity = 1 - ratio;
    const purpleIntensity = ratio;
    
    
    if (preset === 'bassBoost' && ratio < 0.3) {
      return `rgba(168, 85, 247, ${0.8 + intensity * 0.2})`; 
    }
    
    if (preset === 'vocal' && ratio > 0.3 && ratio < 0.7) {
      return `rgba(34, 211, 238, ${0.8 + intensity * 0.2})`; 
    }
    
    
    const r = Math.round(34 * cyanIntensity + 168 * purpleIntensity);
    const g = Math.round(211 * cyanIntensity + 85 * purpleIntensity);
    const b = Math.round(238 * cyanIntensity + 247 * purpleIntensity);
    const alpha = 0.6 + intensity * 0.4;
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <svg
      width={radius * 2 + maxBarHeight * 2}
      height={radius * 2 + maxBarHeight * 2}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(${radius + maxBarHeight}, ${radius + maxBarHeight})`}>
        {weightedData.map((value, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x1 = Math.cos(angle) * radius;
          const y1 = Math.sin(angle) * radius;

          const barHeight = minBarHeight + value * maxBarHeight;
          const x2 = Math.cos(angle) * (radius + barHeight);
          const y2 = Math.sin(angle) * (radius + barHeight);
          
          const thickness = getBarThickness(index);
          const color = getBarGradient(index, value);

          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={thickness}
              strokeLinecap="round"
              initial={{ x2: x1, y2: y1 }}
              animate={{ x2, y2 }}
              transition={{ 
                duration: 0.15, 
                ease: [0.4, 0, 0.2, 1], 
                type: 'tween'
              }}
              style={{
                filter: 'url(#glow)',
                opacity: 0.9,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
