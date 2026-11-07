-- ==============================================================================
-- MachinaFlow - Estensione Dati Intestazione Aziendale & Logo per DDT
-- Esegui questo script nel Supabase SQL Editor
-- ==============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aziende' AND column_name='indirizzo') THEN
        ALTER TABLE public.aziende ADD COLUMN indirizzo TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aziende' AND column_name='cap') THEN
        ALTER TABLE public.aziende ADD COLUMN cap VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aziende' AND column_name='provincia') THEN
        ALTER TABLE public.aziende ADD COLUMN provincia VARCHAR(10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aziende' AND column_name='codice_fiscale') THEN
        ALTER TABLE public.aziende ADD COLUMN codice_fiscale VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aziende' AND column_name='logo_url') THEN
        ALTER TABLE public.aziende ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aziende' AND column_name='note_ddt_predefinite') THEN
        ALTER TABLE public.aziende ADD COLUMN note_ddt_predefinite TEXT;
    END IF;
END $$;

-- Aggiorna azienda pilota predefinita con dati d'esempio completi
UPDATE public.aziende
SET 
    indirizzo = COALESCE(indirizzo, 'Via dell''Innovazione Meccanica 12'),
    cap = COALESCE(cap, '55100'),
    provincia = COALESCE(provincia, 'LU'),
    citta = COALESCE(citta, 'Lucca'),
    partita_iva = COALESCE(partita_iva, 'IT01234567890')
WHERE id = 'az-pilota-01';

-- Permetti all'amministratore dell'azienda di aggiornare i propri dati anagrafici (UPDATE)
DROP POLICY IF EXISTS "Aggiornamento dati azienda per titolare o super_admin" ON public.aziende;
CREATE POLICY "Aggiornamento dati azienda per titolare o super_admin" ON public.aziende
FOR UPDATE TO authenticated
USING (id = public.get_current_user_azienda_id() OR public.is_super_admin())
WITH CHECK (id = public.get_current_user_azienda_id() OR public.is_super_admin());
