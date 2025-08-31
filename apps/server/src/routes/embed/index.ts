import express, { Router } from 'express';
import { embedCorsMiddleware } from '../../middleware/cors';
import tokenRouter from './token';
import configRouter from './config';

const router: Router = express.Router();

// Apply CORS middleware to all embed routes
router.use(embedCorsMiddleware);

// Mount sub-routes
router.use('/token', tokenRouter);
router.use('/config', configRouter);

export default router;
