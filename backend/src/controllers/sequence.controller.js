const { analyseSequence } = require('../services/sequence.service');

/**
 * analyse — POST /api/sequence/analyse
 * Accepts a FASTA string and returns the full residue composition + biophysical constants.
 */
async function analyse(req, res) {
  try {
    const { fasta } = req.body;

    if (!fasta || typeof fasta !== 'string' || fasta.trim().length === 0) {
      return res.status(400).json({ error: 'fasta field is required and must be a non-empty string' });
    }

    const result = analyseSequence(fasta);

    return res.json({
      trp: result.trp,
      tyr: result.tyr,
      phe: result.phe,
      cys: result.cys,
      disulfideBonds: result.disulfideBonds,
      molecularWeight: result.molecularWeight,
      epsilon: result.epsilon,
      seqLength: result.seqLength,
      workingConcUm: result.workingConc,
      safeMinUm: result.safeMin,
      safeMaxUm: result.safeMax,
      nativeEmissionNm: result.nativePeak,
      unfoldedEmissionNm: result.unfoldedPeak,
      redShift: result.redShift
    });
  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('No sequence')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('sequence.controller analyse error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { analyse };
