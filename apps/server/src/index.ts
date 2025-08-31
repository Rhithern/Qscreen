import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Get allowed origins from environment
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
  return origins.split(',').map(origin => origin.trim());
};

// Basic middleware
app.use(cors({
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Serve React SPA from public directory
app.use(express.static(path.join(process.cwd(), "public"), { maxAge: "1h" }));

// Serve embed SDK from CDN route
app.use('/cdn/embed', express.static(path.join(__dirname, '../../../packages/embed-sdk/dist'), {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

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
    wsUrl: process.env.CONDUCTOR_WS_URL || `wss://app.quickscreening.cam/api/ws`,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || `https://app.quickscreening.cam`,
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

// SPA fallback for all non-API routes
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
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
