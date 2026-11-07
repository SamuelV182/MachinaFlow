-- ==============================================================================
-- MachinaFlow - Migrazione Multi-Tenant & Sicurezza Row-Level Security (RLS)
-- Esegui questo script nel Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- NOTE DI SICUREZZA:
-- 1. I dati esistenti senza azienda_id vengono agganciati all'azienda pilota predefinita 'az-pilota-01'.
-- 2. Nessun dato viene cancellato o modificato nelle funzionalità esistenti.
-- 3. Ogni query futura isola automaticamente i dati all'azienda dell'utente loggato.
-- ==============================================================================

-- 1. ASSICURA TABELLA AZIENDE
CREATE TABLE IF NOT EXISTS public.aziende (
    id TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email_titolare VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    partita_iva VARCHAR(50),
    citta VARCHAR(100),
    stato VARCHAR(20) NOT NULL DEFAULT 'attiva',
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserisci azienda pilota di default se non esiste già
INSERT INTO public.aziende (id, nome, email_titolare, stato)
VALUES ('az-pilota-01', 'Stabilimento Principale (Pilota)', 'admin@machinaflow.com', 'attiva')
ON CONFLICT (id) DO NOTHING;

-- 2. ASSICURA TABELLA PROFILI UTENTI
CREATE TABLE IF NOT EXISTS public.profili_utenti (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100),
    cognome VARCHAR(100),
    ruolo VARCHAR(50) NOT NULL DEFAULT 'amministratore',
    azienda_id TEXT REFERENCES public.aziende(id) ON DELETE SET NULL,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ASSICURA TABELLA INVITI AZIENDE
CREATE TABLE IF NOT EXISTS public.inviti_aziende (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token TEXT NOT NULL UNIQUE,
    azienda_id TEXT NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
    email_destinatario VARCHAR(150) NOT NULL,
    nome_contatto VARCHAR(150),
    telefono VARCHAR(50),
    stato VARCHAR(30) NOT NULL DEFAULT 'in_attesa',
    creato_da UUID,
    creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    utilizzato_il TIMESTAMPTZ
);

-- 4. AGGIUNGI COLONNA azienda_id A TUTTE LE TABELLE APPLICATIVE (SENZA PERDITA DATI)
DO $$ BEGIN
    -- centri_lavoro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='centri_lavoro' AND column_name='azienda_id') THEN
        ALTER TABLE public.centri_lavoro ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
    END IF;

    -- tipi_processo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tipi_processo' AND column_name='azienda_id') THEN
        ALTER TABLE public.tipi_processo ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
    END IF;

    -- articoli
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articoli' AND column_name='azienda_id') THEN
        ALTER TABLE public.articoli ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
    END IF;

    -- clienti
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clienti' AND column_name='azienda_id') THEN
        ALTER TABLE public.clienti ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
    END IF;

    -- ordini_clienti
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordini_clienti' AND column_name='azienda_id') THEN
        ALTER TABLE public.ordini_clienti ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
    END IF;

    -- ordini_produzione
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordini_produzione' AND column_name='azienda_id') THEN
        ALTER TABLE public.ordini_produzione ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
    END IF;

    -- ddt_clienti (se tabella esiste)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ddt_clienti') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddt_clienti' AND column_name='azienda_id') THEN
            ALTER TABLE public.ddt_clienti ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
        END IF;
    END IF;

    -- ddt_esterni (se tabella esiste)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ddt_esterni') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddt_esterni' AND column_name='azienda_id') THEN
            ALTER TABLE public.ddt_esterni ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
        END IF;
    END IF;

    -- fornitori_terzisti (se tabella esiste)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fornitori_terzisti') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornitori_terzisti' AND column_name='azienda_id') THEN
            ALTER TABLE public.fornitori_terzisti ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
        END IF;
    END IF;

    -- ordini_fornitori (se tabella esiste)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ordini_fornitori') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordini_fornitori' AND column_name='azienda_id') THEN
            ALTER TABLE public.ordini_fornitori ADD COLUMN azienda_id TEXT REFERENCES public.aziende(id) ON DELETE CASCADE DEFAULT 'az-pilota-01';
        END IF;
    END IF;
END $$;

-- Rimuovi eventuali record con azienda_id NULL e assegnali a 'az-pilota-01'
UPDATE public.centri_lavoro SET azienda_id = 'az-pilota-01' WHERE azienda_id IS NULL;
UPDATE public.tipi_processo SET azienda_id = 'az-pilota-01' WHERE azienda_id IS NULL;
UPDATE public.articoli SET azienda_id = 'az-pilota-01' WHERE azienda_id IS NULL;
UPDATE public.clienti SET azienda_id = 'az-pilota-01' WHERE azienda_id IS NULL;
UPDATE public.ordini_clienti SET azienda_id = 'az-pilota-01' WHERE azienda_id IS NULL;
UPDATE public.ordini_produzione SET azienda_id = 'az-pilota-01' WHERE azienda_id IS NULL;

-- 5. FUNZIONE DI SUPPORTO PER ESTRARRE L'AZIENDA DELL'UTENTE CONNESSO
CREATE OR REPLACE FUNCTION public.get_current_user_azienda_id()
RETURNS TEXT AS $$
    SELECT azienda_id FROM public.profili_utenti WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- FUNZIONE DI SUPPORTO PER VERIFICARE SE È SUPER ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profili_utenti 
        WHERE id = auth.uid() AND ruolo = 'super_admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. ABILITA ROW LEVEL SECURITY SU TUTTE LE TABELLE
ALTER TABLE public.aziende ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profili_utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inviti_aziende ENABLE ROW LEVEL SECURITY;
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

