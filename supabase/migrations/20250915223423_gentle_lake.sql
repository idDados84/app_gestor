-- Function to calculate valor_financeiro
CREATE OR REPLACE FUNCTION calculate_valor_financeiro_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.valor_financeiro = NEW.valor_operacao + NEW.valor_juros + NEW.valor_multas + NEW.valor_atualizacao - NEW.valor_descontos - NEW.valor_abto - NEW.valor_pagto;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Migration for contas_pagar
DO $$
BEGIN
    -- Rename 'valor' to 'valor_parcela' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor') THEN
        ALTER TABLE contas_pagar RENAME COLUMN valor TO valor_parcela;
        -- Ensure valor_parcela has a default and is not null
        ALTER TABLE contas_pagar ALTER COLUMN valor_parcela SET DEFAULT 0;
        ALTER TABLE contas_pagar ALTER COLUMN valor_parcela SET NOT NULL;
    END IF;

    -- Add new financial columns to contas_pagar if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_operacao') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_operacao numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_juros') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_juros numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_multas') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_multas numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_atualizacao') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_atualizacao numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_descontos') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_descontos numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_abto') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_abto numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_pagto') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_pagto numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_financeiro') THEN
        ALTER TABLE contas_pagar ADD COLUMN valor_financeiro numeric(15,2) NOT NULL DEFAULT 0;
    END IF;

    -- Add CHECK constraints for non-negative values for contas_pagar
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_operacao_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_operacao_pagar CHECK (valor_operacao >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_juros_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_juros_pagar CHECK (valor_juros >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_multas_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_multas_pagar CHECK (valor_multas >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_atualizacao_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_atualizacao_pagar CHECK (valor_atualizacao >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_descontos_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_descontos_pagar CHECK (valor_descontos >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_abto_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_abto_pagar CHECK (valor_abto >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_pagto_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_pagto_pagar CHECK (valor_pagto >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_parcela_pagar' AND table_name = 'contas_pagar') THEN
        ALTER TABLE contas_pagar ADD CONSTRAINT chk_valor_parcela_pagar CHECK (valor_parcela >= 0);
    END IF;

    -- Create trigger for contas_pagar
    DROP TRIGGER IF EXISTS trg_calculate_valor_financeiro_pagar ON contas_pagar;
    CREATE TRIGGER trg_calculate_valor_financeiro_pagar
    BEFORE INSERT OR UPDATE ON contas_pagar
    FOR EACH ROW EXECUTE FUNCTION calculate_valor_financeiro_trigger();

    -- Add indexes for performance for contas_pagar
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_operacao ON contas_pagar (valor_operacao);
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_financeiro ON contas_pagar (valor_financeiro);
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_valor_parcela ON contas_pagar (valor_parcela);

END $$;

-- Migration for contas_receber
DO $$
BEGIN
    -- Rename 'valor' to 'valor_parcela' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor') THEN
        ALTER TABLE contas_receber RENAME COLUMN valor TO valor_parcela;
        -- Ensure valor_parcela has a default and is not null
        ALTER TABLE contas_receber ALTER COLUMN valor_parcela SET DEFAULT 0;
        ALTER TABLE contas_receber ALTER COLUMN valor_parcela SET NOT NULL;
    END IF;

    -- Add new financial columns to contas_receber if they don't exist (valor_abto already exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_operacao') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_operacao numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_juros') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_juros numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_multas') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_multas numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_atualizacao') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_atualizacao numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_descontos') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_descontos numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    -- valor_abto already exists on contas_receber, so no need to add it again.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_pagto') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_pagto numeric(15,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='valor_financeiro') THEN
        ALTER TABLE contas_receber ADD COLUMN valor_financeiro numeric(15,2) NOT NULL DEFAULT 0;
    END IF;

    -- Add CHECK constraints for non-negative values for contas_receber
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_operacao_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_operacao_receber CHECK (valor_operacao >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_juros_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_juros_receber CHECK (valor_juros >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_multas_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_multas_receber CHECK (valor_multas >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_atualizacao_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_atualizacao_receber CHECK (valor_atualizacao >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_descontos_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_descontos_receber CHECK (valor_descontos >= 0);
    END IF;
    -- The valor_abto constraint might already exist if it was added with the column.
    -- IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_abto_receber' AND table_name = 'contas_receber') THEN
    --     ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_abto_receber CHECK (valor_abto >= 0);
    -- END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_pagto_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_pagto_receber CHECK (valor_pagto >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_valor_parcela_receber' AND table_name = 'contas_receber') THEN
        ALTER TABLE contas_receber ADD CONSTRAINT chk_valor_parcela_receber CHECK (valor_parcela >= 0);
    END IF;

    -- Create trigger for contas_receber
    DROP TRIGGER IF EXISTS trg_calculate_valor_financeiro_receber ON contas_receber;
    CREATE TRIGGER trg_calculate_valor_financeiro_receber
    BEFORE INSERT OR UPDATE ON contas_receber
    FOR EACH ROW EXECUTE FUNCTION calculate_valor_financeiro_trigger();

    -- Add indexes for performance for contas_receber
    CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_operacao ON contas_receber (valor_operacao);
    CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_financeiro ON contas_receber (valor_financeiro);
    CREATE INDEX IF NOT EXISTS idx_contas_receber_valor_parcela ON contas_receber (valor_parcela);

END $$;