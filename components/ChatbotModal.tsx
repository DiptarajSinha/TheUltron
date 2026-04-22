"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Ticket,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  Check,
  Sparkles,
  ChevronRight,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { sendTicket } from "@/app/actions/sendTicket";

// ─── Utility ────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "dd-MM-yyyy");
  } catch {
    return dateStr;
  }
};

// ─── Web Speech API Types ────────────────────────────────────────────────────
// The Web Speech API types aren't in TypeScript's default lib.
// We declare a minimal interface to satisfy the compiler.
interface SpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } }; isFinal: boolean; length: number }[] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Attraction {
  name: string;
  time: string;
}

interface BookingData {
  action: string;
  date: string;
  hours: number;
  location: string;
  locationId: string;
  attractions: Attraction[];
}

interface SelectionMetadata {
  type: "checkboxes" | "chips";
  options: string[];
  limit?: number;
  hours?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  type: "text" | "booking_card" | "booking_confirmed";
  booking?: BookingData;
  suggestions?: string[];
  selectionMetadata?: SelectionMetadata | null;
  ticketId?: string;
  timestamp: Date;
  isTyped?: boolean;
  isCancelled?: boolean;
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Local Knowledge Base ────────────────────────────────────────────────────
// All website content answers are served locally — no API calls needed.

interface KBEntry {
  keywords: string[];
  response: string;
  suggestions?: string[];
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "sup", "yo", "howdy", "hola", "greetings"],
    response: "Hey there! 👋 I'm **Friday**, your Ultron booking assistant. I can help you book a robot tour guide, check pricing, or answer questions about our service. What can I do for you?",
  },
  {
    keywords: ["how are you", "how do you do", "whats up", "what's up"],
    response: "I'm doing great, thanks for asking! 🤖 Ready to help you with anything related to The Ultron. What do you need?",
  },
  {
    keywords: ["thank", "thanks", "thank you", "thx", "ty"],
    response: "You're welcome! 😊 Let me know if there's anything else I can help with.",
  },
  {
    keywords: ["bye", "goodbye", "see you", "later", "cya"],
    response: "Goodbye! 👋 Have a great day! Come back anytime you need to book a robot tour.",
  },
  {
    keywords: ["price", "pricing", "cost", "how much", "rate", "charge", "fee", "expensive", "cheap", "afford", "money", "rupee", "inr", "₹"],
    response: "Here's our pricing:\n\n💰 **Hourly Rate**: ₹200/hour\n🔒 **Security Deposit**: ₹600 (fully refundable)\n\n**Examples:**\n• 1 hour tour = ₹200 + ₹600 deposit = **₹800 total**\n• 2 hours = ₹400 + ₹600 = **₹1,000 total**\n• 3 hours = ₹600 + ₹600 = **₹1,200 total**\n• 4 hours = ₹800 + ₹600 = **₹1,400 total**\n\nThe deposit is returned when the robot is brought back to any designated station on time.",
  },
  {
    keywords: ["how it works", "how does it work", "process", "steps", "how to use", "how to book", "how can i book", "how do i book", "booking process", "guide me", "help me book", "explain", "tell me how", "how to rent"],
    response: "Here's how The Ultron works:\n\n**Step 1: Download & Register** 📱\nGet the Ultron app, scan your ID, and connect your payment method securely.\n\n**Step 2: Choose Your Plan** ⏱️\nSelect how many hours you need (1-4 hours). The robot unlocks and pairs with your device instantly.\n\n**Step 3: Return on Time** 🏁\nGuide the robot back to any designated station before your time ends to recover your full deposit.\n\n**Rate:** ₹200/hour + ₹600 refundable deposit.\n\nWant me to help you book right now? Just say **\"Book a robot\"**!",
    suggestions: ["Book a Robot", "Pricing"],
  },
  {
    keywords: ["location", "locations", "where", "place", "places", "tourist", "spots", "destination", "destinations", "visit", "available", "book", "rent", "reservation", "reserve"],
    response: "We are currently available at two prime locations in Kolkata. Which one would you like to visit?\n\n📍 **Eco Park Newtown**\n📍 **Indian Museum, Kolkata**",
    suggestions: ["Eco Park Newtown", "Indian Museum Kolkata"],
  },
  {
    keywords: ["eco park", "ecopark", "newtown", "eco-park"],
    response: "🌿 **Eco Park Newtown** is a sprawling urban park with themed gardens and a large lake.\n\n**Available attractions** (15 min each):\n1. Japanese Garden 🎋\n2. Mist Garden 🌫️\n3. Seven Wonders of the World 🏛️\n4. Butterfly Park 🦋\n5. Deer Park 🦌\n6. Lake and Musical Fountain ⛲\n7. Bamboo Roof Garden 🎍\n8. Glass House 🏠\n\nWould you like to **book a robot tour** here?",
    suggestions: ["Book a Robot", "How It Works"],
  },
  {
    keywords: ["indian museum", "museum", "kolkata museum"],
    response: "🏛️ **Indian Museum, Kolkata** is the oldest and largest museum in India, featuring rare antiques and artifacts.\n\n**Available attractions** (15 min each):\n1. Egyptian Mummy 🏺\n2. Bharhut Gallery 🖼️\n3. Gandhara Gallery 🗿\n4. Mammal Gallery 🦁\n5. Bird and Fish Gallery 🐦\n6. Geology Gallery 💎\n7. Textile Gallery 🧵\n8. Coin Gallery 🪙\n\nWould you like to **book a tour** here?",
    suggestions: ["Book a Robot", "How It Works"],
  },
  {
    keywords: ["attraction", "attractions", "what can i see", "what to see", "things to do", "activities"],
    response: "Each location has **8 unique attractions**, and each takes about **15 minutes** to explore.\n\n🌿 **Eco Park**: Japanese Garden, Mist Garden, Seven Wonders, Butterfly Park, Deer Park, Musical Fountain, Bamboo Roof Garden, Glass House\n\n🏛️ **Indian Museum**: Egyptian Mummy, Bharhut Gallery, Gandhara Gallery, Mammal Gallery, Bird & Fish Gallery, Geology Gallery, Textile Gallery, Coin Gallery\n\nYou can choose which attractions to include in your roadmap during booking!",
  },
  {
    keywords: ["deposit", "refund", "refundable", "security", "return"],
    response: "💰 The **₹600 security deposit** is **fully refundable**!\n\nJust return the robot to any designated station before your booking time expires, and you'll get the full deposit back. Easy as that!",
  },
  {
    keywords: ["time", "duration", "hours", "how long", "minimum", "maximum"],
    response: "⏱️ **Tour Duration Options:**\n• Minimum: **1 hour**\n• Maximum: **4 hours**\n\nEach hour allows you to visit up to **4 attractions** (15 minutes each).\n\n**Tip**: For the full Eco Park or Museum experience, we recommend a 2-hour booking to cover all 8 attractions!",
  },
  {
    keywords: ["robot", "ultron", "what is", "about", "about ultron", "what does the robot do", "features", "technology", "autonomous"],
    response: "🤖 **The Ultron** is a fully autonomous robotic tour guide system.\n\n**Key Features:**\n• **Ultrasonic Vision** — Real-time obstacle detection with precision mapping\n• **Kinetic Resilience** — Silent, adaptive tracks for any terrain\n• **Deep Intelligence** — Context-aware modules that understand tourist commands\n• **360° Sensor Matrix** — Processing 200 arrays for safe navigation\n\nRent one instantly at any station. It pairs with your device and guides you through your selected attractions!",
  },
  {
    keywords: ["safe", "safety", "secure", "trust", "reliable"],
    response: "🛡️ The Ultron is designed with **safety-first** principles:\n\n• **Ultrasonic obstacle detection** for collision avoidance\n• **Autonomous navigation** through mapped routes\n• **Secure payment** with Stripe integration\n• **Refundable deposit** — no hidden charges\n• **Real-time tracking** through the companion app\n\nYou're in safe hands (or tracks 🤖)!",
  },
  {
    keywords: ["ticket", "tickets", "my ticket", "my tickets", "my booking", "my bookings", "reservation", "reservations", "see my tickets", "show my tickets", "check my tickets"],
    response: "📋 To view your tickets, click the **user icon** in the top navigation bar, or use the **\"See My Tickets\"** quick action below!\n\nYour tickets show:\n• Booking date and time\n• Location and attractions\n• QR code for check-in\n• Booking status (Active, Confirmed, or Expired)",
  },
  {
    keywords: ["payment", "pay", "stripe", "card", "checkout"],
    response: "💳 **Payment is secure and simple:**\n\n1. Complete your booking details\n2. Review the trip summary\n3. Click **\"Verify and Pay\"**\n4. Payment is processed securely via Stripe\n\n**Cost** = (Hours × ₹200) + ₹600 deposit\n\nThe deposit is refunded when you return the robot on time!",
  },
  {
    keywords: ["contact", "support", "help", "customer", "issue", "problem", "complaint"],
    response: "📞 For support, you can:\n\n• Chat with me right here — I'll do my best to help!\n• Email: support@theultron.com\n• Visit the **Privacy Policy** or **Terms of Service** links in the footer\n\nHow can I assist you today?",
  },
];

