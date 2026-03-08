"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { LoginAnimation } from "@/components/ui/LoginAnimation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Login fields
  const [uid, setUid] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!uid.trim()) {
        setError("UID is required");
        setIsLoading(false);
        return;
      }
      if (!/^\d{4}$/.test(pin)) {
        setError("PIN must be exactly 4 digits");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();

      const email = `${uid.trim().toLowerCase()}@partner.coindcx.internal`;

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password: pin,
        });

      if (authError) {
        console.error("[Login] Auth error:", authError.message);
        setError(
          authError.message === "Invalid login credentials"
            ? "Invalid UID or PIN"
            : authError.message
        );
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        setError("Authentication failed. No user data returned.");
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError(
          "No profile found for this account. Please contact support."
        );
        setIsLoading(false);
        return;
      }

      if (profile.role === "admin") {
        router.push("/admin");
        router.refresh();
      } else if (profile.role === "partner") {
        router.push("/dashboard");
        router.refresh();
      } else {
        await supabase.auth.signOut();
        setError(
          `Access denied. Unknown role: "${profile.role}". Please contact support.`
        );
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Animated Characters */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-[#0028cc] p-8">
        {/* Animated Characters */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="z-10"
        >
          <LoginAnimation
            isTyping={isTyping}
            passwordVisible={showPassword}
            passwordLength={pin.length}
          />
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[#0028cc]">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Login Card - White */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Logo inside card */}
            <div className="pt-8 pb-4 text-center border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
                {BRAND.name}
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="space-y-4"
              >
                <Input
                  id="uid"
                  label="UID"
                  placeholder="e.g. VA51243378"
                  value={uid}
                  onChange={(e) => setUid(e.target.value.toUpperCase())}
                  autoComplete="username"
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  disabled={isLoading}
                  error={uid.length > 0 && uid.length < 5 ? "UID should be at least 5 characters" : undefined}
                />
                <div className="relative">
                  <Input
                    id="pin"
                    label="4-Digit PIN"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);
                      setPin(val);
                    }}
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="current-password"
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    disabled={isLoading}
                    error={pin.length > 0 && pin.length < 4 ? "PIN must be exactly 4 digits" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-100 text-brand-alert text-sm rounded-xl px-4 py-3 font-body"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full gap-2"
                size="lg"
              >
                Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
