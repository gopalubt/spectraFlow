export interface SequenceAnalysis {
  trp: number;
  tyr: number;
  phe: number;
  cys: number;
  disulfideBonds: number;
  molecularWeight: number;
  epsilon: number;
  seqLength: number;
  workingConcUm: number;
  safeMinUm: number;
  safeMaxUm: number;
  nativeEmissionNm: number;
  unfoldedEmissionNm: number;
  redShift: number;
}
