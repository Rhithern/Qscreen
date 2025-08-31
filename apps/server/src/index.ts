import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import jobsRouter from './routes/jobs';
import invitationsRouter from './routes/invitations';
import responsesRouter from './routes/responses';
import embedRouter from './routes/embed';

const app: Express = express();

// Basic middleware
app.use(cors({
  origin: config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api/jobs', jobsRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/responses', responsesRouter);
app.use('/api/embed', embedRouter);

// Serve embed SDK files from CDN route
app.use('/cdn/embed', express.static(path.join(__dirname, '../../../packages/embed-sdk/dist'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set appropriate MIME types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.js.map')) {
      res.setHeader('Content-Type', 'application/json');
    }
    // Enable CORS for CDN files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: config.PORT,
    version: '1.0.0'
  });
});

app.get('/api/embed/config', (req, res) => {
  res.json({
    wsUrl: `ws://localhost:${config.PORT}`,
    appUrl: `http://localhost:${config.PORT}`,
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: config.PORT,
    version: '1.0.0'
  });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Server started on port ${config.PORT}`);
  console.log(`API endpoint: http://localhost:${config.PORT}/api`);
  console.log(`CDN endpoint: http://localhost:${config.PORT}/cdn/embed`);
  console.log(`Health check: http://localhost:${config.PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

export default app;
