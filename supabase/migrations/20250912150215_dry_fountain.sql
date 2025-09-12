/*
  # Add Electronic Data and Advanced Fields to Financial Tables

  1. New Columns Added
    - `dados_ele` (jsonb) - Electronic payment data
    - `id_autorizacao` (text) - Authorization ID
    - `eh_parcelado` (boolean) - Is installment payment
    - `total_parcelas` (integer) - Total number of installments
    - `numero_parcela` (integer) - Current installment number
    - `lancamento_pai_id` (uuid) - Parent transaction ID
    - `eh_recorrente` (boolean) - Is recurring payment
    - `periodicidade` (text) - Recurrence period
    - `frequencia_recorrencia` (integer) - Recurrence frequency
    - `data_inicio_recorrencia` (date) - Recurrence start date
    - `termino_apos_ocorrencias` (integer) - End after X occurrences
    - `termino_apos_data` (date) - End after specific date

  2. Tables Updated
    - contas_pagar
    - contas_receber

  3. Security
    - Maintains existing RLS policies
*/

-- Add columns to contas_pagar table
DO $$
BEGIN
  -- Electronic data fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'dados_ele'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN dados_ele jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'id_autorizacao'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN id_autorizacao text;
  END IF;

  -- Installment fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'eh_parcelado'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN eh_parcelado boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'total_parcelas'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN total_parcelas integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'numero_parcela'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN numero_parcela integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'lancamento_pai_id'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN lancamento_pai_id uuid;
  END IF;

  -- Recurrence fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'eh_recorrente'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN eh_recorrente boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'periodicidade'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN periodicidade text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'frequencia_recorrencia'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN frequencia_recorrencia integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'data_inicio_recorrencia'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN data_inicio_recorrencia date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'termino_apos_ocorrencias'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN termino_apos_ocorrencias integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'termino_apos_data'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN termino_apos_data date;
  END IF;
END $$;

-- Add columns to contas_receber table
DO $$
BEGIN
  -- Electronic data fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'dados_ele'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN dados_ele jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'id_autorizacao'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN id_autorizacao text;
  END IF;

  -- Installment fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'eh_parcelado'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN eh_parcelado boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'total_parcelas'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN total_parcelas integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'numero_parcela'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN numero_parcela integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'lancamento_pai_id'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN lancamento_pai_id uuid;
  END IF;

  -- Recurrence fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'eh_recorrente'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN eh_recorrente boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'periodicidade'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN periodicidade text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'frequencia_recorrencia'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN frequencia_recorrencia integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'data_inicio_recorrencia'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN data_inicio_recorrencia date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'termino_apos_ocorrencias'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN termino_apos_ocorrencias integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'termino_apos_data'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN termino_apos_data date;
  END IF;
END $$;

-- Add foreign key constraint for lancamento_pai_id in contas_pagar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contas_pagar_lancamento_pai_id_fkey'
  ) THEN
    ALTER TABLE contas_pagar 
    ADD CONSTRAINT contas_pagar_lancamento_pai_id_fkey 
    FOREIGN KEY (lancamento_pai_id) REFERENCES contas_pagar(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for lancamento_pai_id in contas_receber
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contas_receber_lancamento_pai_id_fkey'
  ) THEN
    ALTER TABLE contas_receber 
    ADD CONSTRAINT contas_receber_lancamento_pai_id_fkey 
    FOREIGN KEY (lancamento_pai_id) REFERENCES contas_receber(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_lancamento_pai ON contas_pagar(lancamento_pai_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_eh_parcelado ON contas_pagar(eh_parcelado);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_eh_recorrente ON contas_pagar(eh_recorrente);

CREATE INDEX IF NOT EXISTS idx_contas_receber_lancamento_pai ON contas_receber(lancamento_pai_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_eh_parcelado ON contas_receber(eh_parcelado);
CREATE INDEX IF NOT EXISTS idx_contas_receber_eh_recorrente ON contas_receber(eh_recorrente);