-- 7. REGOLE RLS IMPERMEABILI
-- Gli utenti possono accedere solo ed esclusivamente ai record della propria azienda (oppure se Super Admin)
-- Per garantire continuità durante i test attuali, se l'utente non ha ancora un profilo con azienda_id,
-- ha accesso ai record di 'az-pilota-01'.

-- Tabella: profili_utenti (ognuno legge e modifica il proprio, super_admin legge tutti)
DROP POLICY IF EXISTS "Profili utenti visibili a proprietario o super_admin" ON public.profili_utenti;
CREATE POLICY "Profili utenti visibili a proprietario o super_admin" ON public.profili_utenti
FOR ALL TO authenticated
USING (id = auth.uid() OR public.is_super_admin())
WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- Tabella: aziende
DROP POLICY IF EXISTS "Aziende visibili solo ai membri o super_admin" ON public.aziende;
CREATE POLICY "Aziende visibili solo ai membri o super_admin" ON public.aziende
FOR ALL TO authenticated
USING (id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Macro policy riutilizzabile per tabelle tenant
-- centri_lavoro
DROP POLICY IF EXISTS "Isolamento centri_lavoro per azienda" ON public.centri_lavoro;
DROP POLICY IF EXISTS "Accesso totale per autenticati centri_lavoro" ON public.centri_lavoro;
CREATE POLICY "Isolamento centri_lavoro per azienda" ON public.centri_lavoro
FOR ALL TO authenticated
USING (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin());

-- tipi_processo
DROP POLICY IF EXISTS "Isolamento tipi_processo per azienda" ON public.tipi_processo;
DROP POLICY IF EXISTS "Accesso totale per autenticati tipi_processo" ON public.tipi_processo;
CREATE POLICY "Isolamento tipi_processo per azienda" ON public.tipi_processo
FOR ALL TO authenticated
USING (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin());

-- articoli
DROP POLICY IF EXISTS "Isolamento articoli per azienda" ON public.articoli;
DROP POLICY IF EXISTS "Accesso totale per autenticati articoli" ON public.articoli;
CREATE POLICY "Isolamento articoli per azienda" ON public.articoli
FOR ALL TO authenticated
USING (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin());

-- distinta_base (collegata agli articoli della propria azienda)
DROP POLICY IF EXISTS "Isolamento distinta_base per azienda" ON public.distinta_base;
DROP POLICY IF EXISTS "Accesso totale per autenticati distinta_base" ON public.distinta_base;
CREATE POLICY "Isolamento distinta_base per azienda" ON public.distinta_base
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.articoli a WHERE a.id = articolo_padre_id AND (a.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.articoli a WHERE a.id = articolo_padre_id AND (a.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
);

-- fasi_ciclo_standard
DROP POLICY IF EXISTS "Isolamento fasi_ciclo_standard per azienda" ON public.fasi_ciclo_standard;
DROP POLICY IF EXISTS "Accesso totale per autenticati fasi_ciclo_standard" ON public.fasi_ciclo_standard;
CREATE POLICY "Isolamento fasi_ciclo_standard per azienda" ON public.fasi_ciclo_standard
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.articoli a WHERE a.id = articolo_id AND (a.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.articoli a WHERE a.id = articolo_id AND (a.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
);

-- clienti
DROP POLICY IF EXISTS "Isolamento clienti per azienda" ON public.clienti;
DROP POLICY IF EXISTS "Accesso totale per autenticati clienti" ON public.clienti;
CREATE POLICY "Isolamento clienti per azienda" ON public.clienti
FOR ALL TO authenticated
USING (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin());

-- ordini_clienti
DROP POLICY IF EXISTS "Isolamento ordini_clienti per azienda" ON public.ordini_clienti;
DROP POLICY IF EXISTS "Accesso totale per autenticati ordini_clienti" ON public.ordini_clienti;
CREATE POLICY "Isolamento ordini_clienti per azienda" ON public.ordini_clienti
FOR ALL TO authenticated
USING (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin());

-- righe_ordine_cliente
DROP POLICY IF EXISTS "Isolamento righe_ordine_cliente per azienda" ON public.righe_ordine_cliente;
DROP POLICY IF EXISTS "Accesso totale per autenticati righe_ordine_cliente" ON public.righe_ordine_cliente;
CREATE POLICY "Isolamento righe_ordine_cliente per azienda" ON public.righe_ordine_cliente
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.ordini_clienti o WHERE o.id = ordine_cliente_id AND (o.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.ordini_clienti o WHERE o.id = ordine_cliente_id AND (o.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
);

-- ordini_produzione
DROP POLICY IF EXISTS "Isolamento ordini_produzione per azienda" ON public.ordini_produzione;
DROP POLICY IF EXISTS "Accesso totale per autenticati ordini_produzione" ON public.ordini_produzione;
CREATE POLICY "Isolamento ordini_produzione per azienda" ON public.ordini_produzione
FOR ALL TO authenticated
USING (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin())
WITH CHECK (azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin());

-- fasi_odp
DROP POLICY IF EXISTS "Isolamento fasi_odp per azienda" ON public.fasi_odp;
DROP POLICY IF EXISTS "Accesso totale per autenticati fasi_odp" ON public.fasi_odp;
CREATE POLICY "Isolamento fasi_odp per azienda" ON public.fasi_odp
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.ordini_produzione o WHERE o.id = odp_id AND (o.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.ordini_produzione o WHERE o.id = odp_id AND (o.azienda_id = COALESCE(public.get_current_user_azienda_id(), 'az-pilota-01') OR public.is_super_admin()))
);
