import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analyzeRouter from './routes/analyze';
import ridesRouter from './routes/rides';
import stravaRouter from './routes/strava';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(/[,;]/).map(o => o.trim().replace(/\/$/, ''))
    : []),
];
console.log('CORS allowed origins:', allowedOrigins);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/analyze', analyzeRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/strava', stravaRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CarbMaps API running on http://localhost:${PORT}`);
});
