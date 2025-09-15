/*
  # Reestruturação Completa dos Campos Financeiros

  1. Alterações nas Tabelas
    - Renomear campo `valor` para `valor_parcela` em contas_pagar e contas_receber
    - Adicionar 8 novos campos financeiros:
      - valor_operacao: Valor base da operação
      - valor_juros: Juros aplicados
      - valor_multas: Multas por atraso
      - valor_atualizacao: Correção monetária
      - valor_descontos: Descontos concedidos
      - valor_abto: Abatimentos (compensações)
      - valor_pagto: Pagamentos realizados
      - valor_financeiro: Saldo calculado automaticamente

  2. Triggers e Funções
    - Função para cálculo automático do valor_financeiro
    - Triggers para recalcular valor_financeiro em INSERT/UPDATE

  3. Validações
    - Constraints para garantir valores não negativos
    - Validação de integridade dos cálculos

  4. Índices
    - Índices para otimizar consultas nos novos campos
*/

-- Função para calcular valor_financeiro automaticamente
CREATE OR REPLACE FUNCTION calculate_valor_financeiro()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular valor_financeiro usando a fórmula:
  -- valor_financeiro = valor_operacao + valor_juros + valor_multas + valor_atualizacao - valor_descontos - valor_abto - valor_pagto
  NEW.valor_financeiro = COALESCE(NEW.valor_operacao, 0) 
                       + COALESCE(NEW.valor_juros, 0) 
                       + COALESCE(NEW.valor_multas, 0) 
                       + COALESCE(NEW.valor_atualizacao, 0) 
                       - COALESCE(NEW.valor_descontos, 0) 
                       - COALESCE(NEW.valor_abto, 0) 
                       - COALESCE(NEW.valor_pagto, 0);
  
  -- Se não há valor_parcela definido, usar valor_financeiro
  IF NEW.valor_parcela IS NULL OR NEW.valor_parcela = 0 THEN
    NEW.valor_parcela = NEW.valor_financeiro;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reestruturar tabela contas_pagar
DO $$
BEGIN
  -- Adicionar novos campos se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_operacao') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_operacao NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_juros') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_juros NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_multas') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_multas NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_atualizacao') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_atualizacao NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_descontos') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_descontos NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_abto') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_abto NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_pagto') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_pagto NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_financeiro') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_financeiro NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  -- Renomear campo valor para valor_parcela se ainda não foi renomeado
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_parcela') THEN
    ALTER TABLE contas_pagar RENAME COLUMN valor TO valor_parcela;
  END IF;
  
  -- Se valor_parcela não existe mas valor existe, criar valor_parcela baseado em valor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor_parcela') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'valor') THEN
    ALTER TABLE contas_pagar ADD COLUMN valor_parcela NUMERIC(15,2) DEFAULT 0 NOT NULL;
    UPDATE contas_pagar SET valor_parcela = valor WHERE valor_parcela = 0;
  END IF;
END $$;

-- Reestruturar tabela contas_receber
DO $$
BEGIN
  -- Adicionar novos campos se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_operacao') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_operacao NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_juros') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_juros NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_multas') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_multas NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_atualizacao') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_atualizacao NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_descontos') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_descontos NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_abto') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_abto NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_pagto') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_pagto NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_financeiro') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_financeiro NUMERIC(15,2) DEFAULT 0 NOT NULL;
  END IF;
  
  -- Renomear campo valor para valor_parcela se ainda não foi renomeado
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_parcela') THEN
    ALTER TABLE contas_receber RENAME COLUMN valor TO valor_parcela;
  END IF;
  
  -- Se valor_parcela não existe mas valor existe, criar valor_parcela baseado em valor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor_parcela') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'valor') THEN
    ALTER TABLE contas_receber ADD COLUMN valor_parcela NUMERIC(15,2) DEFAULT 0 NOT NULL;
    UPDATE contas_receber SET valor_parcela = valor WHERE valor_parcela = 0;
  END IF;
END $$;

-- Migrar dados existentes para a nova estrutura
UPDATE contas_pagar 
SET valor_operacao = COALESCE(valor_parcela, 0),
    valor_financeiro = COALESCE(valor_parcela, 0)
WHERE valor_operacao = 0;

UPDATE contas_receber 
SET valor_operacao = COALESCE(valor_parcela, 0),
    valor_financeiro = COALESCE(valor_parcela, 0)
WHERE valor_operacao = 0;

-- Adicionar constraints de validação
ALTER TABLE contas_pagar 
ADD CONSTRAINT IF NOT EXISTS contas_pagar_valores_positivos 
CHECK (
  valor_operacao >= 0 AND 
  valor_juros >= 0 AND 
  valor_multas >= 0 AND 
  valor_atualizacao >= 0 AND 
  valor_descontos >= 0 AND 
  valor_abto >= 0 AND 
  valor_pagto >= 0 AND
  valor_parcela >= 0
);

ALTER TABLE contas_receber 
ADD CONSTRAINT IF NOT EXISTS contas_receber_valores_positivos 
CHECK (
  valor_operacao >= 0 AND 
  valor_juros >= 0 AND 
  valor_multas >= 0 AND 
  valor_atualizacao >= 0 AND 
  valor_descontos >= 0 AND 
  valor_abto >= 0 AND 
  valor_pagto >= 0 AND
  valor_parcela >= 0
);

-- Criar triggers para cálculo automático
DROP TRIGGER IF EXISTS calculate_valor_financeiro_contas_pagar ON contas_pagar;
CREATE TRIGGER calculate_valor_financeiro_contas_pagar
  BEFORE INSERT OR UPDATE ON contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION calculate_valor_financeiro();

DROP TRIGGER IF EXISTS calculate_valor_financeiro_contas_receber ON contas_receber;
CREATE TRIGGER calculate_valor_financeiro_contas_receber
  BEFORE INSERT OR UPDATE ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION calculate_valor_financeiro();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_financeiro ON contas_pagar(valor_financeiro);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_operacao ON contas_pagar(valor_operacao);
CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_financeiro ON contas_receber(valor_financeiro);
CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_operacao ON contas_receber(valor_operacao);