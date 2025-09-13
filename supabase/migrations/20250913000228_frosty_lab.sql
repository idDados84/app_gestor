/*
  # Create Document Types Table

  1. New Tables
    - `tipos_documentos`
      - `id` (uuid, primary key)
      - `codigo_tipo` (varchar, unique) - Document code (00, 01, 55, etc.)
      - `nome_tipo` (varchar, required) - Document type name
      - `sigla_tipo` (varchar, required) - Document abbreviation (NF, NFe, etc.)
      - `descricao` (text, optional)
      - `ativo` (boolean)
      - Standard audit fields

  2. Security
    - Enable RLS on `tipos_documentos` table
    - Add policy for authenticated users to manage document types

  3. Sample Data
    - 20 sample records with Brazilian document types
*/

CREATE TABLE IF NOT EXISTS tipos_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tipo character varying(10) UNIQUE NOT NULL,
  nome_tipo character varying(255) NOT NULL,
  sigla_tipo character varying(20) NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE tipos_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on tipos_documentos"
  ON tipos_documentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for public users on tipos_documentos"
  ON tipos_documentos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tipos_documentos_codigo ON tipos_documentos(codigo_tipo);
CREATE INDEX IF NOT EXISTS idx_tipos_documentos_sigla ON tipos_documentos(sigla_tipo);
CREATE INDEX IF NOT EXISTS idx_tipos_documentos_ativo ON tipos_documentos(ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_documentos_deleted_at ON tipos_documentos(deleted_at);

-- Insert sample data
INSERT INTO tipos_documentos (codigo_tipo, nome_tipo, sigla_tipo, descricao) VALUES
('00', 'Nota Fiscal', 'NF', 'Nota Fiscal modelo 1 ou 1-A'),
('01', 'Nota Fiscal Avulsa', 'NFA', 'Nota Fiscal Avulsa'),
('55', 'Nota Fiscal Eletrônica', 'NFe', 'Nota Fiscal Eletrônica modelo 55'),
('65', 'Nota Fiscal de Consumidor Eletrônica', 'NFCe', 'Nota Fiscal de Consumidor Eletrônica modelo 65'),
('57', 'Conhecimento de Transporte Eletrônico', 'CTe', 'Conhecimento de Transporte Eletrônico'),
('03', 'Boleto Bancário', 'BOLETO', 'Boleto de Cobrança Bancária'),
('04', 'Pedido de Compra', 'PEDIDO', 'Pedido de Compra ou Venda'),
('05', 'Fatura Comercial', 'FATURA', 'Fatura Comercial'),
('06', 'Contrato', 'CONTRATO', 'Contrato de Prestação de Serviços'),
('07', 'Recibo', 'RECIBO', 'Recibo de Pagamento'),
('08', 'Nota Promissória', 'PROMISSORIA', 'Nota Promissória'),
('09', 'Duplicata', 'DUPLICATA', 'Duplicata Mercantil'),
('10', 'Cheque', 'CHEQUE', 'Cheque Bancário'),
('11', 'Ordem de Pagamento', 'OP', 'Ordem de Pagamento'),
('12', 'Cupom Fiscal', 'CF', 'Cupom Fiscal'),
('13', 'Nota de Débito', 'ND', 'Nota de Débito'),
('14', 'Nota de Crédito', 'NC', 'Nota de Crédito'),
('15', 'Comprovante de Transferência', 'TRANSF', 'Comprovante de Transferência Bancária'),
('16', 'Comprovante PIX', 'PIX', 'Comprovante de Transferência PIX'),
('17', 'Documento de Arrecadação', 'DAR', 'Documento de Arrecadação de Receitas');