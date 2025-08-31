import express, { Router } from 'express';
import { config } from '../../config';

const router: Router = express.Router();

// GET /api/embed/config - Public configuration for embed widget
router.get('/', (req, res) => {
  res.json({
    wsUrl: config.WS_URL || `ws://localhost:${config.PORT}/ws`,
    version: '1.0.0',
    features: {
      audioRecording: true,
      realTimeTranscription: true,
      textToSpeech: true,
      scoring: true
    },
    limits: {
      maxSessionDuration: 3600, // 1 hour in seconds
      maxQuestionDuration: 300,  // 5 minutes per question
      audioSampleRate: 16000
    },
    ui: {
      theme: 'modern',
      showTimer: true,
      showProgress: true,
      allowSkip: false
    }
  });
});

export default router;
