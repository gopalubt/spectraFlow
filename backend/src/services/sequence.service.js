/**
 * SpectraFlow — Sequence Analysis Service
 * All biochemistry calculations live here as pure functions.
 */

// Monoisotopic residue masses (Da) for the 20 standard amino acids.
// Source: Roepstorff & Fohlman (1984), as tabulated in Proteomics literature.
const RESIDUE_MASSES = {
  A: 71.03711,
  R: 156.10111,
  N: 114.04293,
  D: 115.02694,
  C: 103.00919,
  Q: 128.05858,
  E: 129.04259,
  G: 57.02146,
  H: 137.05891,
  I: 113.08406,
  L: 113.08406,
  K: 128.09496,
  M: 131.04049,
  F: 147.06841,
  P: 97.05276,
  S: 87.03203,
  T: 101.04768,
  W: 186.07931,
  Y: 163.06333,
  V: 99.06841
};

// Mass of water added back for the full polypeptide chain.
// Source: Standard biochemistry; each peptide bond loses H2O, one molecule is added back.
const WATER_MASS = 18.01056;

/**
 * parseFasta — strips FASTA header lines (lines beginning with '>') and
 * comment/blank lines, then returns a single clean uppercase sequence string.
 * Handles both single-entry and multi-entry FASTA (concatenates all sequences).
 */
function parseFasta(fasta) {
  if (!fasta || typeof fasta !== 'string') {
    throw new Error('Invalid FASTA input: must be a non-empty string');
  }
  const lines = fasta.split('\n');
  const sequenceLines = lines
    .filter(line => line.trim() !== '' && !line.trim().startsWith('>') && !line.trim().startsWith(';'))
    .map(line => line.trim().toUpperCase());
  const sequence = sequenceLines.join('');
  if (sequence.length === 0) {
    throw new Error('No sequence data found in FASTA input');
  }
  // Validate that only standard amino acid characters are present
  const invalidChars = sequence.replace(/[ACDEFGHIKLMNPQRSTVWY]/g, '');
  if (invalidChars.length > 0) {
    throw new Error(`Invalid amino acid characters found: ${[...new Set(invalidChars)].join(', ')}`);
  }
  return sequence;
}

/**
 * countResidues — tallies the number of Trp (W), Tyr (Y), Phe (F), and Cys (C)
 * residues in a clean amino acid sequence, plus total length.
 */
function countResidues(sequence) {
  let trp = 0, tyr = 0, phe = 0, cys = 0;
  for (const aa of sequence) {
    if (aa === 'W') trp++;
    else if (aa === 'Y') tyr++;
    else if (aa === 'F') phe++;
    else if (aa === 'C') cys++;
  }
  return { trp, tyr, phe, cys, length: sequence.length };
}

/**
 * calculateMW — computes the molecular weight (Da) of a polypeptide.
 * Formula: MW = Σ(residue masses) + H2O
 * Source: Gasteiger et al. (2005), ExPASy Proteomics Server.
 */
function calculateMW(sequence) {
  let mass = WATER_MASS;
  for (const aa of sequence) {
    const residueMass = RESIDUE_MASSES[aa];
    if (residueMass === undefined) {
      throw new Error(`Unknown amino acid: ${aa}`);
    }
    mass += residueMass;
  }
  return mass;
}

/**
 * calculateEpsilon — molar extinction coefficient at 280 nm using the Pace equation.
 * Formula: ε₂₈₀ = (Trp × 5500) + (Tyr × 1490) + (disulfideBonds × 125)
 *   where disulfideBonds = Math.floor(cysCount / 2)
 * Source: Pace et al. (1995) Protein Science 4:2411–2423.
 */
function calculateEpsilon(trp, tyr, disulfideBonds) {
  // Pace 1995: each Trp contributes 5500, each Tyr 1490, each disulfide 125 M⁻¹cm⁻¹
  return (trp * 5500) + (tyr * 1490) + (disulfideBonds * 125);
}

