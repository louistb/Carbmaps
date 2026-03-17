import React from 'react';

export function CarbMapLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Croissant outline — black stroke only */}
      <path
        d="M18,62 Q10,40 22,24 Q34,10 52,14 Q68,18 76,30 Q84,44 78,60 Q72,72 60,76 Q48,80 38,72 Q28,66 18,62Z"
        stroke="#000" strokeWidth="3" fill="none"
      />
      {/* Left tip */}
      <path
        d="M18,62 Q12,70 8,80 Q14,76 22,72 Q20,67 18,62Z"
        stroke="#000" strokeWidth="2" fill="none"
      />
      {/* Right tip */}
      <path
        d="M78,60 Q86,66 90,76 Q84,70 76,68 Q77,64 78,60Z"
        stroke="#000" strokeWidth="2" fill="none"
      />
      {/* Crust texture lines */}
      <path d="M32,22 Q28,34 30,48" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
      <path d="M46,16 Q44,28 46,44" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
      <path d="M60,20 Q62,32 60,48" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}
