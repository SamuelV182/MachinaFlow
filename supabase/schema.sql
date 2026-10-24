-- ==============================================================================
-- MachinaFlow - Schema Database Semplificato per Sincronizzazione Immediata
-- ==============================================================================

-- 1. TIPI ENUM
DO $$ BEGIN
    CREATE TYPE public.ruolo_utente AS ENUM ('amministratore', 'responsabile_produzione', 'operatore');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_articolo AS ENUM ('prodotto_finito', 'semilavorato', 'materia_prima');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stato_ordine_cliente AS ENUM ('bozza', 'confermato', 'in_produzione', 'evaso', 'annullato');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stato_odp AS ENUM ('pianificato', 'rilasciato', 'in_lavorazione', 'completato', 'sospeso');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stato_fase AS ENUM ('non_iniziata', 'in_corso', 'completata', 'bloccata');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CENTRI DI LAVORO / MACCHINE
CREATE TABLE IF NOT EXISTS public.centri_lavoro (
    id TEXT PRIMARY KEY,
    codice VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    reparto VARCHAR(100) NOT NULL DEFAULT 'Officina',
    capacita_giornaliera_ore NUMERIC(5,2) NOT NULL DEFAULT 8.00,
    costo_orario NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TIPI DI PROCESSO
CREATE TABLE IF NOT EXISTS public.tipi_processo (
    id TEXT PRIMARY KEY,
    codice VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    descrizione TEXT,
    centro_lavoro_predefinito_id TEXT REFERENCES public.centri_lavoro(id) ON DELETE SET NULL,
    colore_badge VARCHAR(30) DEFAULT '#3b82f6',
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ANAGRAFICA ARTICOLI
CREATE TABLE IF NOT EXISTS public.articoli (
    id TEXT PRIMARY KEY,
    codice_articolo VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT NOT NULL,
    tipo public.tipo_articolo NOT NULL DEFAULT 'prodotto_finito',
    unita_misura VARCHAR(20) NOT NULL DEFAULT 'pz',
    giacenza_attuale NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    scorta_minima NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    prezzo_riferimento NUMERIC(12,2) DEFAULT 0.00,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DISTINTA BASE (BOM)
CREATE TABLE IF NOT EXISTS public.distinta_base (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    articolo_padre_id TEXT NOT NULL REFERENCES public.articoli(id) ON DELETE CASCADE,
    articolo_componente_id TEXT NOT NULL REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita_necessaria NUMERIC(12,4) NOT NULL CHECK (quantita_necessaria > 0),
    note TEXT,
    CONSTRAINT unq_padre_componente UNIQUE (articolo_padre_id, articolo_componente_id)
);

-- 6. CICLI DI LAVORAZIONE STANDARD (ROUTING)
CREATE TABLE IF NOT EXISTS public.fasi_ciclo_standard (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    articolo_id TEXT NOT NULL REFERENCES public.articoli(id) ON DELETE CASCADE,
    sequenza INTEGER NOT NULL DEFAULT 10,
    nome_fase VARCHAR(150) NOT NULL,
    tipo_processo_id TEXT REFERENCES public.tipi_processo(id) ON DELETE SET NULL,
    centro_lavoro_id TEXT NOT NULL REFERENCES public.centri_lavoro(id) ON DELETE RESTRICT,
    tempo_attrezzaggio_min NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    tempo_ciclo_pezzo_min NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    note_operative TEXT
);

-- 7. ANAGRAFICA CLIENTI
CREATE TABLE IF NOT EXISTS public.clienti (
    id TEXT PRIMARY KEY,
    ragione_sociale VARCHAR(255) NOT NULL,
    partita_iva VARCHAR(50),
    email VARCHAR(150),
    telefono VARCHAR(50),
    indirizzo TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDINI CLIENTI
CREATE TABLE IF NOT EXISTS public.ordini_clienti (
    id TEXT PRIMARY KEY,
    numero_ordine VARCHAR(50) NOT NULL UNIQUE,
    cliente_id TEXT NOT NULL REFERENCES public.clienti(id) ON DELETE RESTRICT,
    data_ordine DATE NOT NULL DEFAULT CURRENT_DATE,
    data_consegna_concordata DATE NOT NULL,
    stato public.stato_ordine_cliente NOT NULL DEFAULT 'confermato',
    note TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. RIGHE ORDINE CLIENTE
CREATE TABLE IF NOT EXISTS public.righe_ordine_cliente (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ordine_cliente_id TEXT NOT NULL REFERENCES public.ordini_clienti(id) ON DELETE CASCADE,
    articolo_id TEXT NOT NULL REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita NUMERIC(12,3) NOT NULL CHECK (quantita > 0),
    prezzo_unitario NUMERIC(12,2) DEFAULT 0.00
);

-- 10. ORDINI DI PRODUZIONE (OdP)
CREATE TABLE IF NOT EXISTS public.ordini_produzione (
    id TEXT PRIMARY KEY,
    codice_odp VARCHAR(50) NOT NULL UNIQUE,
    riga_ordine_cliente_id TEXT REFERENCES public.righe_ordine_cliente(id) ON DELETE SET NULL,
    articolo_id TEXT NOT NULL REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita_da_produrre NUMERIC(12,3) NOT NULL CHECK (quantita_da_produrre > 0),
    quantita_prodotta NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    data_inizio_pianificata DATE,
    data_fine_pianificata DATE,
    stato public.stato_odp NOT NULL DEFAULT 'pianificato',
    priorita INTEGER NOT NULL DEFAULT 2,
    qr_code_token VARCHAR(100) NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    note TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. FASI ODP (ESECUZIONE IN OFFICINA)
CREATE TABLE IF NOT EXISTS public.fasi_odp (
    id TEXT PRIMARY KEY,
    odp_id TEXT NOT NULL REFERENCES public.ordini_produzione(id) ON DELETE CASCADE,
    sequenza INTEGER NOT NULL DEFAULT 10,
    nome_fase VARCHAR(150) NOT NULL,
    tipo_processo_id TEXT REFERENCES public.tipi_processo(id) ON DELETE SET NULL,
    centro_lavoro_id TEXT NOT NULL REFERENCES public.centri_lavoro(id) ON DELETE RESTRICT,
    tempo_stimato_totale_min NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tempo_effettivo_min NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stato public.stato_fase NOT NULL DEFAULT 'non_iniziata',
    operatore_id UUID,
    data_inizio_reale TIMESTAMPTZ,
    data_fine_reale TIMESTAMPTZ,
    note_officina TEXT
);

-- 12. ABILITA ROW LEVEL SECURITY
ALTER TABLE public.centri_lavoro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipi_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distinta_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasi_ciclo_standard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini_clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.righe_ordine_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini_produzione ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasi_odp ENABLE ROW LEVEL SECURITY;

-- Policy di lettura e scrittura per utenti autenticati (accesso totale a chi ha fatto il login)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Accesso totale per autenticati centri_lavoro" ON public.centri_lavoro;
    CREATE POLICY "Accesso totale per autenticati centri_lavoro" ON public.centri_lavoro FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati tipi_processo" ON public.tipi_processo;
    CREATE POLICY "Accesso totale per autenticati tipi_processo" ON public.tipi_processo FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati articoli" ON public.articoli;
    CREATE POLICY "Accesso totale per autenticati articoli" ON public.articoli FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati distinta_base" ON public.distinta_base;
    CREATE POLICY "Accesso totale per autenticati distinta_base" ON public.distinta_base FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati fasi_ciclo_standard" ON public.fasi_ciclo_standard;
    CREATE POLICY "Accesso totale per autenticati fasi_ciclo_standard" ON public.fasi_ciclo_standard FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati clienti" ON public.clienti;
    CREATE POLICY "Accesso totale per autenticati clienti" ON public.clienti FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati ordini_clienti" ON public.ordini_clienti;
    CREATE POLICY "Accesso totale per autenticati ordini_clienti" ON public.ordini_clienti FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati righe_ordine_cliente" ON public.righe_ordine_cliente;
    CREATE POLICY "Accesso totale per autenticati righe_ordine_cliente" ON public.righe_ordine_cliente FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati ordini_produzione" ON public.ordini_produzione;
    CREATE POLICY "Accesso totale per autenticati ordini_produzione" ON public.ordini_produzione FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Accesso totale per autenticati fasi_odp" ON public.fasi_odp;
    CREATE POLICY "Accesso totale per autenticati fasi_odp" ON public.fasi_odp FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
