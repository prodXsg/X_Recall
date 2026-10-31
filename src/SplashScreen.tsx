import { motion } from 'motion/react';
import { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1400); // 300ms fade-in + 800ms delay + 300ms fade-out
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="absolute inset-0 bg-black flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-white select-none"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: {
            delay: 0.3,
            duration: 0.8,
          },
        }}
      >
        <div className="text-9xl font-bold tracking-tighter">𝕏</div>
      </motion.div>
    </motion.div>
  );
}
