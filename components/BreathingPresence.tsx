import React from 'react';
import { motion } from 'framer-motion';

interface BreathingPresenceProps {
  state: 'idle' | 'breathing' | 'analyzing' | 'voice';
  customColor?: string;
  volume?: number; // 0 to 1
}

export const BreathingPresence: React.FC<BreathingPresenceProps> = ({ state, customColor, volume = 0 }) => {
  const baseColor = customColor || '#E5D0A8'; // Default Gold

  // --- LIQUID ORB VARIANT (For Voice Mode) ---
  if (state === 'voice') {
    // Dynamic scale based on volume
    const volScale = 1 + (volume * 1.5);
    
    return (
      <div className="relative flex items-center justify-center w-80 h-80">
        
        {/* Aura Layer (Slow rotation) */}
        <motion.div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{ 
            background: `radial-gradient(circle at center, ${baseColor}, transparent 70%)`,
          }}
          animate={{
             scale: [1, 1.2, 1],
             rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Liquid Blob 1 (Background) */}
        <motion.div
          className="absolute w-full h-full opacity-60 blur-2xl"
          style={{ backgroundColor: baseColor }}
          animate={{
            borderRadius: [
              "60% 40% 30% 70% / 60% 30% 70% 40%",
              "30% 60% 70% 40% / 50% 60% 30% 60%",
              "60% 40% 30% 70% / 60% 30% 70% 40%",
            ],
            rotate: [0, -180, -360],
            scale: 0.8 + (volume * 0.2)
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Liquid Blob 2 (Core - Reactive) */}
        <motion.div
          className="absolute w-64 h-64 blur-md opacity-90 shadow-lg"
          style={{ 
            backgroundColor: '#FDFBF7', // Ivory
            border: `2px solid ${baseColor}`,
            boxShadow: `0 0 ${40 + volume * 100}px ${baseColor}`
          }}
          animate={{
            borderRadius: [
              "50% 50% 50% 50% / 50% 50% 50% 50%",
              "60% 40% 30% 70% / 60% 30% 70% 40%", 
              "40% 60% 70% 30% / 40% 70% 30% 60%",
              "50% 50% 50% 50% / 50% 50% 50% 50%"
            ],
            scale: [1, volScale, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            duration: 8, // Morph speed
            repeat: Infinity,
            ease: "easeInOut",
            // Use volume to speed up animation slightly ideally, but simpler to just scale for now
          }}
        />
        
        {/* Inner Highlight */}
        <motion.div
           className="absolute w-32 h-32 rounded-full blur-xl opacity-80"
           style={{ backgroundColor: '#FFFFFF' }}
           animate={{
             scale: 0.8 + volume,
             opacity: 0.5 + (volume * 0.5)
           }}
           transition={{ duration: 0.2 }}
        />

      </div>
    );
  }

  // --- STANDARD BREATHING VARIANT (For Text/Intro) ---

  const dynamicScale = state === 'analyzing' ? 1 + (volume * 1.5) : 1;
  const dynamicOpacity = state === 'analyzing' ? 0.4 + (volume * 0.4) : 0.3;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Glow */}
      <motion.div
        className="absolute rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: baseColor, width: '100%', height: '100%' }}
        animate={{
          scale: state === 'analyzing' ? [1, dynamicScale, 1] : [1, 1.1, 1],
          opacity: state === 'analyzing' ? [0.2, dynamicOpacity, 0.2] : [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: state === 'analyzing' ? 0.2 : 6,
          repeat: state === 'analyzing' ? 0 : Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Middle Circle */}
      <motion.div
        className="absolute rounded-full opacity-40 blur-md"
        style={{ backgroundColor: baseColor, width: '60%', height: '60%' }}
        animate={{
          scale: state === 'analyzing' ? 1 + (volume * 0.5) : [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: state === 'analyzing' ? 0.1 : 5,
          repeat: state === 'analyzing' ? 0 : Infinity,
          ease: "easeInOut",
          delay: state === 'analyzing' ? 0 : 0.5
        }}
      />

      {/* Core */}
      <motion.div
        className="relative rounded-full z-10 shadow-sm"
        style={{ 
          backgroundColor: '#FDFBF7',
          border: `1px solid ${baseColor}`,
          width: '30%', 
          height: '30%' 
        }}
        animate={{
          scale: state === 'analyzing' ? 1 + (volume * 0.2) : 1,
          boxShadow: state === 'analyzing' 
            ? `0 0 ${20 + volume * 50}px 5px ${baseColor}40` 
            : `0 0 10px 2px ${baseColor}20`,
        }}
        transition={{
          duration: state === 'analyzing' ? 0.1 : 2,
          repeat: state === 'analyzing' ? 0 : Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};