/**
 * calculateWorkingConc — determines safe working concentrations using Beer-Lambert law.
 * Beer-Lambert: A = ε × c × l  →  c = A / (ε × l), l = 1 cm
 * Target absorbance = 0.2 AU (optimal for accuracy without detector saturation).
 * Safe range: 0.1–0.8 AU.
 * Source: Beer (1852) / Lambert (1760); practical limits from Pace et al. (1995).
 *
 * Returns concentrations in μM (micromolar).
 */
function calculateWorkingConc(epsilon) {
  if (!epsilon || epsilon <= 0) {
    throw new Error('Epsilon must be a positive number');
  }
  // c (M) = A / ε, convert to μM by multiplying by 1e6
  const workingConc = (0.2 / epsilon) * 1e6;   // target: A = 0.2
  const safeMin = (0.1 / epsilon) * 1e6;        // lower safe limit: A = 0.1
  const safeMax = (0.8 / epsilon) * 1e6;        // upper safe limit: A = 0.8
  return { workingConc, safeMin, safeMax };
}

/**
 * calculateStockPrep — calculates stock solution preparation parameters.
 * Uses C1V1 = C2V2 dilution principle.
 * Source: Standard laboratory dilution mathematics.
 *
 * Params:
 *   workingConc    — desired working concentration (μM)
 *   stockMultiplier — fold-concentration of stock over working (e.g. 10 for 10×)
 *   cuvVolumeUl    — cuvette volume in μL (typically 1000)
 *   denaturantSteps — number of denaturant concentration steps
 *   replicates     — number of replicates per step
 *   safetyMargin   — fractional safety margin (e.g. 0.2 for 20% extra)
 *   molecularWeight — protein MW in Da
 *   proteinForm    — 'powder' or 'solution'
 */
function calculateStockPrep({
  workingConc,
  stockMultiplier,
  cuvVolumeUl,
  denaturantSteps,
  replicates,
  safetyMargin,
  molecularWeight
}) {
  // Stock concentration is stockMultiplier times the working concentration
  const stockConc = workingConc * stockMultiplier;

  // C1V1 = C2V2  →  V1 = (C2 × V2) / C1
  // volPerTube is the volume of stock to add to each tube (μL)
  const volPerTube = (workingConc * cuvVolumeUl) / stockConc;

  const totalTubes = denaturantSteps * replicates;

  // Total raw stock volume in mL
  const rawStockVol = (totalTubes * volPerTube) / 1000;

  // Add safety margin, then round up to nearest 0.5 mL
  const withMargin = rawStockVol * (1 + safetyMargin);
  const finalStockVol = Math.ceil(withMargin / 0.5) * 0.5;

  // Mass required (mg) = concentration (μM) × volume (mL) × MW (Da) × unit conversion
  // μM × mL = nmol; nmol × MW (g/mol) × 1e-6 = mg
  // Equivalently: stockConc (μM) × 1e-6 (mol/μmol) × finalStockVol (mL) × 1e-3 (L/mL) × MW (g/mol) × 1000 (mg/g)
  const massMg = stockConc * finalStockVol * molecularWeight * 1e-6;

  return {
    stockConc,
    volPerTube,
    totalTubes,
    rawStockVol,
    finalStockVol,
    massMg
  };
}

/**
 * generateExperimentGrid — generates a list of denaturant concentration steps
 * with per-step volumes and priority flags.
 *
 * Max concentrations: Urea = 8 M, GdnHCl = 6 M
 * Predicted Cm (midpoint of unfolding) heuristic based on disulfide bond count:
 *   disulfideBonds >= 10 → predCmLow = 3.5
 *   disulfideBonds >= 4  → predCmLow = 2.5
 *   else                 → predCmLow = 1.5
 * Focus window: [predCmLow − 0.5, predCmHigh + 0.5]
 * Flags:
 *   'caution' — near solubility limit (Urea > 7 M, GdnHCl > 5.5 M)
 *   'focus'   — within the predicted Cm window
 *   'run'     — standard data point
 *
 * Source: Pace (1986) Methods Enzymol 131:266–280; practical experience.
 */
