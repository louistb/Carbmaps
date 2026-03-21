import React from 'react';

const ral = "'Raleway', sans-serif";

const h2Style: React.CSSProperties = {
  fontFamily: ral,
  fontSize: '0.95rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  letterSpacing: '0.04em',
  margin: '1.75rem 0 0.5rem',
};

const pStyle: React.CSSProperties = {
  fontFamily: ral,
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.75,
  margin: '0 0 0.6rem',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--accent-gold)',
  fontWeight: 700,
  textDecoration: 'none',
  borderBottom: '1px solid var(--accent-gold)',
};

export function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      justifyContent: 'center',
      padding: '3rem 1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem 2.5rem 3rem',
        boxShadow: '0 4px 32px rgba(26,26,24,0.07)',
      }}>

        <a
          href="/"
          style={{ ...linkStyle, fontSize: '0.75rem', display: 'inline-block', marginBottom: '2rem' }}
        >
          ← Back to CarbMaps
        </a>

        <div style={{
          fontFamily: "'MedievalSharp', cursive",
          fontSize: '1.8rem',
          color: 'var(--text-primary)',
          marginBottom: '0.25rem',
        }}>
          CarbMaps
        </div>
        <div style={{
          fontFamily: ral,
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.35rem',
        }}>
          Privacy Policy
        </div>
        <p style={{ ...pStyle, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Last updated: March 2026
        </p>

        <p style={pStyle}>
          CarbMaps is a cycling route analyser that generates pacing, climb, nutrition and weather
          plans. This policy explains what data we handle, how it is stored, and your rights.
        </p>

        <h2 style={h2Style}>1. Data we collect</h2>
        <p style={pStyle}>
          CarbMaps collects only what is necessary to provide its analysis features:
        </p>
        <ul style={{ ...pStyle, paddingLeft: '1.25rem' }}>
          <li>
            <strong>Via Strava OAuth</strong> — your Strava first name, athlete ID, and the GPS
            stream data (latitude, longitude, elevation, distance, time) of routes or activities
            you choose to analyse. This data is fetched on demand and is never stored on our servers.
          </li>
          <li>
            <strong>Via file upload</strong> — the GPX, FIT or TCX file you upload. It is processed
            server-side in memory and immediately discarded; a copy is kept in your browser's local
            storage solely to allow re-analysis without re-uploading.
          </li>
          <li>
            <strong>Rider settings</strong> — FTP (watts) and body weight (kg) that you enter.
            These are stored only in your browser's local storage.
          </li>
        </ul>

        <h2 style={h2Style}>2. How data is stored</h2>
        <p style={pStyle}>
          CarbMaps uses a <strong>local-first, zero-server-storage</strong> architecture. All ride
          data, analysis results, and rider settings are stored exclusively in your browser's local
          storage. Our servers are stateless — no personal data, GPS tracks, or Strava tokens are
          written to any database or disk.
        </p>
        <p style={pStyle}>
          Strava OAuth tokens (access token, refresh token) are stored in your browser's local
          storage and are used solely to fetch your data from Strava on your behalf.
        </p>

        <h2 style={h2Style}>3. Strava data</h2>
        <p style={pStyle}>
          CarbMaps is built on the{' '}
          <a href="https://www.strava.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Strava
          </a>{' '}
          API. When you connect your Strava account:
        </p>
        <ul style={{ ...pStyle, paddingLeft: '1.25rem' }}>
          <li>We request read-only access (<code>read, activity:read</code>) to your routes and activities.</li>
          <li>Strava data retrieved through the API is displayed only to you — it is never shared with other users or third parties.</li>
          <li>GPS location data from Strava is never cached or stored in your browser beyond the duration of the active session.</li>
          <li>
            <strong>Strava may collect and use data related to your access to the Strava API</strong>,
            as described in the{' '}
            <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Strava Privacy Policy
            </a>.
          </li>
        </ul>
        <p style={pStyle}>
          You can revoke CarbMaps' access to your Strava account at any time via the Disconnect
          button in the app, or directly from your{' '}
          <a href="https://www.strava.com/settings/apps" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Strava account settings
          </a>.
        </p>

        <h2 style={h2Style}>4. Third-party services</h2>
        <ul style={{ ...pStyle, paddingLeft: '1.25rem' }}>
          <li>
            <strong>Strava API</strong> — used to retrieve your routes and activities.{' '}
            <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy policy</a>.
          </li>
          <li>
            <strong>Open-Meteo</strong> — used for weather forecasts when you add a start time.
            Only GPS coordinates derived from your route are sent. No personal data is transmitted.{' '}
            <a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer" style={linkStyle}>Terms</a>.
          </li>
          <li>
            <strong>Google Analytics 4</strong> — used for anonymous usage analytics (page views,
            feature engagement). No personally identifiable information is collected.{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy policy</a>.
          </li>
        </ul>

        <h2 style={h2Style}>5. Data deletion</h2>
        <p style={pStyle}>
          You are in full control of your data:
        </p>
        <ul style={{ ...pStyle, paddingLeft: '1.25rem' }}>
          <li>Delete individual rides using the delete button in your saved rides list.</li>
          <li>Disconnect Strava to remove all Strava tokens from your browser.</li>
          <li>Clear your browser's local storage to remove all CarbMaps data instantly.</li>
        </ul>
        <p style={pStyle}>
          Because no data is stored server-side, there is nothing further to request deletion of on
          our end.
        </p>

        <h2 style={h2Style}>6. Cookies</h2>
        <p style={pStyle}>
          CarbMaps does not use cookies. Data persistence relies solely on browser local storage.
          Google Analytics may set cookies in accordance with its own privacy policy.
        </p>

        <h2 style={h2Style}>7. Children's privacy</h2>
        <p style={pStyle}>
          CarbMaps is not directed at children under 13. We do not knowingly collect data from
          anyone under 13.
        </p>

        <h2 style={h2Style}>8. Changes to this policy</h2>
        <p style={pStyle}>
          We may update this policy as the app evolves. The date at the top of this page reflects
          the most recent revision. Continued use of CarbMaps after changes constitutes acceptance
          of the updated policy.
        </p>

        <h2 style={h2Style}>9. Contact</h2>
        <p style={pStyle}>
          Questions about this privacy policy or your data? Open an issue or discussion on our{' '}
          <a href="https://github.com/louistb/Carbmaps" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            GitHub repository
          </a>.
        </p>

      </div>
    </div>
  );
}
