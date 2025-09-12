/*
  # Criar Tabelas Separadas - Contas a Pagar e Contas a Receber

  1. Novas Tabelas
    - `contas_pagar` - Contas a pagar específicas
    - `contas_receber` - Contas a receber específicas

  2. Segurança
    - RLS habilitado em ambas as tabelas
    - Políticas de acesso para usuários autenticados

  3. Índices
    - Índices para melhor performance nas consultas
*/

-- Criar tabela de contas a pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  fornecedor_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  departamento_id uuid REFERENCES departamentos(id) ON DELETE SET NULL,
  forma_cobranca_id uuid REFERENCES formas_cobranca(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  valor decimal(15,2) NOT NULL,
  status text CHECK (status IN ('pendente', 'pago', 'cancelado')) DEFAULT 'pendente',
  data_vencimento date NOT NULL,
  data_pagamento date,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de contas a receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  departamento_id uuid REFERENCES departamentos(id) ON DELETE SET NULL,
  forma_cobranca_id uuid REFERENCES formas_cobranca(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  valor decimal(15,2) NOT NULL,
  status text CHECK (status IN ('pendente', 'recebido', 'cancelado')) DEFAULT 'pendente',
  data_vencimento date NOT NULL,
  data_recebimento date,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Contas a pagar - acesso completo"
  ON contas_pagar FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Contas a receber - acesso completo"
  ON contas_receber FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa ON contas_pagar(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa ON contas_receber(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);

-- Inserir dados de exemplo para contas a pagar
INSERT INTO contas_pagar (
  empresa_id, fornecedor_id, categoria_id, departamento_id, forma_cobranca_id,
  descricao, valor, status, data_vencimento, observacoes
)
SELECT 
  e.id,
  p.id,
  c.id,
  d.id,
  f.id,
  'Pagamento a fornecedor - ' || generate_series,
  ROUND((RANDOM() * 5000 + 500)::numeric, 2),
  CASE 
    WHEN generate_series % 3 = 0 THEN 'pendente'
    WHEN generate_series % 3 = 1 THEN 'pago'
    ELSE 'pendente'
  END,
  CURRENT_DATE + (RANDOM() * 90)::integer,
  CASE 
    WHEN (generate_series % 4) = 0 THEN 'Pagamento urgente'
    ELSE NULL
  END
FROM generate_series(1, 30) AS generate_series
CROSS JOIN (SELECT id FROM empresas LIMIT 5) e
CROSS JOIN (SELECT id FROM participantes WHERE tipo IN ('fornecedor', 'ambos') LIMIT 10) p
CROSS JOIN (SELECT id FROM categorias WHERE tipo IN ('despesa', 'ambos') LIMIT 5) c
CROSS JOIN (SELECT id FROM departamentos LIMIT 5) d
CROSS JOIN (SELECT id FROM formas_cobranca LIMIT 3) f
LIMIT 30;

-- Inserir dados de exemplo para contas a receber
INSERT INTO contas_receber (
  empresa_id, cliente_id, categoria_id, departamento_id, forma_cobranca_id,
  descricao, valor, status, data_vencimento, observacoes
)
SELECT 
  e.id,
  p.id,
  c.id,
  d.id,
  f.id,
  'Recebimento de cliente - ' || generate_series,
  ROUND((RANDOM() * 8000 + 1000)::numeric, 2),
  CASE 
    WHEN generate_series % 3 = 0 THEN 'pendente'
    WHEN generate_series % 3 = 1 THEN 'recebido'
    ELSE 'pendente'
  END,
  CURRENT_DATE + (RANDOM() * 60)::integer,
  CASE 
    WHEN (generate_series % 5) = 0 THEN 'Cliente preferencial'
    ELSE NULL
  END
FROM generate_series(1, 40) AS generate_series
CROSS JOIN (SELECT id FROM empresas LIMIT 5) e
CROSS JOIN (SELECT id FROM participantes WHERE tipo IN ('cliente', 'ambos') LIMIT 10) p
CROSS JOIN (SELECT id FROM categorias WHERE tipo IN ('receita', 'ambos') LIMIT 5) c
CROSS JOIN (SELECT id FROM departamentos LIMIT 5) d
CROSS JOIN (SELECT id FROM formas_cobranca LIMIT 3) f
LIMIT 40;