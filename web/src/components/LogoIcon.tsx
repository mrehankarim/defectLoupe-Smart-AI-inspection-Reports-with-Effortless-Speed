interface LogoIconProps {
  className?: string;
  size?: number;
}

export default function LogoIcon({ className = "w-5 h-5", size = 20 }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Precision Loupe Ring */}
      <circle cx="10.5" cy="10.5" r="7" />
      {/* Precision Reticle Focal Crosshair lines */}
      <line x1="10.5" y1="5.5" x2="10.5" y2="7.5" />
      <line x1="10.5" y1="13.5" x2="10.5" y2="15.5" />
      <line x1="5.5" y1="10.5" x2="7.5" y2="10.5" />
      <line x1="13.5" y1="10.5" x2="15.5" y2="10.5" />
      {/* Center Optical Target Point */}
      <circle cx="10.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      {/* Loupe Diagonal Handle */}
      <path d="M15.5 15.5L21 21" strokeWidth="2.6" />
    </svg>
  );
}
