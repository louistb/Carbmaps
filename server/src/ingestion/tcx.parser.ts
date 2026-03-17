import { ParsedRoute } from '../types/route.types';

// Stub — TCX file support is a future extensibility seam
export function parseTcx(_content: string): ParsedRoute {
  throw new Error('TCX file parsing is not yet supported. Please upload a GPX file.');
}
