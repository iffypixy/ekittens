import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed",
  ghost: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export const Button = ({ variant = "primary", className = "", children, ...rest }: Props) => (
  <button
    type="button"
    className={`rounded-lg px-4 py-2 text-sm transition active:scale-95 ${styles[variant]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);
