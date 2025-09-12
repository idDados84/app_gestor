/*
  # Remove coluna "Término após (data)" e ajusta validações

  1. Alterações nas Tabelas
    - Remove coluna `termino_apos_data` de `contas_pagar`
    - Remove coluna `termino_apos_data` de `contas_receber`
    - Adiciona constraint para validar `termino_apos_ocorrencias > 0`

  2. Validações
    - Campo `termino_apos_ocorrencias` deve ser > 0 quando preenchido
    - Remove referências à coluna `termino_apos_data`

  3. Limpeza
    - Remove qualquer lógica relacionada à data de término
*/

-- Primeiro, vamos verificar se existem dados na coluna termino_apos_data
-- e migrar se necessário (definindo um valor padrão para termino_apos_ocorrencias se estiver null)

-- Para contas_pagar: definir valor padrão de 12 ocorrências se termino_apos_ocorrencias for null
-- mas termino_apos_data estiver preenchido
DO $$
BEGIN
  UPDATE contas_pagar 
  SET termino_apos_ocorrencias = 12 
  WHERE termino_apos_ocorrencias IS NULL 
    AND termino_apos_data IS NOT NULL 
    AND eh_recorrente = true;
END $$;

-- Para contas_receber: mesmo tratamento
DO $$
BEGIN
  UPDATE contas_receber 
  SET termino_apos_ocorrencias = 12 
  WHERE termino_apos_ocorrencias IS NULL 
    AND termino_apos_data IS NOT NULL 
    AND eh_recorrente = true;
END $$;

-- Remover a coluna termino_apos_data da tabela contas_pagar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'termino_apos_data'
  ) THEN
    ALTER TABLE contas_pagar DROP COLUMN termino_apos_data;
  END IF;
END $$;

-- Remover a coluna termino_apos_data da tabela contas_receber
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'termino_apos_data'
  ) THEN
    ALTER TABLE contas_receber DROP COLUMN termino_apos_data;
  END IF;
END $$;

-- Adicionar constraint para validar termino_apos_ocorrencias > 0 em contas_pagar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'contas_pagar' 
    AND constraint_name = 'contas_pagar_termino_apos_ocorrencias_check'
  ) THEN
    ALTER TABLE contas_pagar 
    ADD CONSTRAINT contas_pagar_termino_apos_ocorrencias_check 
    CHECK (termino_apos_ocorrencias IS NULL OR termino_apos_ocorrencias > 0);
  END IF;
END $$;

-- Adicionar constraint para validar termino_apos_ocorrencias > 0 em contas_receber
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'contas_receber' 
    AND constraint_name = 'contas_receber_termino_apos_ocorrencias_check'
  ) THEN
    ALTER TABLE contas_receber 
    ADD CONSTRAINT contas_receber_termino_apos_ocorrencias_check 
    CHECK (termino_apos_ocorrencias IS NULL OR termino_apos_ocorrencias > 0);
  END IF;
END $$;