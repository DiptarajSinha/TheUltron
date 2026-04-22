"use client";

import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatbotButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const ChatbotButton = ({ isOpen, onClick }: ChatbotButtonProps) => {
  return (
    <AnimatePresence mode="wait">
      {!isOpen && (
        <motion.button
          key="chatbot-btn"
          initial={{ scale: 0, width: 64 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ width: 220 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 200,
            damping: 20,
            width: { type: "spring", stiffness: 300, damping: 30 },
          }}
          onClick={onClick}
          className="fixed bottom-8 right-8 h-16 bg-accent rounded-full flex items-center justify-start shadow-[0_0_30px_rgba(74,144,226,0.6)] z-50 group overflow-hidden px-4"
          aria-label="Chat Support"
        >
          {/* Pulse effect */}
          <span className="absolute left-0 top-0 w-16 h-16 rounded-full border border-accent animate-ping opacity-75 pointer-events-none"></span>

          <div className="flex items-center gap-4 min-w-[200px]">
            <MessageCircle className="w-8 h-8 text-white shrink-0 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-white font-sans font-black uppercase tracking-[0.2em] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Chat With Friday
            </span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
