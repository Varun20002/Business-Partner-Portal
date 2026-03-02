"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [uid, setUid] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate inputs
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

      // Clear any existing session to avoid conflicts
      await supabase.auth.signOut();

      // Format email: {uid}@partner.coindcx.internal
      const email = `${uid.trim().toLowerCase()}@partner.coindcx.internal`;

      // Authenticate with Supabase Auth
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

      // Fetch profile to determine role
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

      // Redirect based on role
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
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {BRAND.name}
          </h1>
          <p className="text-blue-200/70 font-body">{BRAND.tagline}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Input
                id="uid"
                label="UID"
                placeholder="e.g. VA51243378"
                value={uid}
                onChange={(e) => setUid(e.target.value.toUpperCase())}
                autoComplete="username"
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
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
        </div>
      </motion.div>
    </div>
  );
}
