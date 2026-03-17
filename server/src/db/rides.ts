import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const GPX_DIR = path.join(DATA_DIR, 'gpx');

function ensureGpxDir() {
  if (!fs.existsSync(GPX_DIR)) fs.mkdirSync(GPX_DIR, { recursive: true });
}

export function saveGpx(id: string, buffer: Buffer): void {
  ensureGpxDir();
  fs.writeFileSync(path.join(GPX_DIR, `${id}.gpx`), buffer);
}

export function getGpxBuffer(id: string): Buffer | null {
  const gpxPath = path.join(GPX_DIR, `${id}.gpx`);
  if (!fs.existsSync(gpxPath)) return null;
  return fs.readFileSync(gpxPath);
}

export function deleteGpx(id: string): void {
  const gpxPath = path.join(GPX_DIR, `${id}.gpx`);
  if (fs.existsSync(gpxPath)) fs.unlinkSync(gpxPath);
}
