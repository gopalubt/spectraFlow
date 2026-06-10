const express = require('express');
const cors = require('cors');

const sequenceRoutes = require('./routes/sequence.routes');
const protocolRoutes = require('./routes/protocol.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

app.use(express.json());

app.use('/api/sequence', sequenceRoutes);
app.use('/api/protocol', protocolRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SpectraFlow API' });
});

module.exports = app;
