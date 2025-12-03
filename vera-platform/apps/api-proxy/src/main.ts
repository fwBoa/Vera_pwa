import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
// Load .env from project root
import * as fs from 'fs';
const envPath = path.join(__dirname, '../../../.env');
console.log('[ENV] Current __dirname:', __dirname);
console.log('[ENV] Calculated envPath:', envPath);
if (fs.existsSync(envPath)) {
  console.log('[ENV] .env file FOUND at:', envPath);
} else {
  console.error('[ENV] .env file NOT FOUND at:', envPath);
  // Try alternative path for local dev (source root)
  const altEnvPath = path.join(process.cwd(), '.env');
  console.log('[ENV] Trying alternative path:', altEnvPath);
  if (fs.existsSync(altEnvPath)) {
    console.log('[ENV] .env file FOUND at alternative path');
    dotenv.config({ path: altEnvPath });
  }
}
dotenv.config({ path: envPath });

// Debug: Show loaded Supabase env vars
console.log('[ENV] SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('[ENV] SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'LOADED (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'MISSING');
console.log('[ENV] SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'LOADED (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')' : 'MISSING');

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import analyzeRoutes from './routes/analyze';
import surveyRoutes from './routes/survey';
import { authenticateToken, AuthRequest } from './middleware/auth.middleware';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Simplified CORS for debugging
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'Salut flo, bah ça fonctionne ahaha' });
});

// import multimodalRoutes from './routes/multimodal';
import multimodalRoutes from './routes/multimodal';
import metadataRoutes from './routes/metadata';

// ...

app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/analyze', multimodalRoutes); // Mounts /upload and /url under /api/analyze
app.use('/api', metadataRoutes); // Mounts /metadata under /api

// Protected Admin Route Example
app.get('/api/admin/dashboard', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: `Welcome to the admin dashboard, ${req.user.username}` });
});

// Export app for Vercel
export default app;

// Global error handlers to prevent crash
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Only listen if running locally (not imported as a module)
// We assume if VERCEL env is not set, we are local
if (!process.env.VERCEL) {
  console.log('[Startup] Starting server on port', port);
  app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
  });
} else {
  console.log('[Startup] Skipping app.listen (running on Vercel)');
}
