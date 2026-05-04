import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-charcoal"
          >
            {label}
            {props.required && (
              <span className="text-terracotta ml-0.5">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 transition-colors",
            "focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-muted">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
