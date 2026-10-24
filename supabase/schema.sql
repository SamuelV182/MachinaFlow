-- ==============================================================================
-- MachinaFlow - Schema Database PostgreSQL per Supabase (PCP / MES / Mini-ERP)
-- ==============================================================================

-- 1. TIPI ENUM
CREATE TYPE public.ruolo_utente AS ENUM ('amministratore', 'responsabile_produzione', 'operatore');
CREATE TYPE public.tipo_articolo AS ENUM ('prodotto_finito', 'semilavorato', 'materia_prima');
CREATE TYPE public.stato_ordine_cliente AS ENUM ('bozza', 'confermato', 'in_produzione', 'evaso', 'annullato');
CREATE TYPE public.stato_odp AS ENUM ('pianificato', 'rilasciato', 'in_lavorazione', 'completato', 'sospeso');
CREATE TYPE public.stato_fase AS ENUM ('non_iniziata', 'in_corso', 'completata', 'bloccata');

-- 2. TABELLA PROFILI UTENTE
CREATE TABLE IF NOT EXISTS public.profili (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    ruolo public.ruolo_utente NOT NULL DEFAULT 'operatore',
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CENTRI DI LAVORO / MACCHINE
CREATE TABLE IF NOT EXISTS public.centri_lavoro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    reparto VARCHAR(100) NOT NULL DEFAULT 'Officina',
    capacita_giornaliera_ore NUMERIC(5,2) NOT NULL DEFAULT 8.00,
    costo_orario NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TIPI DI PROCESSO / FASI CONFIGURABILI (es. Taglio, Fresatura, Sbavatura, ecc.)
CREATE TABLE IF NOT EXISTS public.tipi_processo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    descrizione TEXT,
    centro_lavoro_predefinito_id UUID REFERENCES public.centri_lavoro(id) ON DELETE SET NULL,
    colore_badge VARCHAR(30) DEFAULT '#3b82f6',
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ANAGRAFICA ARTICOLI
CREATE TABLE IF NOT EXISTS public.articoli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice_articolo VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT NOT NULL,
    tipo public.tipo_articolo NOT NULL DEFAULT 'prodotto_finito',
    unita_misura VARCHAR(20) NOT NULL DEFAULT 'pz',
    giacenza_attuale NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    scorta_minima NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    prezzo_riferimento NUMERIC(12,2) DEFAULT 0.00,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DISTINTA BASE (BOM)
CREATE TABLE IF NOT EXISTS public.distinta_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    articolo_padre_id UUID NOT NULL REFERENCES public.articoli(id) ON DELETE CASCADE,
    articolo_componente_id UUID NOT NULL REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita_necessaria NUMERIC(12,4) NOT NULL CHECK (quantita_necessaria > 0),
    note TEXT,
    CONSTRAINT unq_padre_componente UNIQUE (articolo_padre_id, articolo_componente_id)
);

-- 7. CICLI DI LAVORAZIONE STANDARD (ROUTING)
CREATE TABLE IF NOT EXISTS public.fasi_ciclo_standard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    articolo_id UUID NOT NULL REFERENCES public.articoli(id) ON DELETE CASCADE,
    sequenza INTEGER NOT NULL DEFAULT 10,
    nome_fase VARCHAR(150) NOT NULL,
    tipo_processo_id UUID REFERENCES public.tipi_processo(id) ON DELETE SET NULL,
    centro_lavoro_id UUID NOT NULL REFERENCES public.centri_lavoro(id) ON DELETE RESTRICT,
    tempo_attrezzaggio_min NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    tempo_ciclo_pezzo_min NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    note_operative TEXT
);

-- 8. ANAGRAFICA CLIENTI
CREATE TABLE IF NOT EXISTS public.clienti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ragione_sociale VARCHAR(255) NOT NULL,
    partita_iva VARCHAR(50),
    email VARCHAR(150),
    telefono VARCHAR(50),
    indirizzo TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ORDINI CLIENTI (SALES ORDERS)
CREATE TABLE IF NOT EXISTS public.ordini_clienti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ordine VARCHAR(50) NOT NULL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES public.clienti(id) ON DELETE RESTRICT,
    data_ordine DATE NOT NULL DEFAULT CURRENT_DATE,
    data_consegna_concordata DATE NOT NULL,
    stato public.stato_ordine_cliente NOT NULL DEFAULT 'confermato',
    note TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. RIGHE ORDINE CLIENTE
CREATE TABLE IF NOT EXISTS public.righe_ordine_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordine_cliente_id UUID NOT NULL REFERENCES public.ordini_clienti(id) ON DELETE CASCADE,
    articolo_id UUID NOT NULL REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita NUMERIC(12,3) NOT NULL CHECK (quantita > 0),
    prezzo_unitario NUMERIC(12,2) DEFAULT 0.00
);

-- 11. ORDINI DI PRODUZIONE (OdP / JOB ORDER)
CREATE TABLE IF NOT EXISTS public.ordini_produzione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice_odp VARCHAR(50) NOT NULL UNIQUE,
    riga_ordine_cliente_id UUID REFERENCES public.righe_ordine_cliente(id) ON DELETE SET NULL,
    articolo_id UUID NOT NULL REFERENCES public.articoli(id) ON DELETE RESTRICT,
    quantita_da_produrre NUMERIC(12,3) NOT NULL CHECK (quantita_da_produrre > 0),
    quantita_prodotta NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    data_inizio_pianificata DATE,
    data_fine_pianificata DATE,
    stato public.stato_odp NOT NULL DEFAULT 'pianificato',
    priorita INTEGER NOT NULL DEFAULT 2, -- 1: Bassa, 2: Media, 3: Alta, 4: Urgente
    qr_code_token VARCHAR(100) NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    note TEXT,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. FASI OD P (ESECUZIONE IN OFFICINA)
