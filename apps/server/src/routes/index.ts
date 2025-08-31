import { Router } from 'express';
import adminRouter from './admin';
import embedRouter from './embed';

const router = Router();

// Mount API routes
router.use('/admin', adminRouter);
router.use('/embed', embedRouter);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Export route placeholder
router.get('/export/interview/:id', (req, res) => {
  res.json({
    message: 'Export functionality not yet implemented',
    interviewId: req.params.id
  });
});

// Debug route for testing
router.get('/debug', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

export default router;
