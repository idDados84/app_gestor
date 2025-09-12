/*
  # Add soft delete support to all tables

  1. New Columns
    - Add `deleted_at` column to all tables for soft delete functionality
    - Column type: timestamp with time zone, default NULL
    - NULL = active record, timestamp = soft deleted record

  2. Performance
    - Add indexes on deleted_at columns for efficient filtering
    - Optimize queries to exclude soft deleted records

  3. Security
    - Maintain existing RLS policies
    - Soft deleted records still respect access controls
*/

-- Add deleted_at column to all tables
DO $$
BEGIN
  -- usuarios table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_usuarios_deleted_at ON usuarios(deleted_at);
  END IF;

  -- grupos_empresas table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grupos_empresas' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE grupos_empresas ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_grupos_empresas_deleted_at ON grupos_empresas(deleted_at);
  END IF;

  -- empresas table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'empresas' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE empresas ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_empresas_deleted_at ON empresas(deleted_at);
  END IF;

  -- departamentos table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departamentos' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE departamentos ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_departamentos_deleted_at ON departamentos(deleted_at);
  END IF;

  -- categorias table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categorias' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE categorias ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_categorias_deleted_at ON categorias(deleted_at);
  END IF;

  -- participantes table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participantes' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE participantes ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_participantes_deleted_at ON participantes(deleted_at);
  END IF;

  -- formas_cobranca table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formas_cobranca' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE formas_cobranca ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_formas_cobranca_deleted_at ON formas_cobranca(deleted_at);
  END IF;

  -- contas_cobranca table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_cobranca' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE contas_cobranca ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_contas_cobranca_deleted_at ON contas_cobranca(deleted_at);
  END IF;

  -- contas_pagar table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_deleted_at ON contas_pagar(deleted_at);
  END IF;

  -- contas_receber table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_contas_receber_deleted_at ON contas_receber(deleted_at);
  END IF;

END $$;