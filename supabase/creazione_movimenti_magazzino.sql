-- =========================================================================
-- MIGRAZIONE: REGISTRO MOVIMENTI DI MAGAZZINO (Cloud-First Supabase)
-- Tracciabilità 100% per carichi fornitore, scarichi produzione, versamenti e vendite
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.movimenti_magazzino (
    id TEXT PRIMARY KEY,
    azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE,
    articolo_id TEXT NOT NULL REFERENCES public.articoli(id) ON DELETE CASCADE,
    tipo_movimento VARCHAR(40) NOT NULL, 
    -- Tipi supportati:
    -- 'carico_fornitore'       -> Arrivo merci / DDT Fornitore
    -- 'scarico_produzione'     -> Prelievo materie prime / componenti a bordo macchina per OdP
    -- 'carico_finito'          -> Versamento pezzi finiti conformi da OdP completato
    -- 'scarico_ddt_cliente'    -> Spedizione al cliente con DDT
    -- 'rettifica_inventario'   -> Rettifica manuale / inventario fisico
    quantita NUMERIC(12,3) NOT NULL, -- Positiva (+) per entrate, negativa (-) per uscite
    giacenza_precedente NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    giacenza_risultante NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    unita_misura VARCHAR(20) DEFAULT 'pz',
    riferimento_documento VARCHAR(150), -- es: 'DDT Fornitore #84920' o 'DDT Cliente #DDT-2026-004'
    codice_odp VARCHAR(100),            -- es: 'ODP-BRBME-2026-005'
    lotto_colata VARCHAR(100),          -- es: 'Colata #K9942' o lotto tracciato
    operatore_nome VARCHAR(100),        -- Chi ha eseguito l'azione
    note TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indici di performance per ricerche rapide e filtri
CREATE INDEX IF NOT EXISTS idx_movimenti_azienda_id ON public.movimenti_magazzino(azienda_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_articolo_id ON public.movimenti_magazzino(articolo_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_tipo ON public.movimenti_magazzino(tipo_movimento);
CREATE INDEX IF NOT EXISTS idx_movimenti_creato_il ON public.movimenti_magazzino(creato_il DESC);
CREATE INDEX IF NOT EXISTS idx_movimenti_codice_odp ON public.movimenti_magazzino(codice_odp);

-- Abilitazione Row Level Security (RLS)
ALTER TABLE public.movimenti_magazzino ENABLE ROW LEVEL SECURITY;

-- Policy di isolamento multi-tenant
DROP POLICY IF EXISTS "movimenti_magazzino_isolation_policy" ON public.movimenti_magazzino;
CREATE POLICY "movimenti_magazzino_isolation_policy" ON public.movimenti_magazzino
    FOR ALL
    USING (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
