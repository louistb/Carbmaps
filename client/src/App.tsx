import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnalysisStore } from './store/analysisStore';
import { useStrava } from './hooks/useStrava';
import { useAnalysis } from './hooks/useAnalysis';
import { UploadForm } from './components/upload/UploadForm';
import { LoadingScreen } from './components/loading/LoadingScreen';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { PacingTab } from './components/tabs/PacingTab';
import { ClimbsTab } from './components/tabs/ClimbsTab';
import { NutritionTab } from './components/tabs/NutritionTab';
import { WeatherTab } from './components/tabs/WeatherTab';
import { CueSheetTab } from './components/tabs/CueSheetTab';
import { PrivacyPolicy } from './components/PrivacyPolicy';

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
  if (window.location.pathname === '/privacy') return <PrivacyPolicy />;

  const { appState, rideId, reset } = useAnalysisStore();
  const { handleCallback } = useStrava();
  const { loadRide } = useAnalysis();

  // On mount: handle Strava OAuth or restore a ride from the URL (?ride=<id>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    if (code && state === 'carbmaps') {
      window.history.replaceState({}, '', window.location.pathname);
      handleCallback(code).catch(console.error);
    } else {
      const rideIdFromUrl = params.get('ride');
      if (rideIdFromUrl) {
        loadRide(rideIdFromUrl);
      }
    }
  }, []);

  // Sync state → URL (only pushes when the URL doesn't already match)
  useEffect(() => {
    const currentRideId = new URLSearchParams(window.location.search).get('ride');
    if (appState === 'results' && rideId && currentRideId !== rideId) {
      window.history.pushState({ rideId }, '', `?ride=${rideId}`);
    } else if (appState === 'idle' && currentRideId) {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [appState, rideId]);

  // Sync URL → state on browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const rideIdFromUrl = new URLSearchParams(window.location.search).get('ride');
      if (rideIdFromUrl) {
        loadRide(rideIdFromUrl);
      } else {
        reset();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [reset, loadRide]);

  return (
    /* Page wrapper — warm parchment bg with centered widget */
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--bg-base)',
    }}>
      <div className="app-card" style={{
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
