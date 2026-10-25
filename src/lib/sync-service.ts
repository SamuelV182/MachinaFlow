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

      // Se nel browser ci sono ordini non ancora presenti su Supabase, inviali in background verificando sia id che codice_odp
      if (locali.length > 0) {
        for (const loc of locali) {
          const esisteSuCloud = odpCloud.some((c) => c.id === loc.id || c.codice_odp === loc.codice_odp)
          if (!esisteSuCloud) {
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

    // 2. Salva su Supabase Cloud (solo colonne presenti nel database)
    try {
      const datiOdpPuliti = {
        id: nuovoOdp.id,
        codice_odp: nuovoOdp.codice_odp,
        riga_ordine_cliente_id: nuovoOdp.riga_ordine_cliente_id || null,
        articolo_id: nuovoOdp.articolo_id,
        quantita_da_produrre: nuovoOdp.quantita_da_produrre,
        quantita_prodotta: nuovoOdp.quantita_prodotta || 0,
        data_inizio_pianificata: nuovoOdp.data_inizio_pianificata || null,
        data_fine_pianificata: nuovoOdp.data_fine_pianificata || null,
        stato: nuovoOdp.stato || 'pianificato',
        priorita: nuovoOdp.priorita || 2,
        qr_code_token: nuovoOdp.qr_code_token,
        note: nuovoOdp.note || null
      }
      const { error: errOdp } = await supabase
        .from('ordini_produzione')
        .upsert(datiOdpPuliti, { onConflict: 'id' })
      if (errOdp) {
        console.error('Errore inserimento ordine_produzione:', JSON.stringify(errOdp, null, 2))
        return
      }

      if (nuovoOdp.fasi && nuovoOdp.fasi.length > 0) {
        const fasiPulite = nuovoOdp.fasi.map((f) => ({
          id: f.id,
          odp_id: nuovoOdp.id,
          sequenza: f.sequenza,
          nome_fase: f.nome_fase,
          tipo_processo_id: f.tipo_processo_id || null,
          centro_lavoro_id: f.centro_lavoro_id,
          tempo_stimato_totale_min: f.tempo_stimato_totale_min || 0,
          tempo_effettivo_min: f.tempo_effettivo_min || 0,
          stato: f.stato || 'non_iniziata',
          operatore_id: f.operatore_id || null,
          data_inizio_reale: f.data_inizio_reale || null,
          data_fine_reale: f.data_fine_reale || null,
          note_officina: f.note_officina || null
        }))
        const resFasi = await supabase.from('fasi_odp').upsert(fasiPulite)
        if (resFasi.error) {
          console.error('Errore inserimento fasi_odp:', JSON.stringify(resFasi.error, null, 2))
        }
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

    // Aggiorna Cloud (solo colonne valide)
    try {
      const fasePulita = {
        id: fase.id,
        odp_id: fase.odp_id,
        sequenza: fase.sequenza,
        nome_fase: fase.nome_fase,
        tipo_processo_id: fase.tipo_processo_id || null,
        centro_lavoro_id: fase.centro_lavoro_id,
        tempo_stimato_totale_min: fase.tempo_stimato_totale_min || 0,
        tempo_effettivo_min: fase.tempo_effettivo_min || 0,
        stato: fase.stato || 'non_iniziata',
        operatore_id: fase.operatore_id || null,
        data_inizio_reale: fase.data_inizio_reale || null,
        data_fine_reale: fase.data_fine_reale || null,
        note_officina: fase.note_officina || null
      }
      await supabase.from('fasi_odp').upsert(fasePulita)
    } catch (e) {
      console.error('Errore aggiornamento cloud fase:', e)
    }
  },

  async aggiornaStatoOdP(odpId: string, nuovoStato: 'pianificato' | 'rilasciato' | 'in_lavorazione' | 'completato' | 'sospeso', quantitaProdotta?: number) {
    try {
      // Aggiorna localStorage
      const salvati = localStorage.getItem('machinaflow_odp')
      if (salvati) {
        const lista: (OrdineProduzione & { fasi: FaseOdP[] })[] = JSON.parse(salvati)
        const odp = lista.find((o) => o.id === odpId)
        if (odp) {
          odp.stato = nuovoStato
          if (quantitaProdotta !== undefined) {
            odp.quantita_prodotta = quantitaProdotta
          } else if (nuovoStato === 'completato') {
            odp.quantita_prodotta = odp.quantita_da_produrre
          }
          localStorage.setItem('machinaflow_odp', JSON.stringify(lista))
        }
      }

      // Aggiorna Cloud Supabase
      const payload: any = { stato: nuovoStato }
      if (quantitaProdotta !== undefined) {
        payload.quantita_prodotta = quantitaProdotta
      }
      await supabase
        .from('ordini_produzione')
        .update(payload)
        .eq('id', odpId)
    } catch (e) {
      console.error('Errore aggiornamento stato OdP su Supabase:', e)
    }
  },

  // 3. ORDINI CLIENTI
  async salvaOrdineCliente(ordine: OrdineCliente & { righe?: RigaOrdineCliente[] }) {
    try {
      await supabase.from('ordini_clienti').upsert({
        id: ordine.id,
        numero_ordine: ordine.numero_ordine,
        cliente_id: ordine.cliente_id,
        data_ordine: ordine.data_ordine,
        data_consegna_concordata: ordine.data_consegna_concordata,
        stato: ordine.stato,
        note: ordine.note || null
      })

      if (ordine.righe && ordine.righe.length > 0) {
        const righeDaSalvare = ordine.righe.map((r) => ({
          id: r.id,
          ordine_cliente_id: ordine.id,
          articolo_id: r.articolo_id,
          quantita: r.quantita,
          prezzo_unitario: r.prezzo_unitario || 0
        }))
        await supabase.from('righe_ordine_cliente').upsert(righeDaSalvare)
      }
    } catch (e) {
      console.error('Errore salvataggio ordine cliente su Supabase:', e)
    }
  },

  async aggiornaStatoOrdineCliente(ordineId: string, nuovoStato: 'bozza' | 'confermato' | 'in_produzione' | 'evaso' | 'annullato') {
    try {
      await supabase
        .from('ordini_clienti')
        .update({ stato: nuovoStato })
        .eq('id', ordineId)
    } catch (e) {
      console.error('Errore aggiornamento stato ordine cliente su Supabase:', e)
    }
  },

  // 4. ARTICOLI E GIACENZE
  async salvaArticolo(articolo: Articolo) {
    try {
      await supabase.from('articoli').upsert({
        id: articolo.id,
        codice_articolo: articolo.codice_articolo,
        descrizione: articolo.descrizione,
        tipo: articolo.tipo,
        unita_misura: articolo.unita_misura,
        giacenza_attuale: articolo.giacenza_attuale,
        scorta_minima: articolo.scorta_minima,
        prezzo_riferimento: articolo.prezzo_riferimento || 0
      })
    } catch (e) {
      console.error('Errore salvataggio articolo su Supabase:', e)
    }
  },

  // 5. CENTRI DI LAVORO E PROCESSI
  async salvaCentroLavoro(centro: CentroLavoro) {
    try {
      await supabase.from('centri_lavoro').upsert(centro)
    } catch (e) {
      console.error('Errore salvataggio centro lavoro su Supabase:', e)
    }
  },

  async salvaTipoProcesso(processo: TipoProcesso) {
    try {
      await supabase.from('tipi_processo').upsert(processo)
    } catch (e) {
      console.error('Errore salvataggio tipo processo su Supabase:', e)
    }
  }
}
