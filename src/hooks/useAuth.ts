"use client";

// Thin wrapper — all auth logic lives in AuthContext.tsx.
// Consumers import this hook unchanged; the interface is identical.
export { useAuthContext as useAuth } from "@/contexts/AuthContext";
