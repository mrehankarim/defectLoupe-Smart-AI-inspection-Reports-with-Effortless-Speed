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
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Precision Optical Loupe Ring */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Inscribed Geometric Inspection Diamond (Defect Marker) */}
      <path
        d="M12 4.5L19.5 12L12 19.5L4.5 12Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Inner Optical Lens Core */}
      <circle
        cx="12"
        cy="12"
        r="3.6"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* Center Target Focus Point */}
      <circle
        cx="12"
        cy="12"
        r="1.4"
        fill="currentColor"
      />

      {/* 4 Cardinal Calibration Alignment Ticks */}
      <line x1="12" y1="1" x2="12" y2="3.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="12" y1="20.8" x2="12" y2="23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3.2" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20.8" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
