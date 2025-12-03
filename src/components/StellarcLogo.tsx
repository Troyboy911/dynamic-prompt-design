interface StellarcLogoProps {
  className?: string;
  size?: number;
}

const StellarcLogo = ({ className = "", size = 32 }: StellarcLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      {/* Glow filter */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="stellarcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(200, 98%, 39%)" />
          <stop offset="100%" stopColor="hsl(180, 100%, 50%)" />
        </linearGradient>
      </defs>

      {/* Outer orbital ring */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="url(#stellarcGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
        filter="url(#glow)"
      />

      {/* Inner orbital ring */}
      <ellipse
        cx="50"
        cy="50"
        rx="30"
        ry="15"
        stroke="url(#stellarcGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
        transform="rotate(-30 50 50)"
        filter="url(#glow)"
      />

      {/* Second orbital ring */}
      <ellipse
        cx="50"
        cy="50"
        rx="30"
        ry="15"
        stroke="url(#stellarcGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
        transform="rotate(30 50 50)"
        filter="url(#glow)"
      />

      {/* Core nucleus */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="url(#stellarcGradient)"
        filter="url(#glow)"
      />

      {/* Orbital electrons/nodes */}
      <circle cx="50" cy="8" r="4" fill="hsl(180, 100%, 50%)" filter="url(#glow)" />
      <circle cx="78" cy="66" r="4" fill="hsl(200, 98%, 39%)" filter="url(#glow)" />
      <circle cx="22" cy="66" r="4" fill="hsl(200, 98%, 39%)" filter="url(#glow)" />

      {/* Connecting lines to nodes */}
      <line x1="50" y1="42" x2="50" y2="12" stroke="url(#stellarcGradient)" strokeWidth="1" opacity="0.5" />
      <line x1="56" y1="54" x2="74" y2="64" stroke="url(#stellarcGradient)" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="54" x2="26" y2="64" stroke="url(#stellarcGradient)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
};

export default StellarcLogo;
