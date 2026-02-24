"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-brand-alert" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="text-gray-500 font-body">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} variant="primary">
          Try Again
        </Button>
      </div>
    </div>
  );
}
