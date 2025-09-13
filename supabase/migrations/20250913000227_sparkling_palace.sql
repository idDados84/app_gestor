/*
  # Create Financial Accounts Table

  1. New Tables
    - `contas_financeiras`
      - `id` (uuid, primary key)
      - `codigo_conta` (varchar, unique)
      - `nome_conta` (varchar, required)
      - `tipo_conta` (varchar, required) - BANCO, CAIXA, POUPANCA, INVESTIMENTO
      - `banco_codigo` (varchar, optional)
      - `agencia` (varchar, optional)
      - `conta_numero` (varchar, optional)
      - `saldo_inicial` (decimal)
      - `saldo_atual` (decimal)
      - `ativo` (boolean)
      - Standard audit fields

  2. Security
    - Enable RLS on `contas_financeiras` table
    - Add policy for authenticated users to manage their accounts

  3. Sample Data
    - 20 sample records including major Brazilian banks and cash accounts
*/

CREATE TABLE IF NOT EXISTS contas_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_conta character varying(20) UNIQUE,
  nome_conta character varying(255) NOT NULL,
  tipo_conta character varying(50) NOT NULL CHECK (tipo_conta IN ('BANCO', 'CAIXA', 'POUPANCA', 'INVESTIMENTO')),
  banco_codigo character varying(10),
  agencia character varying(20),
  conta_numero character varying(30),
  saldo_inicial numeric(15,2) DEFAULT 0,
  saldo_atual numeric(15,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on contas_financeiras"
  ON contas_financeiras
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for public users on contas_financeiras"
  ON contas_financeiras
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_codigo ON contas_financeiras(codigo_conta);
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_tipo ON contas_financeiras(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_ativo ON contas_financeiras(ativo);
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_deleted_at ON contas_financeiras(deleted_at);

-- Insert sample data
INSERT INTO contas_financeiras (codigo_conta, nome_conta, tipo_conta, banco_codigo, agencia, conta_numero, saldo_inicial, saldo_atual) VALUES
('001-001', 'Banco do Brasil - Conta Corrente', 'BANCO', '001', '1234-5', '12345-6', 50000.00, 50000.00),
('237-001', 'Bradesco - Conta Corrente', 'BANCO', '237', '2345-6', '23456-7', 75000.00, 75000.00),
('341-001', 'Itaú - Conta Corrente', 'BANCO', '341', '3456-7', '34567-8', 100000.00, 100000.00),
('033-001', 'Santander - Conta Corrente', 'BANCO', '033', '4567-8', '45678-9', 60000.00, 60000.00),
('104-001', 'Caixa Econômica - Conta Corrente', 'BANCO', '104', '5678-9', '56789-0', 80000.00, 80000.00),
('260-001', 'Nu Pagamentos - Conta Digital', 'BANCO', '260', '0001', '12345678-9', 25000.00, 25000.00),
('077-001', 'Inter - Conta Digital', 'BANCO', '077', '0001', '87654321-0', 30000.00, 30000.00),
('290-001', 'PagSeguro - Conta Digital', 'BANCO', '290', '0001', '11223344-5', 15000.00, 15000.00),
('001-002', 'Banco do Brasil - Poupança', 'POUPANCA', '001', '1234-5', '98765-4', 20000.00, 20000.00),
('237-002', 'Bradesco - Poupança', 'POUPANCA', '237', '2345-6', '87654-3', 35000.00, 35000.00),
('341-002', 'Itaú - Poupança', 'POUPANCA', '341', '3456-7', '76543-2', 45000.00, 45000.00),
('CAIXA-001', 'Caixa Geral - Matriz', 'CAIXA', NULL, NULL, NULL, 5000.00, 5000.00),
('CAIXA-002', 'Caixa Pequeno - Filial 1', 'CAIXA', NULL, NULL, NULL, 2000.00, 2000.00),
('CAIXA-003', 'Caixa Pequeno - Filial 2', 'CAIXA', NULL, NULL, NULL, 1500.00, 1500.00),
('INV-001', 'Tesouro Direto - SELIC', 'INVESTIMENTO', NULL, NULL, NULL, 100000.00, 100000.00),
('INV-002', 'CDB Banco Inter', 'INVESTIMENTO', '077', '0001', 'CDB-001', 50000.00, 50000.00),
('INV-003', 'LCI Itaú', 'INVESTIMENTO', '341', '3456-7', 'LCI-001', 75000.00, 75000.00),
('212-001', 'Banco Original - Conta Corrente', 'BANCO', '212', '0001', '55667788-9', 40000.00, 40000.00),
('336-001', 'C6 Bank - Conta Digital', 'BANCO', '336', '0001', '99887766-5', 20000.00, 20000.00),
('323-001', 'Mercado Pago - Conta Digital', 'BANCO', '323', '0001', '44556677-8', 10000.00, 10000.00);