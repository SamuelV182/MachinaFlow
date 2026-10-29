-- ==============================================================================
-- MachinaFlow - Estensione Schema Supabase: DDT, Terzisti e Ordini Fornitori
-- Esegui questo script nel Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. DDT CLIENTI (Spedizioni / Consegne a Clienti)
CREATE TABLE IF NOT EXISTS public.ddt_clienti (
    id TEXT PRIMARY KEY,
    numero_ddt VARCHAR(50) NOT NULL UNIQUE,
    data_emissione DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_id TEXT REFERENCES public.clienti(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_indirizzo TEXT,
    cliente_piva VARCHAR(50),
    destinazione_diversa TEXT,
    causale_trasporto VARCHAR(100) NOT NULL DEFAULT 'Vendita',
    porto VARCHAR(30) NOT NULL DEFAULT 'Franco',
    aspetto_beni VARCHAR(100) NOT NULL DEFAULT 'A vista',
    numero_colli INTEGER NOT NULL DEFAULT 1,
    peso_totale_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    vettore_nome VARCHAR(150) NOT NULL DEFAULT 'Mittente (Mezzo proprio)',
    note_trasporto TEXT,
    righe JSONB NOT NULL DEFAULT '[]'::jsonb,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DDT ESTERNI (Invio e Rientro Lavorazioni Conto Terzi)
CREATE TABLE IF NOT EXISTS public.ddt_esterni (
    id TEXT PRIMARY KEY,
    numero_ddt VARCHAR(50) NOT NULL UNIQUE,
    data_emissione DATE NOT NULL DEFAULT CURRENT_DATE,
    fornitore_nome VARCHAR(255) NOT NULL,
    fornitore_indirizzo TEXT,
    fornitore_piva VARCHAR(50),
    causale_trasporto VARCHAR(100) NOT NULL DEFAULT 'Invio per Conto Lavorazione',
    porto VARCHAR(30) NOT NULL DEFAULT 'Franco',
    aspetto_beni VARCHAR(100) NOT NULL DEFAULT 'A vista su pallet',
    numero_colli INTEGER NOT NULL DEFAULT 1,
    peso_totale_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    vettore_nome VARCHAR(150) NOT NULL DEFAULT 'Mittente (Mezzo proprio)',
    note_trasporto TEXT,
    stato VARCHAR(50) NOT NULL DEFAULT 'spedito',
    righe JSONB NOT NULL DEFAULT '[]'::jsonb,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ANAGRAFICA FORNITORI TERZISTI
CREATE TABLE IF NOT EXISTS public.fornitori_terzisti (
    id TEXT PRIMARY KEY,
    ragione_sociale VARCHAR(255) NOT NULL,
    partita_iva VARCHAR(50),
    codice_fiscale VARCHAR(50),
    indirizzo TEXT,
    citta VARCHAR(100),
    cap VARCHAR(20),
    provincia VARCHAR(10),
    telefono VARCHAR(50),
    email VARCHAR(150),
    specialita VARCHAR(150),
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDINI FORNITORI / MRP
CREATE TABLE IF NOT EXISTS public.ordini_fornitori (
    id TEXT PRIMARY KEY,
    articolo_id TEXT REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita_ordinata NUMERIC(12,3) NOT NULL CHECK (quantita_ordinata > 0),
    fornitore_nome VARCHAR(255) NOT NULL,
    data_ordine DATE NOT NULL DEFAULT CURRENT_DATE,
    data_arrivo_prevista DATE NOT NULL,
    stato VARCHAR(50) NOT NULL DEFAULT 'in_ordine',
    note TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ABILITA ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ddt_clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddt_esterni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori_terzisti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini_fornitori ENABLE ROW LEVEL SECURITY;

-- 6. POLICY DI LETTURA E SCRITTURA PER UTENTI AUTENTICATI
DO $$ BEGIN
    DROP POLICY IF EXISTS "Accesso totale per autenticati ddt_clienti" ON public.ddt_clienti;
    CREATE POLICY "Accesso totale per autenticati ddt_clienti" ON public.ddt_clienti FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati ddt_esterni" ON public.ddt_esterni;
    CREATE POLICY "Accesso totale per autenticati ddt_esterni" ON public.ddt_esterni FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati fornitori_terzisti" ON public.fornitori_terzisti;
    CREATE POLICY "Accesso totale per autenticati fornitori_terzisti" ON public.fornitori_terzisti FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati ordini_fornitori" ON public.ordini_fornitori;
    CREATE POLICY "Accesso totale per autenticati ordini_fornitori" ON public.ordini_fornitori FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
