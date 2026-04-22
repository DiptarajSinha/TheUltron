"use client";

import { motion } from "framer-motion";
import { DownloadCloud, MousePointerClick, Clock } from "lucide-react";

const steps = [
  {
    icon: <DownloadCloud className="w-8 h-8 md:w-10 md:h-10 text-accent mb-4 md:mb-6" />,
    title: "Download & Register",
    description: "Get the Ultron app, scan your ID, and connect your payment method securely."
  },
  {
    icon: <MousePointerClick className="w-8 h-8 md:w-10 md:h-10 text-accent mb-4 md:mb-6" />,
    title: "Choose Plan",
    description: "Select the hours you need. The robot will instantly unlock and pair with your device."
  },
  {
    icon: <Clock className="w-8 h-8 md:w-10 md:h-10 text-accent mb-4 md:mb-6" />,
    title: "Return on Time",
    description: "Guide it back to any designated station before your time ends to recover your deposit."
  }
];

export const JourneySection = () => {
  return (
    <section id="journey" className="py-20 md:py-32 px-6 bg-black scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-12 md:mb-20 text-center">Your Journey</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                y: -12,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group glass p-8 md:p-10 rounded-3xl text-center flex flex-col items-center border border-white/5 hover:border-accent/30 relative overflow-hidden transition-colors duration-500"
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <motion.div 
                className="p-4 md:p-5 bg-accent/5 rounded-2xl mb-2 relative z-10 group-hover:bg-accent/10 transition-colors duration-300"
                whileHover={{ rotate: 5, scale: 1.1 }}
              >
                {step.icon}
              </motion.div>
              
              <h3 className="text-xl md:text-2xl font-playfair font-bold mb-3 md:mb-4 text-white relative z-10 group-hover:text-accent transition-colors duration-300">
                {step.title}
              </h3>
              
              <p className="text-gray-400 font-sans text-sm md:text-base leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors duration-300">
                {step.description}
              </p>

              {/* Decorative accent line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
