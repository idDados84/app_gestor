/*
  # Add valor_abto column to contas_receber table

  1. New Column
    - `valor_abto` (numeric(15,2), nullable, default 0)
      - Abatimentos (compensações/devoluções)

  2. Security
    - No changes to RLS policies needed
*/

-- Add valor_abto column to contas_receber table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'valor_abto'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_abto numeric(15,2) DEFAULT 0;
  END IF;
END $$;