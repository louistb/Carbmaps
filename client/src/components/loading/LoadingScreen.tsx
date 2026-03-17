import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const MESSAGES = [
  "Counting your carbs so you don't have to...",
  "Negotiating with that 12% gradient...",
  "Plotting your inevitable bonk...",
  "Convincing your legs this is a good idea...",
  "Checking if the climb has a coffee stop...",
  "Estimating gels until the hallucinations start...",
  "Checking if you really need that gel at km 40 (you do)...",
  "Pretending to consult a sports nutritionist...",
];

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => setMessageIndex(i => (i + 1) % MESSAGES.length), 2500);
    const dotInterval = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => { clearInterval(msgInterval); clearInterval(dotInterval); };
  }, []);

  return (
    <div style={{
      minHeight: '420px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      gap: '1.75rem',
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-20px) scaleX(1); }
          50%       { transform: translateX(20px)  scaleX(1.08); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>

      <div style={{ fontSize: '3rem', animation: 'bounce 1.4s ease-in-out infinite', display: 'inline-block' }}>
        🚴
      </div>

      <div style={{ textAlign: 'center', maxWidth: '340px' }}>
        <div style={{
          marginBottom: '0.5rem',
          fontWeight: 800,
          fontSize: '1.05rem',
          background: 'var(--grad-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Analysing your route{'.'.repeat(dots)}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}
          >
            {MESSAGES[messageIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '220px', height: '3px',
        background: 'var(--border-subtle)',
        borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: '45%',
          background: 'var(--grad-primary)',
          borderRadius: '999px',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}
