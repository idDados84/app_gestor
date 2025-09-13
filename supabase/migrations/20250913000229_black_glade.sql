/*
  # Add Enhanced Fields to Accounts Tables

  1. Table Updates
    - Add new fields to `contas_pagar` table
    - Add new fields to `contas_receber` table
    - Create foreign key relationships

  2. New Fields Added
    - `conta_cobranca_id` (uuid) - Reference to contas_financeiras
    - `tipo_documento_id` (uuid) - Reference to tipos_documentos
    - `sku_parcela` (varchar) - Installment SKU
    - `intervalo_ini` (integer) - Initial interval for 1st installment
    - `intervalo_rec` (integer) - Recurring interval for subsequent installments
    - `n_docto_origem` (varchar) - Origin document number
    - `n_doctos_ref` (text[]) - Reference document numbers (array)
    - `projetos` (text[]) - Projects (array)
    - `eh_vencto_fixo` (boolean) - Fixed due date flag

  3. Foreign Keys
    - Link to contas_financeiras and tipos_documentos tables
*/

-- Add new fields to contas_pagar
DO $$
BEGIN
  -- Add conta_cobranca_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'conta_cobranca_id'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN conta_cobranca_id uuid;
  END IF;

  -- Add tipo_documento_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'tipo_documento_id'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN tipo_documento_id uuid;
  END IF;

  -- Add sku_parcela field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'sku_parcela'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN sku_parcela character varying(100);
  END IF;

  -- Add intervalo_ini field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'intervalo_ini'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN intervalo_ini integer DEFAULT 0;
  END IF;

  -- Add intervalo_rec field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'intervalo_rec'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN intervalo_rec integer DEFAULT 30;
  END IF;

  -- Add n_docto_origem field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'n_docto_origem'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN n_docto_origem character varying(100);
  END IF;

  -- Add n_doctos_ref field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'n_doctos_ref'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN n_doctos_ref text[];
  END IF;

  -- Add projetos field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'projetos'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN projetos text[];
  END IF;

  -- Add eh_vencto_fixo field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_pagar' AND column_name = 'eh_vencto_fixo'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN eh_vencto_fixo boolean DEFAULT false;
  END IF;
END $$;

-- Add new fields to contas_receber
DO $$
BEGIN
  -- Add conta_cobranca_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'conta_cobranca_id'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN conta_cobranca_id uuid;
  END IF;

  -- Add tipo_documento_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'tipo_documento_id'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN tipo_documento_id uuid;
  END IF;

  -- Add sku_parcela field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'sku_parcela'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN sku_parcela character varying(100);
  END IF;

  -- Add intervalo_ini field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'intervalo_ini'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN intervalo_ini integer DEFAULT 0;
  END IF;

  -- Add intervalo_rec field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'intervalo_rec'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN intervalo_rec integer DEFAULT 30;
  END IF;

  -- Add n_docto_origem field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'n_docto_origem'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN n_docto_origem character varying(100);
  END IF;

  -- Add n_doctos_ref field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'n_doctos_ref'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN n_doctos_ref text[];
  END IF;

  -- Add projetos field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'projetos'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN projetos text[];
  END IF;

  -- Add eh_vencto_fixo field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'eh_vencto_fixo'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN eh_vencto_fixo boolean DEFAULT false;
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  -- Foreign key for contas_pagar -> contas_financeiras
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contas_pagar_conta_cobranca_id_fkey'
  ) THEN
    ALTER TABLE contas_pagar 
    ADD CONSTRAINT contas_pagar_conta_cobranca_id_fkey 
    FOREIGN KEY (conta_cobranca_id) REFERENCES contas_financeiras(id) ON DELETE SET NULL;
  END IF;

  -- Foreign key for contas_pagar -> tipos_documentos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contas_pagar_tipo_documento_id_fkey'
  ) THEN
    ALTER TABLE contas_pagar 
    ADD CONSTRAINT contas_pagar_tipo_documento_id_fkey 
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documentos(id) ON DELETE SET NULL;
  END IF;

  -- Foreign key for contas_receber -> contas_financeiras
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contas_receber_conta_cobranca_id_fkey'
  ) THEN
    ALTER TABLE contas_receber 
    ADD CONSTRAINT contas_receber_conta_cobranca_id_fkey 
    FOREIGN KEY (conta_cobranca_id) REFERENCES contas_financeiras(id) ON DELETE SET NULL;
  END IF;

  -- Foreign key for contas_receber -> tipos_documentos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contas_receber_tipo_documento_id_fkey'
  ) THEN
    ALTER TABLE contas_receber 
    ADD CONSTRAINT contas_receber_tipo_documento_id_fkey 
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documentos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_cobranca ON contas_pagar(conta_cobranca_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_tipo_documento ON contas_pagar(tipo_documento_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_sku_parcela ON contas_pagar(sku_parcela);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_n_docto_origem ON contas_pagar(n_docto_origem);

CREATE INDEX IF NOT EXISTS idx_contas_receber_conta_cobranca ON contas_receber(conta_cobranca_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_tipo_documento ON contas_receber(tipo_documento_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_sku_parcela ON contas_receber(sku_parcela);
CREATE INDEX IF NOT EXISTS idx_contas_receber_n_docto_origem ON contas_receber(n_docto_origem);