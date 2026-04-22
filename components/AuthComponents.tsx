"use client";

import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AuthProps {
  onToggle: () => void;
  onForgotPassword?: () => void;
  onFocusField?: (field: string | null) => void;
  onPasswordVisibilityChange?: (visible: boolean) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);



export const LoginForm = ({ onToggle, onForgotPassword, onFocusField, onPasswordVisibilityChange }: AuthProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const togglePassword = () => {
    const next = !showPassword;
    setShowPassword(next);
    onPasswordVisibilityChange?.(next);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md px-6 py-12 md:py-12 flex flex-col justify-center min-h-fit lg:h-full">
      <div className="mb-8 md:mb-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-playfair font-black text-white mb-3 tracking-tighter italic">Sign In</h1>
        <p className="text-gray-500 font-sans text-xs uppercase tracking-[0.2em] font-bold">Access your Ultron Dashboard</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="alex.mercer@gmail.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => onFocusField?.("email")}
              onBlur={() => onFocusField?.(null)}
              required
              className="pl-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => onFocusField?.("password")}
              onBlur={() => onFocusField?.(null)}
              required
              className="pl-12 pr-12"
            />
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs font-sans text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="normal-case font-normal text-gray-500 cursor-pointer">
              Remember Me
            </Label>
          </div>
          <button type="button" onClick={onForgotPassword} className="text-xs uppercase tracking-widest font-black text-accent hover:text-blue-400 transition-colors">
            Forgot Password?
          </button>
        </div>

        <Button 
          disabled={loading}
          type="submit"
          className="w-full bg-accent hover:bg-blue-600 h-14 rounded-2xl group transition-all"
        >
          <span className="font-black uppercase tracking-[0.3em] text-xs">
            {loading ? "Authenticating..." : "Sign In"}
          </span>
          {!loading && <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]"><span className="bg-surface px-4 text-gray-600 font-sans">Or join with</span></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-4 bg-white/[0.03] border border-white/5 text-white font-sans py-4 rounded-2xl hover:bg-white/10 transition-all group font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>


        <p className="text-center text-gray-500 font-sans text-xs mt-8 tracking-wide">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={onToggle} className="text-accent font-bold hover:text-blue-400 transition-colors uppercase tracking-widest ml-1 text-[11px]">Sign up</button>
        </p>
      </form>
    </div>
  );
};

export const RegisterForm = ({ onToggle, onFocusField, onPasswordVisibilityChange }: AuthProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const togglePassword = () => {
    const next = !showPassword;
    setShowPassword(next);
    onPasswordVisibilityChange?.(next);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md px-6 py-12 md:py-12 flex flex-col justify-center min-h-fit lg:h-full">
      <div className="mb-8 md:mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-playfair font-black text-white mb-3 tracking-tighter italic">Join Us</h1>
        <p className="text-gray-500 font-sans text-xs uppercase tracking-[0.2em] font-bold">Initialize your account</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reg-name">Full Name</Label>
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
            <Input
              id="reg-name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => onFocusField?.("name")}
              onBlur={() => onFocusField?.(null)}
              required
              className="pl-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">Email Address</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
            <Input
              id="reg-email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => onFocusField?.("email")}
              onBlur={() => onFocusField?.(null)}
              required
              className="pl-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
              <Input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => onFocusField?.("password")}
                onBlur={() => onFocusField?.(null)}
                required
                className="pl-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">Confirm</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
              <Input
                id="reg-confirm"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => onFocusField?.("password")}
                onBlur={() => onFocusField?.(null)}
                required
                className="pl-12"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs font-sans text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>
        )}

        <div className="flex items-center space-x-3 mt-4">
          <Checkbox id="terms" required />
          <Label htmlFor="terms" className="normal-case font-normal text-gray-500 cursor-pointer text-[11px]">
            Accept <span className="text-accent underline underline-offset-4">Terms & Privacy</span>
          </Label>
        </div>

        <Button 
          disabled={loading}
          type="submit"
          className="w-full bg-accent hover:bg-blue-600 h-14 rounded-2xl group transition-all mt-4"
        >
          <span className="font-black uppercase tracking-[0.3em] text-xs">
            {loading ? "Creating Instance..." : "Create Account"}
          </span>
          {!loading && <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]"><span className="bg-surface px-4 text-gray-600 font-sans">Or register with</span></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-4 bg-white/[0.03] border border-white/5 text-white font-sans py-4 rounded-2xl hover:bg-white/10 transition-all group font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>


        <p className="text-center text-gray-500 font-sans text-xs mt-6 tracking-wide">
          Already have an account?{" "}
          <button type="button" onClick={onToggle} className="text-accent font-bold hover:text-blue-400 transition-colors uppercase tracking-widest ml-1 text-[11px]">Sign in</button>
        </p>
      </form>
    </div>
  );
};

export const ForgotPasswordForm = ({ onToggle }: { onToggle: () => void }) => {
  return (
    <div className="w-full max-w-md px-6 py-8 md:py-12 flex flex-col justify-center h-full">
      <div className="mb-10 text-center md:text-left">
        <button onClick={onToggle} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest">Back to Sign In</span>
        </button>
        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-2">Reset Password</h1>
        <p className="text-gray-500 font-sans text-sm">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email Address</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-accent transition-colors z-10" />
            <Input
              id="reset-email"
              name="email"
              type="email"
              placeholder="alex.mercer@gmail.com"
              required
              className="pl-12"
            />
          </div>
        </div>

        <button className="w-full bg-accent text-white h-14 rounded-2xl hover:bg-blue-600 transition-all shadow-[0_10px_30px_rgba(74,144,226,0.2)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group uppercase tracking-widest text-[11px] font-black">
          Send Reset Link
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
