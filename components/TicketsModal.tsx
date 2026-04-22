"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, Calendar, MapPin, Clock, ChevronRight, Activity, History, ArrowLeft, Download, QrCode, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, isPast, parseISO } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";

interface Attraction {
  name: string;
  time: string;
}

interface TicketData {
  id: string;
  date: string;
  hours: number;
  location: string;
  total_cost: number;
  status: string;
  attractions: Attraction[];
}

const locationData: Record<string, { address: string; query: string }> = {
  "Eco Park": {
    address: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161",
    query: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161"
  },
  "Eco Park Newtown": {
    address: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161",
    query: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161"
  },
  "Indian Museum": {
    address: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016",
    query: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016"
  },
  "Indian Museum, Kolkata": {
    address: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016",
    query: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016"
  }
};

export const TicketsModal = ({ isOpen, onClose, userId }: { isOpen: boolean; onClose: () => void; userId: string }) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filter, setFilter] = useState<"active" | "expired">("active");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const mapsLinkRef = useRef<HTMLAnchorElement>(null);

  const handleDownload = async () => {
    if (!ticketRef.current || !selectedTicket) return;
    setIsDownloading(true);

    try {
      const ticketContainer = ticketRef.current;
      const mapsLink = mapsLinkRef.current;
      
      // Force QR visibility for printing
      ticketContainer.classList.add('is-printing');
      
      const dataUrl = await toJpeg(ticketContainer, { 
        quality: 0.8,
        pixelRatio: 2, // Balanced resolution
        backgroundColor: '#050505',
      });
      
      // CAPTURE COORDINATES WHILE PRINT LAYOUT IS STILL ACTIVE
      let printTimeCoords = null;
      if (mapsLink) {
        const ticketRect = ticketContainer.getBoundingClientRect();
        const linkRect = mapsLink.getBoundingClientRect();
        printTimeCoords = { ticketRect, linkRect };
      }

      ticketContainer.classList.remove('is-printing');

      // Use 'pt' (points) for more standard PDF dimensions and reliable link scaling
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [ticketContainer.offsetWidth * 0.75 * 2, ticketContainer.offsetHeight * 0.75 * 2]
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Add clickable Google Maps link to the PDF
      if (printTimeCoords) {
        const { ticketRect, linkRect } = printTimeCoords;
        
        // Calculate relative coordinates in percentage, then map to PDF points
        const relX = ((linkRect.left - ticketRect.left) / ticketRect.width) * pdfWidth;
        const relY = ((linkRect.top - ticketRect.top) / ticketRect.height) * pdfHeight;
        const relW = (linkRect.width / ticketRect.width) * pdfWidth;
        const relH = (linkRect.height / ticketRect.height) * pdfHeight;
        
        const destination = locationData[selectedTicket.location]?.query 
             ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData[selectedTicket.location].query)}`
             : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTicket.location + " Kolkata")}`;

        pdf.link(relX, relY, relW, relH, { url: destination });
      }

      pdf.save(`RobotPass-${selectedTicket.id.split("-")[0].toUpperCase()}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from("tickets")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "pending")
          .order("created_at", { ascending: false });

        if (data) {
          setTickets(data);
        }
      } catch (err: unknown) {
        console.error("Error fetching tickets:", err);
      }
      setLoading(false);
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchTickets();
    } else {
      document.body.style.overflow = "unset";
      setSelectedTicket(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, userId]);

  const filteredTickets = tickets.filter(t => {
    const isPastDate = isPast(parseISO(t.date)) && format(parseISO(t.date), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
    return filter === "active" ? !isPastDate : isPastDate;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-2xl h-full md:h-auto md:max-h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)] z-10 overflow-hidden flex flex-col"
            style={{
              backgroundImage: 'radial-gradient(circle at top left, rgba(74, 144, 226, 0.08) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(74, 144, 226, 0.03) 0%, transparent 30%)'
            }}
          >
            <AnimatePresence mode="wait">
              {!selectedTicket ? (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* List Header */}
                  <div className="p-6 md:p-10 pb-4 md:pb-6 flex justify-between items-start shrink-0">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none mb-1">Your Passes</h2>
                      <p className="text-xs text-gray-500 font-medium">Manage your upcoming and past trips.</p>
                    </div>
                    <button 
                      onClick={onClose}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/10 active:scale-90"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <div className="px-6 md:px-8 mb-4 md:mb-6 font-sans shrink-0">
                    <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                      <button 
                        onClick={() => setFilter("active")}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                          filter === "active" ? "bg-accent/20 text-accent border border-accent/20 shadow-[0_0_15px_rgba(74,144,226,0.2)]" : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        <Activity size={12} /> Active
                      </button>
                      <button 
                        onClick={() => setFilter("expired")}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                          filter === "expired" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        <History size={12} /> Expired
                      </button>
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 space-y-4 font-sans min-h-0 custom-scrollbar">
                    {loading ? (
                      <div className="h-60 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-10 h-10">
                           <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Loading tickets...</p>
                      </div>
                    ) : filteredTickets.length > 0 ? (
                      filteredTickets.map((ticket, idx) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 hover:bg-accent/[0.05] transition-all group relative overflow-hidden flex flex-col md:flex-row md:items-center gap-4 cursor-pointer active:scale-[0.99]"
                        >
                          <div className="flex-1 z-10">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                                <Ticket size={22} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-base md:text-lg tracking-tight group-hover:text-white transition-colors">{ticket.location}</h3>
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData[ticket.location]?.query || (ticket.location + " Kolkata"))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 hover:bg-white/10 rounded text-accent transition-colors"
                                    title="View on Google Maps"
                                  >
                                    <MapPin size={14} className="fill-accent/20" />
                                  </a>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">ID: {ticket.id.slice(0, 8).toUpperCase()}</span>
                                  <div className="w-1 h-1 rounded-full bg-white/10" />
                                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Confirmed</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                              <div className="flex items-center gap-2 p-1.5 px-3 bg-white/5 rounded-full border border-white/5">
                                <Calendar size={12} className="text-gray-400" />
                                {format(parseISO(ticket.date), "dd-MM-yyyy")}
                              </div>
                              <div className="flex items-center gap-2 p-1.5 px-3 bg-white/5 rounded-full border border-white/5">
                                <MapPin size={12} className="text-gray-400" />
                                {ticket.attractions.length} Stops
                              </div>
                              <div className="flex items-center gap-2 p-1.5 px-3 bg-white/5 rounded-full border border-white/5">
                                <Clock size={12} className="text-gray-400" />
                                {ticket.hours}h Limit
                              </div>
                            </div>
                          </div>

                          <div className="md:text-right flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 gap-1 z-10">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Cost</span>
                            <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-accent group-hover:drop-shadow-[0_0_8px_rgba(74,144,226,0.4)] transition-all">₹{ticket.total_cost}</span>
                            <ChevronRight size={18} className="text-gray-500 ml-4 md:ml-0 md:mt-1 group-hover:translate-x-1 group-hover:text-accent transition-all" />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-40 md:h-60 flex flex-col items-center justify-center text-gray-500 space-y-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl md:rounded-3xl mt-2">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center opacity-30">
                          <Ticket size={32} />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-xs uppercase tracking-widest mb-1 text-white/40">No passes found</p>
                          <p className="text-[10px] text-gray-600 font-medium px-12 text-balance leading-relaxed">You haven&apos;t booked any trips in this category yet.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Authorized Footer */}
                  <div className="p-6 md:p-8 bg-white/[0.02] border-t border-white/5 text-center shrink-0 flex items-center justify-center gap-4">
                    <div className="h-px w-8 bg-white/10 hidden md:block" />
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] whitespace-nowrap">Authorized by Future Industry Co. &copy; 2026</p>
                    <div className="h-px w-8 bg-white/10 hidden md:block" />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                   key="detail"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="flex flex-col flex-1 min-h-0 bg-[#050505] overflow-hidden"
                >
                  {(() => {
                    const isExpired = isPast(parseISO(selectedTicket.date)) && format(parseISO(selectedTicket.date), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
                    const isConfirmed = selectedTicket.status === 'verified' || !isExpired;

                    return (
                      <>
                        {/* Detail Header / Nav */}
                        <div className="p-4 md:p-6 flex items-center justify-between shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-md z-30">
                          <button 
                            onClick={() => {
                              setSelectedTicket(null);
                              setShowQR(false);
                            }}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all group"
                          >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Passes
                          </button>
                          <div className="flex items-center gap-3">
                             <button 
                               onClick={handleDownload}
                               disabled={isDownloading}
                               className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white border border-white/10 disabled:opacity-50"
                               title="Download PDF"
                             >
                               {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={16} />}
                             </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <div ref={ticketRef} className="p-6 md:p-8 space-y-8 bg-[#050505] group">
                            {/* Premium Status Card */}
                            <div className="border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black/60 backdrop-blur-md rounded-[2.5rem]">
                              
                              {/* Status Header */}
                              <div className={cn(
                                "text-white p-8 md:p-12 relative overflow-hidden text-center",
                                isConfirmed ? "bg-gradient-to-br from-green-500/20 via-emerald-600/10 to-transparent border-b border-green-500/30" : "bg-gradient-to-br from-red-500/20 via-rose-600/10 to-transparent border-b border-red-500/30"
                              )}>
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                                  className="flex justify-center mb-6"
                                >
                                  <div className={cn("rounded-full p-6 shadow-lg relative", isConfirmed ? "bg-green-500/5" : "bg-red-500/10")}>
                                    {isConfirmed ? (
                                       <motion.svg viewBox="0 0 52 52" className="h-16 w-16 text-green-500">
                                         <motion.circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="1" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.2 }} transition={{ duration: 0.5 }} />
                                         <motion.path fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7.5 7.5L38 18" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} />
                                       </motion.svg>
                                    ) : (
                                       <XCircle className="h-16 w-16 text-red-500" />
                                    )}
                                  </div>
                                </motion.div>

                                <h1 className={cn("text-3xl md:text-5xl font-black uppercase tracking-tighter mb-3", isConfirmed ? "text-green-400" : "text-red-400")}>
                                  {isConfirmed ? (selectedTicket.status === 'verified' ? "Pass Verified" : "Pass Active") : "Pass Expired"}
                                </h1>
                                <p className="text-gray-400 text-sm md:text-base font-medium max-w-xs mx-auto">
                                  {isConfirmed ? "Your robot is synchronized and ready for the mission." : "This pass has expired. Please book a new trip."}
                                </p>

                                {/* Decorative elements */}
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl opacity-20" />
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl opacity-20" />
                              </div>

                              <div className="p-8 md:p-10 space-y-10">
                                {/* ID & QR SECTION */}
                                <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.03] border border-white/5 rounded-3xl p-8 relative">
                                  <div className={cn("flex-1 text-center md:text-left space-y-2", !isConfirmed && "md:text-center")}>
                                     <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-black">Ticket Identifier</p>
                                     <div className={cn("flex flex-col md:flex-row items-baseline gap-2 md:gap-3 justify-center", isConfirmed ? "md:justify-start" : "md:justify-center")}>
                                        <span className="text-3xl md:text-5xl font-black text-white font-mono tracking-tighter">
                                          ULT-{selectedTicket.id.substring(0, 4).toUpperCase()}
                                        </span>
                                     </div>
                                  </div>
                                  
                                  {isConfirmed && (
                                    <div className="shrink-0 flex flex-col items-center gap-4">
                                       <div className="group-[.is-printing]:hidden">
                                         <button 
                                           onClick={() => setShowQR(!showQR)}
                                           className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-blue-500 transition-all active:scale-95"
                                         >
                                           <QrCode size={16} /> {showQR ? "Hide QR Access" : "View QR Access"}
                                         </button>
                                       </div>

                                       {/* Web QR - with animation */}
                                       <AnimatePresence>
                                         {showQR && (
                                           <motion.div 
                                             initial={{ opacity: 0, scale: 0.8 }}
                                             animate={{ opacity: 1, scale: 1 }}
                                             exit={{ opacity: 0, scale: 0.8 }}
                                             className="bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] group-[.is-printing]:hidden"
                                           >
                                              <QRCodeCanvas 
                                               value={JSON.stringify({ ticketId: selectedTicket.id, userId: userId.slice(0, 8) })}
                                               size={140}
                                               level="H"
                                              />
                                           </motion.div>
                                         )}
                                       </AnimatePresence>

                                       {/* PDF QR - Always visible when printing, high contrast */}
                                       <div className="hidden group-[.is-printing]:block">
                                         <div className="bg-white p-4 rounded-3xl">
                                            <QRCodeCanvas 
                                             value={JSON.stringify({ ticketId: selectedTicket.id, userId: userId.slice(0, 8) })}
                                             size={180}
                                             level="H"
                                             includeMargin={false}
                                             fgColor="#000000"
                                             bgColor="#FFFFFF"
                                            />
                                         </div>
                                       </div>
                                    </div>
                                  )}
                                </div>

                                {/* DETAILS GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                         <Calendar size={24} />
                                      </div>
                                      <div>
                                         <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-1">Deployment Date</p>
                                         <p className="text-xl font-bold text-white tracking-tight">{format(parseISO(selectedTicket.date), "dd MMMM yyyy")}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                         <Clock size={24} />
                                      </div>
                                      <div>
                                         <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-1">Time & Duration</p>
                                         <p className="text-xl font-bold text-white tracking-tight">10:00 AM <span className="text-gray-500 font-medium ml-2">({selectedTicket.hours}h Limit)</span></p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5 md:col-span-2">
                                      <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                                         <MapPin size={24} />
                                      </div>
                                      <div>
                                         <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-1">Mission Location</p>
                                         <div className="flex items-center gap-2">
                                           <p className="text-xl font-bold text-white tracking-tight">{selectedTicket.location}</p>
                                           <a 
                                             ref={mapsLinkRef}
                                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData[selectedTicket.location]?.query || (selectedTicket.location + " Kolkata"))}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-accent transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/5"
                                           >
                                             <MapPin size={14} className="fill-accent/20" />
                                             <span className="hidden md:inline">Google Maps</span>
                                           </a>
                                         </div>
                                         <p className="text-xs text-gray-500 mt-1 font-medium italic">
                                           {locationData[selectedTicket.location]?.address}
                                         </p>
                                      </div>
                                   </div>
                                </div>

                                {/* TRIP COST */}
                                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                                   <div>
                                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-black mb-1">Total Authorized Amount</p>
                                      <p className="text-5xl font-black text-accent tracking-tighter">₹{selectedTicket.total_cost}</p>
                                   </div>
                                   <div className="text-right hidden sm:block">
                                      <CheckCircle2 size={32} className="text-accent/20" />
                                   </div>
                                </div>
                              </div>
                            </div>

                            {/* ITINERARY LIST */}
                            <div className="space-y-6">
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                                 <Info size={12} className="text-accent" />
                                 Authorized Trip Sequence
                                 <div className="h-px flex-1 bg-white/5" />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {selectedTicket.attractions.map((point, idx) => (
                                  <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:border-accent/20 transition-all"
                                  >
                                     <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-xs font-black group-hover:text-accent group-hover:border-accent/20 transition-colors">
                                          {String(idx + 1).padStart(2, "0")}
                                        </div>
                                        <div>
                                          <p className="font-black text-lg text-white/90 tracking-tight group-hover:text-white transition-colors">{point.name}</p>
                                          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-1">Authorized Hub</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{point.time}</span>
                                     </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>

                            {/* Download Prompt for Print */}
                            <div className="hidden pdf-only flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[3rem]">
                               <QrCode size={100} className="text-white opacity-20 mb-6" />
                               <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Authorized Ultron Digital Pass</p>
                            </div>
                          </div>
                          
                          <div className="p-8 pb-12 flex flex-col gap-4 max-w-2xl mx-auto">
                              <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full bg-white hover:bg-gray-200 text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="h-5 w-5" />}
                                {isDownloading ? "Generating..." : "Download Digital Pass"}
                              </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
