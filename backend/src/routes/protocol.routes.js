const express = require('express');
const protocolController = require('../controllers/protocol.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/generate', protocolController.generate);
router.post('/save', authMiddleware, protocolController.save);
router.get('/list', authMiddleware, protocolController.list);
router.get('/:id', authMiddleware, protocolController.getById);

module.exports = router;
