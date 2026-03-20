declare function gtag(...args: unknown[]): void;

function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, params ?? {});
  }
}

export const analytics = {
  stravaConnectClick: () =>
    track('strava_connect_click'),

  stravaConnected: () =>
    track('strava_connected'),

  rideAnalysisStart: (source: 'gpx' | 'strava') =>
    track('ride_analysis_start', { source }),
};
