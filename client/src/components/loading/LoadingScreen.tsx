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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => setMessageIndex(i => (i + 1) % MESSAGES.length), 2500);
    const progInterval = setInterval(() => setProgress(p => Math.min(p + 1.2, 95)), 80);
    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, []);

  return (
    <div style={{
      minHeight: '440px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      gap: '2rem',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        fontFamily: "'Raleway', sans-serif",
        fontWeight: 900,
        fontSize: '1.5rem',
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
      }}>
        Analysing your route
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            fontFamily: "'Raleway', sans-serif",
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: '340px',
            fontWeight: 400,
          }}
        >
          {MESSAGES[messageIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{
        width: '240px', height: '3px',
        background: 'var(--border-subtle)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--accent-gold)',
          borderRadius: 2,
          transition: 'width 0.08s linear',
        }} />
      </div>
    </div>
  );
}
