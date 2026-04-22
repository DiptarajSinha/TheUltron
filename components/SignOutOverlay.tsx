"use client";

import { motion, AnimatePresence } from "framer-motion";
import { InfinityLoader } from "./ui/loader-13";

interface SignOutOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const SignOutOverlay = ({ isVisible, message = "Signing you out..." }: SignOutOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <div className="relative group">
            {/* Glow backing */}
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-[60px] animate-pulse" />
            
            <InfinityLoader 
              size={120} 
              className="relative z-10 [&>svg>path:last-child]:stroke-accent" 
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.5em] text-accent animate-pulse">
              {message}
            </p>
            <div className="mt-4 flex gap-1 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-accent/40 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
