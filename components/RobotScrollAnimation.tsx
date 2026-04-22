"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, motion, AnimatePresence } from "framer-motion";

export const RobotScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);
  
  // Deterministic UI State Control (Only triggers re-renders on section boundary)
  const [activeLayer, setActiveLayer] = useState<"hero" | 0 | 1 | 2 | "none">("hero");
  const activeLayerRef = useRef<"hero" | 0 | 1 | 2 | "none">("hero");

  const totalFrames = 182;
  const progressPercent = Math.round((loadedCount / totalFrames) * 100);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    let count = 0;
    
    for (let i = 1; i <= totalFrames; i++) {
      const img = new window.Image();
      const frameNum = i.toString().padStart(3, "0");
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`; 
      
      img.onload = () => {
        count++;
        setLoadedCount(count);
      };
      
      imagesRef.current.push(img);
    }
  }, []);

  useEffect(() => {
    if (loadedCount === totalFrames && !initialLoad) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setInitialLoad(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loadedCount, initialLoad]);

  const renderFrame = (progress: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const frameIndex = Math.min(
      totalFrames - 1,
      Math.floor(progress * totalFrames)
    );
    
    // Strict Deterministic Cutoffs
    const TEXT_STOP_FRAME = Math.floor(totalFrames * 0.75);
    const HERO_END_FRAME = Math.floor(totalFrames * 0.1);
    const TEXT_START_FRAME = HERO_END_FRAME;
    
    // Change divisor from 4 to 3 mapping limits precisely securely ensuring none fall through
    const TOTAL_LAYERS = 3;
    const segmentSize = (TEXT_STOP_FRAME - TEXT_START_FRAME) / TOTAL_LAYERS;

    let newLayer: "hero" | 0 | 1 | 2 | "none" = "none";

    if (frameIndex < HERO_END_FRAME) {
      newLayer = "hero";
    } else if (frameIndex >= TEXT_STOP_FRAME) {
      newLayer = "none";
    } else {
      const segment = Math.floor((frameIndex - TEXT_START_FRAME) / segmentSize);
      // Ensures the segment caps strictly preventing array-overflow bounds
      newLayer = Math.min(TOTAL_LAYERS - 1, Math.max(0, segment)) as 0 | 1 | 2;
    }

    if (newLayer !== activeLayerRef.current) {
      activeLayerRef.current = newLayer;
      setActiveLayer(newLayer);
    }
    
    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    
    const { innerWidth: width, innerHeight: height } = window;
    
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // "Contain" scaling logic
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight;
    if (imgRatio > canvasRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
    } else {
      drawHeight = height;
      drawWidth = height * imgRatio;
    }

    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };

  useEffect(() => {
    if (!initialLoad) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      ctx.scale(dpr, dpr);
      renderFrame(scrollYProgress.get());
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [initialLoad, scrollYProgress]);

  useEffect(() => {
    let ticking = false;
    
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          renderFrame(latest);
          ticking = false;
        });
        ticking = true;
      }
    });

    return () => unsubscribe();
  }, [initialLoad, scrollYProgress]);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-black">
      
      <div className="sticky top-0 h-screen w-full flex items-center justify-center z-10 overflow-hidden text-white/90">
        
        <AnimatePresence>
          {!initialLoad && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
              className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black"
            >
              {/* Circular Loader */}
              <div className="relative w-32 h-32 mb-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="white"
                    strokeWidth="1.5"
                    fill="transparent"
                    strokeDasharray="376.8"
                    initial={{ strokeDashoffset: 376.8 }}
                    animate={{ strokeDashoffset: 376.8 - (376.8 * (progressPercent / 100)) }}
                    transition={{ type: "spring", stiffness: 30, damping: 15 }}
                  />
                </svg>
                {/* Spinning glow/arc effect */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-[1.5px] border-white/30 rounded-full"
                />
              </div>

              {/* Text: INITIALIZING SYSTEM */}
              <div className="text-white font-sans text-xs md:text-sm tracking-[0.5em] uppercase mb-8 opacity-80">
                Initializing System
              </div>

              {/* Progress Bar Container */}
              <div className="w-48 h-[1px] bg-white/10 relative mb-4 overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-white"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Percentage */}
              <div className="text-white/40 font-sans text-[10px] tracking-[0.2em]">
                {progressPercent}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <canvas ref={canvasRef} className="block w-full h-full object-contain" />
        
        {/* Overlay Layers controlled uniquely by Deterministic State */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <AnimatePresence mode="wait">
          
            {activeLayer === "hero" && (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
              >
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-sans font-bold tracking-widest drop-shadow-2xl max-w-[90vw] mx-auto transition-all duration-300 uppercase">
                  Autonomous Navigation
                </h1>
                <p className="text-gray-400 font-sans mt-4 text-sm sm:text-base md:text-xl tracking-[0.3em] uppercase">
                  From static hero to kinetic reality
                </p>
              </motion.div>
            )}

            {activeLayer === 0 && (
              <>
                <motion.div 
                  key="left0"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0 }}
                  className="absolute top-20 md:top-1/4 left-6 md:left-16 max-w-[280px] sm:max-w-sm"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold tracking-wide drop-shadow-md pb-1 md:pb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-200">
                    Ultrasonic Vision
                  </h2>
                  <p className="text-gray-300 mt-1 md:mt-2 leading-relaxed text-sm sm:text-base md:text-lg drop-shadow-md">
                    Real-time obstacle detection with absolute precision mapping.
                  </p>
                </motion.div>
                <motion.div 
                  key="right0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-10 md:bottom-32 right-6 md:right-16 max-w-[200px] sm:max-w-[280px] text-right"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-sans font-medium tracking-wide text-gray-200 drop-shadow-lg">
                    Sensor Matrix X-1
                  </h3>
                  <p className="text-gray-500 font-sans text-xs sm:text-sm mt-1 md:mt-2 leading-relaxed tracking-wider uppercase drop-shadow-lg">
                    360-degree topology scanning processing 200 arrays natively.
                  </p>
                </motion.div>
              </>
            )}

            {activeLayer === 1 && (
              <>
                <motion.div 
                  key="left1"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0 }}
                  className="absolute top-20 md:top-1/4 left-6 md:left-16 max-w-[280px] sm:max-w-sm"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold tracking-wide drop-shadow-md pb-1 md:pb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-200">
                    Kinetic Resilience
                  </h2>
                  <p className="text-gray-300 mt-1 md:mt-2 leading-relaxed text-sm sm:text-base md:text-lg drop-shadow-md">
                    Silent, adaptive tracks adjusting to surface friction instantly.
                  </p>
                </motion.div>
                <motion.div 
                  key="right1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-10 md:bottom-32 right-6 md:right-16 max-w-[200px] sm:max-w-[280px] text-right"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-sans font-medium tracking-wide text-gray-200 drop-shadow-lg">
                    Torque Core
                  </h3>
                  <p className="text-gray-500 font-sans text-xs sm:text-sm mt-1 md:mt-2 leading-relaxed tracking-wider uppercase drop-shadow-lg">
                    Motor control logic resolving dynamic physical barriers silently.
                  </p>
                </motion.div>
              </>
            )}

            {activeLayer === 2 && (
              <>
                <motion.div 
                  key="left2"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0 }}
                  className="absolute top-20 md:top-1/4 left-6 md:left-16 max-w-[280px] sm:max-w-sm"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold tracking-wide drop-shadow-md pb-1 md:pb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-200">
                    Deep Intelligence
                  </h2>
                  <p className="text-gray-300 mt-1 md:mt-2 leading-relaxed text-sm sm:text-base md:text-lg drop-shadow-md">
                    Context-aware inference modules interpreting tourist commands fluently.
                  </p>
                </motion.div>
                <motion.div 
                  key="right2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-10 md:bottom-32 right-6 md:right-16 max-w-[200px] sm:max-w-[280px] text-right"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-sans font-medium tracking-wide text-gray-200 drop-shadow-lg">
                    Logic Cortex Alpha
                  </h3>
                  <p className="text-gray-500 font-sans text-xs sm:text-sm mt-1 md:mt-2 leading-relaxed tracking-wider uppercase drop-shadow-lg">
                    On-board localized routing latency measuring 0.1ms sequentially.
                  </p>
                </motion.div>
              </>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
