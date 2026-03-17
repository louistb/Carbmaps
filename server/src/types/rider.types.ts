// intensity is a continuous FTP target percentage (60–95)
export type IntensityLevel = number;

export interface RiderSettings {
  ftpWatts: number;
  weightKg: number;
  intensity: number; // target FTP %, e.g. 70.5
  startDateTime?: string; // ISO 8601 — optional; omit to skip weather forecast
}
