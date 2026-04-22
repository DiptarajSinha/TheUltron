"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm, RegisterForm, ForgotPasswordForm } from "@/components/AuthComponents";
import { ArrowLeft } from "lucide-react";
import { AnimatedCharacters } from "@/components/AnimatedCharacters";
import Link from "next/link";

export default function AuthPage() {
  const [view, setView] = useState<"login" | "register" | "forgot-password">("login");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isTyping = focusedField !== null;
  const isTypingPassword = focusedField === "password";

  const VisualContent = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 md:p-12 lg:p-16 overflow-hidden bg-[#0a0a0a]">
       {/* Brand Header */}
       <div className="relative z-20 w-full flex justify-between lg:justify-center">
          <div className="flex items-center gap-3 text-lg font-black uppercase tracking-[0.4em] text-white">
            <div className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path d="M7 5V13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13V5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="12" cy="11" r="2.2" fill="#4A90E2" />
                <path d="M12 18V21" stroke="#4A90E2" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M8 21H16" stroke="#4A90E2" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
            <span className="hidden sm:inline">The Ultron</span>
          </div>
        </div>

        {/* Characters Area */}
        <div className="relative z-10 w-full flex items-center justify-center flex-1 max-h-[500px]">
           <AnimatedCharacters 
             isTyping={isTyping} 
             isTypingPassword={isTypingPassword} 
             showPassword={isPasswordVisible} 
             side={(view === "login" || view === "forgot-password") ? "right" : "left"}
           />
        </div>

        {/* Footer */}
        <div className="relative z-20 w-full flex justify-center gap-6 text-[9px] uppercase tracking-widest text-gray-600 font-bold">
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Terms</a>
           <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
    </div>
  );

  return (
    <main className="min-h-screen lg:h-screen bg-black flex items-center justify-center p-0 lg:p-12 lg:overflow-hidden relative">
      {/* Back Icon Button */}
      <Link 
        href="/" 
        className="fixed top-6 left-6 md:top-8 md:left-8 z-[60] p-2.5 rounded-full border border-white/5 bg-black/40 backdrop-blur-md text-gray-500 hover:text-white transition-all hover:scale-110 active:scale-95 group"
        aria-label="Back to Home"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </Link>

      <div className="relative w-full max-w-[1400px] min-h-[100dvh] lg:h-[800px] bg-surface lg:rounded-[3rem] border border-white/5 shadow-2xl overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row transition-all duration-500">
        
        {/* Desktop Sliding Visual Panel */}
        <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20">
          <motion.div
            initial={false}
            animate={{ 
              x: (view === "login" || view === "forgot-password") ? "100%" : "0%",
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="absolute top-0 left-0 w-1/2 h-full bg-[#0a0a0a] border-x border-white/5 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <VisualContent />
          </motion.div>
        </div>

        {/* Dynamic Forms Container */}
        <div className="flex-1 flex flex-col lg:flex-row relative h-full">
          
          {/* Left Area (Sign In or Forgot Password) */}
          <div className={`w-full lg:w-1/2 h-full flex items-center justify-center transition-all duration-500 ${view === "register" ? "lg:opacity-0 lg:pointer-events-none lg:scale-95 blur-xl" : "opacity-100 scale-100 blur-0"}`}>
            <AnimatePresence mode="wait">
              {view === "login" && (
                <motion.div
                  key="login-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex justify-center"
                >
                  <LoginForm 
                    onToggle={() => setView("register")} 
                    onForgotPassword={() => setView("forgot-password")} 
                    onFocusField={setFocusedField}
                    onPasswordVisibilityChange={setIsPasswordVisible}
                  />
                </motion.div>
              )}
              {view === "forgot-password" && (
                <motion.div
                  key="forgot-password-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex justify-center"
                >
                  <ForgotPasswordForm onToggle={() => setView("login")} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Area (Register) */}
          <div className={`w-full lg:w-1/2 h-full flex items-center justify-center transition-all duration-500 ${view !== "register" ? "lg:opacity-0 lg:pointer-events-none lg:scale-95 blur-xl" : "opacity-100 scale-100 blur-0"}`}>
            <AnimatePresence mode="wait">
              {view === "register" && (
                <motion.div
                  key="register-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex justify-center"
                >
                  <RegisterForm 
                    onToggle={() => setView("login")} 
                    onFocusField={setFocusedField}
                    onPasswordVisibilityChange={setIsPasswordVisible}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Header (Visible on mobile/tablet) */}
        <div className="lg:hidden h-[40vh] md:h-[50vh] w-full shrink-0 border-b border-white/5">
           <VisualContent />
        </div>
      </div>

      {/* Background Ambience */}
      <div className="fixed -bottom-48 -left-48 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed -top-48 -right-48 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
    </main>
  );
}
