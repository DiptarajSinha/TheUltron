"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  Ticket, 
  Save, 
  Loader2,
  Trophy,
  Activity,
  ArrowLeft,
  KeyRound,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignOutOverlay } from "@/components/SignOutOverlay";
import { User } from "@supabase/supabase-js";

interface TicketData {
  id: string;
  date: string;
  location: string;
  total_cost: number;
  created_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  
  // Modal State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth");
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      const metadataName = currentUser.user_metadata?.name || "";
      const metadataPhone = currentUser.user_metadata?.phone || "";
      
      setName(metadataName);
      setPhone(metadataPhone);
      setInitialName(metadataName);
      setInitialPhone(metadataPhone);

      // Fetch Ticket Count
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("id, date, location, total_cost, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (ticketData) {
        setTickets(ticketData);
      }
      
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    // Validation for Indian Phone (10 digits)
    const phoneClean = phone.replace(/\s+/g, "");
    if (phoneClean && !/^\d{10}$/.test(phoneClean)) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      setUpdating(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { 
        name: name,
        phone: phoneClean 
      }
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setInitialName(name);
      setInitialPhone(phoneClean);
      setMessage({ type: "success", text: "Profile updated successfully." });
    }
    setUpdating(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setUpdating(true);
    setShowResetConfirm(false);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password reset link sent to your email." });
    }
    setUpdating(false);
  };

  const getMembershipTier = (count: number) => {
    if (count >= 6) return { name: "Gold Member", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" };
    if (count >= 3) return { name: "Silver Member", color: "text-gray-300", bg: "bg-gray-300/10", border: "border-gray-300/20" };
    return { name: "Bronze Member", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Loading Account...</p>
        </div>
      </div>
    );
  }

  const tier = getMembershipTier(tickets.length);
  const isDirty = (name !== initialName || phone !== initialPhone) && !updating;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 px-6 font-sans relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Link */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
        </motion.div>

        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-surface/30 border border-white/5 p-8 md:p-12 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative shrink-0"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-accent/20 to-blue-400/20 border-2 border-white/10 flex items-center justify-center relative shadow-[0_0_40px_rgba(74,144,226,0.15)] group-hover:shadow-[0_0_60px_rgba(74,144,226,0.3)] transition-all duration-700">
                <UserIcon className="w-10 h-10 md:w-16 md:h-16 text-accent" />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-black flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-3 h-3 md:w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            <div className="text-center md:text-left flex-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${tier.bg} ${tier.border} ${tier.color} text-[9px] font-black uppercase tracking-[0.3em] mb-4 shadow-lg`}>
                  <Trophy className="w-3 h-3" /> {tier.name}
                </div>
                <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-white uppercase drop-shadow-lg">
                  {name || "User Profile"}
                </h1>
                <p className="text-gray-400 font-sans text-xs md:text-sm mt-2 tracking-widest uppercase font-medium">User ID: <span className="text-accent/60 font-mono">#{user?.id?.slice(0, 8).toUpperCase()}</span></p>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-surface/20 border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Activity className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-bold tracking-tight uppercase">Profile Details</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Full Name</label>
                     <div className="relative group">
                       <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" />
                       <input 
                         type="text" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all font-medium"
                         placeholder="Enter full name"
                       />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Contact (India Only)</label>
                     <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" />
                          <span className="text-xs font-bold text-gray-400">+91</span>
                       </div>
                       <input 
                         type="tel" 
                         value={phone}
                         onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                         className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-16 pr-4 text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all font-mono tracking-wider font-medium"
                         placeholder="10 digit number"
                       />
                     </div>
                   </div>

                   <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Email ID (Read-only)</label>
                     <div className="relative group grayscale">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                       <input 
                         type="email" 
                         value={user?.email || ""}
                         disabled
                         className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-gray-500 cursor-not-allowed font-medium"
                       />
                        <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/50" />
                     </div>
                   </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest border ${
                        message.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}
                    >
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  disabled={!isDirty}
                  className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group uppercase tracking-[0.2em] text-xs ${
                    isDirty 
                      ? "bg-accent text-white hover:bg-blue-500 hover:-translate-y-1 shadow-accent/20" 
                      : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5 shadow-none"
                  }`}
                >
                  {updating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className={`w-4 h-4 ${isDirty ? "group-hover:scale-110 transition-transform" : ""}`} />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Security Section */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="bg-surface/20 border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-bold tracking-tight uppercase">Account Security</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={() => setShowResetConfirm(true)}
                   className="flex-1 px-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                 >
                   <KeyRound className="w-4 h-4 text-accent" />
                   Reset Password
                 </button>
                 <button 
                   onClick={() => setShowSignOutConfirm(true)}
                   className="px-6 py-5 rounded-2xl border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                 >
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Stats Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-accent/10 border border-accent/20 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(74,144,226,0.1)] relative overflow-hidden group"
            >
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <Ticket className="w-12 h-12 text-accent mx-auto mb-4 opacity-50 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
               <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">Robot passes</p>
               <h3 className="text-6xl font-black italic tracking-tighter text-white my-2">{tickets.length}</h3>
               <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Total Bookings</p>
            </motion.div>

             <div className="text-center opacity-20 py-8">
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-500">Future Industry Co. &copy; 2026</p>
             </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0D0D0D] p-8 rounded-3xl border border-white/10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Security Check</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                Are you sure you want to trigger a password reset sequence? We will send a secure link to your registered email ID.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePasswordReset}
                  className="w-full bg-accent hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg shadow-accent/20"
                >
                  Yes, Trigger Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border border-white/5"
                >
                  No, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignOutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0D0D0D] p-8 rounded-3xl border border-white/10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Sign Out</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                Are you sure you want to sign out of your account? You will need to sign in again to access your passes.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    setIsSigningOut(true);
                    setShowSignOutConfirm(false);
                    setTimeout(async () => {
                      await supabase.auth.signOut();
                      router.push("/");
                    }, 2000);
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg shadow-red-500/20"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border border-white/5"
                >
                  No, Stay Signed In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SignOutOverlay isVisible={isSigningOut} />
    </div>
  );
}
