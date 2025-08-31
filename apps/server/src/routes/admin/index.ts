import { Router } from 'express';

const router = Router();

// Placeholder admin routes
router.get('/api-keys', (req, res) => {
  res.json({ message: 'Admin API keys endpoint - not yet implemented' });
});

router.get('/jobs', (req, res) => {
  res.json({ message: 'Admin jobs endpoint - not yet implemented' });
});

router.get('/team', (req, res) => {
  res.json({ message: 'Admin team endpoint - not yet implemented' });
});

router.get('/invites', (req, res) => {
  res.json({ message: 'Admin invites endpoint - not yet implemented' });
});

router.get('/question-bank', (req, res) => {
  res.json({ message: 'Admin question bank endpoint - not yet implemented' });
});

router.get('/responses', (req, res) => {
  res.json({ message: 'Admin responses endpoint - not yet implemented' });
});

export default router;
