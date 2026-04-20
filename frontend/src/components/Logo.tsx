import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({ className = "w-48 h-auto", variant = 'full' }) => {
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="iconGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="iconGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="#f8fafc" filter="url(#shadow)" />
        <circle cx="100" cy="100" r="85" fill="url(#iconGrad1)" opacity="0.05" />

        {/* Map pin */}
        <g transform="translate(100, 85)">
          <path
            d="M0 -50 C35 -50 55 -25 55 5 C55 40 0 75 0 75 C0 75 -55 40 -55 5 C-55 -25 -35 -50 0 -50 Z"
            fill="url(#iconGrad2)"
            opacity="0.9"
          />
          <circle cx="0" cy="-5" r="18" fill="white" />
          <circle cx="0" cy="-5" r="12" fill="url(#iconGrad1)" />
          <circle cx="0" cy="-5" r="6" fill="white" opacity="0.3" />
        </g>

        {/* Route line */}
        <path
          d="M30 160 Q60 130 100 140 Q140 150 170 120"
          stroke="url(#iconGrad1)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="8,4"
        />
      </svg>
    );
  }

  if (variant === 'text') {
    return (
      <svg
        viewBox="0 0 400 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="textGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="textGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y="65"
          fontSize="52"
          fontWeight="800"
          fill="url(#textGrad1)"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          letterSpacing="-1"
        >
          LogiTrack
        </text>
        <text
          x="280"
          y="65"
          fontSize="52"
          fontWeight="800"
          fill="url(#textGrad2)"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          letterSpacing="-1"
        >
          AI
        </text>
        <rect x="0" y="80" width="380" height="3" rx="1.5" fill="url(#textGrad1)" opacity="0.3" />
      </svg>
    );
  }

  // Full logo (default)
  return (
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.15"/>
        </filter>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background circle decoration */}
      <circle cx="400" cy="180" r="160" fill="#f8fafc" filter="url(#shadow)" />
      <circle cx="400" cy="180" r="150" fill="url(#blueGrad)" opacity="0.03" />

      {/* === TRUCK / DELIVERY VEHICLE === */}
      <g transform="translate(140, 130)">
        {/* Truck body */}
        <rect x="0" y="20" width="100" height="55" rx="8" fill="url(#orangeGrad)" filter="url(#shadow)"/>
        {/* Truck cabin */}
        <rect x="70" y="5" width="45" height="45" rx="8" fill="#f97316" />
        {/* Windshield */}
        <rect x="75" y="12" width="18" height="20" rx="4" fill="#e2e8f0" opacity="0.8" />
        <rect x="98" y="12" width="12" height="20" rx="4" fill="#e2e8f0" opacity="0.8" />
        {/* Wheels */}
        <circle cx="25" cy="80" r="12" fill="#1e293b" />
        <circle cx="25" cy="80" r="5" fill="#64748b" />
        <circle cx="85" cy="80" r="12" fill="#1e293b" />
        <circle cx="85" cy="80" r="5" fill="#64748b" />
        {/* Headlight */}
        <rect x="112" y="35" width="6" height="8" rx="2" fill="#fef08a" />
        {/* Taillight */}
        <rect x="-4" y="35" width="6" height="8" rx="2" fill="#ef4444" />
      </g>

      {/* === MAP PIN WITH AI CHIP === */}
      <g transform="translate(400, 100)">
        {/* Pin shadow */}
        <ellipse cx="0" cy="85" rx="30" ry="8" fill="#cbd5e1" opacity="0.5" />
        {/* Pin body */}
        <path
          d="M0 -75 C45 -75 70 -40 70 0 C70 50 0 90 0 90 C0 90 -70 50 -70 0 C-70 -40 -45 -75 0 -75 Z"
          fill="url(#greenGrad)"
          filter="url(#shadow)"
        />
        {/* Pin highlight */}
        <path
          d="M-40 -40 C-50 -20 -50 10 -40 30"
          stroke="white"
          strokeWidth="3"
          fill="none"
          opacity="0.3"
          strokeLinecap="round"
        />
        {/* AI Chip inside pin */}
        <rect x="-30" y="-30" width="60" height="60" rx="10" fill="white" filter="url(#shadow)" />
        <rect x="-25" y="-25" width="50" height="50" rx="6" fill="url(#purpleGrad)" />
        {/* Chip circuits */}
        <line x1="-15" y1="-15" x2="15" y2="15" stroke="white" strokeWidth="2" opacity="0.5" />
        <line x1="-15" y1="15" x2="15" y2="-15" stroke="white" strokeWidth="2" opacity="0.5" />
        <circle cx="0" cy="0" r="8" fill="white" opacity="0.3" />
        <circle cx="0" cy="0" r="4" fill="white" />
        {/* Chip pins */}
        {[-20, -10, 0, 10, 20].map((x) => (
          <line key={x} x1={x} y1={-35} x2={x} y2={-45} stroke="#22c55e" strokeWidth="2.5" />
        ))}
        {[-20, -10, 0, 10, 20].map((x) => (
          <line key={x} x1={x} y1={35} x2={x} y2={45} stroke="#22c55e" strokeWidth="2.5" />
        ))}
      </g>

      {/* === CONNECTING ROUTE (Road) === */}
      <g filter="url(#glow)">
        <path
          d="M240 200 Q320 240 400 220 Q480 200 540 230"
          stroke="url(#blueGrad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Dashed line on road */}
        <path
          d="M240 200 Q320 240 400 220 Q480 200 540 230"
          stroke="#ffffff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="8,12"
          opacity="0.6"
        />
      </g>

      {/* === WAREHOUSE / STORAGE === */}
      <g transform="translate(620, 140)">
        {/* Warehouse building */}
        <rect x="0" y="20" width="80" height="55" rx="6" fill="url(#blueGrad)" filter="url(#shadow)" />
        {/* Roof */}
        <polygon points="-5,20 40,-15 85,20" fill="#1d4ed8" />
        {/* Doors */}
        <rect x="15" y="40" width="20" height="35" rx="3" fill="#1e293b" />
        <rect x="45" y="40" width="20" height="35" rx="3" fill="#1e293b" />
        {/* Door handles */}
        <circle cx="30" cy="60" r="2" fill="#fef08a" />
        <circle cx="60" cy="60" r="2" fill="#fef08a" />
      </g>

      {/* === TEXT WITH MODERN TYPOGRAPHY === */}
      <g transform="translate(180, 310)">
        <text
          x="0"
          y="0"
          fontSize="48"
          fontWeight="800"
          fill="url(#blueGrad)"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          letterSpacing="-1.5"
        >
          LogiTrack
        </text>
        <text
          x="240"
          y="0"
          fontSize="48"
          fontWeight="800"
          fill="url(#greenGrad)"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          letterSpacing="-1"
        >
          AI
        </text>
        {/* Tagline */}
        <text
          x="0"
          y="30"
          fontSize="14"
          fontWeight="500"
          fill="#64748b"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          letterSpacing="2"
        >
          INTELLIGENT LOGISTICS PLATFORM
        </text>
        {/* Underline */}
        <rect x="0" y="40" width="320" height="2" rx="1" fill="url(#orangeGrad)" opacity="0.4" />
      </g>
    </svg>
  );
};

export default Logo;
