-- SpectraFlow — Initial Database Schema
-- Run this migration in the Supabase SQL editor or via the Supabase CLI.

CREATE TABLE protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  protein_name TEXT,
  fasta_sequence TEXT NOT NULL,
  trp_count INTEGER NOT NULL,
  tyr_count INTEGER NOT NULL,
  phe_count INTEGER NOT NULL,
  cys_count INTEGER NOT NULL,
  disulfide_bonds INTEGER NOT NULL,
  molecular_weight NUMERIC NOT NULL,
  epsilon NUMERIC NOT NULL,
  denaturant_type TEXT NOT NULL DEFAULT 'urea',
  step_size NUMERIC NOT NULL DEFAULT 0.5,
  cuvette_volume INTEGER NOT NULL DEFAULT 1000,
  stock_multiplier INTEGER NOT NULL DEFAULT 10,
  replicates INTEGER NOT NULL DEFAULT 1,
  safety_margin NUMERIC NOT NULL DEFAULT 0.2,
  protein_form TEXT NOT NULL DEFAULT 'powder',
  working_conc_um NUMERIC NOT NULL,
  stock_conc_um NUMERIC NOT NULL,
  vol_per_tube_ul NUMERIC NOT NULL,
  total_stock_vol_ml NUMERIC NOT NULL,
  mass_mg NUMERIC,
  predicted_cm_low NUMERIC NOT NULL,
  predicted_cm_high NUMERIC NOT NULL,
  native_emission_nm INTEGER NOT NULL,
  unfolded_emission_nm INTEGER NOT NULL,
  experiment_grid JSONB NOT NULL
);

ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own protocols"
  ON protocols FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX protocols_user_id_idx ON protocols(user_id);
CREATE INDEX protocols_created_at_idx ON protocols(created_at DESC);
