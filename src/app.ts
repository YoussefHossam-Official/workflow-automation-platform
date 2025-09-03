import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import workflowRoutes from './routes/workflows.js';
import hookRoutes from './routes/hooks.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/hooks', hookRoutes);

// Error handler (last)
app.use((err:any, _req:any, res:any, _next:any) => {
  console.error(err);
  res.status(500).json({ message: err?.message || 'Internal server error' });
});

export default app;
