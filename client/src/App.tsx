import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnalysisStore } from './store/analysisStore';
import { UploadForm } from './components/upload/UploadForm';
import { LoadingScreen } from './components/loading/LoadingScreen';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { PacingTab } from './components/tabs/PacingTab';
import { ClimbsTab } from './components/tabs/ClimbsTab';
import { NutritionTab } from './components/tabs/NutritionTab';
import { WeatherTab } from './components/tabs/WeatherTab';

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
          {activeTab === 'nutrition' && <NutritionTab data={result.nutrition} />}
          {activeTab === 'weather'   && result.weather && <WeatherTab data={result.weather} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { appState } = useAnalysisStore();

  return (
    /* Page wrapper — warm parchment bg with centered widget */
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.25rem',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
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
