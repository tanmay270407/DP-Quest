import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../src/server/apiRouter';

dotenv.config();

const app = express();

// CORS & Preflight middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing with 50MB limit for image proofs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API router
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Explicit 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found` });
});

// Express API Error Handler (ensures errors always return JSON, never HTML)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Vercel Serverless API Error]', err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: err.message || 'Internal Server Error',
    status: 'FAILED'
  });
});

export default app;
