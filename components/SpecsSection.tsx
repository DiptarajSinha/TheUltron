"use client";

import { motion } from "framer-motion";
import { Cpu, Wifi, Map, Eye } from "lucide-react";

const specs = [
  {
    icon: <Wifi className="w-8 h-8 text-accent mb-4" />,
    title: "Ultrasonic Sensors",
    description: "Multi-directional sensing matrix processing 200+ readings per second for flawless environmental awareness."
  },
  {
    icon: <Eye className="w-8 h-8 text-accent mb-4" />,
    title: "IR Tracking System",
    description: "High-fidelity infrared cameras enable precise motion tracking and night-vision capabilities in low light."
  },
  {
    icon: <Map className="w-8 h-8 text-accent mb-4" />,
    title: "Autonomous Navigation",
    description: "Advanced SLAM algorithms processing Lidar data to navigate complex tourist environments safely."
  },
  {
    icon: <Cpu className="w-8 h-8 text-accent mb-4" />,
    title: "Neural AI Module",
    description: "On-board inference engine providing real-time voice translation and intelligent tourist context."
  }
];

export const SpecsSection = () => {
  return (
    <section id="specs" className="py-24 px-4 bg-black relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">Core Architecture</h2>
          <p className="text-gray-400 font-sans max-w-2xl mx-auto">Engineered from the ground up for safety, efficiency, and intelligence.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specs.map((spec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="glass p-8 rounded-3xl hover:bg-surface/60 transition-colors duration-300 group cursor-default"
            >
              <div className="transform group-hover:scale-110 transition-transform duration-300 origin-left">
                {spec.icon}
              </div>
              <h3 className="text-2xl font-playfair font-semibold mb-3">{spec.title}</h3>
              <p className="text-gray-400 font-sans leading-relaxed">{spec.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
