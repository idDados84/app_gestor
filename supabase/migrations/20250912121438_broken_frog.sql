/*
  # Sistema de Gestão Financeira - Tabelas Principais

  1. Tabelas Criadas
    - `usuarios` - Usuários do sistema
    - `grupos_empresas` - Grupos de empresas
    - `empresas` - Empresas do sistema
    - `participantes` - Participantes/clientes/fornecedores
    - `formas_cobranca` - Formas de cobrança disponíveis
    - `contas_cobranca` - Contas de cobrança
    - `categorias` - Categorias para classificação
    - `departamentos` - Departamentos das empresas

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas em autenticação
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de grupos de empresas
CREATE TABLE IF NOT EXISTS grupos_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_empresa_id uuid REFERENCES grupos_empresas(id) ON DELETE SET NULL,
  nome text NOT NULL,
  razao_social text,
  cnpj text UNIQUE,
  endereco text,
  telefone text,
  email text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de departamentos
CREATE TABLE IF NOT EXISTS departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo text CHECK (tipo IN ('receita', 'despesa', 'ambos')) DEFAULT 'ambos',
  cor text DEFAULT '#3B82F6',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de participantes (clientes/fornecedores)
CREATE TABLE IF NOT EXISTS participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text CHECK (tipo IN ('cliente', 'fornecedor', 'ambos')) DEFAULT 'cliente',
  documento text,
  endereco text,
  telefone text,
  email text,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de formas de cobrança
CREATE TABLE IF NOT EXISTS formas_cobranca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  prazo_dias integer DEFAULT 0,
  taxa_juros decimal(5,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de contas de cobrança
CREATE TABLE IF NOT EXISTS contas_cobranca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  participante_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  departamento_id uuid REFERENCES departamentos(id) ON DELETE SET NULL,
  forma_cobranca_id uuid REFERENCES formas_cobranca(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  valor decimal(15,2) NOT NULL,
  tipo text CHECK (tipo IN ('pagar', 'receber')) NOT NULL,
  status text CHECK (status IN ('pendente', 'pago', 'cancelado')) DEFAULT 'pendente',
  data_vencimento date NOT NULL,
  data_pagamento date,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Usuários podem ver todos os dados"
  ON usuarios FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Grupos empresas - acesso completo"
  ON grupos_empresas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Empresas - acesso completo"
  ON empresas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Departamentos - acesso completo"
  ON departamentos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Categorias - acesso completo"
  ON categorias FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Participantes - acesso completo"
  ON participantes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Formas cobrança - acesso completo"
  ON formas_cobranca FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Contas cobrança - acesso completo"
  ON contas_cobranca FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresas_grupo ON empresas(grupo_empresa_id);
CREATE INDEX IF NOT EXISTS idx_departamentos_empresa ON departamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_empresa ON contas_cobranca(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_participante ON contas_cobranca(participante_id);
CREATE INDEX IF NOT EXISTS idx_contas_status ON contas_cobranca(status);
CREATE INDEX IF NOT EXISTS idx_contas_tipo ON contas_cobranca(tipo);
CREATE INDEX IF NOT EXISTS idx_contas_vencimento ON contas_cobranca(data_vencimento);