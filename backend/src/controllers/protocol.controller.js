const {
  generateProtocol,
  saveProtocol,
  listProtocols,
  getProtocolById
} = require('../services/protocol.service');

/**
 * generate — POST /api/protocol/generate
 * Accepts FASTA + experiment parameters and returns a full protocol object.
 */
async function generate(req, res) {
  try {
    const {
      fasta,
      proteinName,
      denaturantType,
      stepSize,
      cuvVolumeUl,
      stockMultiplier,
      replicates,
      safetyMargin,
      proteinForm
    } = req.body;

    if (!fasta || typeof fasta !== 'string' || fasta.trim().length === 0) {
      return res.status(400).json({ error: 'fasta field is required' });
    }

    const protocol = generateProtocol({
      fasta,
      proteinName,
      denaturantType,
      stepSize: stepSize !== undefined ? Number(stepSize) : undefined,
      cuvVolumeUl: cuvVolumeUl !== undefined ? Number(cuvVolumeUl) : undefined,
      stockMultiplier: stockMultiplier !== undefined ? Number(stockMultiplier) : undefined,
      replicates: replicates !== undefined ? Number(replicates) : undefined,
      safetyMargin: safetyMargin !== undefined ? Number(safetyMargin) : undefined,
      proteinForm
    });

    return res.json(protocol);
  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('No sequence')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('protocol.controller generate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * save — POST /api/protocol/save  (auth required)
 * Persists a generated protocol to Supabase for the authenticated user.
 */
async function save(req, res) {
  try {
    const protocol = req.body;
    if (!protocol || !protocol.fastaSequence) {
      return res.status(400).json({ error: 'Protocol body with fastaSequence is required' });
    }

    const result = await saveProtocol(protocol, req.user.id);
    return res.status(201).json(result);
  } catch (err) {
    console.error('protocol.controller save error:', err);
    return res.status(500).json({ error: 'Failed to save protocol' });
  }
}

/**
 * list — GET /api/protocol/list  (auth required)
 * Returns a summary list of all protocols owned by the authenticated user.
 */
async function list(req, res) {
  try {
    const protocols = await listProtocols(req.user.id);
    return res.json(protocols);
  } catch (err) {
    console.error('protocol.controller list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve protocols' });
  }
}

/**
 * getById — GET /api/protocol/:id  (auth required)
 * Returns the full protocol record for the given ID, enforcing user ownership.
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Protocol ID is required' });
    }

    const protocol = await getProtocolById(id, req.user.id);
    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    return res.json(protocol);
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: 'Protocol not found' });
    }
    console.error('protocol.controller getById error:', err);
    return res.status(500).json({ error: 'Failed to retrieve protocol' });
  }
}

module.exports = { generate, save, list, getById };
