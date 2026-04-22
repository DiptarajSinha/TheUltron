"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  CreditCard,
  AlertCircle,
  Navigation
} from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { supabase } from "@/lib/supabase";
import UniqueLoading from "@/components/ui/morph-loading";

// Mock Data
const TOURIST_SPOTS = [
  {
    id: "eco-park",
    name: "Eco Park Newtown",
    description: "A sprawling urban park with themed gardens and a large lake.",
    attractions: [
      { id: "e1", name: "Japanese Garden" },
      { id: "e2", name: "Mist Garden" },
      { id: "e3", name: "Seven Wonders of the World" },
      { id: "e4", name: "Butterfly Park" },
      { id: "e5", name: "Deer Park" },
      { id: "e6", name: "Lake and Musical Fountain" },
      { id: "e7", name: "Bamboo Roof Garden" },
      { id: "e8", name: "Glass House" },
    ]
  },
  {
    id: "indian-museum",
    name: "Indian Museum, Kolkata",
    description: "The oldest and largest museum in India, featuring rare antiques.",
    attractions: [
      { id: "m1", name: "Egyptian Mummy" },
      { id: "m2", name: "Bharhut Gallery" },
      { id: "m3", name: "Gandhara Gallery" },
      { id: "m4", name: "Mammal Gallery" },
      { id: "m5", name: "Bird and Fish Gallery" },
      { id: "m6", name: "Geology Gallery" },
      { id: "m7", name: "Textile Gallery" },
      { id: "m8", name: "Coin Gallery" },
    ]
  }
];

function ReserveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHours = Number(searchParams.get("hours") || 1);

  const [step, setStep] = useState(1);
  
  // 3 PM IST Logic
  const getInitialDate = () => {
    const now = new Date();
    const istDate = toZonedTime(now, "Asia/Kolkata");
    const isPast3PM = istDate.getHours() >= 15;
    
    const baseDate = new Date(istDate);
    if (isPast3PM) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    return format(baseDate, "yyyy-MM-dd");
  };

  const [date, setDate] = useState<string>(getInitialDate());
  const [hours, setHours] = useState(initialHours);
  const [selectedSpot, setSelectedSpot] = useState(TOURIST_SPOTS[0]);
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<{ name: string; time: string }[]>([]);
  const [isReserving, setIsReserving] = useState(false);

  // Custom Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Roadmap Logic: 15 mins per point
  useEffect(() => {
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Safety check: if the user somehow navigated back to root but this component is still mounted
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      router.replace("/");
    }
  }, [step, router]);

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    if (step === 1) {
      router.push("/#pricing");
      return;
    }
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Proximity-based Sorting (Logical Path)
  // Indices defined by the order in the TOURIST_SPOTS array
  const getSortedAttractions = (ids: string[], spot: typeof TOURIST_SPOTS[0]) => {
    return [...ids].sort((a, b) => {
      const indexA = spot.attractions.findIndex(attr => attr.id === a);
      const indexB = spot.attractions.findIndex(attr => attr.id === b);
      return indexA - indexB;
    });
  };

  // Roadmap Logic: 15 mins per point
  useEffect(() => {
    const sortedIds = getSortedAttractions(selectedAttractions, selectedSpot);
    const points = sortedIds.map((id, index) => {
      const attraction = selectedSpot.attractions.find(a => a.id === id);
      return {
        name: attraction?.name || "Point",
        time: `${(index + 1) * 15} mins`
      };
    });
    setRoadmap(points);
  }, [selectedAttractions, selectedSpot]);

  const totalPointsNeeded = hours * 4; 
  const pointsToRemove = roadmap.length - totalPointsNeeded;

  const handleToggleAttraction = (id: string) => {
    setSelectedAttractions(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Removed old nextStep/prevStep logic as it's now integrated with hashes above

  const handlePayment = async () => {
    setIsReserving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      // Save to Supabase
      const { data, error } = await supabase.from("tickets").insert({
        user_id: user.id,
        date,
        hours,
        location: selectedSpot.name,
        total_cost: (hours * 200) + 600,
        attractions: roadmap,
        status: 'active'
      }).select("id").maybeSingle();

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw new Error(error.message);
      }

      let insertedId = "ULT-" + Math.floor(1000 + Math.random() * 9000);
      if (data && data.id) {
         const shortId = data.id.toString().split('-')[0].toUpperCase();
         insertedId = "ULT-" + shortId;
      }

      sessionStorage.setItem("last_booking", JSON.stringify({
         id: insertedId,
         date,
         hours,
         location: selectedSpot.name,
         total_cost: (hours * 200) + 600,
         email: user.email || "guest@example.com"
      }));

      router.push("/reserve/success");
    } catch (err: unknown) {
      console.error("Reservation Flow Error:", err);
      const message = err instanceof Error ? err.message : "Unknown Error";
      alert(`Failed to save reservation: ${message}. Please check your connection and try again.`);
    } finally {
      setIsReserving(false);
    }
  };

  // Calendar Helpers
  const daysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 w-full" />);
    }

    // Calculate minimum date based on 3PM IST rule
    const now = new Date();
    const istDate = toZonedTime(now, "Asia/Kolkata");
    const isPast3PM = istDate.getHours() >= 15;
    const minDateObj = new Date(istDate);
    if (isPast3PM) minDateObj.setDate(minDateObj.getDate() + 1);
    const minDateStr = format(minDateObj, "yyyy-MM-dd");

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const isSelected = date === dateStr;
      const isPastDay = dateStr < minDateStr;

      days.push(
        <button
          key={d}
          onClick={() => !isPastDay && setDate(dateStr)}
          disabled={isPastDay}
          className={`h-12 w-full rounded-xl flex items-center justify-center text-sm transition-all ${
            isSelected 
              ? "bg-accent text-white shadow-[0_0_15px_rgba(74,144,226,0.4)] scale-110 z-10" 
              : isPastDay 
                ? "text-gray-700 cursor-not-allowed" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white overflow-y-auto relative font-sans flex flex-col py-0 md:py-4 px-0 md:px-6">
      <AnimatePresence>
        {isReserving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <UniqueLoading variant="morph" size="lg" />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-white font-black uppercase tracking-[0.3em] text-sm text-center"
            >
              Confirming Booking...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-start md:justify-center">
        <div className="glass rounded-none md:rounded-[2.5rem] p-5 md:p-10 border-0 md:border md:border-white/5 relative flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden min-h-screen md:min-h-0 md:max-h-[90vh]">
          <div className="flex items-center justify-between mb-6 md:mb-8 gap-4 border-b border-white/5 pb-4 md:pb-6">
            <div className="flex items-center gap-2 md:gap-4">
               <button 
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center gap-0 hover:gap-2 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none group overflow-hidden max-w-[40px] hover:max-w-[120px] px-2.5"
              >
                <ChevronLeft size={18} className="shrink-0" />
                <span className="font-black text-[9px] tracking-[0.2em] uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Back
                </span>
              </button>
              <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
              <h2 className="text-lg md:text-3xl font-playfair font-black tracking-tighter uppercase italic text-white/90 truncate max-w-[120px] sm:max-w-none">
                {step === 1 && "Trip Details"}
                {step === 2 && "Select Location"}
                {step === 3 && "Select Places"}
                {step === 4 && "Booking Pass"}
              </h2>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                    step >= i ? "bg-accent border-accent text-white shadow-[0_0_15px_rgba(74,144,226,0.3)]" : "border-white/10 text-white/30"
                  }`}>
                    {step > i ? <CheckCircle2 size={12} /> : <span className="text-[9px] sm:text-[11px] font-black">{i}</span>}
                  </div>
                  {i < 4 && <div className={`h-[1px] w-2 sm:w-6 mx-0.5 sm:mx-1 rounded-full ${step > i ? "bg-accent" : "bg-white/5"}`} />}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col min-h-0 overflow-y-auto md:overflow-hidden pb-6"
              >
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
                  {/* Custom Calendar UI */}
                  <div className="bg-surface/30 border border-white/5 rounded-3xl md:rounded-[2rem] p-5 sm:p-8 flex flex-col shadow-inner">
                    <div className="flex justify-between items-center mb-6 px-1">
                       <h3 className="font-black text-accent tracking-[0.3em] uppercase text-[10px] sm:text-xs">{format(currentMonth, "MMMM yyyy")}</h3>
                       <div className="flex gap-1">
                          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"><ChevronLeft size={16}/></button>
                          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"><ChevronRight size={16}/></button>
                       </div>
                    </div>
                    <div className="grid grid-cols-7 mb-4 text-center text-[9px] sm:text-xs text-gray-500 font-black uppercase tracking-tighter">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 sm:gap-8">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-gray-500">
                        <Clock size={16} className="text-accent" /> Tour Duration
                      </label>
                      <div className="flex items-center gap-4 sm:gap-6 bg-surface/50 border border-white/5 rounded-3xl p-5 sm:p-6">
                         <button 
                          onClick={() => setHours(Math.max(1, hours - 1))}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/5 hover:bg-accent hover:text-white transition-all flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg"
                         >
                           -
                         </button>
                         <div className="flex-1 text-center">
                            <span className="block font-black text-4xl sm:text-5xl leading-none">{hours}</span>
                            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] mt-1 block">Hours</span>
                         </div>
                         <button 
                           onClick={() => setHours(Math.min(4, hours + 1))}
                           className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/5 hover:bg-accent hover:text-white transition-all flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg"
                         >
                           +
                         </button>
                      </div>
                      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] sm:text-xs text-center text-gray-500 uppercase tracking-widest leading-relaxed">
                          Rate: <span className="text-white">₹200/hr</span> • Deposit: <span className="text-white">₹600</span>
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={nextStep}
                      className="w-full bg-accent text-white font-black py-5 sm:py-6 rounded-2xl glow-box hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl group uppercase tracking-[0.2em] text-xs sm:text-sm"
                    >
                      Continue to Site <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pb-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {TOURIST_SPOTS.map((spot) => (
                    <motion.div 
                      key={spot.id}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setSelectedSpot(spot);
                        setSelectedAttractions([]);
                        nextStep();
                      }}
                      className={`relative group cursor-pointer p-6 sm:p-10 rounded-3xl md:rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-2xl ${
                        selectedSpot.id === spot.id ? "bg-accent/10 border-accent" : "bg-surface/30 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="absolute -right-16 -top-16 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
                      
                      <div className="relative z-10 flex justify-between items-start mb-6 md:mb-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-accent/20 transition-all">
                          <MapPin size={24} className={selectedSpot.id === spot.id ? "text-accent" : "text-gray-400"} />
                        </div>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-xl md:text-3xl font-black mb-2 md:mb-3 tracking-tight">{spot.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed">{spot.description}</p>
                      </div>

                      <div className="relative z-10 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex justify-between items-center group-hover:text-accent transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Select Location</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Your Trip Stops</span>
                    <button 
                      onClick={() => {
                        if (selectedAttractions.length === selectedSpot.attractions.length) {
                          setSelectedAttractions([]);
                        } else {
                          setSelectedAttractions(selectedSpot.attractions.map(a => a.id));
                        }
                      }}
                      className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-all"
                    >
                      {selectedAttractions.length === selectedSpot.attractions.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Total Time</span>
                     <span className={`font-black text-xl sm:text-2xl tracking-tighter transition-colors ${pointsToRemove > 0 ? "text-red-400" : "text-accent"}`}>
                       {roadmap.length * 15} / {hours * 60}m
                     </span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-2 px-1 pb-6 custom-scrollbar">
                  {selectedSpot.attractions.map((attr) => (
                    <motion.div 
                      key={attr.id}
                      whileHover={{ y: -2 }}
                      onClick={() => handleToggleAttraction(attr.id)}
                      className={`p-5 sm:p-6 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between h-32 sm:h-36 border-white/5 ${
                        selectedAttractions.includes(attr.id) ? "bg-accent/10 border-accent" : "bg-white/[0.02] hover:border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all ${
                          selectedAttractions.includes(attr.id) ? "bg-accent border-accent text-white" : "border-white/10"
                        }`}>
                          {selectedAttractions.includes(attr.id) && <CheckCircle2 size={14} />}
                        </div>
                        <span className="text-[9px] sm:text-[11px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2.5 py-1.5 rounded-full">15m</span>
                      </div>
                      <span className="font-black text-xs sm:text-sm tracking-tight uppercase leading-snug">{attr.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/5">
                  {pointsToRemove > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-red-500/5 border border-red-500/10 p-5 sm:p-6 rounded-2xl">
                       <AlertCircle size={24} className="text-red-500 shrink-0" />
                       <div className="flex-1 text-center sm:text-left">
                          <p className="text-[10px] sm:text-xs font-black text-red-400 uppercase tracking-widest">Need More Time (+{Math.ceil(pointsToRemove/4)}h needed)</p>
                       </div>
                       <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                          <button onClick={() => setHours(prev => prev + 1)} className="flex-1 px-4 py-3 bg-red-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg">Add 1h</button>
                          <button onClick={() => setHours(prev => prev + 2)} className="flex-1 px-4 py-3 bg-red-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg">Add 2h</button>
                       </div>
                    </div>
                  ) : (
                    <button 
                      onClick={nextStep}
                      disabled={selectedAttractions.length === 0}
                      className="w-full bg-accent text-white font-black py-5 sm:py-6 rounded-2xl glow-box hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-20 uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-xl"
                    >
                      View Roadmap <Navigation size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 pb-10 custom-scrollbar relative pl-8 sm:pl-10 space-y-4 sm:space-y-6 before:absolute before:left-[14px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-[1px] sm:before:w-[2px] before:bg-accent/20">
                  {roadmap.map((point, idx) => (
                    <motion.div 
                      key={idx}
                      className="relative group"
                    >
                      <div className="absolute -left-[24px] sm:-left-[30px] top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black border sm:border-2 border-accent flex items-center justify-center text-[10px] sm:text-sm font-black z-10 group-hover:bg-accent group-hover:text-white transition-all shadow-[0_0_15px_rgba(74,144,226,0.3)]">
                        {idx + 1}
                      </div>
                      <div className="bg-surface/30 border border-white/5 p-4 sm:p-6 rounded-2xl flex-1 flex justify-between items-center group-hover:border-accent/30 transition-all shadow-xl">
                        <div className="space-y-1">
                          <span className="font-black text-sm sm:text-base tracking-tight uppercase leading-snug">{point.name}</span>
                          <span className="block text-[9px] sm:text-xs text-gray-500 uppercase font-black tracking-widest">ETA: {point.time} from hub</span>
                        </div>
                        <div className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[8px] sm:text-xs font-black text-accent uppercase tracking-widest shrink-0">Optimized</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 md:pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-12 bg-black md:bg-transparent -mx-5 md:mx-0 px-5 md:px-0 pb-6 md:pb-0 mt-auto">
                  <div className="flex justify-between w-full sm:w-auto items-center sm:flex-col sm:items-start">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Amount</span>
                    <span className="font-black text-3xl sm:text-4xl tracking-tighter text-accent">₹{(hours * 200) + 600}</span>
                  </div>
                  <button 
                    onClick={handlePayment}
                    disabled={isReserving}
                    className="w-full sm:flex-1 bg-accent text-white font-black py-5 sm:py-6 rounded-2xl shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] sm:text-sm"
                  >
                    {isReserving ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CreditCard size={20}/>
                        <span>Confirm Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}



export default function ReservePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ReserveContent />
    </Suspense>
  );
}
