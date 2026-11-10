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
  OrdineFornitore,
  MovimentoMagazzino
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

// Recupera in modo ultra-rapido l'ID dell'azienda corrente (sia per utenti normali che per Super Admin in Modalità Supporto)
export function getCurrentAziendaId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // 1. Priorità massima: modalità supporto esplicita attivata dal Super Admin
    const idSupporto = localStorage.getItem('machinaflow_supporto_azienda_id')
    if (idSupporto) return idSupporto

    // 2. Azienda memorizzata dell'utente loggato
    const sessionAz = localStorage.getItem('machinaflow_session_azienda_id')
    if (sessionAz) return sessionAz

    // 3. Fallback da Supabase auth session memorizzata nel browser
    const sbKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (sbKey) {
      const tokenData = JSON.parse(localStorage.getItem(sbKey) || '{}')
      const user = tokenData?.user
      if (user?.user_metadata?.azienda_id) {
        return user.user_metadata.azienda_id
      }
    }
  } catch {}
  return null
}

// Restituisce una sigla o codice breve univoco per l'azienda corrente (es. 'BRB', 'PILOTA', ecc.)
export function getSiglaAziendaCorrente(): string {
  if (typeof window === 'undefined') return ''
  try {
    const azId = getCurrentAziendaId()
    if (!azId || azId === 'az-pilota-01') return ''
    const match = azId.match(/^az-([a-z0-9]+)/i)
    if (match && match[1]) {
      return match[1].slice(0, 5).toUpperCase()
    }
  } catch {}
  return ''
}

// Costruisce o normalizza un codice OdP con sigla aziendale (es. 'ODP-BRB-2026-001' oppure 'ODP-2026-001' se pilota)
export function formattaCodiceOdpPerAzienda(codiceBase: string): string {
  const sigla = getSiglaAziendaCorrente()
  if (!sigla) return codiceBase
  if (codiceBase.includes(`-${sigla}-`)) return codiceBase
  // Sostituisce 'ODP-2026-' o 'ODP-' con 'ODP-SIGLA-2026-'
  if (codiceBase.startsWith('ODP-')) {
    return codiceBase.replace(/^ODP-/, `ODP-${sigla}-`)
  }
  return `ODP-${sigla}-${codiceBase}`
}

// Costruisce o normalizza un numero DDT cliente con sigla aziendale per evitare conflitti globali
export function formattaNumeroDdtPerAzienda(numeroDdtBase: string): string {
  const sigla = getSiglaAziendaCorrente()
  if (!sigla) return numeroDdtBase
  if (numeroDdtBase.includes(`-${sigla}-`)) return numeroDdtBase
  if (numeroDdtBase.startsWith('DDT-')) {
    return numeroDdtBase.replace(/^DDT-/, `DDT-${sigla}-`)
  }
  return `DDT-${sigla}-${numeroDdtBase}`
}

// Verifica se siamo in modalità supporto o con un'azienda diversa da quella demo pilota
export function isAziendaClienteIsolata(): boolean {
  const azId = getCurrentAziendaId()
  return Boolean(azId && azId !== 'az-pilota-01')
}

