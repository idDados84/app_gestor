/*
  # Criação da Nova Estrutura Financeira com 4 Tabelas

  1. Novas Tabelas
    - `tbl_faturamentos` - Registro financeiro principal (valor original inalterável)
    - `tbl_parcelamentos` - Detalhes da operação de parcelamento e composição financeira
    - `tbl_parcelas` - Cada parcela individual gerada pelo parcelamento
    - `tbl_transacoes_financeiras` - Registros de pagamentos (entrada e parcelas)

  2. Relacionamentos
    - tbl_parcelamentos -> tbl_faturamentos (1:N)
    - tbl_parcelas -> tbl_parcelamentos (1:N)
    - tbl_transacoes_financeiras -> tbl_faturamentos (1:N)
    - tbl_transacoes_financeiras -> tbl_parcelas (1:N)

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso público temporárias para desenvolvimento
*/

-- Tabela: tbl_faturamentos
-- Armazena o registro financeiro principal com valor original inalterável
CREATE TABLE IF NOT EXISTS public.tbl_faturamentos (
    id_faturamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_faturamento VARCHAR(50),
    n_documento_origem VARCHAR(100),
    dt_faturamento DATE NOT NULL,
    valor_original DECIMAL(15, 2) NOT NULL,
    cod_participante VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para tbl_faturamentos
CREATE INDEX IF NOT EXISTS idx_tbl_faturamentos_cod_faturamento ON public.tbl_faturamentos (cod_faturamento);
CREATE INDEX IF NOT EXISTS idx_tbl_faturamentos_n_documento_origem ON public.tbl_faturamentos (n_documento_origem);
CREATE INDEX IF NOT EXISTS idx_tbl_faturamentos_dt_faturamento ON public.tbl_faturamentos (dt_faturamento);
CREATE INDEX IF NOT EXISTS idx_tbl_faturamentos_cod_participante ON public.tbl_faturamentos (cod_participante);
CREATE INDEX IF NOT EXISTS idx_tbl_faturamentos_deleted_at ON public.tbl_faturamentos (deleted_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_tbl_faturamentos_updated_at 
    BEFORE UPDATE ON public.tbl_faturamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: tbl_parcelamentos
-- Registra os detalhes da operação de parcelamento e composição financeira
CREATE TABLE IF NOT EXISTS public.tbl_parcelamentos (
    id_parcelamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_faturamento_fk UUID NOT NULL,
    valor_base DECIMAL(15, 2) NOT NULL DEFAULT 0,
    qtd_parcelas INT NOT NULL DEFAULT 1,
    valor_entrada DECIMAL(15, 2) DEFAULT 0,
    juros DECIMAL(10, 2) DEFAULT 0,
    multas DECIMAL(10, 2) DEFAULT 0,
    atualizacao DECIMAL(10, 2) DEFAULT 0,
    descontos DECIMAL(10, 2) DEFAULT 0,
    abatimentos DECIMAL(10, 2) DEFAULT 0,
    valor_total_parcelas DECIMAL(15, 2) NOT NULL DEFAULT 0,
    dt_vencimento_entrada DATE,
    intervalo_ini INT DEFAULT 0,
    intervalo_rec INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_parcelamento_faturamento
        FOREIGN KEY (id_faturamento_fk)
        REFERENCES public.tbl_faturamentos (id_faturamento)
        ON DELETE CASCADE
);

-- Índices para tbl_parcelamentos
CREATE INDEX IF NOT EXISTS idx_tbl_parcelamentos_faturamento ON public.tbl_parcelamentos (id_faturamento_fk);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelamentos_qtd_parcelas ON public.tbl_parcelamentos (qtd_parcelas);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelamentos_valor_total ON public.tbl_parcelamentos (valor_total_parcelas);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelamentos_deleted_at ON public.tbl_parcelamentos (deleted_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_tbl_parcelamentos_updated_at 
    BEFORE UPDATE ON public.tbl_parcelamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: tbl_parcelas
-- Detalha cada parcela individual gerada pelo parcelamento
CREATE TABLE IF NOT EXISTS public.tbl_parcelas (
    id_parcela UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_parcela VARCHAR(100) UNIQUE,
    id_parcelamento_fk UUID NOT NULL,
    n_parcela INT NOT NULL,
    valor_parcela DECIMAL(15, 2) NOT NULL,
    dt_vencimento DATE NOT NULL,
    status_parcela VARCHAR(20) DEFAULT 'Aberto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_parcela_parcelamento
        FOREIGN KEY (id_parcelamento_fk)
        REFERENCES public.tbl_parcelamentos (id_parcelamento)
        ON DELETE CASCADE,
    CONSTRAINT chk_status_parcela 
        CHECK (status_parcela IN ('Aberto', 'Parcial', 'Liquidado', 'Cancelado')),
    CONSTRAINT chk_valor_parcela_positivo 
        CHECK (valor_parcela >= 0),
    CONSTRAINT chk_n_parcela_positivo 
        CHECK (n_parcela >= 0)
);

-- Índices para tbl_parcelas
CREATE INDEX IF NOT EXISTS idx_tbl_parcelas_sku ON public.tbl_parcelas (sku_parcela);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelas_parcelamento ON public.tbl_parcelas (id_parcelamento_fk);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelas_n_parcela ON public.tbl_parcelas (n_parcela);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelas_dt_vencimento ON public.tbl_parcelas (dt_vencimento);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelas_status ON public.tbl_parcelas (status_parcela);
CREATE INDEX IF NOT EXISTS idx_tbl_parcelas_deleted_at ON public.tbl_parcelas (deleted_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_tbl_parcelas_updated_at 
    BEFORE UPDATE ON public.tbl_parcelas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: tbl_transacoes_financeiras
-- Registra os pagamentos de entrada e das parcelas
CREATE TABLE IF NOT EXISTS public.tbl_transacoes_financeiras (
    id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_faturamento_fk UUID NOT NULL,
    id_parcela_fk UUID NOT NULL,
    tipo_transacao VARCHAR(50) NOT NULL,
    dt_pagamento DATE NOT NULL,
    valor_pago DECIMAL(15, 2) NOT NULL,
    digito_ordem_pagamento INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_transacao_faturamento
        FOREIGN KEY (id_faturamento_fk)
        REFERENCES public.tbl_faturamentos (id_faturamento)
        ON DELETE RESTRICT, -- Impede exclusão do faturamento se houver transações
    CONSTRAINT fk_transacao_parcela
        FOREIGN KEY (id_parcela_fk)
        REFERENCES public.tbl_parcelas (id_parcela)
        ON DELETE RESTRICT, -- Impede exclusão da parcela se houver transações
    CONSTRAINT chk_tipo_transacao 
        CHECK (tipo_transacao IN ('Entrada', 'Pagamento de Parcela', 'Estorno', 'Ajuste')),
    CONSTRAINT chk_valor_pago_positivo 
        CHECK (valor_pago > 0),
    CONSTRAINT chk_digito_ordem_positivo 
        CHECK (digito_ordem_pagamento > 0)
);

-- Índices para tbl_transacoes_financeiras
CREATE INDEX IF NOT EXISTS idx_tbl_transacoes_faturamento ON public.tbl_transacoes_financeiras (id_faturamento_fk);
CREATE INDEX IF NOT EXISTS idx_tbl_transacoes_parcela ON public.tbl_transacoes_financeiras (id_parcela_fk);
CREATE INDEX IF NOT EXISTS idx_tbl_transacoes_tipo ON public.tbl_transacoes_financeiras (tipo_transacao);
CREATE INDEX IF NOT EXISTS idx_tbl_transacoes_dt_pagamento ON public.tbl_transacoes_financeiras (dt_pagamento);
CREATE INDEX IF NOT EXISTS idx_tbl_transacoes_deleted_at ON public.tbl_transacoes_financeiras (deleted_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_tbl_transacoes_financeiras_updated_at 
    BEFORE UPDATE ON public.tbl_transacoes_financeiras 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tbl_faturamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_parcelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público temporárias para desenvolvimento
-- IMPORTANTE: Ajustar essas políticas para produção conforme necessário

CREATE POLICY "Permitir acesso completo aos faturamentos"
    ON public.tbl_faturamentos
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir acesso completo aos parcelamentos"
    ON public.tbl_parcelamentos
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir acesso completo às parcelas"
    ON public.tbl_parcelas
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir acesso completo às transações financeiras"
    ON public.tbl_transacoes_financeiras
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Comentários nas tabelas para documentação
COMMENT ON TABLE public.tbl_faturamentos IS 'Registro financeiro principal com valor original inalterável';
COMMENT ON TABLE public.tbl_parcelamentos IS 'Detalhes da operação de parcelamento e composição financeira';
COMMENT ON TABLE public.tbl_parcelas IS 'Cada parcela individual gerada pelo parcelamento';
COMMENT ON TABLE public.tbl_transacoes_financeiras IS 'Registros de pagamentos (entrada e parcelas)';

-- Comentários em colunas importantes
COMMENT ON COLUMN public.tbl_faturamentos.valor_original IS 'Valor inicial e inalterável do faturamento';
COMMENT ON COLUMN public.tbl_parcelamentos.valor_base IS 'Valor base para parcelamento (valor_original - valor_entrada)';
COMMENT ON COLUMN public.tbl_parcelamentos.valor_total_parcelas IS 'Valor final a ser parcelado após aplicar juros, multas, descontos, etc.';
COMMENT ON COLUMN public.tbl_parcelas.sku_parcela IS 'Chave única de controle da sequência de parcelas';
COMMENT ON COLUMN public.tbl_parcelas.n_parcela IS 'Número da parcela (0 para entrada, 1+ para parcelas)';
COMMENT ON COLUMN public.tbl_transacoes_financeiras.digito_ordem_pagamento IS 'Ordem do pagamento para a mesma parcela (permite múltiplos pagamentos)';