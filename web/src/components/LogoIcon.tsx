interface LogoIconProps {
  className?: string;
  size?: number;
}

export default function LogoIcon({ className = "w-5 h-5", size = 20 }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="dl-icon-l" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="dl-icon-d" x1="10" y1="4" x2="28" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Structural L-Bracket Foundation */}
      <path
        d="M6 4C4.895 4 4 4.895 4 6V24C4 26.209 5.791 28 8 28H24C25.105 28 26 27.105 26 26C26 24.895 25.105 24 24 24H8.5C8.224 24 8 23.776 8 23.5V6C8 4.895 7.105 4 6 4Z"
        fill="url(#dl-icon-l)"
      />

      {/* Geometric D-Loupe Aperture */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 4C9.895 4 9 4.895 9 6V19C9 20.105 9.895 21 11 21H18C22.418 21 26 17.418 26 13C26 8.582 22.418 4 18 4H11ZM13.5 8H17.5C20.261 8 22.5 10.239 22.5 13C22.5 15.761 20.261 18 17.5 18H13.5V8Z"
        fill="url(#dl-icon-d)"
      />
    </svg>
  );
}
