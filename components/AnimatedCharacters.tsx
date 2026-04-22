"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  isClosed?: boolean;
  forceLookX?: number;
  forceLookY?: number;
  mouseX: number;
  mouseY: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  isClosed = false,
  forceLookX,
  forceLookY,
  mouseX,
  mouseY
}: EyeBallProps) => {
  const eyeRef = useRef<HTMLDivElement>(null);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();
  const shouldHidePupil = isBlinking || isClosed;
  // If closed, the eye shouldn't track the mouse for the lid line
  const effectivePosition = shouldHidePupil ? { x: 0, y: 0 } : pupilPosition;

  return (
    <div
      ref={eyeRef}
      className={cn(
        "rounded-full flex items-center justify-center relative overflow-hidden transition-colors duration-500",
        isClosed && "bg-black/20"
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: eyeColor,
      }}
    >
      {/* Eyelid overlay for smooth closure */}
      <div 
        className="absolute inset-0 bg-black/20 z-20 transition-transform duration-800 ease-in-out"
        style={{
          transform: (isBlinking || isClosed) ? 'translateY(0)' : 'translateY(-100%)',
          backgroundColor: isClosed ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'
        }}
      />

      {/* Closed eye line */}
      <div 
        className="absolute w-full h-[2px] bg-black/30 z-30 transition-opacity duration-800"
        style={{
          opacity: (isBlinking || isClosed) ? 1 : 0,
        }}
      />

      {!shouldHidePupil && (
        <div
          className="rounded-full relative z-10"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${effectivePosition.x}px, ${effectivePosition.y}px)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
          }}
        />
      )}
    </div>
  );
};

interface PupilOnlyProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
  mouseX: number;
  mouseY: number;
  isClosed?: boolean;
}

