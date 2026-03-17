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

const sans = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => setMessageIndex(i => (i + 1) % MESSAGES.length), 2500);
    const dotInterval = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const progInterval = setInterval(() => setProgress(p => (p + 2) % 100), 80);
    return () => { clearInterval(msgInterval); clearInterval(dotInterval); clearInterval(progInterval); };
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
      <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '1.15rem', color: '#000' }}>
        Analysing your route{'.'.repeat(dots)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            fontFamily: sans,
            color: '#999',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: '340px',
          }}
        >
          {MESSAGES[messageIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar — flat, no radius */}
      <div style={{
        width: '220px', height: '3px',
        background: '#e5e5e5',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: '#000',
          transition: 'width 0.08s linear',
        }} />
      </div>
    </div>
  );
}