export const syncService = {
  getCurrentAziendaId,
  getSiglaAziendaCorrente,
  formattaCodiceOdpPerAzienda,
  formattaNumeroDdtPerAzienda,
  isAziendaClienteIsolata,
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

      // Se è attiva la modalità supporto o un'azienda isolata, filtra tassativamente per azienda_id
      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        query = query.eq('azienda_id', azIdCorrente)
      }

      // Se richiesto solo il carico attivo (es. tablet officina), escludiamo gli ordini completati
      // (filtriamo lo stato 'spedito' lato codice per evitare errore 22P02 su enum postgres)
      if (opzioni?.soloAttivi) {
        query = query.neq('stato', 'completato')
      }

      const { data: odpCloud, error } = await query

      if (error || !odpCloud) {
        if (error) console.warn('Errore lettura OdP da Supabase:', error.message)
        // Se siamo su una nuova azienda cliente e il cloud è vuoto o dà errore, non mostrare dati demo
        if (isAziendaClienteIsolata()) {
          return []
        }
        return opzioni?.soloAttivi ? locali.filter((o) => o.stato !== 'completato' && (o.stato as string) !== 'spedito') : locali
      }

      // 1. Il Cloud Supabase è l'autorità principale. I dati cloud aggiornano la cache locale.

      // 2. Ordina le fasi per sequenza
      const formattati = odpCloud.map((o) => ({
        ...o,
        fasi: (o.fasi || []).sort((a: FaseOdP, b: FaseOdP) => a.sequenza - b.sequenza)
      }))

      // 3. Allinea sempre la cache locale del browser con i dati reali ricevuti:
      try {
        if (!opzioni?.soloAttivi) {
          localStorage.setItem('machinaflow_odp', JSON.stringify(formattati))
        } else if (locali.length > 0) {
          const mappaCloud = new Map(formattati.map((o) => [o.id, o]))
          const localiAggiornati = locali.map((loc) => {
            const fresco = mappaCloud.get(loc.id)
            if (fresco) return fresco
            if (loc.stato === 'in_lavorazione' || loc.stato === 'pianificato' || loc.stato === 'rilasciato') {
              return { ...loc, stato: 'completato' as const }
            }
            return loc
          })
          localStorage.setItem('machinaflow_odp', JSON.stringify(localiAggiornati))
        }
      } catch {}

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
      const azId = getCurrentAziendaId()
      const datiOdpPuliti: any = {
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
      if (azId) {
        datiOdpPuliti.azienda_id = azId
      }
      const { error: errOdp } = await supabase
        .from('ordini_produzione')
        .upsert(datiOdpPuliti, { onConflict: 'id' })
      if (errOdp) {
        console.error('Errore inserimento ordine_produzione:', JSON.stringify(errOdp, null, 2))
        return
      }

      if (nuovoOdp.fasi && nuovoOdp.fasi.length > 0) {
        const fasiPulite = nuovoOdp.fasi.map((f) => {
          const faseRow: any = {
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
          }
          if (azId) {
            faseRow.azienda_id = azId
          }
          return faseRow
        })
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
      const azId = getCurrentAziendaId()
      const fasePulita: any = {
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
      if (azId) {
        fasePulita.azienda_id = azId
      }
      await supabase.from('fasi_odp').upsert(fasePulita)
    } catch (e) {
      console.error('Errore aggiornamento cloud fase:', e)
    }
  },

  async aggiornaStatoOdP(odpId: string, nuovoStato: 'pianificato' | 'rilasciato' | 'in_lavorazione' | 'completato' | 'sospeso' | 'scartato' | 'spedito', quantitaProdotta?: number, quantitaDaProdurre?: number) {
    try {
      // Aggiorna localStorage
      const salvati = localStorage.getItem('machinaflow_odp')
      if (salvati) {
        const lista: (OrdineProduzione & { fasi: FaseOdP[] })[] = JSON.parse(salvati)
        const odp = lista.find((o) => o.id === odpId)
        if (odp) {
          odp.stato = nuovoStato
          if (quantitaDaProdurre !== undefined) {
            odp.quantita_da_produrre = quantitaDaProdurre
          }
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
      if (quantitaDaProdurre !== undefined) {
        payload.quantita_da_produrre = quantitaDaProdurre
      }
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

      let queryOrdini = supabase
        .from('ordini_clienti')
        .select('*')
        .order('numero_ordine', { ascending: false })

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryOrdini = queryOrdini.eq('azienda_id', azIdCorrente)
      }

      const { data: ordiniData, error: errOrdini } = await queryOrdini

      if (errOrdini || !ordiniData) {
        console.warn('Lettura ordini_clienti da Supabase fallita o non disponibile:', errOrdini?.message)
        if (isAziendaClienteIsolata()) {
          return []
        }
        // Se c'è localStorage, uniscilo con i seed dando priorità a localStorage
        const mappaLocale = new Map<string, any>()
        SEED_ORDINI_CLIENTI.forEach((o) => mappaLocale.set(o.id, o))
        ordiniLocali.forEach((o) => mappaLocale.set(o.id, o))
        return Array.from(mappaLocale.values())
      }

      // Se siamo su una nuova azienda cliente (non demo) e non ci sono ordini cloud, ritorna vuoto
      if (isAziendaClienteIsolata() && ordiniData.length === 0) {
        return []
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
      // 1. Base: SEED_ORDINI_CLIENTI solo se siamo nell'azienda demo pilota
      // 2. Cloud: ordiniCompletiCloud (autorità principale)
      // 3. Locale: ordiniLocali (solo se appartengono alla stessa azienda)
      const mappa = new Map<string, any>()
      if (!isAziendaClienteIsolata()) {
        SEED_ORDINI_CLIENTI.forEach((o) => mappa.set(o.id, o))
        ordiniLocali.forEach((o: any) => mappa.set(o.id, o))
      } else if (azIdCorrente) {
        // Se siamo su una nuova azienda isolata, accetta da localStorage solo quelli esplicitamente marchiati con il suo ID
        ordiniLocali
          .filter((o: any) => o.azienda_id === azIdCorrente)
          .forEach((o: any) => mappa.set(o.id, o))
      }
      ordiniCompletiCloud.forEach((o: any) => mappa.set(o.id, o))

      const finale = Array.from(mappa.values())
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(finale))
      return finale
    } catch (e) {
      console.error('Errore getOrdiniClienti:', e)
      if (isAziendaClienteIsolata()) return []
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
      const azId = getCurrentAziendaId()
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
      if (azId) {
        payloadOrdine.azienda_id = azId
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
      let queryArticoli = supabase
        .from('articoli')
        .select('*')
        .order('codice_articolo')

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryArticoli = queryArticoli.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await queryArticoli

      if (error) {
        console.warn('Errore lettura articoli da Supabase:', error.message)
        if (isAziendaClienteIsolata()) return []
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
      if (isAziendaClienteIsolata()) return []
      const salvati = localStorage.getItem('machinaflow_articoli')
      return salvati ? JSON.parse(salvati) : []
    }
  },

  async salvaArticolo(articolo: Articolo) {
    try {
      const azId = getCurrentAziendaId()
      const payload: any = {
        id: articolo.id,
        codice_articolo: articolo.codice_articolo,
        descrizione: articolo.descrizione,
        tipo: articolo.tipo,
        unita_misura: articolo.unita_misura,
        giacenza_attuale: articolo.giacenza_attuale,
        scorta_minima: articolo.scorta_minima,
        prezzo_riferimento: articolo.prezzo_riferimento || 0
      }
      if (azId) {
        payload.azienda_id = azId
      }
      await supabase.from('articoli').upsert(payload)
    } catch (e) {
      console.error('Errore salvataggio articolo su Supabase:', e)
    }
  },

  // DISTINTA BASE (BOM)
  async getDistinte(articoloPadreId?: string): Promise<ComponenteDistintaBase[]> {
    try {
      let query = supabase.from('distinta_base').select('*')
      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        query = query.eq('azienda_id', azIdCorrente)
      }
      if (articoloPadreId) {
        query = query.eq('articolo_padre_id', articoloPadreId)
      }
      const { data, error } = await query
      if (error) {
        console.warn('Errore lettura distinta_base da Supabase:', error.message)
        const salvati = localStorage.getItem('machinaflow_distinte')
        const lista: ComponenteDistintaBase[] = salvati ? JSON.parse(salvati) : (isAziendaClienteIsolata() ? [] : SEED_DISTINTA_BASE)
        return articoloPadreId ? lista.filter((d) => d.articolo_padre_id === articoloPadreId) : lista
      }

      if (data && data.length > 0) {
        return data as ComponenteDistintaBase[]
      }

      if (isAziendaClienteIsolata()) {
        return []
      }

      const salvati = localStorage.getItem('machinaflow_distinte')
      const lista: ComponenteDistintaBase[] = salvati ? JSON.parse(salvati) : SEED_DISTINTA_BASE
      return articoloPadreId ? lista.filter((d) => d.articolo_padre_id === articoloPadreId) : lista
    } catch (e) {
      console.error('Errore getDistinte:', e)
      const salvati = localStorage.getItem('machinaflow_distinte')
      const lista: ComponenteDistintaBase[] = salvati ? JSON.parse(salvati) : (isAziendaClienteIsolata() ? [] : SEED_DISTINTA_BASE)
      return articoloPadreId ? lista.filter((d) => d.articolo_padre_id === articoloPadreId) : lista
    }
  },

  async salvaComponenteDistinta(comp: ComponenteDistintaBase) {
    try {
      const azId = getCurrentAziendaId()
      const payload: any = {
        id: comp.id,
        articolo_padre_id: comp.articolo_padre_id,
        articolo_componente_id: comp.articolo_componente_id,
        quantita_necessaria: comp.quantita_necessaria,
        note: comp.note || null
      }
      if (azId) {
        payload.azienda_id = azId
      }
      await supabase.from('distinta_base').upsert(payload)
    } catch (e) {
      console.error('Errore salvataggio distinta base su Supabase:', e)
    }
  },

  async eliminaComponenteDistinta(id: string) {
    try {
      await supabase.from('distinta_base').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione distinta base su Supabase:', e)
    }
  },

  // CICLI DI LAVORAZIONE STANDARD (ROUTING)
  async getFasiCiclo(articoloId?: string): Promise<FaseCicloStandard[]> {
    try {
      let query = supabase.from('fasi_ciclo_standard').select('*').order('sequenza', { ascending: true })
      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        query = query.eq('azienda_id', azIdCorrente)
      }
      if (articoloId) {
        query = query.eq('articolo_id', articoloId)
      }
      const { data, error } = await query
      if (error) {
        console.warn('Errore lettura fasi_ciclo_standard da Supabase:', error.message)
        const salvati = localStorage.getItem('machinaflow_cicli')
        const lista: FaseCicloStandard[] = salvati ? JSON.parse(salvati) : (isAziendaClienteIsolata() ? [] : SEED_FASI_CICLO)
        return articoloId ? lista.filter((c) => c.articolo_id === articoloId).sort((a, b) => a.sequenza - b.sequenza) : lista
      }

      if (data && data.length > 0) {
        // Deserializza eventuali metadati di conto terzi e prelievo materia prima salvati in note_operative
        const arricchite = data.map((f: any) => {
          let note = f.note_operative || ''
          let metaTerzista: any = {}
          let prelevaMateriaPrima: boolean | undefined = f.preleva_materia_prima

          if (note && note.includes('__MF_TERZISTA__=')) {
            try {
              const parti = note.split('__MF_TERZISTA__=')
              note = parti[0].trim()
              const resto = parti[1].split('\n')[0]
              metaTerzista = JSON.parse(resto)
            } catch {}
          }

          if (note && note.includes('__MF_PRELEVA__=')) {
            try {
              const parti = note.split('__MF_PRELEVA__=')
              note = parti[0].trim()
              const val = parti[1].split('\n')[0].trim()
              prelevaMateriaPrima = val === 'true'
            } catch {}
          }

          return {
            ...f,
            note_operative: note,
            preleva_materia_prima: prelevaMateriaPrima,
            ...metaTerzista
          } as FaseCicloStandard
        })
        return arricchite
      }

      if (isAziendaClienteIsolata()) {
        return []
      }

      const salvati = localStorage.getItem('machinaflow_cicli')
      const lista: FaseCicloStandard[] = salvati ? JSON.parse(salvati) : SEED_FASI_CICLO
      return articoloId ? lista.filter((c) => c.articolo_id === articoloId).sort((a, b) => a.sequenza - b.sequenza) : lista
    } catch (e) {
      console.error('Errore getFasiCiclo:', e)
      const salvati = localStorage.getItem('machinaflow_cicli')
      const lista: FaseCicloStandard[] = salvati ? JSON.parse(salvati) : (isAziendaClienteIsolata() ? [] : SEED_FASI_CICLO)
      return articoloId ? lista.filter((c) => c.articolo_id === articoloId).sort((a, b) => a.sequenza - b.sequenza) : lista
    }
  },

  async salvaFaseCiclo(fase: FaseCicloStandard) {
    try {
      const azId = getCurrentAziendaId()
      
      // Impacchetta i metadati estesi (conto terzi e prelievo materia prima) in note_operative per persistenza universale su Supabase
      let noteFinali = fase.note_operative || ''
      
      // Pulisce eventuali vecchi tag metadati se presenti
      if (noteFinali.includes('__MF_TERZISTA__=')) {
        noteFinali = noteFinali.split('__MF_TERZISTA__=')[0].trim()
      }
      if (noteFinali.includes('__MF_PRELEVA__=')) {
        noteFinali = noteFinali.split('__MF_PRELEVA__=')[0].trim()
      }

      if (fase.is_esterna) {
        const metaTerzista = {
          is_esterna: true,
          fornitore_nome: fase.fornitore_nome || '',
          giorni_rientro_previsti: fase.giorni_rientro_previsti || 5,
          modello_tariffa: fase.modello_tariffa || 'pezzo_fisso',
          costo_tariffa_valore: fase.costo_tariffa_valore || 0,
          costo_minimo_fornitura: fase.costo_minimo_fornitura || 0
        }
        noteFinali = `${noteFinali.trim()}\n__MF_TERZISTA__=${JSON.stringify(metaTerzista)}`
      }

      if (fase.preleva_materia_prima !== undefined) {
        noteFinali = `${noteFinali.trim()}\n__MF_PRELEVA__=${fase.preleva_materia_prima ? 'true' : 'false'}`
      }

      const payload: any = {
        id: fase.id,
        articolo_id: fase.articolo_id,
        sequenza: fase.sequenza,
        nome_fase: fase.nome_fase,
        tipo_processo_id: fase.tipo_processo_id || null,
        centro_lavoro_id: fase.centro_lavoro_id,
        tempo_attrezzaggio_min: fase.tempo_attrezzaggio_min || 0,
        tempo_ciclo_pezzo_min: fase.tempo_ciclo_pezzo_min || 0,
        note_operative: noteFinali.trim() || null
      }
      if (azId) {
        payload.azienda_id = azId
      }
      await supabase.from('fasi_ciclo_standard').upsert(payload)
    } catch (e) {
      console.error('Errore salvataggio fase ciclo standard su Supabase:', e)
    }
  },

  async eliminaFaseCiclo(id: string) {
    try {
      await supabase.from('fasi_ciclo_standard').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione fase ciclo standard su Supabase:', e)
    }
  },

  // CLIENTI
  async getClienti(): Promise<Cliente[]> {
    try {
      let query = supabase.from('clienti').select('*').order('ragione_sociale')
      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        query = query.eq('azienda_id', azIdCorrente)
      }
      const { data, error } = await query
      if (error) {
        console.warn('Errore lettura clienti da Supabase:', error.message)
        if (isAziendaClienteIsolata()) return []
        const salvati = localStorage.getItem('machinaflow_clienti')
        return salvati ? JSON.parse(salvati) : SEED_CLIENTI
      }

      if (data && data.length > 0) {
        localStorage.setItem('machinaflow_clienti', JSON.stringify(data))
        return data as Cliente[]
      }

      if (isAziendaClienteIsolata()) {
        return []
      }

      const salvati = localStorage.getItem('machinaflow_clienti')
      return salvati ? JSON.parse(salvati) : SEED_CLIENTI
    } catch (e) {
      console.error('Errore getClienti:', e)
      if (isAziendaClienteIsolata()) return []
      const salvati = localStorage.getItem('machinaflow_clienti')
      return salvati ? JSON.parse(salvati) : SEED_CLIENTI
    }
  },

  async salvaCliente(cliente: Cliente) {
    // 1. Salva in localStorage per reattività immediata
    try {
      const salvati = localStorage.getItem('machinaflow_clienti')
      const lista: Cliente[] = salvati ? JSON.parse(salvati) : []
      const idx = lista.findIndex((c) => c.id === cliente.id)
      if (idx >= 0) {
        lista[idx] = cliente
      } else {
        lista.unshift(cliente)
      }
      localStorage.setItem('machinaflow_clienti', JSON.stringify(lista))
    } catch {}

    // 2. Supabase Cloud con azienda_id
    try {
      const azId = getCurrentAziendaId()
      const payload: any = {
        id: cliente.id,
        ragione_sociale: cliente.ragione_sociale,
        partita_iva: cliente.partita_iva || null,
        email: cliente.email || null,
        telefono: cliente.telefono || null,
        indirizzo: cliente.indirizzo || null
      }
      if (azId) {
        payload.azienda_id = azId
      }
      await supabase.from('clienti').upsert(payload)
    } catch (e) {
      console.error('Errore salvataggio cliente su Supabase:', e)
    }
  },

  async eliminaCliente(id: string) {
    try {
      const salvati = localStorage.getItem('machinaflow_clienti')
      if (salvati) {
        const lista: Cliente[] = JSON.parse(salvati)
        localStorage.setItem('machinaflow_clienti', JSON.stringify(lista.filter((c) => c.id !== id)))
      }
    } catch {}

    try {
      await supabase.from('clienti').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione cliente su Supabase:', e)
    }
  },

  // 5. CENTRI DI LAVORO E PROCESSI
  async getCentriLavoro(): Promise<CentroLavoro[]> {
    try {
      let queryMacchine = supabase
        .from('centri_lavoro')
        .select('*')
        .order('codice')

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryMacchine = queryMacchine.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await queryMacchine

      if (error) {
        console.warn('Errore lettura centri_lavoro da Supabase:', error.message)
        if (isAziendaClienteIsolata()) return []
        const salvati = localStorage.getItem('machinaflow_centri_lavoro')
        return salvati ? JSON.parse(salvati) : SEED_CENTRI_LAVORO
      }

      if (data && data.length > 0) {
        localStorage.setItem('machinaflow_centri_lavoro', JSON.stringify(data))
        return data as CentroLavoro[]
      }

      if (isAziendaClienteIsolata()) {
        return []
      }

      const salvati = localStorage.getItem('machinaflow_centri_lavoro')
      return salvati ? JSON.parse(salvati) : SEED_CENTRI_LAVORO
    } catch (e) {
      console.error('Errore getCentriLavoro:', e)
      if (isAziendaClienteIsolata()) return []
      const salvati = localStorage.getItem('machinaflow_centri_lavoro')
      return salvati ? JSON.parse(salvati) : SEED_CENTRI_LAVORO
    }
  },

  async salvaCentroLavoro(centro: CentroLavoro) {
    try {
      const azId = getCurrentAziendaId()
      const payload: any = {
        id: centro.id,
        codice: centro.codice,
        nome: centro.nome,
        reparto: centro.reparto || 'Officina',
        capacita_giornaliera_ore: centro.capacita_giornaliera_ore || 8,
        costo_orario: centro.costo_orario || 0,
        attivo: centro.attivo !== undefined ? centro.attivo : true
      }
      if (azId) {
        payload.azienda_id = azId
      }
      const { error } = await supabase.from('centri_lavoro').upsert(payload)
      if (error) {
        console.error('Errore upsert centri_lavoro su Supabase:', error.message)
      }
    } catch (e) {
      console.error('Errore salvataggio centro lavoro su Supabase:', e)
    }
  },

  async eliminaCentroLavoro(id: string) {
    try {
      const salvati = localStorage.getItem('machinaflow_centri_lavoro')
      if (salvati) {
        const lista: CentroLavoro[] = JSON.parse(salvati)
        localStorage.setItem('machinaflow_centri_lavoro', JSON.stringify(lista.filter((c) => c.id !== id)))
      }
    } catch {}

    try {
      await supabase.from('centri_lavoro').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione centro lavoro su Supabase:', e)
    }
  },

  async getTipiProcesso(): Promise<TipoProcesso[]> {
    try {
      let queryProcessi = supabase
        .from('tipi_processo')
        .select('*')
        .order('codice')

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryProcessi = queryProcessi.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await queryProcessi

      if (error) {
        console.warn('Errore lettura tipi_processo da Supabase:', error.message)
        if (isAziendaClienteIsolata()) return []
        const salvati = localStorage.getItem('machinaflow_tipi_processo')
        return salvati ? JSON.parse(salvati) : SEED_TIPI_PROCESSO
      }

      if (data && data.length > 0) {
        localStorage.setItem('machinaflow_tipi_processo', JSON.stringify(data))
        return data as TipoProcesso[]
      }

      if (isAziendaClienteIsolata()) {
        return []
      }

      const salvati = localStorage.getItem('machinaflow_tipi_processo')
      return salvati ? JSON.parse(salvati) : SEED_TIPI_PROCESSO
    } catch (e) {
      console.error('Errore getTipiProcesso:', e)
      if (isAziendaClienteIsolata()) return []
      const salvati = localStorage.getItem('machinaflow_tipi_processo')
      return salvati ? JSON.parse(salvati) : SEED_TIPI_PROCESSO
    }
  },

  async salvaTipoProcesso(processo: TipoProcesso) {
    try {
      const azId = getCurrentAziendaId()
      const payload: any = {
        id: processo.id,
        codice: processo.codice,
        nome: processo.nome,
        descrizione: processo.descrizione || null,
        centro_lavoro_predefinito_id: processo.centro_lavoro_predefinito_id || null,
        colore_badge: processo.colore_badge || '#3b82f6',
        attivo: processo.attivo !== undefined ? processo.attivo : true
      }
      if (azId) {
        payload.azienda_id = azId
      }
      const { error } = await supabase.from('tipi_processo').upsert(payload)
      if (error) {
        console.error('Errore upsert tipi_processo su Supabase:', error.message)
      }
    } catch (e) {
      console.error('Errore salvataggio tipo processo su Supabase:', e)
    }
  },

  async eliminaTipoProcesso(id: string) {
    try {
      const salvati = localStorage.getItem('machinaflow_tipi_processo')
      if (salvati) {
        const lista: TipoProcesso[] = JSON.parse(salvati)
        localStorage.setItem('machinaflow_tipi_processo', JSON.stringify(lista.filter((p) => p.id !== id)))
      }
    } catch {}

    try {
      await supabase.from('tipi_processo').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione tipo processo su Supabase:', e)
    }
  },

  // 6. DOCUMENTI DI TRASPORTO (DDT) CLIENTI
  async getDdtClienti(): Promise<DocumentoTrasportoCliente[]> {
    try {
      let queryDdt = supabase
        .from('ddt_clienti')
        .select('*')
        .order('creato_il', { ascending: false })

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryDdt = queryDdt.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await queryDdt

      if (error) {
        console.warn('Errore lettura ddt_clienti da Supabase:', error.message)
        if (isAziendaClienteIsolata()) return []
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
      if (isAziendaClienteIsolata()) return []
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
      const azId = getCurrentAziendaId()
      const payload: any = {
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
      }
      if (azId) {
        payload.azienda_id = azId
      }
      await supabase.from('ddt_clienti').upsert(payload)
    } catch (e) {
      console.error('Errore salvaDdtCliente su Supabase:', e)
    }
  },

  async eliminaDdtCliente(id: string) {
    try {
      const salvati = localStorage.getItem('machinaflow_ddt_clienti')
      if (salvati) {
        const lista: DocumentoTrasportoCliente[] = JSON.parse(salvati)
        localStorage.setItem('machinaflow_ddt_clienti', JSON.stringify(lista.filter((d) => d.id !== id)))
      }
    } catch {}

    try {
      await supabase.from('ddt_clienti').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione ddt cliente su Supabase:', e)
    }
  },

  // 7. DOCUMENTI DI TRASPORTO (DDT) ESTERNI / TERZISTI
  async getDdtEsterni(): Promise<DocumentoTrasportoEsterno[]> {
    try {
      let queryDdt = supabase
        .from('ddt_esterni')
        .select('*')
        .order('creato_il', { ascending: false })

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryDdt = queryDdt.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await queryDdt

      if (error) {
        console.warn('Errore lettura ddt_esterni da Supabase:', error.message)
        if (isAziendaClienteIsolata()) return []
        const salvati = localStorage.getItem('machinaflow_ddt_esterni')
        return salvati ? JSON.parse(salvati) : []
      }

      if (data && data.length > 0) {
        localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify(data))
        return data as DocumentoTrasportoEsterno[]
      }

      if (isAziendaClienteIsolata()) {
        return []
      }

      return []
    } catch (e) {
      console.error('Errore getDdtEsterni:', e)
      if (isAziendaClienteIsolata()) return []
      const salvati = localStorage.getItem('machinaflow_ddt_esterni')
      return salvati ? JSON.parse(salvati) : []
    }
  },

  async salvaDdtEsterno(ddt: DocumentoTrasportoEsterno) {
    try {
      const azId = getCurrentAziendaId()
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

      // Salva nel Cloud Supabase con azienda_id
      const payload: any = {
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
      }
      if (azId) {
        payload.azienda_id = azId
      }
      await supabase.from('ddt_esterni').upsert(payload)
    } catch (e) {
      console.error('Errore salvaDdtEsterno su Supabase:', e)
    }
  },

  async eliminaDdtEsterno(id: string) {
    try {
      const salvati = localStorage.getItem('machinaflow_ddt_esterni')
      if (salvati) {
        const lista: DocumentoTrasportoEsterno[] = JSON.parse(salvati)
        localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify(lista.filter((d) => d.id !== id)))
      }
    } catch {}

    try {
      await supabase.from('ddt_esterni').delete().eq('id', id)
    } catch (e) {
      console.error('Errore eliminazione ddt esterno su Supabase:', e)
    }
  },

  // 8. ANAGRAFICA FORNITORI TERZISTI
  async getFornitoriTerzisti(): Promise<FornitoreTerzista[]> {
    try {
      let query = supabase
        .from('fornitori_terzisti')
        .select('*')
        .order('ragione_sociale')

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        query = query.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await query

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
      const azId = getCurrentAziendaId()
      const payload: any = { ...terzista }
      if (azId && !payload.azienda_id) {
        payload.azienda_id = azId
      }

      const salvati = localStorage.getItem('machinaflow_fornitori_terzisti')
      const lista: FornitoreTerzista[] = salvati ? JSON.parse(salvati) : []
      const idx = lista.findIndex((t) => t.id === payload.id)
      if (idx >= 0) {
        lista[idx] = payload
      } else {
        lista.push(payload)
      }
      localStorage.setItem('machinaflow_fornitori_terzisti', JSON.stringify(lista))

      await supabase.from('fornitori_terzisti').upsert(payload)
    } catch (e) {
      console.error('Errore salvaFornitoreTerzista su Supabase:', e)
    }
  },

  // 9. ORDINI FORNITORI (MRP)
  async getOrdiniFornitori(): Promise<OrdineFornitore[]> {
    try {
      let queryFornitori = supabase
        .from('ordini_fornitori')
        .select('*')
        .order('creato_il', { ascending: false })

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        queryFornitori = queryFornitori.eq('azienda_id', azIdCorrente)
      }

      const { data, error } = await queryFornitori

      if (error) {
        console.warn('Errore lettura ordini_fornitori:', error.message)
        if (isAziendaClienteIsolata()) return []
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
      if (isAziendaClienteIsolata()) return []
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

  // 6. REAL-TIME SUBSCRIPTIONS & BROADCAST LEGGERO
  // Permette a tutti i client (desktop, cellulari, postazioni) di ricevere aggiornamenti
  // istantanei in tempo reale quando qualsiasi postazione compie un'azione (avvio/chiusura fase, ecc.)
  // senza polling continuo e senza appesantire il sistema (evento puro "evento-su-richiesta").
  inviaSegnaleAvanzamento() {
    try {
      const azId = getCurrentAziendaId() || 'generale'
      const broadcastChannel = supabase.channel(`mf-broadcast-${azId}`)
      broadcastChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastChannel.send({
            type: 'broadcast',
            event: 'cambio_fase',
            payload: { timestamp: Date.now() }
          }).then(() => {
            supabase.removeChannel(broadcastChannel)
          }).catch(() => {
            supabase.removeChannel(broadcastChannel)
          })
        }
      })
    } catch (e) {
      console.warn('Errore invio segnale broadcast:', e)
    }
  },

  sottoscriviAvanzamentoProduzione(suAggiornamento: () => void) {
    let timerDebounce: any = null

    const eseguiAggiornamentoPulito = () => {
      if (timerDebounce) clearTimeout(timerDebounce)
      // Debounce di 300ms: se arrivano eventi simultanei, esegue 1 solo aggiornamento
      timerDebounce = setTimeout(() => {
        suAggiornamento()
      }, 300)
    }

    const azId = getCurrentAziendaId() || 'generale'
    const channelId = `mf-realtime-officina-${azId}`

    const channel = supabase
      .channel(channelId, {
        config: {
          broadcast: { self: false }
        }
      })
      // 1. Canale Broadcast ad altissima velocità e zero impatto database (tra telefoni/terminali)
      .on('broadcast', { event: 'cambio_fase' }, () => {
        eseguiAggiornamentoPulito()
      })
      // 2. Canale CDC Database Postgres Changes (se abilitata la publication su Supabase)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fasi_odp' },
        eseguiAggiornamentoPulito
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordini_produzione' },
        eseguiAggiornamentoPulito
      )
      .subscribe()

    return () => {
      if (timerDebounce) clearTimeout(timerDebounce)
      supabase.removeChannel(channel)
    }
  },

  // 7. REGISTRO MOVIMENTI DI MAGAZZINO (Cloud-First Supabase)
  async getMovimentiMagazzino(articoloId?: string): Promise<MovimentoMagazzino[]> {
    try {
      let query = supabase
        .from('movimenti_magazzino')
        .select('*')
        .order('creato_il', { ascending: false })

      const azIdCorrente = getCurrentAziendaId()
      if (azIdCorrente) {
        query = query.eq('azienda_id', azIdCorrente)
      }
      if (articoloId) {
        query = query.eq('articolo_id', articoloId)
      }

      const { data, error } = await query
      if (error) {
        console.warn('Lettura movimenti_magazzino da Supabase:', error.message)
        const salvati = localStorage.getItem('machinaflow_movimenti_magazzino')
        const lista: MovimentoMagazzino[] = salvati ? JSON.parse(salvati) : []
        return articoloId ? lista.filter((m) => m.articolo_id === articoloId) : lista
      }

      if (data && data.length >= 0) {
        localStorage.setItem('machinaflow_movimenti_magazzino', JSON.stringify(data))
        return data as MovimentoMagazzino[]
      }

      return []
    } catch (e) {
      console.error('Errore getMovimentiMagazzino:', e)
      const salvati = localStorage.getItem('machinaflow_movimenti_magazzino')
      const lista: MovimentoMagazzino[] = salvati ? JSON.parse(salvati) : []
      return articoloId ? lista.filter((m) => m.articolo_id === articoloId) : lista
    }
  },

  async registraMovimentoMagazzino(movimento: Omit<MovimentoMagazzino, 'id' | 'creato_il'>): Promise<MovimentoMagazzino> {
    const id = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const creato_il = new Date().toISOString()
    const azId = getCurrentAziendaId()

    const nuovoMovimento: MovimentoMagazzino = {
      ...movimento,
      id,
      creato_il,
      azienda_id: azId || undefined
    }

    // 1. Salva in cache locale per reattività
    try {
      const salvati = localStorage.getItem('machinaflow_movimenti_magazzino')
      const lista: MovimentoMagazzino[] = salvati ? JSON.parse(salvati) : []
      lista.unshift(nuovoMovimento)
      localStorage.setItem('machinaflow_movimenti_magazzino', JSON.stringify(lista))
    } catch {}

    // 2. Salva direttamente su Supabase Cloud
    try {
      const payload: any = {
        id: nuovoMovimento.id,
        articolo_id: nuovoMovimento.articolo_id,
        tipo_movimento: nuovoMovimento.tipo_movimento,
        quantita: nuovoMovimento.quantita,
        giacenza_precedente: nuovoMovimento.giacenza_precedente,
        giacenza_risultante: nuovoMovimento.giacenza_risultante,
        unita_misura: nuovoMovimento.unita_misura || 'pz',
        riferimento_documento: nuovoMovimento.riferimento_documento || null,
        codice_odp: nuovoMovimento.codice_odp || null,
        lotto_colata: nuovoMovimento.lotto_colata || null,
        operatore_nome: nuovoMovimento.operatore_nome || null,
        note: nuovoMovimento.note || null,
        creato_il: nuovoMovimento.creato_il
      }
      if (azId) {
        payload.azienda_id = azId
      }

      const { error } = await supabase.from('movimenti_magazzino').insert(payload)
      if (error) {
        console.warn('Avviso: movimenti_magazzino su Supabase:', error.message)
      }
    } catch (e) {
      console.error('Errore registrazione cloud movimento magazzino:', e)
    }

    return nuovoMovimento
  }
}
