import { ParsedRoute } from '../types/route.types';
import { parseGpx } from './gpx.parser';
import { parseFit } from './fit.parser';
import { parseTcx } from './tcx.parser';

export function parseRoute(filename: string, fileContent: Buffer): ParsedRoute {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.gpx')) {
    return parseGpx(fileContent.toString('utf-8'));
  }

  if (lower.endsWith('.fit')) {
    return parseFit(fileContent);
  }

  if (lower.endsWith('.tcx')) {
    return parseTcx(fileContent.toString('utf-8'));
  }

  throw new Error(`Unsupported file format: ${filename}. Please upload a .gpx file.`);
}
