'use client';

interface MedicalLogoProps {
  size?: number;
  className?: string;
}

// Logo médical : Coeur blanc 3D avec ombre
export default function MedicalLogo({ size = 24, className = '' }: MedicalLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Définitions pour les effets 3D */}
      <defs>
        <filter id="shadow3D" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.4"/>
        </filter>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0.7"/>
        </linearGradient>
      </defs>

      {/* Ombre du coeur pour effet 3D */}
      <path
        d="M34 56C34 56 10 40 10 24C10 16 16 10 24 10C29 10 34 14 34 14C34 14 39 10 44 10C52 10 58 16 58 24C58 40 34 56 34 56Z"
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Coeur principal - contour blanc avec dégradé */}
      <path
        d="M32 54C32 54 8 38 8 22C8 14 14 8 22 8C27 8 32 12 32 12C32 12 37 8 42 8C50 8 56 14 56 22C56 38 32 54 32 54Z"
        fill="none"
        stroke="url(#heartGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Reflet pour effet 3D */}
      <path
        d="M18 18C16 20 14 24 14 28"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
