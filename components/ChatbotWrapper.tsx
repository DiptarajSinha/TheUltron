"use client";

import { useState } from "react";
import { ChatbotButton } from "./ChatbotButton";
import { ChatbotModal } from "./ChatbotModal";

export const ChatbotWrapper = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <ChatbotButton
        isOpen={isChatOpen}
        onClick={() => setIsChatOpen(true)}
      />
      <ChatbotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
};
