"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User as UserIcon, Ticket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

import Link from "next/link";

import { TicketsModal } from "./TicketsModal";
import { SignOutOverlay } from "./SignOutOverlay";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleHashChange = () => {
      if (window.location.hash !== "#tickets") {
        setIsTicketsModalOpen(false);
      } else {
        setIsTicketsModalOpen(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("hashchange", handleHashChange);
    
    // Check initial hash
    if (window.location.hash === "#tickets") {
      setIsTicketsModalOpen(true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
      subscription.unsubscribe();
    };
  }, []);

  const openTicketsModal = () => {
    window.location.hash = "tickets";
    setIsTicketsModalOpen(true);
  };

  const closeTicketsModal = () => {
    if (window.location.hash === "#tickets") {
      window.history.back();
    }
    setIsTicketsModalOpen(false);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    }, 2000);
  };


  const navLinks = [
    { name: "Home", href: "#top" },
    { name: "Journey", href: "#journey" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-4 transition-all duration-300 ${
          isScrolled ? "bg-black/60 backdrop-blur-md border-b border-white/10 shadow-lg" : "bg-transparent"
        }`}
      >
        {/* Brand */}
        <Link href="#top" className="flex items-center gap-3 cursor-pointer group">
          {/* Custom Ultron Logo */}
          <div className="relative w-8 h-8 md:w-9 md:h-9">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* White U-shape */}
              <path 
                d="M7 5V13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13V5" 
                stroke="white" 
                strokeWidth="2.4" 
                strokeLinecap="round" 
              />
              {/* Blue Dot */}
              <circle cx="12" cy="11" r="2.2" fill="var(--accent)" />
              {/* Blue Stand */}
              <path d="M12 18V21" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M8 21H16" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2 font-sans font-black text-xl md:text-2xl tracking-tighter uppercase drop-shadow-lg">
            <span className="text-white">The</span>
            <span className="text-accent">Ultron</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-sans text-gray-400">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="nav-link hover:text-white transition-all duration-300 font-medium relative group px-1"
            >
              {link.name}
            </a>
          ))}
          {user ? (
            <div className="flex items-center gap-4 ml-4">
              {/* Profile Dropdown */}
              <div className="relative group/dropdown">
                <motion.div 
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 0 20px rgba(74, 144, 226, 0.4)",
                    borderColor: "rgba(74, 144, 226, 0.6)"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent cursor-pointer relative overflow-hidden group/avatar"
                >
                  <UserIcon className="w-5 h-5 text-accent relative z-10" />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ opacity: 1, scale: 2 }}
                    className="absolute inset-0 bg-accent/10 blur-xl pointer-events-none"
                  />
                </motion.div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full pt-4 opacity-0 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:pointer-events-auto transition-all duration-300 z-50">
                  <div className="w-52 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-2 relative before:absolute before:-top-4 before:right-0 before:w-16 before:h-4 before:bg-transparent -mt-2">
                     <Link href="/account" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all w-full text-left group/item">
                        <UserIcon className="w-4 h-4 text-accent group-hover/item:scale-110 transition-transform" />
                        Account
                     </Link>
                     <button onClick={openTicketsModal} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all w-full text-left group/item">
                        <Ticket className="w-4 h-4 text-accent group-hover/item:scale-110 transition-transform" />
                        My Tickets
                     </button>
                     <div className="h-px bg-white/10 my-2" />
                     <button 
                       onClick={() => setShowLogoutConfirm(true)}
                       className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all w-full text-left group/item"
                     >
                       <LogOut className="w-4 h-4 text-red-400 group-hover/item:scale-110 transition-transform" />
                       <span className="font-bold">Sign Out</span>
                     </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <Link href="/auth">
              <button className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-blue-500/40 text-white px-8 py-2.5 rounded-full font-sans font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:border-blue-400 group ml-4">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <span className="relative z-10">Sign In</span>
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center md:hidden">
          <button 
            onClick={() => setIsOpen(true)}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-xs bg-surface z-[70] shadow-2xl flex flex-col p-8 md:hidden border-l border-white/10"
            >
              <div className="flex justify-between items-center mb-12">
                <Link href="#top" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                  <div className="w-7 h-7">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M7 5V13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13V5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
                      <circle cx="12" cy="11" r="2.2" fill="var(--accent)" />
                      <path d="M12 18V21" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
                      <path d="M8 21H16" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex items-baseline gap-1.5 font-sans font-black text-lg tracking-tight uppercase">
                    <span className="text-white">The</span>
                    <span className="text-accent">Ultron</span>
                  </div>
                </Link>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className="text-2xl font-playfair font-bold text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300"
                  >
                    {link.name}
                  </a>
                ))}
                
                {user && (
                   <div className="flex flex-col gap-6">
                     <Link 
                       href="/account"
                       onClick={() => setIsOpen(false)}
                       className="text-2xl font-playfair font-bold text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 text-left flex items-center gap-4"
                     >
                       <UserIcon className="w-6 h-6 text-accent" />
                       Account
                     </Link>
                     <button 
                       onClick={() => {
                         openTicketsModal();
                         setIsOpen(false);
                       }}
                       className="text-2xl font-playfair font-bold text-accent hover:translate-x-2 transition-all duration-300 text-left flex items-center gap-4"
                     >
                       <Ticket className="w-6 h-6" />
                       My Tickets
                     </button>
                   </div>
                )}

                <div className="h-px bg-white/10 my-4" />
                {user ? (
                  <button 
                    onClick={() => {
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-sans font-bold flex items-center justify-center gap-3"
                  >

                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                ) : (
                  <Link href="/auth" onClick={() => setIsOpen(false)}>
                    <button className="w-full bg-accent text-white py-4 rounded-2xl font-sans font-bold shadow-lg shadow-accent/20">
                      Sign In
                    </button>
                  </Link>
                )}
              </div>

              <div className="mt-auto">
                <p className="text-xs text-gray-500 font-sans tracking-widest uppercase">
                  The Ultron &copy; 2026
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {user && (
        <TicketsModal 
          isOpen={isTicketsModalOpen} 
          onClose={closeTicketsModal} 
          userId={user.id} 
        />
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass p-8 rounded-3xl border border-white/10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-white mb-3">Sign Out?</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Are you sure you want to end your session? You&apos;ll need to sign back in to access your tickets.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-sans font-bold transition-all duration-300 shadow-lg shadow-red-500/20"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-sans font-bold transition-all duration-300 border border-white/5"
                >
                  Keep Browsing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SignOutOverlay isVisible={isLoggingOut} />
    </>
  );
};