const PupilOnly = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
  mouseX,
  mouseY,
  isClosed = false
}: PupilOnlyProps) => {
  const pupilRef = useRef<HTMLDivElement>(null);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();
  const effectivePosition = isClosed ? { x: 0, y: 0 } : pupilPosition;

  return (
    <div
      ref={pupilRef}
      className="relative flex items-center justify-center"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(${effectivePosition.x}px, ${effectivePosition.y}px)`,
        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
      }}
    >
      <div 
        className="rounded-full transition-all duration-800 ease-in-out"
        style={{
          width: isClosed ? '100%' : `${size}px`,
          height: isClosed ? '2px' : `${size}px`,
          backgroundColor: isClosed ? 'rgba(0,0,0,0.4)' : pupilColor,
          borderRadius: isClosed ? '0' : '9999px',
        }}
      />
    </div>
  );
};

interface AnimatedCharactersProps {
  isTyping: boolean;
  isTypingPassword: boolean;
  showPassword?: boolean;
  side: "left" | "right";
}

export const AnimatedCharacters = ({ isTyping, isTypingPassword, showPassword = false, side }: AnimatedCharactersProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking effects
  useEffect(() => {
    const blink = (setter: (val: boolean) => void) => {
      setter(true);
      setTimeout(() => setter(false), 150);
    };

    const intervalP = setInterval(() => blink(setIsPurpleBlinking), Math.random() * 4000 + 3000);
    const intervalB = setInterval(() => blink(setIsBlackBlinking), Math.random() * 4000 + 4000);

    return () => {
      clearInterval(intervalP);
      clearInterval(intervalB);
    };
  }, []);

  // Interactive behaviors
  useEffect(() => {
    if (isTyping && !isTypingPassword) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isTyping, isTypingPassword]);

  // Peeking logic
  useEffect(() => {
    if (isTypingPassword && showPassword) {
      const interval = setInterval(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isTypingPassword, showPassword]);

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
    };
  };

  const purplePos = calcPos(purpleRef);
  const blackPos = calcPos(blackRef);
  const yellowPos = calcPos(yellowRef);
  const orangePos = calcPos(orangeRef);

  const isPasswordHidden = isTypingPassword && !showPassword;
  const lookAwayX = side === "right" ? 10 : -10;
  const lookAwayY = -5;

  return (
    <div className="relative w-full h-full max-w-[550px] aspect-[1.3] mx-auto scale-75 md:scale-100 flex items-end justify-center perspective-1000">
      {/* Background characters (Purple) */}
      <div 
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl"
        style={{
          left: '12%',
          width: '32%',
          height: isTyping ? '110%' : '100%',
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: isTyping && !showPassword && isTypingPassword
            ? `skewX(${(purplePos.bodySkew || 0) + (side === "left" ? 12 : -12)}deg) translateX(${side === "left" ? -40 : 40}px)` 
            : `skewX(${purplePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="absolute flex gap-4 md:gap-8 transition-all duration-700" style={{
          left: isPasswordHidden ? (side === "left" ? '15%' : '45%') : isLookingAtEachOther ? (side === "left" ? '45%' : '15%') : `${25 + purplePos.faceX}%`,
          top: isPasswordHidden ? '8%' : isLookingAtEachOther ? '16%' : `${10 + purplePos.faceY}%`,
        }}>
          <EyeBall size={20} pupilSize={8} mouseX={mouseX} mouseY={mouseY} isBlinking={isPurpleBlinking} forceLookX={isPurplePeeking ? 4 : isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
          <EyeBall size={20} pupilSize={8} mouseX={mouseX} mouseY={mouseY} isBlinking={isPurpleBlinking} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
        </div>
      </div>

      {/* Black character */}
      <div 
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl"
        style={{
          left: '43%',
          width: '22%',
          height: '78%',
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: isLookingAtEachOther
            ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + (side === "left" ? -10 : 10)}deg) translateX(${side === "left" ? -20 : 20}px)`
            : isTyping && isTypingPassword
              ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
              : `skewX(${blackPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="absolute flex gap-3 md:gap-6 transition-all duration-700" style={{
          left: isPasswordHidden ? (side === "left" ? '12%' : '40%') : isLookingAtEachOther ? (side === "left" ? '40%' : '15%') : `${22 + blackPos.faceX}%`,
          top: isPasswordHidden ? '2%' : isLookingAtEachOther ? '4%' : `${10 + blackPos.faceY}%`,
        }}>
          <EyeBall size={18} pupilSize={7} mouseX={mouseX} mouseY={mouseY} isBlinking={isBlackBlinking} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
          <EyeBall size={18} pupilSize={7} mouseX={mouseX} mouseY={mouseY} isBlinking={isBlackBlinking} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
        </div>
      </div>

      {/* Orange character */}
      <div 
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl"
        style={{
          left: '0',
          width: '43%',
          height: '50%',
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          zIndex: 3,
          transform: `skewX(${orangePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="absolute flex gap-4 md:gap-8 transition-all duration-200" style={{
          left: isPasswordHidden ? `${34 + (side === "left" ? -10 : 10)}%` : `${34 + (orangePos.faceX || 0)}%`,
          top: isPasswordHidden ? '40%' : `${45 + (orangePos.faceY || 0)}%`,
        }}>
          <PupilOnly mouseX={mouseX} mouseY={mouseY} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
          <PupilOnly mouseX={mouseX} mouseY={mouseY} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
        </div>
      </div>

      {/* Yellow character */}
      <div 
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl"
        style={{
          left: '56%',
          width: '25%',
          height: '58%',
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: `skewX(${yellowPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="absolute flex gap-3 md:gap-6 transition-all duration-200" style={{
          left: isPasswordHidden ? `${37 + (side === "left" ? -10 : 10)}%` : `${37 + (yellowPos.faceX || 0)}%`,
          top: isPasswordHidden ? '12%' : `${17 + (yellowPos.faceY || 0)}%`,
        }}>
          <PupilOnly mouseX={mouseX} mouseY={mouseY} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
          <PupilOnly mouseX={mouseX} mouseY={mouseY} forceLookX={isPasswordHidden ? lookAwayX : undefined} forceLookY={isPasswordHidden ? lookAwayY : undefined} />
        </div>
        <div className="absolute w-[57%] h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200" style={{
          left: `${28 + (yellowPos.faceX || 0)}%`,
          top: `${38 + (yellowPos.faceY || 0)}%`,
        }} />
      </div>
    </div>
  );
};
