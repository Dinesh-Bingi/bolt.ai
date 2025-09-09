import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface HolographicAvatarProps {
  imageUrl?: string;
  name: string;
  isAnimating?: boolean;
}

export default function HolographicAvatar({ imageUrl, name, isAnimating = false }: HolographicAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Holographic Base */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-full blur-xl" />
      
      {/* Avatar Container */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          rotateY: isAnimating ? 360 : isHovered ? 10 : 0,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{
          rotateY: { duration: isAnimating ? 4 : 0.3, repeat: isAnimating ? Infinity : 0, ease: "linear" },
          scale: { duration: 0.3 }
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{ perspective: 1000 }}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-cyan-400/30 shadow-2xl shadow-cyan-500/20 bg-gradient-to-br from-gray-800 to-gray-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Holographic Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse" />
        
        {/* Scanning Lines */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            background: 'linear-gradient(45deg, transparent 40%, rgba(6, 182, 212, 0.1) 50%, transparent 60%)',
            backgroundSize: '20px 20px'
          }}
        />
      </motion.div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl animate-pulse" />
    </div>
  );
}