CREATE TABLE IF NOT EXISTS public.fasi_odp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odp_id UUID NOT NULL REFERENCES public.ordini_produzione(id) ON DELETE CASCADE,
    sequenza INTEGER NOT NULL DEFAULT 10,
    nome_fase VARCHAR(150) NOT NULL,
    tipo_processo_id UUID REFERENCES public.tipi_processo(id) ON DELETE SET NULL,
    centro_lavoro_id UUID NOT NULL REFERENCES public.centri_lavoro(id) ON DELETE RESTRICT,
    tempo_stimato_totale_min NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tempo_effettivo_min NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stato public.stato_fase NOT NULL DEFAULT 'non_iniziata',
    operatore_id UUID REFERENCES public.profili(id) ON DELETE SET NULL,
    data_inizio_reale TIMESTAMPTZ,
    data_fine_reale TIMESTAMPTZ,
    note_officina TEXT
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Least Privilege
-- ==============================================================================
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;
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

-- Policy di accesso in lettura generale per utenti autenticati
CREATE POLICY "Utenti autenticati possono leggere centri lavoro" ON public.centri_lavoro FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere tipi processo" ON public.tipi_processo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere articoli" ON public.articoli FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere distinta base" ON public.distinta_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere fasi ciclo standard" ON public.fasi_ciclo_standard FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere clienti" ON public.clienti FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere ordini clienti" ON public.ordini_clienti FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere righe ordine cliente" ON public.righe_ordine_cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere ordini produzione" ON public.ordini_produzione FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti autenticati possono leggere fasi odp" ON public.fasi_odp FOR SELECT TO authenticated USING (true);
CREATE POLICY "Utenti possono leggere il proprio profilo" ON public.profili FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy di scrittura: Funzione helper per verificare se l'utente è admin o responsabile
CREATE OR REPLACE FUNCTION public.is_gestore()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profili
    WHERE id = auth.uid() AND ruolo IN ('amministratore', 'responsabile_produzione')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- I gestori possono modificare anagrafiche e ordini
CREATE POLICY "Gestori possono modificare centri lavoro" ON public.centri_lavoro FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare tipi processo" ON public.tipi_processo FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare articoli" ON public.articoli FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare distinta base" ON public.distinta_base FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare fasi ciclo" ON public.fasi_ciclo_standard FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare clienti" ON public.clienti FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare ordini clienti" ON public.ordini_clienti FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare righe ordini clienti" ON public.righe_ordine_cliente FOR ALL TO authenticated USING (public.is_gestore());
CREATE POLICY "Gestori possono modificare ordini produzione" ON public.ordini_produzione FOR ALL TO authenticated USING (public.is_gestore());

-- Gli operatori possono aggiornare lo stato e i tempi delle fasi OdP a bordo macchina
CREATE POLICY "Operatori possono aggiornare avanzamento fasi odp" ON public.fasi_odp FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Gestori possono inserire ed eliminare fasi odp" ON public.fasi_odp FOR ALL TO authenticated USING (public.is_gestore());

-- ==============================================================================
-- DATI INIZIALI DI SEED (Dimostrativi per collaudo immediato)
-- ==============================================================================
INSERT INTO public.centri_lavoro (codice, nome, reparto, capacita_giornaliera_ore, costo_orario) VALUES
('MC-01', 'Centro di Lavoro CNC 5 Assi Mazak', 'Fresatura', 8.00, 75.00),
('MC-02', 'Tornio CNC Motorizzato DMG MORI', 'Tornitura', 8.00, 65.00),
('MC-03', 'Taglio Laser Fibra 4kW', 'Taglio Lamiera', 10.00, 85.00),
('MC-04', 'Banco Sbavatura & Finitura Manuale', 'Finitura', 7.50, 40.00),
('UFF-CAM', 'Ufficio Tecnico CAD/CAM', 'Progettazione', 8.00, 50.00)
ON CONFLICT (codice) DO NOTHING;

INSERT INTO public.tipi_processo (codice, nome, descrizione, colore_badge) VALUES
('PROC-CAM', 'Programmazione CAD/CAM', 'Definizione percorsi utensile e setup macchina', '#6366f1'),
('PROC-TAGLIO', 'Taglio Lamiera / Profilato', 'Taglio a misura tramite laser o sega a nastro', '#f59e0b'),
('PROC-FRESATURA', 'Fresatura CNC', 'Asportazione truciolo su centro di lavoro', '#3b82f6'),
('PROC-TORNITURA', 'Tornitura CNC', 'Lavorazione cilindrica ad asportazione truciolo', '#06b6d4'),
('PROC-FINITURA', 'Sbavatura & Finitura', 'Rimozione bave, satinatura o marcatura', '#10b981'),
('PROC-COLLAUDO', 'Controllo Qualità & Spedizione', 'Verifica quote dimensionali e imballaggio', '#8b5cf6')
ON CONFLICT (codice) DO NOTHING;
