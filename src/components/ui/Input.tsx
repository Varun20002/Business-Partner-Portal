import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 font-body"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          disabled={props.disabled}
          className={cn(
            "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-body transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary",
            error
              ? "border-brand-alert focus:ring-brand-alert/20 focus:border-brand-alert"
              : "border-gray-200",
            props.disabled && "bg-gray-100 cursor-not-allowed opacity-60",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-brand-alert font-body">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-400 font-body">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
