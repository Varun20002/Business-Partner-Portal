"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BRAND } from "@/lib/constants";
import { LoginAnimation } from "@/components/ui/LoginAnimation";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Signup fields
  const [uid, setUid] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Client-side validation
      if (!uid.trim()) {
        setError("UID is required");
        setIsLoading(false);
        return;
      }

      if (!/^[A-Z]{2}\d+$/i.test(uid)) {
        setError("Invalid UID format. Must be 2 letters followed by numbers (e.g., VA51243378)");
        setIsLoading(false);
        return;
      }

      if (!/^\d{4}$/.test(pin)) {
        setError("PIN must be exactly 4 digits");
        setIsLoading(false);
        return;
      }

      if (pin !== confirmPin) {
        setError("PINs do not match");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: uid.trim().toUpperCase(),
          pin,
          confirmPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Signup] API error:", data.error);
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Show success state
      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("[Signup] Unexpected error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If signup was successful, show success message
  if (success) {
    return (
      <div className="h-screen flex overflow-hidden">
        {/* Left Side - Animated Characters */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-[#0028cc] p-8">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="z-10 flex flex-col items-center"
          >
            <CheckCircle className="w-24 h-24 text-green-400 mb-6" />
            <h2 className="text-3xl font-heading font-bold text-white text-center">
              Account Created!
            </h2>
            <p className="text-white/70 mt-2 text-center">
              Redirecting to login...
            </p>
          </motion.div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[#0028cc]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600 font-body">
                Your account has been created. You can now log in with your UID and PIN.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Redirecting to login...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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

      {/* Right Side - Signup Form */}
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
          {/* Signup Card - White */}
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
              <p className="text-sm text-gray-500 mt-1 font-body">
                Set up your PIN
              </p>
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
                  error={
                    uid.length > 0 && !/^[A-Z]{2}\d+$/i.test(uid)
                      ? "Invalid UID format"
                      : undefined
                  }
                />
                
                {/* PIN Input */}
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
                    autoComplete="new-password"
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    disabled={isLoading}
                    error={
                      pin.length > 0 && pin.length < 4
                        ? "PIN must be exactly 4 digits"
                        : undefined
                    }
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

                {/* Confirm PIN Input */}
                <div className="relative">
                  <Input
                    id="confirmPin"
                    label="Confirm PIN"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);
                      setConfirmPin(val);
                    }}
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="new-password"
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    disabled={isLoading}
                    error={
                      confirmPin.length > 0 && confirmPin !== pin
                        ? "PINs do not match"
                        : confirmPin.length > 0 && confirmPin.length < 4
                        ? "Must be 4 digits"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
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
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600 font-body">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-brand-primary font-semibold hover:underline"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
