import { Navbar } from "@/components/Navbar";
import { RobotScrollAnimation } from "@/components/RobotScrollAnimation";
import { HeroSection } from "@/components/HeroSection";
import { JourneySection } from "@/components/JourneySection";
import { PricingCalculator } from "@/components/PricingCalculator";
import { ChatbotWrapper } from "@/components/ChatbotWrapper";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main id="top" className="bg-black min-h-screen text-white font-sans selection:bg-accent relative">
      <Navbar />
      
      {/* 400vh Scroll-linked frame-by-frame Canvas */}
      <RobotScrollAnimation />
      
      {/* Post-Animation UI Elements */}
      <div className="relative z-10 bg-black shadow-[0_-20px_50px_rgba(0,0,0,1)]">
        <HeroSection />
        <JourneySection />
        <PricingCalculator />
        <Footer />
      </div>

      <ChatbotWrapper />
    </main>
  );
}