function findLocalAnswer(input: string): KBEntry | null {
  const normalized = input.toLowerCase().trim();

  // Score each KB entry by how many keywords match
  let bestMatch: { entry: KBEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        // Longer keyword matches get higher scores
        score += keyword.length;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  return bestMatch ? bestMatch.entry : null;
}

// Check if the user wants to initiate/continue a booking
function isBookingIntent(input: string): boolean {
  const bookingKeywords = [
    "book", "reserve", "booking", "reservation",
    "i want to book", "book a robot", "book a tour",
    "book for me", "help me book", "make a booking",
    "i want to reserve", "schedule", "plan a trip",
    "book a ticket", "get a ticket",
  ];
  const normalized = input.toLowerCase().trim();
  return bookingKeywords.some((kw) => normalized.includes(kw));
}

// ─── Typewriter Component ──────────────────────────────────────────────────
const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15); // FAST but letter-by-letter
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  // Simple markdown renderer for typing text
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/).map((part, j) => {
          if (!part) return null;
          if (part.startsWith("[") && part.includes("](")) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <Link key={j} href={match[2]} className="text-blue-500 hover:text-blue-400 font-bold underline decoration-blue-500/30">
                  {match[1]}
                </Link>
              );
            }
          }
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-white font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return <span>{renderMarkdown(displayedText)}</span>;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ChatbotModal = ({ isOpen, onClose }: ChatbotModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Hey! I'm **Friday**, your Ultron assistant. 🤖\n\nI can help you book a robot tour guide, check pricing, or answer questions about our service.\n\nTry the quick actions below or just type your question!",
      type: "text",
      timestamp: new Date(),
      isTyped: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [fsmState, setFsmState] = useState<"IDLE" | "AWAITING_DATE" | "AWAITING_LOCATION" | "AWAITING_HOURS" | "AWAITING_ATTRACTIONS" | "CONFIRMATION">("IDLE");
  const [fsmDraft, setFsmDraft] = useState<Partial<BookingData>>({});
  const isBookingMode = fsmState !== "IDLE";
  const [confirmingBooking, setConfirmingBooking] = useState<BookingData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [shouldAutoListen, setShouldAutoListen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Auto-scroll to bottom on new messages or on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Custom Human-like Voice Selection
  const getBestVoice = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Preferred voices in order
    const preferred = [
      "Google UK English Female",
      "Google US English",
      "Microsoft Aria Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "en-GB",
      "en-US"
    ];
    
    for (const name of preferred) {
      const v = voices.find(voice => voice.name.includes(name) || voice.lang === name);
      if (v) return v;
    }
    return voices.find(v => v.lang.startsWith("en")) || voices[0];
  }, []);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      // Strip markdown for cleaner speech
      const clean = text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/[•📍💰🤖🌿🏛️⏱️🔒📱🏁💳📋🛡️📞🎋🌫️🏠🦋🦌⛲🎍🏺🖼️🗿🦁🐦💎🧵🪙👋😊✅🎉]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      
      const bestVoice = getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled, getBestVoice]
  );

  const addBotMessage = useCallback(
    (
      content: string,
      type: ChatMessage["type"] = "text",
      booking?: BookingData,
      suggestions?: string[],
      selectionMetadata?: SelectionMetadata | null,
      ticketId?: string
    ) => {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: "bot",
        content,
        type,
        booking,
        suggestions,
        selectionMetadata,
        ticketId,
        timestamp: new Date(),
        isTyped: false,
      };
      setMessages((prev) => [...prev, msg]);
      setCurrentSuggestions(suggestions || []);
      if (type === "text" || type === "booking_confirmed") {
        setIsTyping(true);
      }
      if (type === "text" && content) {
        speakText(content);
      }
    },
    [speakText]
  );

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText && fsmState !== "AWAITING_ATTRACTIONS") return;

    if (messageText) {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          content: messageText,
          type: "text",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
    }

    setInput("");
    setCurrentSuggestions([]);
    setSelectedAttractions([]);



    const lowerText = messageText.toLowerCase();

    // Global Cancel - Must happen BEFORE IDLE check so "Cancel Booking" string doesn't get swept into a new booking via isBookingIntent
    if (lowerText === "cancel" || lowerText === "cancel booking") {
        setFsmState("IDLE");
        setFsmDraft({});
        setMessages((prev) => prev.map((m) => m.type === "booking_card" ? { ...m, isCancelled: true } : m));
        addBotMessage("Booking cancelled. Let me know if you need anything else!");
        return;
    }

    if (fsmState === "IDLE") {
        if (!isBookingIntent(messageText)) {
          const entry = findLocalAnswer(messageText);
          if (entry) {
            setIsLoading(true);
            await new Promise((r) => setTimeout(r, 500));
            setIsLoading(false);
            addBotMessage(entry.response, "text", undefined, entry.suggestions, null);
            return;
          }
          addBotMessage("I can help with questions about **The Ultron** — our pricing, locations, how the booking works, and more.\n\nOr if you want, I can help you **book a robot tour right now! Just say \"Book a robot\".**");
          return;
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              setFsmState("IDLE");
              setFsmDraft({});
              addBotMessage("Please  [Sign In](/auth) first!");
              return;
            }
            setFsmState("AWAITING_DATE");
            setFsmDraft({ action: "CREATE_BOOKING" });
            
            // Check if it's past 3 PM IST
            const now = new Date();
            const currentHour = now.getHours();
            const isPast3PM = currentHour >= 15;
            
            const dateSuggestions = isPast3PM 
              ? ["Tomorrow", "DATE_PICKER", "Cancel Booking"]
              : ["Today", "Tomorrow", "DATE_PICKER", "Cancel Booking"];

            addBotMessage("When would you like to plan your tour? You can pick a date below.", "text", undefined, dateSuggestions, null);
            return;
        }
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);

    const nextDraft = { ...fsmDraft };
    const getBaseSuggestions = () => ["Cancel Booking"];

    // Check if past 3 PM for date handling below
    const now = new Date();
    const isPast3PM = now.getHours() >= 15;

    switch (fsmState) {
      case "AWAITING_DATE": {
         let dateStr = "";
         const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

         const dayAfterTomorrowRegex = /day\s+after\s+(tomorrow|tmr|tmrw)/i;
         const tomorrowRegex = /\btomorrow\b|\btmr\b|\btmrw\b/i;
         const todayRegex = /\btoday\b/i;

         if (dayAfterTomorrowRegex.test(lowerText)) {
             const dat = new Date(); dat.setDate(dat.getDate()+2);
             dateStr = toLocalDateStr(dat);
         } else if (tomorrowRegex.test(lowerText)) {
             const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
             dateStr = toLocalDateStr(tmr);
         } else if (todayRegex.test(lowerText)) {
             if (isPast3PM) {
                 addBotMessage("Sorry, bookings for **Today** are closed (we close bookings daily at 3 PM). Would you like to book for **Tomorrow** instead?", "text", undefined, ["Tomorrow", "DATE_PICKER", ...getBaseSuggestions()]);
                 setIsLoading(false);
                 return;
             }
             dateStr = toLocalDateStr(new Date());
         } else if (messageText.match(/^\d{4}-\d{2}-\d{2}$/)) { 
             // If they picked today from date picker after 3PM
             const pickedDate = new Date(messageText);
             const today = new Date();
             today.setHours(0,0,0,0);
             if (pickedDate.getTime() === today.getTime() && isPast3PM) {
                 addBotMessage("Sorry, bookings for **Today** are already closed. Please select another date.", "text", undefined, ["Tomorrow", "DATE_PICKER", ...getBaseSuggestions()]);
                 return;
             }
             dateStr = messageText;
         } else {
             const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
             const cleaned = lowerText.replace(/(\d+)(st|nd|rd|th)/gi, '$1').trim();
             const hasMonth = months.some(m => cleaned.includes(m));
             if (hasMonth) {
                 const currentYear = new Date().getFullYear();
                 const parseStr = /\d{4}/.test(cleaned) ? cleaned : `${cleaned} ${currentYear}`;
                 const d = new Date(parseStr);
                 if (!isNaN(d.getTime())) {
                     // Check if they manually typed today's date after 3PM
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const checkD = new Date(d);
                     checkD.setHours(0,0,0,0);
                     if (checkD.getTime() === today.getTime() && isPast3PM) {
                         addBotMessage("Sorry, same-day bookings are closed after 3 PM. Please choose a future date.", "text", undefined, ["Tomorrow", "DATE_PICKER", ...getBaseSuggestions()]);
                         return;
                     }

                     // Ensure the date is in the future. If not, add 1 year.
                     if (d < today) {
                        d.setFullYear(d.getFullYear() + 1);
                     }
                     dateStr = toLocalDateStr(d);
                 }
             }

             if (!dateStr) {
                 const dateSugg = isPast3PM ? ["Tomorrow", "DATE_PICKER"] : ["Today", "Tomorrow", "DATE_PICKER"];
                 addBotMessage("I didn't quite catch that. Please select a valid date below.", "text", undefined, [...dateSugg, ...getBaseSuggestions()]);
                 return;
             }
         }
         nextDraft.date = dateStr;
         setFsmDraft(nextDraft);

         if (!nextDraft.location) {
             setFsmState("AWAITING_LOCATION");
             addBotMessage("Got it! And which location will you be visiting?", "text", undefined, ["Eco Park Newtown", "Indian Museum Kolkata", ...getBaseSuggestions()]);
         } else if (!nextDraft.hours) {
             setFsmState("AWAITING_HOURS");
             addBotMessage("Got it! How long would you like to rent the robot guide?", "text", undefined, ["1 hour", "2 hours", "3 hours", "4 hours", ...getBaseSuggestions()]);
         } else if (!nextDraft.attractions) {
             setFsmState("AWAITING_ATTRACTIONS");
             // Force selection array
             const ECO_OPTIONS = ["Japanese Garden", "Mist Garden", "Seven Wonders of the World", "Butterfly Park", "Deer Park", "Lake and Musical Fountain", "Bamboo Roof Garden", "Glass House"];
             const MUS_OPTIONS = ["Egyptian Mummy", "Bharhut Gallery", "Gandhara Gallery", "Mammal Gallery", "Bird and Fish Gallery", "Geology Gallery", "Textile Gallery", "Coin Gallery"];
             const options = nextDraft.location === "Eco Park Newtown" ? ECO_OPTIONS : MUS_OPTIONS;
             addBotMessage(`Perfect. Please select your attractions. You can visit up to ${nextDraft.hours*4} attractions in ${nextDraft.hours} hour(s).\n\nPlease tap the items on the screen to select your attractions.`, "text", undefined, [...getBaseSuggestions()], {
                 type: "checkboxes",
                 options: options,
                 limit: nextDraft.hours * 4,
                 hours: nextDraft.hours
             });
         } else {
             setFsmState("CONFIRMATION");
             const totalCost = (nextDraft.hours! * 200) + 600;
             addBotMessage(`Date updated! Here is your new summary:\n* Date: ${formatDate(nextDraft.date!)}\n* Location: ${nextDraft.location}\n* Duration: ${nextDraft.hours} hour(s)\n* Attractions: ${nextDraft.attractions.map((a: { name: string })=>a.name).join(", ")}\n\nThe cost will be ₹${nextDraft.hours! * 200} for ${nextDraft.hours} hour(s), plus a ₹600 refundable security deposit (Total: ₹${totalCost}).`, "text", undefined, ["Yes, Proceed", "Update Location", "Update Date", "Update Hours", "Cancel Booking"]);
         }
         break;
      }
      case "AWAITING_LOCATION": {
         if (lowerText.includes("eco park") || lowerText.includes("newtown")) nextDraft.location = "Eco Park Newtown";
         else if (lowerText.includes("museum") || lowerText.includes("indian museum")) nextDraft.location = "Indian Museum Kolkata";
         else {
             addBotMessage("I didn't quite catch that. Please select a valid location below.", "text", undefined, ["Eco Park Newtown", "Indian Museum Kolkata", ...getBaseSuggestions()]);
             return;
         }
         if (nextDraft.location !== fsmDraft.location) {
             nextDraft.attractions = undefined;
         }
         nextDraft.locationId = nextDraft.location === "Eco Park Newtown" ? "eco-park" : "indian-museum";
         setFsmDraft(nextDraft);

         if (!nextDraft.date) {
             setFsmState("AWAITING_DATE");
             addBotMessage("Great! What date are you planning to visit?", "text", undefined, ["Today", "Tomorrow", "DATE_PICKER", ...getBaseSuggestions()]);
         } else if (!nextDraft.hours) {
             setFsmState("AWAITING_HOURS");
             addBotMessage("Awesome choice! How long would you like to rent the robot guide? (Each hour lets you visit up to 4 attractions).", "text", undefined, ["1 hour", "2 hours", "3 hours", "4 hours", ...getBaseSuggestions()]);
         } else if (!nextDraft.attractions) {
             setFsmState("AWAITING_ATTRACTIONS");
             const ECO_OPTIONS = ["Japanese Garden", "Mist Garden", "Seven Wonders of the World", "Butterfly Park", "Deer Park", "Lake and Musical Fountain", "Bamboo Roof Garden", "Glass House"];
             const MUS_OPTIONS = ["Egyptian Mummy", "Bharhut Gallery", "Gandhara Gallery", "Mammal Gallery", "Bird and Fish Gallery", "Geology Gallery", "Textile Gallery", "Coin Gallery"];
             const options = nextDraft.location === "Eco Park Newtown" ? ECO_OPTIONS : MUS_OPTIONS;
             addBotMessage(`Location updated!\n\nSince the location changed, please select your attractions. You can visit up to ${nextDraft.hours*4} attractions in ${nextDraft.hours} hour(s).\n\nPlease tap the items on the screen to select your attractions.`, "text", undefined, [...getBaseSuggestions()], {
                 type: "checkboxes",
                 options: options,
                 limit: nextDraft.hours * 4,
                 hours: nextDraft.hours
             });
         } else {
             setFsmState("CONFIRMATION");
             const totalCost = (nextDraft.hours! * 200) + 600;
             addBotMessage(`Location updated! Here is your new summary:\n* Date: ${formatDate(nextDraft.date!)}\n* Location: ${nextDraft.location}\n* Duration: ${nextDraft.hours} hour(s)\n* Attractions: ${nextDraft.attractions.map((a: { name: string })=>a.name).join(", ")}\n\nThe cost will be ₹${nextDraft.hours! * 200} for ${nextDraft.hours} hour(s), plus a ₹600 refundable security deposit (Total: ₹${totalCost}).`, "text", undefined, ["Yes, Proceed", "Update Location", "Update Date", "Update Hours", "Cancel Booking"]);
         }
         break;
      }
      case "AWAITING_HOURS": {
         let hrs = 0;
         if (lowerText.includes("1") || lowerText.includes("one")) hrs = 1;
         else if (lowerText.includes("2") || lowerText.includes("two")) hrs = 2;
         else if (lowerText.includes("3") || lowerText.includes("three")) hrs = 3;
         else if (lowerText.includes("4") || lowerText.includes("four")) hrs = 4;
         else {
             addBotMessage("Please select a valid duration between 1 to 4 hours.", "text", undefined, ["1 hour", "2 hours", "3 hours", "4 hours", ...getBaseSuggestions()]);
             return;
         }
         if (hrs !== fsmDraft.hours) {
             nextDraft.attractions = undefined;
         }
         nextDraft.hours = hrs;
         setFsmDraft(nextDraft);
         setFsmState("AWAITING_ATTRACTIONS");
         
         const ECO_OPTIONS = ["Japanese Garden", "Mist Garden", "Seven Wonders of the World", "Butterfly Park", "Deer Park", "Lake and Musical Fountain", "Bamboo Roof Garden", "Glass House"];
         const MUS_OPTIONS = ["Egyptian Mummy", "Bharhut Gallery", "Gandhara Gallery", "Mammal Gallery", "Bird and Fish Gallery", "Geology Gallery", "Textile Gallery", "Coin Gallery"];
         const options = nextDraft.location === "Eco Park Newtown" ? ECO_OPTIONS : MUS_OPTIONS;

         addBotMessage(`Hours updated!\n\nFor ${nextDraft.location}, you can choose which attractions you'd like to see. Each attraction takes about 15 minutes, and you can visit a maximum of ${hrs*4} attractions in ${hrs} hour(s).\n\nPlease tap the items on the screen to select your attractions.`, "text", undefined, [...getBaseSuggestions()], {
             type: "checkboxes",
             options: options,
             limit: hrs * 4,
             hours: hrs
         });
         break;
      }
      case "AWAITING_ATTRACTIONS": {
         if (!messageText) return;
         const arr = messageText.split(',').map(s=>s.trim()).filter(Boolean);
         if (arr.length === 0) {
             addBotMessage("Please select at least one attraction by tapping from the list above.", "text", undefined, [...getBaseSuggestions()]);
             return; 
         }
         nextDraft.attractions = arr.map(a => ({ name: a, time: "15 mins" }));
         setFsmDraft(nextDraft);
         setFsmState("CONFIRMATION");
         
         const totalCost = (nextDraft.hours! * 200) + 600;
         addBotMessage(`Here is a summary of your tour:\n* Date: ${formatDate(nextDraft.date!)}\n* Location: ${nextDraft.location}\n* Duration: ${nextDraft.hours} hour(s)\n* Attractions: ${arr.join(", ")}\n\nThe cost will be ₹${nextDraft.hours! * 200} for ${nextDraft.hours} hour(s), plus a ₹600 refundable security deposit (Total: ₹${totalCost}).`, "text", undefined, ["Yes, Proceed", "Update Location", "Update Date", "Update Hours", "Cancel Booking"]);
         break;
      }
      case "CONFIRMATION": {
         if (lowerText.includes("yes") || lowerText.includes("proceed") || lowerText.includes("confirm")) {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) {
                 addBotMessage("Please [Sign In](/auth) first.");
                 setFsmState("IDLE");
                 return;
             }
             const totalCost = (nextDraft.hours! * 200) + 600;
             const { data: ticket, error } = await supabase.from("tickets")
                 .insert({
                     user_id: user.id,
                     date: nextDraft.date,
                     hours: nextDraft.hours,
                     location: nextDraft.location,
                     total_cost: totalCost,
                     attractions: nextDraft.attractions,
                     status: "pending"
                 }).select().single();
             if (error) {
                 addBotMessage("Sorry, there was an issue creating your booking draft. Please try again.");
             } else {
                 addBotMessage("", "booking_card", nextDraft as BookingData, ["Cancel Booking"], null, ticket.id);
             }
             setFsmState("IDLE");
             setFsmDraft({});
         } else if (lowerText.includes("update location")) {
              setFsmState("AWAITING_LOCATION");
              const opts = ["Eco Park Newtown", "Indian Museum Kolkata"];
              const filteredLocs = nextDraft.location ? opts.filter(l => l !== nextDraft.location) : opts;
              addBotMessage("Which location will you be visiting instead?", "text", undefined, [...filteredLocs, ...getBaseSuggestions()]);
         } else if (lowerText.includes("update date")) {
             setFsmState("AWAITING_DATE");
             addBotMessage("When would you like to plan your tour? You can pick a date below.", "text", undefined, ["Today", "Tomorrow", "DATE_PICKER", ...getBaseSuggestions()]);
         } else if (lowerText.includes("update hours")) {
             setFsmState("AWAITING_HOURS");
             addBotMessage("How long would you like to rent the robot guide?", "text", undefined, ["1 hour", "2 hours", "3 hours", "4 hours", ...getBaseSuggestions()]);
         } else {
             addBotMessage("Please tap 'Yes, Proceed' to finalize or update a field.", "text", undefined, ["Yes, Proceed", "Update Location", "Update Date", "Update Hours", "Cancel Booking"]);
         }
         break;
      }
    }
  };

  const handleConfirmBooking = async (ticketId: string, booking: BookingData) => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "active" })
        .eq("id", ticketId);

      if (error) throw error;

      // Trigger automated delivery via server action
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const shortId = ticketId.substring(0, 4).toUpperCase();
      const displayId = `ULT-${shortId}`;

      if (user && booking) {
        try {
          const hoursNum = Number(booking.hours);
          const totalCost = (hoursNum * 200) + 600;
          await sendTicket({
            id: displayId,
            date: booking.date,
            hours: hoursNum,
            location: booking.location,
            total_cost: totalCost,
            email: user.email || "",
            customerName: user.user_metadata?.name || user.email?.split("@")[0] || "Explorer",
            token: session?.access_token || ""
          });
        } catch (deliveryError) {
          console.error("Chatbot Delivery Error:", deliveryError);
        }
      }

      // Update the booking card message to mark it as confirmed
      setMessages((prev) =>
        prev.map((m) =>
          m.ticketId === ticketId && m.type === "booking_card" && m.booking
            ? { ...m, booking: { ...m.booking, action: "CONFIRMED" } }
            : m
        )
      );

      setConfirmingBooking(null);

      // Check if we already added a confirmation message for this ticket
      if (messages.some(m => m.type === "booking_confirmed" && m.content.includes(booking.location) && m.content.includes(booking.date))) {
        return;
      }

      const confirmedMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "bot",
        content: `Booking confirmed! 🎉\n\n**Ticket ID: ${displayId}**\n**${booking.location}**\n📅 ${formatDate(booking.date)} • ⏱️ ${booking.hours}h\n💰 ₹${booking.hours * 200 + 600}\n\nYour ticket is now active. You can view it anytime from **My Tickets** in the navigation bar. Have an amazing tour!`,
        type: "booking_confirmed",
        timestamp: new Date(),
        isTyped: false,
      };
      setMessages((prev) => [...prev, confirmedMsg]);
      setCurrentSuggestions([]);
      setIsListening(false);
      recognitionRef.current?.stop();
      speakText("Booking confirmed! Your ticket is now active. Have an amazing tour!");
    } catch (error) {
      console.error("Confirm error:", error);
      addBotMessage("Failed to confirm the booking. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Voice Input ──
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      addBotMessage("Sorry, voice input isn't supported in your browser. Please try Chrome or Edge.");
      return;
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((result: any) => result[0].transcript)
        .join("");

      setInput(transcript);

      // If final result, send it
      if (event.results[event.results.length - 1].isFinal) {
        setTimeout(() => {
          handleSend(transcript);
          setIsListening(false);
        }, 300);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  useEffect(() => {
    if (shouldAutoListen) {
      setShouldAutoListen(false);
      const voiceDisabled = fsmState === "AWAITING_ATTRACTIONS" || messages.some((m) => m.type === "booking_card" && !m.isCancelled && m.booking?.action !== "CONFIRMED");
      if (!voiceDisabled && !isListening) {
        toggleListening();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoListen]);

  const isVoiceDisabled = fsmState === "AWAITING_ATTRACTIONS" || messages.some((m) => m.type === "booking_card" && !m.isCancelled && m.booking?.action !== "CONFIRMED");

  // ── Quick Actions ──
  const quickActions = [
    { label: "See My Tickets", icon: <Ticket size={14} />, action: "How do I see my tickets?" },
    { label: "Book a Robot", icon: <Sparkles size={14} />, action: "I want to book a robot tour" },
    { label: "How It Works", icon: <ArrowRight size={14} />, action: "How does The Ultron work?" },
    { label: "Pricing", icon: <CreditCard size={14} />, action: "What are the prices?" },
  ];

  const renderAttractionSelector = (msg: ChatMessage) => {
    if (!msg.selectionMetadata || msg.selectionMetadata.type !== "checkboxes") return null;
    const { options, limit, hours } = msg.selectionMetadata;
    const max = limit || 4;
    const isLatest = messages[messages.length - 1].id === msg.id;

    const handleToggle = (opt: string) => {
      if (!isLatest) return;
      setSelectedAttractions((prev) =>
        prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
      );
    };

    return (
      <div className="mt-4 space-y-4 bg-white/[0.04] border border-white/5 rounded-2xl p-4">
        {/* User requested limit message */}
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Selection for {max} attractions only for {hours || 1} hour(s)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              disabled={!isLatest || (!selectedAttractions.includes(opt) && selectedAttractions.length >= max)}
              onClick={() => handleToggle(opt)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                selectedAttractions.includes(opt)
                  ? "bg-accent/20 border-accent text-white"
                  : "bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.05]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  selectedAttractions.includes(opt) ? "bg-accent border-accent" : "border-gray-600"
                }`}
              >
                {selectedAttractions.includes(opt) && <Check size={10} className="text-white" />}
              </div>
              <span className="text-xs font-medium">{opt}</span>
            </button>
          ))}
        </div>

        {isLatest && (
          <button
            onClick={() => handleSend(selectedAttractions.join(", "))}
            disabled={selectedAttractions.length === 0}
            className="w-full py-3 bg-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          >
            Confirm Selection ({selectedAttractions.length})
          </button>
        )}
      </div>
    );
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown: bold, newlines, and links
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/).map((part, j) => {
          if (!part) return null;
          if (part.startsWith("[") && part.includes("](")) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <Link key={j} href={match[2]} className="text-blue-500 hover:text-blue-400 font-bold underline decoration-blue-500/30">
                  {match[1]}
                </Link>
              );
            }
          }
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-white font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  const renderBookingCard = (msg: ChatMessage) => {
    if (!msg.booking) return null;
    const { booking, ticketId } = msg;
    const totalCost = booking.hours * 200 + 600;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border border-accent/30 rounded-2xl p-5 max-w-[300px] space-y-4"
      >
        <div className="flex items-center gap-2 text-accent">
          <Ticket size={18} />
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            Trip Summary
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <MapPin size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Location
              </p>
              <p className="text-sm font-bold text-white">{booking.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Date
              </p>
              <p className="text-sm font-bold text-white">{formatDate(booking.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Duration
              </p>
              <p className="text-sm font-bold text-white">
                {booking.hours} hour{booking.hours > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">
            Attractions ({booking.attractions.length})
          </p>
          <div className="space-y-1">
            {booking.attractions.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-300">{a.name}</span>
                <span className="text-gray-500 text-[10px]">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Total
            </p>
            <p className="text-xl font-black text-accent">₹{totalCost}</p>
          </div>
          <button
            onClick={() => setConfirmingBooking(booking)}
            disabled={booking.action === "CONFIRMED" || msg.isCancelled || !ticketId || isConfirming}
            className={`${msg.isCancelled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-accent text-white hover:bg-blue-500 shadow-accent/20'} px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale`}
            data-ticket-id={ticketId}
          >
            {msg.isCancelled ? "Cancelled" : booking.action === "CONFIRMED" ? "Payment Done" : "Verify & Pay"}
            {!msg.isCancelled && <ChevronRight size={14} />}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] md:bg-black/40"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0a0a0a] z-[90] flex flex-col border-l border-white/5 shadow-2xl shadow-black/50"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Bot size={16} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white">
                    Friday
                  </h3>
                  <p className="text-[9px] text-gray-500 font-medium">
                    {isBookingMode ? "Booking Agent" : "Ultron Assistant"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setTtsEnabled(!ttsEnabled);
                    if (ttsEnabled) window.speechSynthesis?.cancel();
                  }}
                  className={`p-1.5 rounded-lg transition-all ${ttsEnabled ? "bg-accent/20 text-accent" : "text-gray-500 hover:bg-white/5"}`}
                  title={ttsEnabled ? "Mute voice" : "Enable voice output"}
                >
                  {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                      msg.role === "user"
                        ? "bg-white/10"
                        : msg.type === "booking_confirmed"
                          ? "bg-green-500/20"
                          : "bg-accent/20"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User size={13} className="text-gray-400" />
                    ) : msg.type === "booking_confirmed" ? (
                      <CheckCircle2 size={13} className="text-green-400" />
                    ) : (
                      <Bot size={13} className="text-accent" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  {msg.type === "booking_card" ? (
                    renderBookingCard(msg)
                  ) : (
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-accent/10 border border-accent/20 text-white rounded-tr-md"
                          : msg.type === "booking_confirmed"
                            ? "bg-green-500/10 border border-green-500/20 text-gray-200 rounded-tl-md"
                            : "bg-white/[0.04] border border-white/5 text-gray-200 rounded-tl-md"
                      }`}
                    >
                      {msg.role === "bot" && msg.id === messages[messages.length - 1].id && !msg.isTyped ? (
                        <TypewriterText 
                          text={msg.content} 
                          onComplete={() => {
                            setIsTyping(false);
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyped: true } : m));
                            setTimeout(() => {
                               inputRef.current?.focus();
                               setShouldAutoListen(true);
                            }, 100);
                          }} 
                        />
                      ) : (
                        renderMarkdown(msg.content)
                      )}
                      
                      {msg.role === "bot" && msg.selectionMetadata && renderAttractionSelector(msg)}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-accent" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1.5">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Contextual Suggestions ── */}
            <AnimatePresence>
              {currentSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="px-4 py-3 border-t border-white/5 bg-accent/5 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-1.5 px-1">
                    <Sparkles size={10} className="text-accent" />
                    <span className="text-[9px] uppercase tracking-widest font-black text-accent/70">
                      Suggestions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {currentSuggestions.map((suggestion) => {
                      if (suggestion === "DATE_PICKER") {
                        return (
                          <input 
                            key="dp"
                            type="date"
                            onChange={(e) => handleSend(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="shrink-0 w-auto px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl text-xs font-bold transition-all shadow-lg hover:bg-accent/20 outline-none"
                            style={{ colorScheme: 'dark' }}
                          />
                        );
                      }
                      const isCancel = suggestion === 'Cancel Booking';
                      return (
                        <button
                          key={suggestion}
                          onClick={() => handleSend(suggestion)}
                          disabled={isLoading || isTyping}
                          className={`text-center px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale ${
                            isCancel 
                              ? 'w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 mt-1' 
                              : 'w-auto bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 hover:text-white'
                          }`}
                        >
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* ── Quick Actions ── */}
            <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto custom-scrollbar">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleSend(qa.action)}
                  disabled={isLoading || isTyping}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-full text-[11px] text-gray-400 hover:text-white font-medium transition-all disabled:opacity-30 whitespace-nowrap"
                >
                  {qa.icon}
                  {qa.label}
                </button>
              ))}
            </div>

            {/* ── Input Area ── */}
            <div className="px-4 py-3 border-t border-white/5 bg-[#0a0a0a] flex flex-col items-center">
                <button
                  onClick={toggleListening}
                  disabled={isLoading || isTyping || isVoiceDisabled}
                  className={`relative p-3.5 rounded-full transition-all shadow-2xl active:scale-90 ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                      : "bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.1] border border-white/10"
                  } disabled:opacity-20`}
                  title={isVoiceDisabled ? "Voice disabled for this step" : (isListening ? "Stop listening" : "Voice input")}
                >
                  {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                  {isListening && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                  )}
                </button>
                <div className="mt-2 text-center h-auto">
                   <p className="text-[10px] font-medium text-gray-400">{isListening ? "Listening..." : "Tap to speak"}</p>
                   {isBookingMode && (
                     <p className="text-[9px] text-accent mt-1 font-medium flex items-center justify-center gap-1">
                       <Sparkles size={8} /> Powered by Friday Booking Agent
                     </p>
                   )}
                </div>
            </div>
          </motion.div>

          {/* ── Confirm Booking Overlay ── */}
          <AnimatePresence>
            {confirmingBooking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6"
                >
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                      <CreditCard size={24} className="text-accent" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-[0.15em] text-white">
                      Verify & Pay
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Review your trip details below
                    </p>
                  </div>

                  <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                        Location
                      </span>
                      <span className="text-sm text-white font-bold">
                        {confirmingBooking.location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                        Date
                      </span>
                      <span className="text-sm text-white font-bold">
                        {formatDate(confirmingBooking.date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                        Duration
                      </span>
                      <span className="text-sm text-white font-bold">
                        {confirmingBooking.hours}h
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-2">
                        Attractions
                      </span>
                      {confirmingBooking.attractions.map((a, i) => (
                        <div
                          key={i}
                          className="flex justify-between py-1 text-xs"
                        >
                          <span className="text-gray-400">{a.name}</span>
                          <span className="text-gray-600">{a.time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                        Total
                      </span>
                      <span className="text-2xl font-black text-accent">
                        ₹{confirmingBooking.hours * 200 + 600}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmingBooking(null)}
                      className="flex-1 py-3.5 rounded-xl border border-white/10 text-gray-400 text-xs font-black uppercase tracking-wider hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Find the ticket ID from the booking card message
                        const bookingMsg = messages.find(
                          (m) =>
                            m.type === "booking_card" &&
                            m.booking?.date === confirmingBooking.date &&
                            m.booking?.location === confirmingBooking.location
                        );
                        if (bookingMsg?.ticketId) {
                          handleConfirmBooking(bookingMsg.ticketId, confirmingBooking);
                        }
                      }}
                      disabled={isConfirming}
                      className="flex-1 py-3.5 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isConfirming ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Confirm Payment
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
