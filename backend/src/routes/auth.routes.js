const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /api/auth/verify
 * Verifies the caller's JWT and returns the authenticated user's id and email.
 * Used by the frontend to confirm a session is still valid.
 */
router.get('/verify', authMiddleware, (req, res) => {
  return res.json({
    id: req.user.id,
    email: req.user.email
  });
});

module.exports = router;
