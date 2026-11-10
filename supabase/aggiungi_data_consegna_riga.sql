-- Aggiunta della colonna data_consegna_riga alla tabella righe_ordine_cliente
-- Permette di gestire date di consegna differenziate per ogni singola posizione della commessa

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'righe_ordine_cliente' 
          AND column_name = 'data_consegna_riga'
    ) THEN
        ALTER TABLE public.righe_ordine_cliente 
        ADD COLUMN data_consegna_riga DATE DEFAULT NULL;
    END IF;
END $$;
