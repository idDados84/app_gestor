/*
  # Inserir Dados Fictícios - Sistema Financeiro

  1. Dados Inseridos
    - 10 grupos de empresas
    - 20 empresas
    - 30 departamentos  
    - 15 categorias
    - 25 participantes
    - 10 formas de cobrança
    - 100 contas de cobrança
*/

-- Inserir grupos de empresas
INSERT INTO grupos_empresas (nome, descricao) VALUES
('Grupo Tecnologia', 'Empresas do setor de tecnologia e inovação'),
('Grupo Comercial', 'Empresas focadas em comércio e varejo'),
('Grupo Industrial', 'Empresas do setor industrial e manufatura'),
('Grupo Serviços', 'Empresas prestadoras de serviços diversos'),
('Grupo Financeiro', 'Instituições financeiras e correlatas'),
('Grupo Saúde', 'Empresas da área de saúde e medicina'),
('Grupo Educação', 'Instituições educacionais e treinamento'),
('Grupo Construção', 'Empresas de construção civil e engenharia'),
('Grupo Alimentício', 'Empresas do setor alimentício e bebidas'),
('Grupo Transporte', 'Empresas de logística e transporte');

-- Inserir empresas
INSERT INTO empresas (grupo_empresa_id, nome, razao_social, cnpj, endereco, telefone, email) 
SELECT 
  g.id,
  CASE 
    WHEN g.nome = 'Grupo Tecnologia' THEN 
      (ARRAY['TechCorp Ltda', 'InnovaSoft SA'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Comercial' THEN 
      (ARRAY['ComercialMax Ltda', 'VarejoPlus SA'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Industrial' THEN 
      (ARRAY['IndústriaForte SA', 'ManufaturaPro Ltda'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Serviços' THEN 
      (ARRAY['ServiçosExpress Ltda', 'ConsultoriaSmart SA'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Financeiro' THEN 
      (ARRAY['FinanceiroSeguro SA', 'CréditoFácil Ltda'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Saúde' THEN 
      (ARRAY['SaúdePlus Ltda', 'MedicinaBem SA'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Educação' THEN 
      (ARRAY['EducaçãoPro SA', 'EnsinoTop Ltda'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Construção' THEN 
      (ARRAY['ConstruSólida SA', 'EngenhariaPro Ltda'])[((ROW_NUMBER() OVER()) % 2) + 1]
    WHEN g.nome = 'Grupo Alimentício' THEN 
      (ARRAY['AlimentosBom SA', 'NutriSaúde Ltda'])[((ROW_NUMBER() OVER()) % 2) + 1]
    ELSE 
      (ARRAY['TransporteFast SA', 'LogísticaExpress Ltda'])[((ROW_NUMBER() OVER()) % 2) + 1]
  END,
  CASE 
    WHEN g.nome = 'Grupo Tecnologia' THEN 
      (ARRAY['TechCorp Tecnologia Ltda', 'InnovaSoft Soluções SA'])[((ROW_NUMBER() OVER()) % 2) + 1]
    ELSE g.nome || ' - ' || 'Empresa ' || ROW_NUMBER() OVER()
  END,
  LPAD(FLOOR(RANDOM() * 99999999999999)::TEXT, 14, '0'),
  'Rua ' || g.nome || ', ' || (ROW_NUMBER() OVER() * 100),
  '(11) ' || LPAD(FLOOR(RANDOM() * 99999999)::TEXT, 8, '0'),
  LOWER(REPLACE(g.nome, ' ', '')) || ROW_NUMBER() OVER() || '@empresa.com'
FROM grupos_empresas g, generate_series(1, 2) s;

-- Inserir categorias
INSERT INTO categorias (nome, descricao, tipo, cor) VALUES
('Vendas', 'Receitas de vendas de produtos e serviços', 'receita', '#10B981'),
('Prestação de Serviços', 'Receitas de prestação de serviços', 'receita', '#059669'),
('Juros Recebidos', 'Receitas financeiras de juros', 'receita', '#047857'),
('Aluguel', 'Despesas com aluguel de imóveis', 'despesa', '#EF4444'),
('Salários', 'Despesas com folha de pagamento', 'despesa', '#DC2626'),
('Fornecedores', 'Despesas com compra de materiais', 'despesa', '#B91C1C'),
('Marketing', 'Despesas com publicidade e marketing', 'despesa', '#F97316'),
('Tecnologia', 'Despesas com TI e software', 'despesa', '#EA580C'),
('Treinamento', 'Investimento em capacitação', 'despesa', '#D97706'),
('Manutenção', 'Despesas com manutenção geral', 'despesa', '#C2410C'),
('Combustível', 'Despesas com combustível', 'despesa', '#9A3412'),
('Telefonia', 'Despesas com telecomunicações', 'despesa', '#7C2D12'),
('Material de Escritório', 'Suprimentos e materiais', 'despesa', '#EAB308'),
('Consultoria', 'Serviços de consultoria externa', 'ambos', '#8B5CF6'),
('Outros', 'Outras receitas e despesas', 'ambos', '#6B7280');

-- Inserir departamentos
INSERT INTO departamentos (empresa_id, nome, descricao)
SELECT 
  e.id,
  (ARRAY['Vendas', 'Marketing', 'Financeiro', 'TI', 'RH', 'Operações'])[((ROW_NUMBER() OVER()) % 6) + 1],
  'Departamento de ' || (ARRAY['Vendas', 'Marketing', 'Financeiro', 'TI', 'RH', 'Operações'])[((ROW_NUMBER() OVER()) % 6) + 1] || ' da ' || e.nome
FROM empresas e, generate_series(1, 2) s
LIMIT 30;

-- Inserir participantes
INSERT INTO participantes (nome, tipo, documento, endereco, telefone, email, observacoes) VALUES
('João Silva Ltda', 'fornecedor', '12.345.678/0001-90', 'Rua das Flores, 123', '(11) 98765-4321', 'joao@fornecedor.com', 'Fornecedor de materiais de escritório'),
('Maria Santos SA', 'cliente', '98.765.432/0001-10', 'Av. Principal, 456', '(11) 87654-3210', 'maria@cliente.com', 'Cliente empresarial há 5 anos'),
('TechSupply Ltda', 'fornecedor', '11.222.333/0001-44', 'Rua da Tecnologia, 789', '(11) 99888-7766', 'contato@techsupply.com', 'Fornecedor de equipamentos de TI'),
('Comercial ABC', 'cliente', '55.666.777/0001-88', 'Rua do Comércio, 321', '(11) 91234-5678', 'abc@comercial.com', 'Cliente atacadista'),
('Serviços Gerais ME', 'fornecedor', '33.444.555/0001-99', 'Av. dos Serviços, 654', '(11) 92345-6789', 'geral@servicos.com', 'Prestador de serviços diversos'),
('Empresa Beta SA', 'cliente', '77.888.999/0001-00', 'Rua Beta, 987', '(11) 93456-7890', 'beta@empresa.com', 'Cliente corporativo'),
('Fornecedor Plus Ltda', 'fornecedor', '22.333.444/0001-11', 'Av. Plus, 147', '(11) 94567-8901', 'plus@fornecedor.com', 'Fornecedor de insumos'),
('Cliente Premium SA', 'cliente', '66.777.888/0001-22', 'Rua Premium, 258', '(11) 95678-9012', 'premium@cliente.com', 'Cliente VIP'),
('Suprimentos Top ME', 'fornecedor', '44.555.666/0001-33', 'Av. Top, 369', '(11) 96789-0123', 'top@suprimentos.com', 'Fornecedor especializado'),
('Corporação Delta', 'cliente', '88.999.000/0001-44', 'Rua Delta, 741', '(11) 97890-1234', 'delta@corporacao.com', 'Grande cliente corporativo'),
('Materiais Express', 'fornecedor', '11.000.111/0001-55', 'Av. Express, 852', '(11) 98901-2345', 'express@materiais.com', 'Entrega rápida'),
('Empresa Gamma Ltda', 'cliente', '99.000.111/0001-66', 'Rua Gamma, 963', '(11) 99012-3456', 'gamma@empresa.com', 'Cliente em crescimento'),
('Logistics Pro SA', 'ambos', '55.111.222/0001-77', 'Av. Logistics, 159', '(11) 90123-4567', 'pro@logistics.com', 'Cliente e fornecedor'),
('Global Trading ME', 'cliente', '33.222.111/0001-88', 'Rua Global, 357', '(11) 91234-5670', 'global@trading.com', 'Comércio exterior'),
('Smart Solutions', 'fornecedor', '77.333.222/0001-99', 'Av. Smart, 468', '(11) 92345-6781', 'smart@solutions.com', 'Soluções inteligentes'),
('Mega Corp SA', 'cliente', '99.444.333/0001-00', 'Rua Mega, 579', '(11) 93456-7892', 'mega@corp.com', 'Multinacional'),
('Local Supplier ME', 'fornecedor', '11.555.444/0001-11', 'Av. Local, 680', '(11) 94567-8903', 'local@supplier.com', 'Fornecedor regional'),
('Fast Company Ltda', 'cliente', '55.666.555/0001-22', 'Rua Fast, 791', '(11) 95678-9014', 'fast@company.com', 'Crescimento acelerado'),
('Quality Services', 'fornecedor', '33.777.666/0001-33', 'Av. Quality, 802', '(11) 96789-0125', 'quality@services.com', 'Serviços de qualidade'),
('Enterprise One SA', 'cliente', '77.888.777/0001-44', 'Rua Enterprise, 913', '(11) 97890-1236', 'one@enterprise.com', 'Enterprise cliente'),
('Reliable Supplies', 'fornecedor', '99.999.888/0001-55', 'Av. Reliable, 024', '(11) 98901-2347', 'reliable@supplies.com', 'Fornecedor confiável'),
('Dynamic Corp ME', 'cliente', '11.000.999/0001-66', 'Rua Dynamic, 135', '(11) 99012-3458', 'dynamic@corp.com', 'Empresa dinâmica'),
('Universal Trading', 'ambos', '55.111.000/0001-77', 'Av. Universal, 246', '(11) 90123-4569', 'universal@trading.com', 'Trading universal'),
('Prime Logistics SA', 'fornecedor', '33.222.111/0001-88', 'Rua Prime, 357', '(11) 91234-5680', 'prime@logistics.com', 'Logística premium'),
('Future Enterprises', 'cliente', '77.333.222/0001-99', 'Av. Future, 468', '(11) 92345-6791', 'future@enterprises.com', 'Visão futurista');

-- Inserir formas de cobrança
INSERT INTO formas_cobranca (nome, descricao, prazo_dias, taxa_juros) VALUES
('À Vista', 'Pagamento à vista em dinheiro ou cartão', 0, 0.00),
('PIX', 'Pagamento via PIX instantâneo', 0, 0.00),
('Boleto 30 dias', 'Boleto bancário com vencimento em 30 dias', 30, 1.50),
('Boleto 60 dias', 'Boleto bancário com vencimento em 60 dias', 60, 2.00),
('Cartão Crédito', 'Pagamento via cartão de crédito', 30, 3.00),
('Transferência Bancária', 'TED/DOC bancário', 1, 0.50),
('Cheque 30 dias', 'Cheque pré-datado para 30 dias', 30, 1.00),
('Cheque 60 dias', 'Cheque pré-datado para 60 dias', 60, 1.50),
('Crediário 90 dias', 'Pagamento parcelado em 90 dias', 90, 2.50),
('Faturamento Mensal', 'Faturamento com prazo de 30 dias', 30, 1.80);

-- Inserir contas de cobrança (100 registros)
WITH empresas_sample AS (
  SELECT id, ROW_NUMBER() OVER() as rn FROM empresas LIMIT 10
),
participantes_sample AS (
  SELECT id, ROW_NUMBER() OVER() as rn FROM participantes LIMIT 20
),
categorias_sample AS (
  SELECT id, ROW_NUMBER() OVER() as rn FROM categorias LIMIT 15
),
departamentos_sample AS (
  SELECT id, ROW_NUMBER() OVER() as rn FROM departamentos LIMIT 20
),
formas_sample AS (
  SELECT id, ROW_NUMBER() OVER() as rn FROM formas_cobranca LIMIT 10
)
INSERT INTO contas_cobranca (
  empresa_id, participante_id, categoria_id, departamento_id, forma_cobranca_id,
  descricao, valor, tipo, status, data_vencimento, data_pagamento, observacoes
)
SELECT 
  e.id,
  p.id,
  c.id,
  d.id,
  f.id,
  CASE 
    WHEN (generate_series % 2) = 0 THEN 'Fatura de serviços prestados - ' || generate_series
    ELSE 'Pagamento de fornecedor - ' || generate_series
  END,
  ROUND((RANDOM() * 9000 + 1000)::numeric, 2), -- Valor entre 1000 e 10000
  CASE WHEN (generate_series % 2) = 0 THEN 'receber' ELSE 'pagar' END,
  CASE 
    WHEN generate_series % 3 = 0 THEN 'pendente'
    WHEN generate_series % 3 = 1 THEN 'pago'
    ELSE 'pendente'
  END,
  CURRENT_DATE + (RANDOM() * 180 - 90)::integer, -- Data entre -90 e +90 dias
  CASE 
    WHEN generate_series % 3 = 1 THEN CURRENT_DATE - (RANDOM() * 30)::integer
    ELSE NULL
  END,
  CASE 
    WHEN (generate_series % 5) = 0 THEN 'Observação importante para conta ' || generate_series
    ELSE NULL
  END
FROM generate_series(1, 100) AS generate_series
CROSS JOIN empresas_sample e
CROSS JOIN participantes_sample p
CROSS JOIN categorias_sample c
CROSS JOIN departamentos_sample d
CROSS JOIN formas_sample f
WHERE e.rn = ((generate_series - 1) % 10) + 1
  AND p.rn = ((generate_series - 1) % 20) + 1
  AND c.rn = ((generate_series - 1) % 15) + 1
  AND d.rn = ((generate_series - 1) % 20) + 1
  AND f.rn = ((generate_series - 1) % 10) + 1
LIMIT 100;