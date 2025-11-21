import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import analyzeRoutes from './routes/analyze';
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

// Protected Admin Route Example
app.get('/api/admin/dashboard', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: `Welcome to the admin dashboard, ${req.user.username}` });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
