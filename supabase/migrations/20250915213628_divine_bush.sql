/*
  # Reestruturação de Campos Financeiros - Contas a Pagar e Receber

  ## Objetivo
  Expandir o modelo de dados para suporte a controle financeiro granular, substituindo o campo único "valor" por 9 campos específicos.

  ## 1. Alterações nas Tabelas
  ### Contas a Pagar:
  - Renomear: `valor` → `valor_parcela`
  - Adicionar: 8 novos campos financeiros
  
  ### Contas a Receber:
  - Renomear: `valor` → `valor_parcela`  
  - Adicionar: 8 novos campos financeiros

  ## 2. Novos Campos
  - `valor_operacao`: Valor base da operação (sem acréscimos/descontos)
  - `valor_juros`: Juros aplicados
  - `valor_multas`: Multas aplicadas
  - `valor_atualizacao`: Correções monetárias
  - `valor_descontos`: Descontos concedidos
  - `valor_abto`: Abatimentos (compensações, devoluções)
  - `valor_pagto`: Pagamentos realizados
  - `valor_financeiro`: Saldo calculado automaticamente

  ## 3. Triggers
  - Trigger para cálculo automático do valor_financeiro
  - Fórmula: valor_operacao + valor_juros + valor_multas + valor_atualizacao - valor_descontos - valor_abto - valor_pagto

  ## 4. Validações
  - Campos numéricos não negativos (exceto descontos/abatimentos)
  - valor_financeiro deve ser >= 0
  - Integridade de parcelamento preservada
*/

-- Função para calcular valor_financeiro automaticamente
CREATE OR REPLACE FUNCTION calculate_valor_financeiro()
RETURNS TRIGGER AS $$
BEGIN
  NEW.valor_financeiro = COALESCE(NEW.valor_operacao, 0) 
                       + COALESCE(NEW.valor_juros, 0)
                       + COALESCE(NEW.valor_multas, 0) 
                       + COALESCE(NEW.valor_atualizacao, 0)
                       - COALESCE(NEW.valor_descontos, 0)
                       - COALESCE(NEW.valor_abto, 0)
                       - COALESCE(NEW.valor_pagto, 0);
  
  -- Garantir que valor_financeiro não seja negativo
  IF NEW.valor_financeiro < 0 THEN
    NEW.valor_financeiro = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- REESTRUTURAÇÃO TABELA CONTAS_PAGAR
-- ========================================

-- Adicionar novos campos financeiros
DO $$
BEGIN
  -- valor_operacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_operacao'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_operacao NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_juros
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_juros'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_multas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_multas'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_multas NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_atualizacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_atualizacao'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_atualizacao NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_descontos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_descontos'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_descontos NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_abto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_abto'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_abto NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_pagto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_pagto'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_pagto NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_financeiro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor_financeiro'
  ) THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_financeiro NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Migrar dados existentes: valor → valor_operacao e valor_parcela
UPDATE contas_pagar 
SET valor_operacao = valor, 
    valor_financeiro = valor
WHERE valor_operacao = 0;

-- Renomear coluna valor para valor_parcela (se ainda não foi renomeada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' AND column_name = 'valor'
  ) THEN
    ALTER TABLE contas_pagar RENAME COLUMN valor TO valor_parcela;
  END IF;
END $$;

-- Criar trigger para cálculo automático
DROP TRIGGER IF EXISTS trigger_calculate_valor_financeiro_contas_pagar ON contas_pagar;
CREATE TRIGGER trigger_calculate_valor_financeiro_contas_pagar
  BEFORE INSERT OR UPDATE ON contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION calculate_valor_financeiro();

-- ========================================
-- REESTRUTURAÇÃO TABELA CONTAS_RECEBER  
-- ========================================

-- Adicionar novos campos financeiros
DO $$
BEGIN
  -- valor_operacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_operacao'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_operacao NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_juros
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_juros'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_multas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_multas'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_multas NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_atualizacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_atualizacao'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_atualizacao NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_descontos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_descontos'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_descontos NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_abto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_abto'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_abto NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_pagto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_pagto'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_pagto NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- valor_financeiro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor_financeiro'
  ) THEN
    ALTER TABLE contas_receber ADD COLUMN valor_financeiro NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Migrar dados existentes: valor → valor_operacao e valor_parcela
UPDATE contas_receber 
SET valor_operacao = valor, 
    valor_financeiro = valor
WHERE valor_operacao = 0;

-- Renomear coluna valor para valor_parcela (se ainda não foi renomeada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_receber' AND column_name = 'valor'
  ) THEN
    ALTER TABLE contas_receber RENAME COLUMN valor TO valor_parcela;
  END IF;
END $$;

-- Criar trigger para cálculo automático
DROP TRIGGER IF EXISTS trigger_calculate_valor_financeiro_contas_receber ON contas_receber;
CREATE TRIGGER trigger_calculate_valor_financeiro_contas_receber
  BEFORE INSERT OR UPDATE ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION calculate_valor_financeiro();

-- ========================================
-- CONSTRAINTS E VALIDAÇÕES
-- ========================================

-- Constraints para contas_pagar
ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_operacao_positive 
CHECK (valor_operacao >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_juros_positive 
CHECK (valor_juros >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_multas_positive 
CHECK (valor_multas >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_atualizacao_positive 
CHECK (valor_atualizacao >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_descontos_positive 
CHECK (valor_descontos >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_abto_positive 
CHECK (valor_abto >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_pagto_positive 
CHECK (valor_pagto >= 0);

ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS check_valor_parcela_positive 
CHECK (valor_parcela >= 0);

-- Constraints para contas_receber
ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_operacao_positive 
CHECK (valor_operacao >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_juros_positive 
CHECK (valor_juros >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_multas_positive 
CHECK (valor_multas >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_atualizacao_positive 
CHECK (valor_atualizacao >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_descontos_positive 
CHECK (valor_descontos >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_abto_positive 
CHECK (valor_abto >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_pagto_positive 
CHECK (valor_pagto >= 0);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS check_valor_parcela_positive 
CHECK (valor_parcela >= 0);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_financeiro 
ON contas_pagar (valor_financeiro);

CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_financeiro 
ON contas_receber (valor_financeiro);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_operacao 
ON contas_pagar (valor_operacao);

CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_operacao 
ON contas_receber (valor_operacao);