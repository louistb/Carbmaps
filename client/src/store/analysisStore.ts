import { create } from 'zustand';

export type AppState = 'idle' | 'loading' | 'results';
export type TabId = 'pacing' | 'climbs' | 'nutrition' | 'weather' | 'cuesheet';

export interface AnalysisResult {
  pacing: import('../types/analysis').PacingResult;
  climbs: import('../types/analysis').ClimbsResult;
  nutrition: import('../types/analysis').NutritionResult;
  weather: import('../types/analysis').WeatherResult | null;
  routePoints: import('../types/analysis').MapPoint[];
}

export interface RideSummary {
  id: string;
  name: string;
  createdAt: string;
  ftpWatts: number;
  intensity: number;
  estimatedTotalTimeMin: number;
  totalDistanceKm: number;
  climbCount: number;
}

interface AnalysisStore {
  appState: AppState;
  result: AnalysisResult | null;
  rideId: string | null;
  activeTab: TabId;
  error: string | null;
  savedRides: RideSummary[];
  isReanalyzing: boolean;
  setAppState: (state: AppState) => void;
  setResult: (result: AnalysisResult, rideId: string) => void;
  updateResult: (result: AnalysisResult) => void;
  setActiveTab: (tab: TabId) => void;
  setError: (error: string | null) => void;
  setSavedRides: (rides: RideSummary[]) => void;
  setIsReanalyzing: (v: boolean) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  appState: 'idle',
  result: null,
  rideId: null,
  activeTab: 'pacing',
  error: null,
  savedRides: [],
  isReanalyzing: false,
  setAppState: (appState) => set({ appState }),
  setResult: (result, rideId) => set({ result, rideId, appState: 'results', error: null }),
  updateResult: (result) => set({ result }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setError: (error) => set({ error, appState: 'idle' }),
  setSavedRides: (savedRides) => set({ savedRides }),
  setIsReanalyzing: (isReanalyzing) => set({ isReanalyzing }),
  reset: () => set({ appState: 'idle', result: null, rideId: null, activeTab: 'pacing', error: null }),
}));
