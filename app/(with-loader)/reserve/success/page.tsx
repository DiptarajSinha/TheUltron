"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XCircle,
  Calendar, 
  MapPin, 
  Clock, 
  Mail, 
  Phone,
  Download,
  QrCode,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QRCodeCanvas } from "qrcode.react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { sendTicket } from "@/app/actions/sendTicket";

interface BookingDetails {
  confirmationNumber: string;
  serviceName: string;
  serviceDescription: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  address: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  price: string;
  status: "confirmed" | "failed";
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

const mockBooking: BookingDetails = {
  confirmationNumber: "ULT-ERR-001",
  serviceName: "Robot Pass - Ultron",
  serviceDescription: "Guided robotic tour experience at the park.",
  date: format(new Date(), "dd-MM-yyyy"),
  time: "10:00 AM",
  duration: "3 Hours",
  location: "Eco Park",
  address: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161",
  customerName: "Guest User",
  customerEmail: "guest@example.com",
  price: "₹1200",
  status: "confirmed"
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function SuccessPage() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const [booking, setBooking] = React.useState<BookingDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const ticketRef = React.useRef<HTMLDivElement>(null);
  const mapsLinkRef = React.useRef<HTMLAnchorElement>(null);
  const deliveryProcessed = React.useRef(false);
  
  const isSuccess = booking?.status === "confirmed";

  React.useEffect(() => {
    setIsVisible(true);
    
    const fetchUserAndBooking = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // If no user, we might be in a strange state, but let's try storage first
          const stored = sessionStorage.getItem("last_booking");
          if (stored) {
             const data = JSON.parse(stored);
             populateFromData(data, null);
          } else {
             setBooking(mockBooking);
          }
          setLoading(false);
          return;
        }

        // Try storage first for speed
        const stored = sessionStorage.getItem("last_booking");
        if (stored) {
          const data = JSON.parse(stored);
          populateFromData(data, user);
          setLoading(false);
          return;
        }

        // Fallback: Fetch latest confirmed ticket from DB
        const { data: latestTickets } = await supabase
          .from("tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (latestTickets && latestTickets.length > 0) {
          const ticket = latestTickets[0];
          populateFromData({
            id: ticket.id,
            date: ticket.date,
            hours: ticket.hours,
            location: ticket.location,
            total_cost: ticket.total_cost,
            email: user.email
          }, user);
        } else {
          setBooking(mockBooking);
        }
      } catch(e) {
        console.error("Success Page Error:", e);
        setBooking(mockBooking);
      } finally {
        setLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const populateFromData = (data: any, user: { id?: string; email?: string; user_metadata?: { name?: string; phone?: string } } | null) => {
      let formattedDate = data.date;
      try {
         // Handle both ISO strings and regular date strings
         const parsedDate = data.date.includes('T') ? parseISO(data.date) : new Date(data.date);
         formattedDate = format(parsedDate, "dd-MM-yyyy");
      } catch(e) {
         console.error("Date formatting error:", e);
      }
      
      let shortId = data.id || "";
      if (typeof shortId === 'string' && shortId.startsWith("ULT-")) {
        shortId = shortId.replace("ULT-", "");
      }
      if (typeof shortId === 'string' && shortId.includes("-")) {
        shortId = shortId.split("-")[0];
      }
      shortId = shortId.toString().toUpperCase().substring(0, 4);

      setBooking({
        confirmationNumber: `ULT-${shortId}`,
        serviceName: "Robot Pass - Ultron",
        serviceDescription: "Guided robotic tour experience at the park.",
        date: formattedDate,
        time: "10:00 AM",
        duration: `${data.hours} Hour${data.hours > 1 ? "s" : ""}`,
        location: data.location,
        address: locationData[data.location]?.address || "Authorized Deployment Site, Kolkata",
        customerName: user?.user_metadata?.name || data.email?.split("@")[0] || "Guest User",
        customerEmail: user?.email || data.email || "guest@example.com",
        customerPhone: user?.user_metadata?.phone ? `+91 ${user.user_metadata.phone}` : undefined,
        price: `₹${data.total_cost}`,
        status: "confirmed"
      });
    };

    fetchUserAndBooking();
  }, []);

