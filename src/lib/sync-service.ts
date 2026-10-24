import { createClient } from '@/lib/supabase/client'
import {
  CentroLavoro,
  TipoProcesso,
  Articolo,
  ComponenteDistintaBase,
  FaseCicloStandard,
  Cliente,
  OrdineCliente,
  RigaOrdineCliente,
  OrdineProduzione,
  FaseOdP
} from '@/types/database'
import {
  SEED_CENTRI_LAVORO,
  SEED_TIPI_PROCESSO,
  SEED_ARTICOLI,
  SEED_DISTINTA_BASE,
  SEED_FASI_CICLO,
  SEED_CLIENTI,
  SEED_ORDINI_CLIENTI
} from '@/lib/data-service'

const supabase = createClient()

export const syncService = {
  // Sincronizza Seed iniziale nel Database Cloud se vuoto
  async inizializzaDatabaseSeVuoto() {
    try {
      const { data: macchine } = await supabase.from('centri_lavoro').select('id').limit(1)
      if (!macchine || macchine.length === 0) {
        // Carica centri lavoro
        await supabase.from('centri_lavoro').upsert(SEED_CENTRI_LAVORO)
        // Carica processi
        await supabase.from('tipi_processo').upsert(SEED_TIPI_PROCESSO)
        // Carica articoli
        await supabase.from('articoli').upsert(
          SEED_ARTICOLI.map((a) => ({
            id: a.id,
            codice_articolo: a.codice_articolo,
            descrizione: a.descrizione,
            tipo: a.tipo,
            unita_misura: a.unita_misura,
            giacenza_attuale: a.giacenza_attuale,
            scorta_minima: a.scorta_minima,
            prezzo_riferimento: a.prezzo_riferimento
          }))
        )
        // Carica distinte
        await supabase.from('distinta_base').upsert(SEED_DISTINTA_BASE)
        // Carica cicli
        await supabase.from('fasi_ciclo_standard').upsert(SEED_FASI_CICLO)
        // Carica clienti
        await supabase.from('clienti').upsert(SEED_CLIENTI)
        // Carica ordini clienti
        for (const ord of SEED_ORDINI_CLIENTI) {
          await supabase.from('ordini_clienti').upsert({
            id: ord.id,
            numero_ordine: ord.numero_ordine,
            cliente_id: ord.cliente_id,
            data_ordine: ord.data_ordine,
            data_consegna_concordata: ord.data_consegna_concordata,
            stato: ord.stato,
            note: ord.note
          })
          if (ord.righe && ord.righe.length > 0) {
            await supabase.from('righe_ordine_cliente').upsert(ord.righe)
          }
        }
      }
    } catch (e) {
      console.warn('Errore inizializzazione seed Supabase:', e)
    }
  },

  // 1. ORDINI DI PRODUZIONE (OdP)
  async getOrdiniProduzione(): Promise<(OrdineProduzione & { fasi: FaseOdP[] })[]> {
    try {
      // Recupera ordini salvati localmente nel browser
      let locali: (OrdineProduzione & { fasi: FaseOdP[] })[] = []
      try {
        const salvati = localStorage.getItem('machinaflow_odp')
        if (salvati) locali = JSON.parse(salvati)
      } catch {}

      const { data: odpCloud, error } = await supabase
        .from('ordini_produzione')
        .select(`
          *,
          fasi:fasi_odp(*)
        `)
        .order('creato_il', { ascending: false })

      if (error || !odpCloud) {
        return locali
      }

      // Se nel browser ci sono ordini non ancora presenti su Supabase, inviali in background
      if (locali.length > 0) {
        for (const loc of locali) {
          if (!odpCloud.some((c) => c.id === loc.id)) {
            // Salva su cloud senza bloccare
            this.salvaOrdineProduzione(loc)
            odpCloud.push(loc)
          }
        }
      }

      // Ordina le fasi per sequenza
      const formattati = odpCloud.map((o) => ({
        ...o,
        fasi: (o.fasi || []).sort((a: FaseOdP, b: FaseOdP) => a.sequenza - b.sequenza)
      }))

      // Aggiorna cache locale per massima reattività
      try {
        localStorage.setItem('machinaflow_odp', JSON.stringify(formattati))
      } catch {}

      return formattati
    } catch {
      try {
        const salvati = localStorage.getItem('machinaflow_odp')
        return salvati ? JSON.parse(salvati) : []
      } catch {
        return []
      }
    }
  },

  async salvaOrdineProduzione(nuovoOdp: OrdineProduzione & { fasi: FaseOdP[] }) {
    // 1. Salva sempre in localStorage per reattività immediata
    try {
      const salvati = localStorage.getItem('machinaflow_odp')
      const lista: (OrdineProduzione & { fasi: FaseOdP[] })[] = salvati ? JSON.parse(salvati) : []
      const index = lista.findIndex((o) => o.id === nuovoOdp.id)
      if (index >= 0) {
        lista[index] = nuovoOdp
      } else {
        lista.unshift(nuovoOdp)
      }
      localStorage.setItem('machinaflow_odp', JSON.stringify(lista))
    } catch {}

    // 2. Salva su Supabase Cloud
    try {
      const { fasi, ...datiOdp } = nuovoOdp
      await supabase.from('ordini_produzione').upsert(datiOdp)

      if (fasi && fasi.length > 0) {
        await supabase.from('fasi_odp').upsert(fasi)
      }
    } catch (e) {
      console.error('Errore sincronizzazione cloud OdP:', e)
    }
  },

  async aggiornaFaseOdP(fase: FaseOdP) {
    // Aggiorna locale
    try {
      const salvati = localStorage.getItem('machinaflow_odp')
      if (salvati) {
        const lista: (OrdineProduzione & { fasi: FaseOdP[] })[] = JSON.parse(salvati)
        for (const odp of lista) {
          const fIndex = odp.fasi.findIndex((f) => f.id === fase.id)
          if (fIndex >= 0) {
            odp.fasi[fIndex] = fase
            break
          }
        }
        localStorage.setItem('machinaflow_odp', JSON.stringify(lista))
      }
    } catch {}

    // Aggiorna Cloud
    try {
      await supabase.from('fasi_odp').upsert(fase)
    } catch (e) {
      console.error('Errore aggiornamento cloud fase:', e)
    }
  }
}
