import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analyzeRouter from './routes/analyze';
import ridesRouter from './routes/rides';
import stravaRouter from './routes/strava';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(/[,;]/).map(o => o.trim().replace(/\/$/, ''))
    : []),
];
console.log('CORS allowed origins:', allowedOrigins);
app.use(cors({ origin: allowedOrigins, exposedHeaders: ['RateLimit-Reset', 'RateLimit-Limit', 'RateLimit-Remaining'] }));
app.use(express.json());

// Rate limit only the heavy compute/Strava-calling endpoints
app.use('/api/analyze', apiLimiter);
app.use('/api/strava/analyze', apiLimiter); // matches both /analyze/:id and /analyze-route/:id

app.use('/api/analyze', analyzeRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/strava', stravaRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CarbMaps API running on http://localhost:${PORT}`);
});
