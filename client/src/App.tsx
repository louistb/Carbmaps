import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnalysisStore } from './store/analysisStore';
import { useStrava } from './hooks/useStrava';
import { UploadForm } from './components/upload/UploadForm';
import { LoadingScreen } from './components/loading/LoadingScreen';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { PacingTab } from './components/tabs/PacingTab';
import { ClimbsTab } from './components/tabs/ClimbsTab';
import { NutritionTab } from './components/tabs/NutritionTab';
import { WeatherTab } from './components/tabs/WeatherTab';
import { CueSheetTab } from './components/tabs/CueSheetTab';

const tabVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

function ResultsView() {
  const { result, activeTab } = useAnalysisStore();
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Header />
      <TabBar />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={tabVariants} initial="initial" animate="animate" exit="exit">
          {activeTab === 'pacing'    && <PacingTab    data={result.pacing}    routePoints={result.routePoints ?? []} />}
          {activeTab === 'climbs'    && <ClimbsTab    data={result.climbs}    routePoints={result.routePoints ?? []} />}
          {activeTab === 'nutrition' && <NutritionTab data={result.nutrition} routePoints={result.routePoints ?? []} />}
          {activeTab === 'weather'   && result.weather && <WeatherTab data={result.weather} />}
          {activeTab === 'cuesheet'  && <CueSheetTab pacing={result.pacing} climbs={result.climbs} nutrition={result.nutrition} routePoints={result.routePoints ?? []} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { appState } = useAnalysisStore();
  const { handleCallback } = useStrava();

  // Handle Strava OAuth redirect (Strava sends ?code=...&state=carbmaps back to the app origin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    if (code && state === 'carbmaps') {
      window.history.replaceState({}, '', window.location.pathname);
      handleCallback(code).catch(console.error);
    }
  }, []);

  return (
    /* Page wrapper — warm parchment bg with centered widget */
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 32px rgba(26,26,24,0.07)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        margin: '2rem 1rem',
      }}>
        <AnimatePresence mode="wait">
          {appState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadForm />
            </motion.div>
          )}
          {appState === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingScreen />
            </motion.div>
          )}
          {appState === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
