"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export const HeroSection = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCTA = () => {
    if (user) {
      const pricingSection = document.getElementById('pricing');
      pricingSection?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/auth');
    }
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex flex-col justify-center items-center text-center px-6 py-20 bg-black overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-[95%] lg:max-w-7xl z-10 mx-auto"
      >
        <h1 className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-6 md:mb-8 transition-all duration-300">
          Explore Smart.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400 glow-text inline-block">
            Tour Safer with Our Robot Guide.
          </span>
        </h1>
        <p className="font-sans text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed">
          Experience the future of tourism. Rent a robot guide instantly by scanning the QR code at any station. Secure, smart, and fully autonomous.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleCTA}
            className="w-full sm:w-auto bg-white text-black font-semibold px-12 py-4 rounded-full text-lg hover:scale-105 hover:bg-white transition-all duration-300 shadow-xl shadow-white/5 active:scale-95"
          >
            {user ? "Try our Robot" : "Get Started Now"}
          </button>
        </div>
      </motion.div>
    </section>
  );
};
