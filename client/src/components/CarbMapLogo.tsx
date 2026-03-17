import React from 'react';

export function CarbMapLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main croissant body — curved crescent shape */}
      <path
        d="M18,62 Q10,40 22,24 Q34,10 52,14 Q68,18 76,30 Q84,44 78,60 Q72,72 60,76 Q48,80 38,72 Q28,66 18,62Z"
        fill="#F5C042"
      />
      {/* Inner lighter body highlight */}
      <path
        d="M24,60 Q18,42 28,28 Q38,16 52,20 Q65,24 71,34 Q78,46 72,59 Q67,69 56,72 Q44,75 36,68 Q30,64 24,60Z"
        fill="#F9D468"
      />
      {/* Baked top crust — darker golden-brown */}
      <path
        d="M22,25 Q35,10 54,15 Q70,20 77,33"
        stroke="#C8861A" strokeWidth="5" fill="none" strokeLinecap="round"
      />
      {/* Left tip */}
      <path
        d="M18,62 Q12,70 8,80 Q14,76 22,72 Q20,67 18,62Z"
        fill="#E8A818"
      />
      {/* Right tip */}
      <path
        d="M78,60 Q86,66 90,76 Q84,70 76,68 Q77,64 78,60Z"
        fill="#E8A818"
      />
      {/* Crust texture lines */}
      <path d="M32,22 Q28,34 30,48" stroke="#C8861A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M46,16 Q44,28 46,44" stroke="#C8861A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M60,20 Q62,32 60,48" stroke="#C8861A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      {/* Bottom crust shadow */}
      <path
        d="M24,60 Q32,72 46,74 Q58,76 70,66"
        stroke="#C8861A" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.5"
      />
    </svg>
  );
}
