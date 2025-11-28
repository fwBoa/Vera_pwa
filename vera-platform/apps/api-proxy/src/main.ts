import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
const envPath = path.join(__dirname, '../../../.env');
console.log('[ENV] Loading .env from:', envPath);
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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api/survey', surveyRoutes); // Survey routes

// Protected Admin Route Example
app.get('/api/admin/dashboard', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: `Welcome to the admin dashboard, ${req.user.username}` });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
