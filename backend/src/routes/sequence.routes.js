const express = require('express');
const sequenceController = require('../controllers/sequence.controller');

const router = express.Router();

router.post('/analyse', sequenceController.analyse);

module.exports = router;
