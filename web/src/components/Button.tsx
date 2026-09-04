import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 border border-emerald-600',
  secondary: 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-semibold',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
