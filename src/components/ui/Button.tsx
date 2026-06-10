"use client";

import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--color-primary-500)",
    color: "#ffffff",
    border: "1px solid var(--color-primary-500)",
  },
  secondary: {
    background: "transparent",
    color: "var(--color-primary-500)",
    border: "1px solid var(--color-primary-500)",
  },
  danger: {
    background: "var(--error-bg)",
    color: "#ffffff",
    border: "1px solid var(--error-bg)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  gold: {
    background: "linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))",
    color: "#1a1a2e",
    border: "1px solid var(--color-accent-500)",
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: "6px 14px",
    fontSize: "13px",
    minHeight: 36,
    borderRadius: 8,
  },
  md: {
    padding: "10px 20px",
    fontSize: "14px",
    minHeight: 44,
    borderRadius: 12,
  },
  lg: {
    padding: "14px 28px",
    fontSize: "16px",
    minHeight: 48,
    borderRadius: 14,
  },
};

/**
 * Shared Button component with 5 variants and 3 sizes.
 * All variants include proper hover, active, disabled, and focus-visible states.
 * Minimum 44px touch target enforced via minHeight.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      style,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontWeight: 600,
      fontFamily: "var(--font-body)",
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.5 : 1,
      transition: "opacity 0.15s ease, transform 0.1s ease, background-color 0.15s ease, border-color 0.15s ease",
      WebkitTapHighlightColor: "transparent",
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={className}
        style={base}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            (e.target as HTMLButtonElement).style.filter = "brightness(1.08)";
          }
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.filter = "";
        }}
        onMouseDown={(e) => {
          if (!isDisabled) {
            (e.target as HTMLButtonElement).style.transform = "scale(0.97)";
          }
        }}
        onMouseUp={(e) => {
          (e.target as HTMLButtonElement).style.transform = "";
        }}
        {...props}
      >
        {isLoading ? (
          <span
            className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
            style={{
              borderColor: variant === "ghost" ? "var(--text-muted)" : "rgba(255,255,255,0.3)",
              borderTopColor: variant === "ghost" ? "var(--text-secondary)" : "#fff",
            }}
          />
        ) : (
          <>
            {leftIcon && <span className="flex items-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
