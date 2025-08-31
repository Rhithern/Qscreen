import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Basic middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    version: '1.0.0'
  });
});

// Basic embed config endpoint
app.get('/api/embed/config', (req, res) => {
  res.json({
    wsUrl: `wss://your-app.railway.app`,
    appUrl: `https://your-app.railway.app`,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Interviewer API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      config: '/api/embed/config'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

export default app;
