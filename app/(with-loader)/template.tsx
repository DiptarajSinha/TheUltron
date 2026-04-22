"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CubeLoader as Loader } from "@/components/ui/loader";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showChildren, setShowChildren] = useState(false);

  useEffect(() => {
    // Dynamic duration: 3.5s for success page, 2s elsewhere
    const duration = pathname?.includes("/reserve/success") ? 3500 : 2000;
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
      // Small delay for fade-out of loader
      setTimeout(() => setShowChildren(true), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <div className={`fixed inset-0 z-[100] transition-opacity duration-1000 ${isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Loader />
      </div>
      
      <div className={`transition-opacity duration-1000 ${showChildren ? "opacity-100" : "opacity-0"}`}>
        {children}
      </div>
    </>
  );
}
