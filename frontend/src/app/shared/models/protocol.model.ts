export interface ExperimentStep {
  concentration: number;
  flag: 'run' | 'focus' | 'caution';
  proteinVol: number;
  denaturantVol: number;
  expectedSignal: string;
}

export interface Protocol {
  id?: string;
  proteinName?: string;
  fastaSequence: string;
  sequence?: string;
  seqLength?: number;
  trpCount: number;
  tyrCount: number;
  pheCount: number;
  cysCount: number;
  disulfideBonds: number;
  molecularWeight: number;
  epsilon: number;
  denaturantType: string;
  stepSize: number;
  cuvVolumeUl: number;
  stockMultiplier: number;
  replicates: number;
  safetyMargin: number;
  proteinForm: string;
  workingConcUm: number;
  safeMinUm: number;
  safeMaxUm: number;
  stockConcUm: number;
  volPerTubeUl: number;
  totalTubes: number;
  rawStockVolMl: number;
  totalStockVolMl: number;
  massMg: number;
  predCmLow: number;
  predCmHigh: number;
  nativeEmissionNm: number;
  unfoldedEmissionNm: number;
  redShift: number;
  experimentGrid: ExperimentStep[];
  createdAt?: string;
}
