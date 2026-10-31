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
  FaseOdP,
  DocumentoTrasportoCliente,
  DocumentoTrasportoEsterno,
  FornitoreTerzista,
  OrdineFornitore
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
            riferimento_ordine_cliente: ord.riferimento_ordine_cliente || null,
            cliente_id: ord.cliente_id,
            data_ordine: ord.data_ordine,
            data_consegna_concordata: ord.data_consegna_concordata,
            stato: ord.stato,
            note: ord.note
          })
          if (ord.righe && ord.righe.length > 0) {
            await supabase.from('righe_ordine_cliente').upsert(
              ord.righe.map((r: any) => ({
                id: r.id,
                ordine_cliente_id: ord.id,
                pos_riga_cliente: r.pos_riga_cliente || null,
                articolo_id: r.articolo_id,
                quantita: r.quantita,
                prezzo_unitario: r.prezzo_unitario || 0
              }))
            )
          }
        }
      }
    } catch (e) {
      console.warn('Errore inizializzazione seed Supabase:', e)
    }
  },

  // 1. ORDINI DI PRODUZIONE (OdP)
  // opzioni.soloAttivi = true: per postazioni a bordo macchina che necessitano solo di ordini attivi o completati di recente
  async getOrdiniProduzione(opzioni?: { soloAttivi?: boolean }): Promise<(OrdineProduzione & { fasi: FaseOdP[] })[]> {
    try {
      // Recupera ordini salvati localmente nel browser
      let locali: (OrdineProduzione & { fasi: FaseOdP[] })[] = []
      try {
        const salvati = localStorage.getItem('machinaflow_odp')
        if (salvati) locali = JSON.parse(salvati)
      } catch {}

      let query = supabase
        .from('ordini_produzione')
        .select(`
          *,
          fasi:fasi_odp(*)
        `)
        .order('creato_il', { ascending: false })

      // Se richiesto solo il carico attivo (es. tablet officina), escludiamo gli ordini completati o già spediti
      // mantenendo gli ordini pianificati, in_corso o sospesi
      if (opzioni?.soloAttivi) {
        query = query.neq('stato', 'completato').neq('stato', 'spedito')
      }

      const { data: odpCloud, error } = await query

      if (error || !odpCloud) {
        return opzioni?.soloAttivi ? locali.filter((o) => o.stato !== 'completato') : locali
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

      // Aggiorna cache locale (se non è un filtro parziale)
      if (!opzioni?.soloAttivi) {
        try {
          localStorage.setItem('machinaflow_odp', JSON.stringify(formattati))
        } catch {}
      }

      return formattati
    } catch {
      try {
        const salvati = localStorage.getItem('machinaflow_odp')
        const lista = salvati ? JSON.parse(salvati) : []
        return opzioni?.soloAttivi ? lista.filter((o: OrdineProduzione) => o.stato !== 'completato') : lista
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
        note: nuovoOdp.note || null,
        materia_prima_scaricata: nuovoOdp.materia_prima_scaricata ?? false,
        data_scarico_materia_prima: nuovoOdp.data_scarico_materia_prima || null
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

  async aggiornaStatoOdP(odpId: string, nuovoStato: 'pianificato' | 'rilasciato' | 'in_lavorazione' | 'completato' | 'sospeso' | 'scartato' | 'spedito', quantitaProdotta?: number) {
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

  async segnaMateriaPrimaScaricata(odpId: string) {
    const adesso = new Date().toISOString()
    try {
      // 1. Aggiorna sempre istantaneamente in localStorage
      const salvati = localStorage.getItem('machinaflow_odp')
      if (salvati) {
        const lista: (OrdineProduzione & { fasi: FaseOdP[] })[] = JSON.parse(salvati)
        const odp = lista.find((o) => o.id === odpId)
        if (odp) {
          odp.materia_prima_scaricata = true
          odp.data_scarico_materia_prima = adesso
          localStorage.setItem('machinaflow_odp', JSON.stringify(lista))
        }
      }

      // 2. Tenta aggiornamento su Supabase Cloud (con catch sicuro)
      try {
        await supabase
          .from('ordini_produzione')
          .update({
            materia_prima_scaricata: true,
            data_scarico_materia_prima: adesso
          })
          .eq('id', odpId)
      } catch (errDb) {
        console.warn('Nota: sync cloud materia_prima_scaricata:', errDb)
      }
    } catch (e) {
      console.error('Errore segnaMateriaPrimaScaricata:', e)
    }
  },

  // 3. ORDINI CLIENTI
  async getOrdiniClienti(): Promise<(OrdineCliente & { righe: RigaOrdineCliente[] })[]> {
    try {
      // Recupera prima le modifiche salvate localmente
      let ordiniLocali: any[] = []
      const salvati = localStorage.getItem('machinaflow_ordini_clienti')
      if (salvati) {
        try {
          ordiniLocali = JSON.parse(salvati)
        } catch {}
      }

      const { data: ordiniData, error: errOrdini } = await supabase
        .from('ordini_clienti')
        .select('*')
        .order('numero_ordine', { ascending: false })

      if (errOrdini || !ordiniData) {
        console.warn('Lettura ordini_clienti da Supabase fallita o non disponibile:', errOrdini?.message)
        // Se c'è localStorage, uniscilo con i seed dando priorità a localStorage
        const mappaLocale = new Map<string, any>()
        SEED_ORDINI_CLIENTI.forEach((o) => mappaLocale.set(o.id, o))
        ordiniLocali.forEach((o) => mappaLocale.set(o.id, o))
        return Array.from(mappaLocale.values())
      }

      // Leggi tutte le righe associate agli ordini da Supabase
      const { data: righeData } = await supabase
        .from('righe_ordine_cliente')
        .select('*')

      const mappaRighe = new Map<string, RigaOrdineCliente[]>()
      ;(righeData || []).forEach((r: any) => {
        const arr = mappaRighe.get(r.ordine_cliente_id) || []
        arr.push(r)
        mappaRighe.set(r.ordine_cliente_id, arr)
      })

      const ordiniCompletiCloud = ordiniData.map((ord: any) => ({
        ...ord,
        righe: mappaRighe.get(ord.id) || ord.righe || []
      }))

      // Unisci le fonti:
      // 1. Base: SEED_ORDINI_CLIENTI
      // 2. Cloud: ordiniCompletiCloud sovrascrivono SEED
      // 3. Locale: ordiniLocali (le modifiche recenti dell'utente) hanno la priorità massima
      const mappa = new Map<string, any>()
      SEED_ORDINI_CLIENTI.forEach((o) => mappa.set(o.id, o))
      ordiniCompletiCloud.forEach((o: any) => mappa.set(o.id, o))
      ordiniLocali.forEach((o: any) => mappa.set(o.id, o))

      const finale = Array.from(mappa.values())
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(finale))
      return finale
    } catch (e) {
      console.error('Errore getOrdiniClienti:', e)
      const salvati = localStorage.getItem('machinaflow_ordini_clienti')
      return salvati ? JSON.parse(salvati) : SEED_ORDINI_CLIENTI
    }
  },

  async salvaOrdineCliente(ordine: OrdineCliente & { righe?: RigaOrdineCliente[] }) {
    // 1. Salva subito in localStorage per non perdere la modifica anche offline
    try {
      const salvati = localStorage.getItem('machinaflow_ordini_clienti')
      let lista: any[] = salvati ? JSON.parse(salvati) : []
      const index = lista.findIndex((o) => o.id === ordine.id)
      if (index >= 0) {
        lista[index] = { ...lista[index], ...ordine }
      } else {
        lista.push(ordine)
      }
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(lista))
    } catch (e) {
      console.warn('Errore salvataggio locale ordine cliente:', e)
    }

    // 2. Tenta la sincronizzazione cloud su Supabase
    try {
      // Prepariamo il payload: proviamo con riferimento_ordine_cliente, con fallback se la colonna non esiste ancora nel DB
      const payloadOrdine: any = {
        id: ordine.id,
        numero_ordine: ordine.numero_ordine,
        cliente_id: ordine.cliente_id,
        data_ordine: ordine.data_ordine,
        data_consegna_concordata: ordine.data_consegna_concordata,
        stato: ordine.stato,
        note: ordine.note || null
      }
      if (ordine.riferimento_ordine_cliente !== undefined) {
        payloadOrdine.riferimento_ordine_cliente = ordine.riferimento_ordine_cliente
      }

      let resOrd = await supabase.from('ordini_clienti').upsert(payloadOrdine)
      // Se fallisce per colonna inesistente (es. riferimento_ordine_cliente), ritenta senza quella colonna
      if (resOrd.error && resOrd.error.message && resOrd.error.message.includes('riferimento_ordine_cliente')) {
        delete payloadOrdine.riferimento_ordine_cliente
        resOrd = await supabase.from('ordini_clienti').upsert(payloadOrdine)
      }

      if (ordine.righe && ordine.righe.length > 0) {
        const righeDaSalvare = ordine.righe.map((r: any) => ({
          id: r.id,
          ordine_cliente_id: ordine.id,
          pos_riga_cliente: r.pos_riga_cliente ? String(r.pos_riga_cliente) : null,
          articolo_id: r.articolo_id,
          quantita: r.quantita,
          prezzo_unitario: r.prezzo_unitario || 0
        }))
        
        let resRighe = await supabase.from('righe_ordine_cliente').upsert(righeDaSalvare)
        if (resRighe.error && resRighe.error.message && resRighe.error.message.includes('pos_riga_cliente')) {
          // Se la colonna pos_riga_cliente non è ancora stata creata in Supabase, salviamo senza quella colonna
          const righeBase = righeDaSalvare.map(({ pos_riga_cliente, ...rest }) => rest)
          await supabase.from('righe_ordine_cliente').upsert(righeBase)
        }
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

  async eliminaOrdineCliente(ordineId: string) {
    // 1. Rimuovi da localStorage
    try {
      const salvati = localStorage.getItem('machinaflow_ordini_clienti')
      if (salvati) {
        const lista: any[] = JSON.parse(salvati)
        const filtrati = lista.filter((o) => o.id !== ordineId)
        localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(filtrati))
      }
    } catch (e) {
      console.warn('Errore rimozione locale ordine cliente:', e)
    }

    // 2. Rimuovi da Supabase Cloud (le righe figlie vengono cancellate in cascata da Postgres)
    try {
      await supabase.from('righe_ordine_cliente').delete().eq('ordine_cliente_id', ordineId)
      await supabase.from('ordini_clienti').delete().eq('id', ordineId)
    } catch (e) {
      console.error('Errore eliminazione ordine cliente su Supabase:', e)
    }
  },

  // 4. ARTICOLI E GIACENZE
  async getArticoli(): Promise<Articolo[]> {
    try {
      const { data, error } = await supabase
        .from('articoli')
        .select('*')
        .order('codice_articolo')

      if (error) {
        console.warn('Errore lettura articoli da Supabase:', error.message)
        const salvati = localStorage.getItem('machinaflow_articoli')
        return salvati ? JSON.parse(salvati) : []
      }

      if (data && data.length > 0) {
        localStorage.setItem('machinaflow_articoli', JSON.stringify(data))
        return data as Articolo[]
      }
      return []
    } catch (e) {
      console.error('Errore getArticoli:', e)
      const salvati = localStorage.getItem('machinaflow_articoli')
      return salvati ? JSON.parse(salvati) : []
    }
  },

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
  },

  // 6. DOCUMENTI DI TRASPORTO (DDT) CLIENTI
  async getDdtClienti(): Promise<DocumentoTrasportoCliente[]> {
    try {
      const { data, error } = await supabase
        .from('ddt_clienti')
        .select('*')
        .order('creato_il', { ascending: false })

      if (error) {
        console.warn('Errore lettura ddt_clienti da Supabase:', error.message)
        const salvati = localStorage.getItem('machinaflow_ddt_clienti')
        return salvati ? JSON.parse(salvati) : []
      }

      if (data) {
        localStorage.setItem('machinaflow_ddt_clienti', JSON.stringify(data))
        return data as DocumentoTrasportoCliente[]
      }
      return []
    } catch (e) {
      console.error('Errore getDdtClienti:', e)
      const salvati = localStorage.getItem('machinaflow_ddt_clienti')
      return salvati ? JSON.parse(salvati) : []
    }
  },

  async salvaDdtCliente(ddt: DocumentoTrasportoCliente) {
    try {
      // Aggiorna cache locale
      const salvati = localStorage.getItem('machinaflow_ddt_clienti')
      const lista: DocumentoTrasportoCliente[] = salvati ? JSON.parse(salvati) : []
      const idx = lista.findIndex((d) => d.id === ddt.id)
      if (idx >= 0) {
        lista[idx] = ddt
      } else {
        lista.unshift(ddt)
      }
      localStorage.setItem('machinaflow_ddt_clienti', JSON.stringify(lista))

      // Salva nel Cloud Supabase
      await supabase.from('ddt_clienti').upsert({
        id: ddt.id,
        numero_ddt: ddt.numero_ddt,
        data_emissione: ddt.data_emissione,
        cliente_id: ddt.cliente_id || null,
        cliente_nome: ddt.cliente_nome,
        cliente_indirizzo: ddt.cliente_indirizzo || null,
        cliente_piva: ddt.cliente_piva || null,
        destinazione_diversa: ddt.destinazione_diversa || null,
        causale_trasporto: ddt.causale_trasporto || 'Vendita',
        porto: ddt.porto || 'Franco',
        aspetto_beni: ddt.aspetto_beni || 'A vista',
        numero_colli: ddt.numero_colli || 1,
        peso_totale_kg: ddt.peso_totale_kg || 0,
        vettore_nome: ddt.vettore_nome || 'Mittente (Mezzo proprio)',
        note_trasporto: ddt.note_trasporto || null,
        righe: ddt.righe || [],
        creato_il: ddt.creato_il || new Date().toISOString()
      })
    } catch (e) {
      console.error('Errore salvaDdtCliente su Supabase:', e)
    }
  },

  // 7. DOCUMENTI DI TRASPORTO (DDT) ESTERNI / TERZISTI
  async getDdtEsterni(): Promise<DocumentoTrasportoEsterno[]> {
    try {
      const { data, error } = await supabase
        .from('ddt_esterni')
        .select('*')
        .order('creato_il', { ascending: false })

      if (error) {
        console.warn('Errore lettura ddt_esterni da Supabase:', error.message)
        const salvati = localStorage.getItem('machinaflow_ddt_esterni')
        return salvati ? JSON.parse(salvati) : []
      }

      if (data) {
        localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify(data))
        return data as DocumentoTrasportoEsterno[]
      }
      return []
    } catch (e) {
      console.error('Errore getDdtEsterni:', e)
      const salvati = localStorage.getItem('machinaflow_ddt_esterni')
      return salvati ? JSON.parse(salvati) : []
    }
  },

  async salvaDdtEsterno(ddt: DocumentoTrasportoEsterno) {
    try {
      // Aggiorna cache locale
      const salvati = localStorage.getItem('machinaflow_ddt_esterni')
      const lista: DocumentoTrasportoEsterno[] = salvati ? JSON.parse(salvati) : []
      const idx = lista.findIndex((d) => d.id === ddt.id)
      if (idx >= 0) {
        lista[idx] = ddt
      } else {
        lista.unshift(ddt)
      }
      localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify(lista))

      // Salva nel Cloud Supabase
      await supabase.from('ddt_esterni').upsert({
        id: ddt.id,
        numero_ddt: ddt.numero_ddt,
        data_emissione: ddt.data_emissione,
        fornitore_nome: ddt.fornitore_nome,
        fornitore_indirizzo: ddt.fornitore_indirizzo || null,
        fornitore_piva: ddt.fornitore_piva || null,
        causale_trasporto: ddt.causale_trasporto || 'Invio per Conto Lavorazione',
        porto: ddt.porto || 'Franco',
        aspetto_beni: ddt.aspetto_beni || 'A vista su pallet',
        numero_colli: ddt.numero_colli || 1,
        peso_totale_kg: ddt.peso_totale_kg || 0,
        vettore_nome: ddt.vettore_nome || 'Mittente (Mezzo proprio)',
        note_trasporto: ddt.note_trasporto || null,
        stato: ddt.stato || 'spedito',
        righe: ddt.righe || [],
        creato_il: ddt.creato_il || new Date().toISOString()
      })
    } catch (e) {
      console.error('Errore salvaDdtEsterno su Supabase:', e)
    }
  },

  // 8. ANAGRAFICA FORNITORI TERZISTI
  async getFornitoriTerzisti(): Promise<FornitoreTerzista[]> {
    try {
      const { data, error } = await supabase
        .from('fornitori_terzisti')
        .select('*')
        .order('ragione_sociale')

      if (error) {
        console.warn('Errore lettura fornitori_terzisti:', error.message)
        const salvati = localStorage.getItem('machinaflow_fornitori_terzisti')
        return salvati ? JSON.parse(salvati) : []
      }

      if (data && data.length > 0) {
        localStorage.setItem('machinaflow_fornitori_terzisti', JSON.stringify(data))
        return data as FornitoreTerzista[]
      }
      return []
    } catch (e) {
      console.error('Errore getFornitoriTerzisti:', e)
      const salvati = localStorage.getItem('machinaflow_fornitori_terzisti')
      return salvati ? JSON.parse(salvati) : []
    }
  },

  async salvaFornitoreTerzista(terzista: FornitoreTerzista) {
    try {
      const salvati = localStorage.getItem('machinaflow_fornitori_terzisti')
      const lista: FornitoreTerzista[] = salvati ? JSON.parse(salvati) : []
      const idx = lista.findIndex((t) => t.id === terzista.id)
      if (idx >= 0) {
        lista[idx] = terzista
      } else {
        lista.push(terzista)
      }
      localStorage.setItem('machinaflow_fornitori_terzisti', JSON.stringify(lista))

      await supabase.from('fornitori_terzisti').upsert(terzista)
    } catch (e) {
      console.error('Errore salvaFornitoreTerzista su Supabase:', e)
    }
  },

  // 9. ORDINI FORNITORI (MRP)
  async getOrdiniFornitori(): Promise<OrdineFornitore[]> {
    try {
      const { data, error } = await supabase
        .from('ordini_fornitori')
        .select('*')
        .order('creato_il', { ascending: false })

      if (error) {
        console.warn('Errore lettura ordini_fornitori:', error.message)
        const salvati = localStorage.getItem('machinaflow_ordini_fornitori')
        return salvati ? JSON.parse(salvati) : []
      }

      if (data) {
        localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(data))
        return data as OrdineFornitore[]
      }
      return []
    } catch (e) {
      console.error('Errore getOrdiniFornitori:', e)
      const salvati = localStorage.getItem('machinaflow_ordini_fornitori')
      return salvati ? JSON.parse(salvati) : []
    }
  },

  async salvaOrdineFornitore(ordine: OrdineFornitore) {
    try {
      const salvati = localStorage.getItem('machinaflow_ordini_fornitori')
      const lista: OrdineFornitore[] = salvati ? JSON.parse(salvati) : []
      const idx = lista.findIndex((o) => o.id === ordine.id)
      if (idx >= 0) {
        lista[idx] = ordine
      } else {
        lista.unshift(ordine)
      }
      localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(lista))

      await supabase.from('ordini_fornitori').upsert(ordine)
    } catch (e) {
      console.error('Errore salvaOrdineFornitore su Supabase:', e)
    }
  },

  // 6. REAL-TIME SUBSCRIPTIONS
  // Permette a tutti i client (desktop, cellulari, postazioni) di ricevere aggiornamenti
  // istantanei in tempo reale quando qualsiasi postazione aggiorna OdP, Fasi, Ordini Clienti o DDT
  sottoscriviAvanzamentoProduzione(suAggiornamento: () => void) {
    const channel = supabase
      .channel('officina-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fasi_odp' },
        () => {
          suAggiornamento()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordini_produzione' },
        () => {
          suAggiornamento()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordini_clienti' },
        () => {
          suAggiornamento()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ddt_clienti' },
        () => {
          suAggiornamento()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordini_fornitori' },
        () => {
          suAggiornamento()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articoli' },
        () => {
          suAggiornamento()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