function generateExperimentGrid({
  denaturantType,
  stepSize,
  disulfideBonds,
  workingConc,
  stockConc,
  cuvVolumeUl,
  stockMultiplier
}) {
  const maxM = denaturantType === 'gdnhcl' ? 6 : 8;

  // Predicted unfolding midpoint (Cm) heuristic
  const predCmLow = disulfideBonds >= 10 ? 3.5 : disulfideBonds >= 4 ? 2.5 : 1.5;
  const predCmHigh = predCmLow + 1.0;
  const focusLow = predCmLow - 0.5;
  const focusHigh = predCmHigh + 0.5;

  const steps = [];
  // Round maxM / stepSize to avoid floating-point issues
  const numSteps = Math.round(maxM / stepSize) + 1;

  for (let i = 0; i < numSteps; i++) {
    // Round each concentration to avoid floating-point drift
    const m = Math.round(i * stepSize * 1000) / 1000;

    let flag;
    if ((denaturantType === 'urea' && m > 7) || (denaturantType === 'gdnhcl' && m > 5.5)) {
      flag = 'caution';
    } else if (m >= focusLow && m <= focusHigh) {
      flag = 'focus';
    } else {
      flag = 'run';
    }

    // Volume of protein stock to add per tube (μL) — same for every step
    const proteinVol = (workingConc * cuvVolumeUl) / stockConc;

    // Denaturant stock is typically prepared as a separate concentrated solution;
    // here we record the conceptual fraction of cuvette volume that is denaturant.
    // For the grid we express denaturant volume as fraction of total cuvette volume.
    // Actual denaturant stock preparation is handled by the lab protocol separately.
    const denaturantFraction = m / maxM;
    const denaturantVol = Math.round(denaturantFraction * (cuvVolumeUl - proteinVol) * 10) / 10;

    steps.push({
      concentration: m,
      flag,
      proteinVol: Math.round(proteinVol * 100) / 100,
      denaturantVol,
      expectedSignal: m === 0
        ? 'native emission'
        : m >= maxM
          ? 'unfolded emission'
          : flag === 'focus'
            ? 'transition region — high data density recommended'
            : 'intermediate'
    });
  }

  return { steps, predCmLow, predCmHigh };
}

/**
 * predictEmission — estimates native and unfolded tryptophan fluorescence emission peaks.
 * Proteins with more disulfide bonds (more compact/buried Trp) tend to have
 * blue-shifted native emission compared to loosely packed proteins.
 * Source: Lakowicz (2006) Principles of Fluorescence Spectroscopy, 3rd ed., Ch. 16.
 */
function predictEmission(disulfideBonds) {
  let nativePeak, unfoldedPeak;

  if (disulfideBonds >= 4) {
    // Highly disulfide-bonded: Trp more buried → blue-shifted native emission
    nativePeak = 330;
    unfoldedPeak = 355;
  } else {
    // Fewer disulfides: Trp more solvent-exposed at native state
    nativePeak = 340;
    unfoldedPeak = 358;
  }

  const redShift = unfoldedPeak - nativePeak;
  return { nativePeak, unfoldedPeak, redShift };
}

/**
 * analyseSequence — master function that orchestrates all analyses for a given FASTA input.
 * Returns a comprehensive analysis object used by both the API and the protocol generator.
 */
function analyseSequence(fasta) {
  const sequence = parseFasta(fasta);
  const { trp, tyr, phe, cys, length: seqLength } = countResidues(sequence);
  const disulfideBonds = Math.floor(cys / 2);
  const molecularWeight = calculateMW(sequence);
  const epsilon = calculateEpsilon(trp, tyr, disulfideBonds);
  const { workingConc, safeMin, safeMax } = calculateWorkingConc(epsilon);
  const emission = predictEmission(disulfideBonds);

  return {
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
    ...emission
  };
}

module.exports = {
  parseFasta,
  countResidues,
  calculateMW,
  calculateEpsilon,
  calculateWorkingConc,
  calculateStockPrep,
  generateExperimentGrid,
  predictEmission,
  analyseSequence
};
