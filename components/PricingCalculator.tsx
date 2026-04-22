"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export const PricingCalculator = () => {
  const router = useRouter();
  const [hours, setHours] = useState(1);
  const hourlyRate = 200;
  const deposit = 600;
  
  const totalCost = (hours * hourlyRate) + deposit;

  const handleReserve = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }
    router.push(`/reserve?hours=${hours}`);
  };

  return (
    <section id="pricing" className="py-20 md:py-32 px-6 bg-black relative scroll-mt-20">
      <div className="max-w-4xl mx-auto glass p-6 sm:p-10 md:p-14 rounded-[2rem] glow-box border border-white/5">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">Rental Estimate</h2>
          <p className="text-gray-400 font-sans text-sm md:text-base">Calculate your robotic tour guide experience.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-10 md:gap-14 items-center">
          <div className="flex-1 w-full">
            <div className="flex justify-between text-sans mb-6">
              <span className="text-gray-300 font-medium">Duration</span>
              <span className="text-accent font-bold text-lg">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
            </div>
            <div className="relative group px-1">
              <input 
                type="range"
                min="1"
                max="4"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent transition-all"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-3 font-sans uppercase tracking-wider">
              <span>1 hr</span>
              <span>4 hrs</span>
            </div>

            <div className="mt-10 space-y-4 font-sans text-sm md:text-base text-gray-400">
              <div className="flex justify-between pb-3 border-b border-white/5">
                <span>Rate ({hours}h × ₹{hourlyRate})</span>
                <span className="text-white">₹{hours * hourlyRate}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/5">
                <span>Security Deposit (Refundable)</span>
                <span className="text-white">₹{deposit}</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[320px] bg-surface/30 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center backdrop-blur-sm">
            <span className="text-gray-400 font-sans text-sm block mb-3 uppercase tracking-widest">Total Estimated Cost</span>
            <motion.span 
              key={totalCost}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl md:text-6xl font-playfair font-bold text-white glow-text block mb-8"
            >
              ₹{totalCost}
            </motion.span>
            <button 
              onClick={handleReserve}
              className="w-full bg-accent text-white font-sans font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(74,144,226,0.3)] hover:-translate-y-1 active:scale-95"
            >
              Reserve Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
