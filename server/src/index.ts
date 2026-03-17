import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analyzeRouter from './routes/analyze';
import ridesRouter from './routes/rides';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.use('/api/analyze', analyzeRouter);
app.use('/api/rides', ridesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CarbMap API running on http://localhost:${PORT}`);
});
