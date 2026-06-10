const { createClient } = require('@supabase/supabase-js');
const {
  analyseSequence,
  calculateStockPrep,
  generateExperimentGrid
} = require('./sequence.service');

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(url, key);
}

/**
 * generateProtocol — orchestrates a full experimental protocol from a FASTA sequence
 * and user-supplied parameters. Returns all calculated values plus the experiment grid.
 */
function generateProtocol({
  fasta,
  proteinName,
  denaturantType = 'urea',
  stepSize = 0.5,
  cuvVolumeUl = 1000,
  stockMultiplier = 10,
  replicates = 1,
  safetyMargin = 0.2,
  proteinForm = 'powder'
}) {
  // Full sequence analysis
  const analysis = analyseSequence(fasta);

  const {
    sequence,
    seqLength,
    trp,
    tyr,
    phe,
    cys,
    disulfideBonds,
    molecularWeight,
    epsilon,
    workingConc,
    safeMin,
    safeMax,
    nativePeak,
    unfoldedPeak,
    redShift
  } = analysis;

  // Determine number of denaturant concentration steps
  const maxM = denaturantType === 'gdnhcl' ? 6 : 8;
  const denaturantSteps = Math.round(maxM / stepSize) + 1;

  // Stock preparation calculations
  const stockPrep = calculateStockPrep({
    workingConc,
    stockMultiplier,
    cuvVolumeUl,
    denaturantSteps,
    replicates,
    safetyMargin,
    molecularWeight
  });

  // Experiment grid
  const { steps: experimentGrid, predCmLow, predCmHigh } = generateExperimentGrid({
    denaturantType,
    stepSize,
    disulfideBonds,
    workingConc,
    stockConc: stockPrep.stockConc,
    cuvVolumeUl,
    stockMultiplier
  });

  return {
    proteinName: proteinName || null,
    fastaSequence: fasta,
    sequence,
    seqLength,
    trpCount: trp,
    tyrCount: tyr,
    pheCount: phe,
    cysCount: cys,
    disulfideBonds,
    molecularWeight,
    epsilon,
    denaturantType,
    stepSize,
    cuvVolumeUl,
    stockMultiplier,
    replicates,
    safetyMargin,
    proteinForm,
    workingConcUm: workingConc,
    safeMinUm: safeMin,
    safeMaxUm: safeMax,
    stockConcUm: stockPrep.stockConc,
    volPerTubeUl: stockPrep.volPerTube,
    totalTubes: stockPrep.totalTubes,
    rawStockVolMl: stockPrep.rawStockVol,
    totalStockVolMl: stockPrep.finalStockVol,
    massMg: stockPrep.massMg,
    predCmLow,
    predCmHigh,
    nativeEmissionNm: nativePeak,
    unfoldedEmissionNm: unfoldedPeak,
    redShift,
    experimentGrid
  };
}

/**
 * saveProtocol — persists a generated protocol to Supabase, scoped to the requesting user.
 */
async function saveProtocol(protocol, userId) {
  const supabase = getSupabaseAdmin();

  const row = {
    user_id: userId,
    protein_name: protocol.proteinName,
    fasta_sequence: protocol.fastaSequence,
    trp_count: protocol.trpCount,
    tyr_count: protocol.tyrCount,
    phe_count: protocol.pheCount,
    cys_count: protocol.cysCount,
    disulfide_bonds: protocol.disulfideBonds,
    molecular_weight: protocol.molecularWeight,
    epsilon: protocol.epsilon,
    denaturant_type: protocol.denaturantType,
    step_size: protocol.stepSize,
    cuvette_volume: protocol.cuvVolumeUl,
    stock_multiplier: protocol.stockMultiplier,
    replicates: protocol.replicates,
    safety_margin: protocol.safetyMargin,
    protein_form: protocol.proteinForm,
    working_conc_um: protocol.workingConcUm,
    stock_conc_um: protocol.stockConcUm,
    vol_per_tube_ul: protocol.volPerTubeUl,
    total_stock_vol_ml: protocol.totalStockVolMl,
    mass_mg: protocol.massMg,
    predicted_cm_low: protocol.predCmLow,
    predicted_cm_high: protocol.predCmHigh,
    native_emission_nm: protocol.nativeEmissionNm,
    unfolded_emission_nm: protocol.unfoldedEmissionNm,
    experiment_grid: protocol.experimentGrid
  };

  const { data, error } = await supabase
    .from('protocols')
    .insert(row)
    .select('id, created_at')
    .single();

  if (error) throw error;
  return data;
}

/**
 * listProtocols — retrieves all protocols owned by a given user, most recent first.
 */
async function listProtocols(userId) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('protocols')
    .select(`
      id, created_at, updated_at, protein_name,
      trp_count, tyr_count, cys_count, disulfide_bonds,
      molecular_weight, epsilon, denaturant_type,
      predicted_cm_low, predicted_cm_high,
      native_emission_nm, unfolded_emission_nm
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * getProtocolById — retrieves a single full protocol by ID, verifying user ownership.
 */
async function getProtocolById(id, userId) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('protocols')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  generateProtocol,
  saveProtocol,
  listProtocols,
  getProtocolById
};
