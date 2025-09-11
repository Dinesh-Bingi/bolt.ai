import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = React.memo(({ children, className = '', hover = false }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      className={`
        bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6
        shadow-xl hover:shadow-2xl transition-all duration-300
        hover:border-white/20 hover:bg-white/10
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;