  // Trigger automated delivery once booking is loaded
  React.useEffect(() => {
    if (booking && !deliveryProcessed.current && isSuccess) {
      deliveryProcessed.current = true;
      const processDelivery = async () => {
        try {
          const hoursNum = parseInt(booking.duration);
          const costNum = parseInt(booking.price.replace("₹", ""));
          
          const { data: { session } } = await supabase.auth.getSession();

          const result = await sendTicket({
            id: booking.confirmationNumber,
            date: booking.date,
            hours: hoursNum,
            location: booking.location,
            total_cost: costNum,
            email: booking.customerEmail,
            phone: booking.customerPhone,
            customerName: booking.customerName,
            token: session?.access_token || ""
          });

          if (!result.success) {
            console.error("Delivery Error: " + result.error);
          }
        } catch (error) {
          console.error("Delivery Error:", error);
        }
      };
      processDelivery();
    }
  }, [booking, isSuccess]);

  const qrData = JSON.stringify({
    ticketId: booking?.confirmationNumber,
    unlockCode: process.env.NEXT_PUBLIC_UNLOCK_CODE || "UNLOCK-772"
  });

  const handleDownload = async () => {
    if (!ticketRef.current || !booking) return;

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
        
        const destination = locationData[booking.location]?.query 
             ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData[booking.location].query)}`
             : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location + " Kolkata")}`;

        pdf.link(relX, relY, relW, relH, { url: destination });
      }

      pdf.save(`RobotPass-${booking.confirmationNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Retrieving Booking...</p>
      </div>
    </div>
  );

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 py-6 md:py-10 px-6 overflow-x-hidden">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <div ref={ticketRef} className="group">
              <Card className="border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black/60 backdrop-blur-md rounded-3xl">
                {/* Status Header */}
                <CardHeader className={cn(
                  "text-white p-8 relative overflow-hidden",
                  isSuccess ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-b border-green-500/30" : "bg-gradient-to-r from-red-500/20 to-rose-600/20 border-b border-red-500/30"
                )}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
                    className="flex justify-center mb-4"
                  >
                    <div className={cn("rounded-full p-6 shadow-lg relative", isSuccess ? "bg-green-500/5" : "bg-red-500/10")}>
                      {isSuccess ? (
                         <motion.svg
                           viewBox="0 0 52 52"
                           className="h-16 w-16 text-green-500"
                           initial="hidden"
                           animate="visible"
                         >
                           <motion.circle
                             cx="26"
                             cy="26"
                             r="25"
                             fill="none"
                             stroke="currentColor"
                             strokeWidth="2"
                             variants={{
                               hidden: { pathLength: 0, opacity: 0 },
                               visible: { 
                                 pathLength: 1, 
                                 opacity: 0.2,
                                 transition: { duration: 0.5, ease: "easeInOut" }
                               }
                             }}
                           />
                           <motion.path
                             fill="none"
                             stroke="currentColor"
                             strokeWidth="5"
                             strokeLinecap="round"
                             strokeLinejoin="round"
                             d="M14 27l7.5 7.5L38 18"
                             variants={{
                               hidden: { pathLength: 0, opacity: 0 },
                               visible: { 
                                 pathLength: 1, 
                                 opacity: 1,
                                 transition: { 
                                   delay: 0.5, 
                                   duration: 0.6, 
                                   ease: [0.12, 0, 0.39, 0] // Custom cubic-beziers for "writing" feel
                                 }
                               }
                             }}
                           />
                           {/* Glow pulse */}
                           <motion.circle
                             cx="26"
                             cy="26"
                             r="25"
                             fill="currentColor"
                             className="opacity-0"
                             animate={{ 
                               scale: [1, 1.2], 
                               opacity: [0, 0.1, 0] 
                             }}
                             transition={{
                               delay: 1.1,
                               duration: 1,
                               repeat: 0
                             }}
                           />
                         </motion.svg>
                      ) : (
                         <XCircle className="h-16 w-16 text-red-500" />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                  >
                    <h1 className={cn("text-3xl font-sans font-black uppercase mb-2", isSuccess ? "text-green-400" : "text-red-400")}>
                      {isSuccess ? "Booking Confirmed!" : "Booking Failed"}
                    </h1>
                    <p className="text-gray-300 text-lg">
                      {isSuccess ? "Your reservation has been successfully confirmed." : "There was an issue processing your booking."}
                    </p>
                  </motion.div>

                  {/* Decorative circles */}
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                </CardHeader>

                <CardContent className="p-8 pb-4">
                  {/* Confirmation Number and QR Code */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center relative"
                  >
                    {isSuccess && (
                      <div className="absolute right-4 top-4 sm:top-1/2 sm:-translate-y-1/2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowQR(!showQR)} 
                          className="text-accent hover:text-white hover:bg-white/10 flex items-center gap-2 transition-all rounded-full"
                        >
                          <QrCode className="h-4 w-4" />
                          <span className="hidden sm:inline">{showQR ? "Hide QR" : "View QR"}</span>
                        </Button>
                      </div>
                    )}
                    <div className="sm:pr-24">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Confirmation Number</p>
                      <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider break-all">
                        {booking.confirmationNumber}
                      </p>
                    </div>
                    
                    <AnimatePresence>
                      {showQR && isSuccess && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                          animate={{ height: "auto", opacity: 1, marginTop: 24 }} 
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          className="flex justify-center overflow-hidden group-[.is-printing]:hidden"
                        >
                          <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                             <QRCodeCanvas 
                              value={qrData}
                              size={160}
                              level="H"
                              includeMargin={false}
                              fgColor="#000000"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* PDF QR - Always visible when printing, high contrast */}
                    <div className="hidden group-[.is-printing]:block mt-6">
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-3xl">
                           <QRCodeCanvas 
                            value={qrData}
                            size={180}
                            level="H"
                            includeMargin={false}
                            fgColor="#000000"
                            bgColor="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Service Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-6 flex flex-col items-center sm:items-start text-center sm:text-left"
                  >
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                      {booking.serviceName}
                    </h2>
                    <p className="text-gray-400 font-medium">{booking.serviceDescription}</p>
                  </motion.div>

                  <Separator className="my-6 bg-white/10" />

                  {/* Booking Details Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6"
                  >
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="bg-blue-500/20 rounded-full p-2.5 mt-0.5 border border-blue-500/30">
                        <Calendar className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Date</p>
                        <p className="font-bold text-white text-sm sm:text-base">{booking.date}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="bg-purple-500/20 rounded-full p-2.5 mt-0.5 border border-purple-500/30">
                        <Clock className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Time</p>
                        <p className="font-bold text-white text-sm sm:text-base">
                          {booking.time} <span className="text-gray-400 font-normal">({booking.duration})</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 sm:col-span-2 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="bg-green-500/20 rounded-full p-2.5 mt-0.5 border border-green-500/30">
                        <MapPin className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Location</p>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-white text-sm sm:text-base">{booking.location}</p>
                            <p className="text-xs text-gray-400 mt-1">{locationData[booking.location]?.address || booking.address}</p>
                          </div>
                          <a 
                            ref={mapsLinkRef}
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData[booking.location]?.query || (booking.location + " Kolkata"))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-accent transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/5 shrink-0"
                          >
                            <MapPin size={14} className="fill-accent/20" />
                            <span className="hidden md:inline">Google Maps</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <Separator className="my-6 bg-white/10" />

                  {/* Customer Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-8"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-4">
                      Customer Info
                      <div className="h-[1px] flex-1 bg-white/10"></div>
                    </h3>
                    <div className="flex items-center gap-4 mb-5">
                      <Avatar className="h-14 w-14 border-2 border-white/10 shadow-lg">
                        <AvatarImage src="/placeholder.svg" alt={booking.customerName} />
                        <AvatarFallback className="bg-accent/20 text-accent font-bold text-lg border border-accent/30">
                          {getInitials(booking.customerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-black uppercase tracking-widest text-white text-base">{booking.customerName}</p>
                        <p className="text-[10px] uppercase tracking-wider text-accent font-bold mt-1">Primary Contact</p>
                      </div>
                    </div>
                    <div className="space-y-4 bg-white/5 border border-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                           <Mail className="h-4 w-4 text-gray-300" />
                        </div>
                        <span className="text-gray-300 font-medium text-sm sm:text-base">{booking.customerEmail}</span>
                      </div>
                      {booking.customerPhone && (
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Phone className="h-4 w-4 text-gray-300" />
                          </div>
                          <span className="text-gray-300 font-medium text-sm sm:text-base">{booking.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <Separator className="my-6 bg-white/10" />

                  {/* Price */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex justify-between items-center py-2 px-1"
                  >
                    <span className="text-xs uppercase tracking-widest font-black text-gray-400">Total Amount</span>
                    <span className="text-3xl font-black text-accent">{booking.price}</span>
                  </motion.div>

                  {/* Footer Note */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-center shadow-inner"
                  >
                    <p className="text-xs sm:text-sm text-blue-200">
                      A confirmation email has been sent to{" "}
                      <span className="font-bold text-white">{booking.customerEmail}</span>
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
            
            {/* Action Buttons */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1 }}
               className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              {isSuccess && (
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-white hover:bg-gray-200 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:-translate-y-1"
                >
                  <Download className="mr-3 h-5 w-5" />
                  Download Pass
                </Button>
              )}
              <Button
                asChild
                className="flex-1 bg-accent hover:bg-blue-500 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(74,144,226,0.2)] transition-all hover:-translate-y-1"
              >
                <Link href="/">
                   Go to Home <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
