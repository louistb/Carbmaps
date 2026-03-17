import { ParsedRoute } from '../types/route.types';

// Stub — FIT file support is a future extensibility seam
export function parseFit(_buffer: Buffer): ParsedRoute {
  throw new Error('FIT file parsing is not yet supported. Please upload a GPX file.');
}
