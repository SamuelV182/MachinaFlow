'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Factory,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Boxes,
  ShoppingCart,
  QrCode,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Layers,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react'
import {
  CentroLavoro,
  TipoProcesso,
  Articolo,
  OrdineProduzione,
  FaseOdP,
  OrdineCliente,
  ComponenteDistintaBase,
  DocumentoTrasportoCliente
} from '@/types/database'
import {
  SEED_CENTRI_LAVORO,
  SEED_ODP,
  SEED_ARTICOLI,
  SEED_ORDINI_CLIENTI,
  SEED_DISTINTA_BASE
} from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

export default function DashboardPage() {
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi: FaseOdP[] })[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [distinte, setDistinte] = useState<ComponenteDistintaBase[]>([])
  const [ordiniClienti, setOrdiniClienti] = useState<OrdineCliente[]>([])

  // Orizzonte Temporale Selezionato (Oggi, Settimana, Mese, Trimestre, 6 Mesi)
  type OrizzonteTemporale = 'oggi' | 'settimana' | 'mese' | 'trimestre' | 'semestre'
  const [orizzonte, setOrizzonte] = useState<OrizzonteTemporale>('settimana')
  const [vistaCarico, setVistaCarico] = useState<'sintetica' | 'calendario'>('sintetica')
  const [giorniCalendario, setGiorniCalendario] = useState<
    { dataIso: string; giornoSettimana: string; giornoMese: string; isOggi: boolean; isWeekend: boolean; isPassato: boolean }[]
  >([])

  // Navigazione Settimane per Matrice Buchi Macchine
  // dataInizioSettimana memorizza la data ISO del Lunedì visualizzato
  const [dataInizioSettimana, setDataInizioSettimana] = useState<string>('')
  const [settimanaSelezionataInfo, setSettimanaSelezionataInfo] = useState<{
    numeroSettimana: number
    anno: number
    valoreInputWeek: string
    etichettaPeriodo: string
    isSettimanaCorrente: boolean
  }>({
    numeroSettimana: 1,
    anno: 2026,
    valoreInputWeek: '',
    etichettaPeriodo: '',
    isSettimanaCorrente: true
  })

  // Calcolo del Lunedì della settimana per una data data
  const getLunedi = (d: Date) => {
    const data = new Date(d)
    const giorno = data.getDay() // 0 = Domenica, 1 = Lunedì...
    const diff = data.getDate() - giorno + (giorno === 0 ? -6 : 1)
    data.setDate(diff)
    return data
  }

  // Calcolo numero settimana ISO 8601
  const getWeekNumber = (d: Date) => {
    const target = new Date(d.valueOf())
    const dayNr = (d.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  }

  // Inizializzazione a OGGI (Finestra Mobile 7 Giorni da Oggi)
  useEffect(() => {
    const oggiIso = new Date().toISOString().split('T')[0]
    setDataInizioSettimana(oggiIso)
  }, [])

  // Rigenera i 7 giorni del calendario ogni volta che cambia dataInizioSettimana
  useEffect(() => {
    if (!dataInizioSettimana) return

    const [y, m, d] = dataInizioSettimana.split('-').map(Number)
    const inizio = new Date(y, m - 1, d)
    const oggiIso = new Date().toISOString().split('T')[0]
    const lunediOggiIso = getLunedi(new Date()).toISOString().split('T')[0]

    const list = Array.from({ length: 7 }, (_, i) => {
      const giorno = new Date(inizio)
      giorno.setDate(inizio.getDate() + i)
      const dataIso = giorno.toISOString().split('T')[0]
      return {
        dataIso,
        giornoSettimana: giorno.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase(),
        giornoMese: giorno.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        isOggi: dataIso === oggiIso,
        isWeekend: giorno.getDay() === 0 || giorno.getDay() === 6,
        isPassato: dataIso < oggiIso
      }
    })
    setGiorniCalendario(list)

    const numSettimana = getWeekNumber(inizio)
    const annoSettimana = inizio.getFullYear()
    const fineSettimana = new Date(inizio)
    fineSettimana.setDate(inizio.getDate() + 6)

    const padWeek = String(numSettimana).padStart(2, '0')
    setSettimanaSelezionataInfo({
      numeroSettimana: numSettimana,
      anno: annoSettimana,
      valoreInputWeek: `${annoSettimana}-W${padWeek}`,
      etichettaPeriodo: `${inizio.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${fineSettimana.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      isSettimanaCorrente: dataInizioSettimana === oggiIso
    })
  }, [dataInizioSettimana])

  // Funzioni di cambio settimana
  const spostaSettimana = (offsetSettimane: number) => {
    if (!dataInizioSettimana) return
    const [y, m, d] = dataInizioSettimana.split('-').map(Number)
    const nuovaData = new Date(y, m - 1, d)
    nuovaData.setDate(nuovaData.getDate() + offsetSettimane * 7)
    setDataInizioSettimana(nuovaData.toISOString().split('T')[0])
  }

  const vaiAOggi = () => {
    const oggiIso = new Date().toISOString().split('T')[0]
    setDataInizioSettimana(oggiIso)
  }

  const selezionaSettimanaEAnno = (nuovaSettimana: number, nuovoAnno: number) => {
    const settClamped = Math.max(1, Math.min(53, nuovaSettimana))
    const annoClamped = Math.max(2020, Math.min(2035, nuovoAnno))

    // Calcolo affidabile del Lunedì per anno e settimana ISO
    // Il 4 gennaio è sempre nella settimana 1 secondo ISO-8601
    const simple = new Date(Date.UTC(annoClamped, 0, 4))
    const day = simple.getUTCDay() || 7
    simple.setUTCDate(simple.getUTCDate() - day + 1 + (settClamped - 1) * 7)
    
    setDataInizioSettimana(simple.toISOString().split('T')[0])
  }

  useEffect(() => {
    const caricaDati = async () => {
      const parseSicuro = <T,>(chiave: string, fallback: T): T => {
        try {
          const item = localStorage.getItem(chiave)
          if (!item || item === 'undefined' || item === 'null') return fallback
          return JSON.parse(item) as T
        } catch {
          return fallback
        }
      }

      const azIsolata = syncService.isAziendaClienteIsolata ? syncService.isAziendaClienteIsolata() : false
      const macchineCloud = await syncService.getCentriLavoro()
      setCentriLavoro(macchineCloud.length > 0 ? macchineCloud : (azIsolata ? [] : parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO)))
      setDistinte(azIsolata ? [] : parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE))
      
      const ordiniCloud = await syncService.getOrdiniClienti()
      setOrdiniClienti(ordiniCloud.length > 0 ? ordiniCloud : (azIsolata ? [] : parseSicuro('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI)))
      
      // Carica e sincronizza OdP da Supabase Cloud
      const odpSincronizzati = await syncService.getOrdiniProduzione()

      // Carica anagrafica articoli e giacenze reali aggiornate da Supabase Cloud
      const articoliCloud = await syncService.getArticoli()
      const articoliEffettivi = articoliCloud && articoliCloud.length > 0 ? articoliCloud : (azIsolata ? [] : parseSicuro('machinaflow_articoli', SEED_ARTICOLI))
      setArticoli(articoliEffettivi)
      
      // Carica DDT per identificare ordini già spediti
      const ddtCloud = await syncService.getDdtClienti()
      const ddtLocali = parseSicuro<DocumentoTrasportoCliente[]>('machinaflow_ddt_clienti', [])
      const ddtTutti = [...ddtCloud, ...ddtLocali]
      const odpSpeditiSet = new Set<string>()
      ddtTutti.forEach((doc) => {
        doc.righe.forEach((r) => {
          if (r.odp_id) odpSpeditiSet.add(r.odp_id)
        })
      })

      // Normalizza stato OdP: se tutte le fasi sono completate o se è presente in un DDT, consideralo chiuso/spedito
      const odpNormalizzati = odpSincronizzati.map((odp) => {
        const tutteCompletate = odp.fasi && odp.fasi.length > 0 && odp.fasi.every((f) => f.stato === 'completata')
        const giaSpedito = odp.stato === 'spedito' || odpSpeditiSet.has(odp.id)
        if (giaSpedito) return { ...odp, stato: 'spedito' as const }
        if (tutteCompletate && odp.stato !== 'completato') return { ...odp, stato: 'completato' as const }
        return odp
      })

      setOdpList(odpNormalizzati)

      // Inizializza seed Supabase se vuoto
      syncService.inizializzaDatabaseSeVuoto()
    }

    caricaDati()

    // Sottoscrizione Real-Time nativa Supabase (ad eventi, zero traffico a riposo):
    // Riceve notifiche istantanee SOLO quando cambia qualcosa su OdP, DDT o Ordini
    const disiscrivi = syncService.sottoscriviAvanzamentoProduzione(() => {
      caricaDati()
    })

    // Sincronizzazione immediata al cambio scheda nello stesso browser
    const onStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('machinaflow_')) {
        caricaDati()
      }
    }
    window.addEventListener('storage', onStorageChange)

    return () => {
      if (disiscrivi && typeof disiscrivi === 'function') disiscrivi()
      window.removeEventListener('storage', onStorageChange)
    }
  }, [])

  // =========================================================================
  // CALCOLO DINAMICO KPI & CARICO CENTRI DI LAVORO
  // =========================================================================
  // Un OdP è attivo SOLO se è pianificato o in lavorazione (NON completato, spedito o scartato)
  const odpAttivi = odpList.filter((o) => {
    if (o.stato === 'completato' || o.stato === 'spedito' || o.stato === 'scartato') return false
    // Se tutte le fasi sono completate, è concluso
    if (o.fasi && o.fasi.length > 0 && o.fasi.every((f) => f.stato === 'completata')) return false
    return true
  })

  // =========================================================================
  // SCHEDULING A RITROSO (BACKWARD SCHEDULING) CON DATE REALI E FINE SETTIMANA
  // =========================================================================
  // - Calcola a ritroso le vere date di calendario per ciascuna fase a partire da data_fine_pianificata
  // - Rispetta i giorni lavorativi della specifica macchina (se lavora_sabato / lavora_domenica)
  // - Se una macchina non lavora nel weekend, retrocede al giorno feriale precedente (Ven -> Gio -> Mer...)
  // - Permette fasi multiple nello stesso giorno fino a 8h/giorno per OdP
  // - Arretrati non completati del passato si sommano su OGGI
  const mappaCaricoCalendario = useMemo(() => {
    if (giorniCalendario.length === 0 || centriLavoro.length === 0) {
      return new Map<string, { ore: number; odp: string[] }>()
    }

    const mappa = new Map<string, { ore: number; odp: string[] }>()
    const oggi = new Date()
    const dataOggiIso = oggi.toISOString().split('T')[0]

    // Mappa veloce dei centri per controllare disponibilità weekend
    const centriMap = new Map<string, CentroLavoro>()
    centriLavoro.forEach((c) => centriMap.set(c.id, c))

    // Helper per verificare se un giorno è lavorativo per una data macchina
    const isGiornoLavorativo = (centroId: string, d: Date): boolean => {
      const centro = centriMap.get(centroId)
      const dayOfWeek = d.getDay() // 0 = Domenica, 6 = Sabato
      if (dayOfWeek === 6) {
        return !!centro?.lavora_sabato
      }
      if (dayOfWeek === 0) {
        return !!centro?.lavora_domenica
      }
      return true // Da Lunedì a Venerdì è sempre lavorativo
    }

    // Helper per trovare il giorno lavorativo precedente valido per una macchina
    const trovaGiornoLavorativoPrecedente = (centroId: string, dataPartenza: Date): Date => {
      const cur = new Date(dataPartenza)
      cur.setDate(cur.getDate() - 1)
      while (!isGiornoLavorativo(centroId, cur)) {
        cur.setDate(cur.getDate() - 1)
      }
      return cur
    }

    // Funzione helper per aggiungere ore a centro + data
    const aggiungiCarico = (centroId: string, dataIso: string, ore: number, codiceOdp: string) => {
      const chiave = `${centroId}_${dataIso}`
      const corrente = mappa.get(chiave) || { ore: 0, odp: [] }
      corrente.ore += ore
      if (!corrente.odp.includes(codiceOdp)) {
        corrente.odp.push(codiceOdp)
      }
      mappa.set(chiave, corrente)
    }

    odpAttivi.forEach((odp) => {
      if (!odp.fasi || odp.fasi.length === 0) return

      // Ordiniamo le fasi per sequenza (dalla prima all'ultima)
      const fasiOrdinate = [...odp.fasi].sort((a, b) => (a.sequenza || 0) - (b.sequenza || 0))

      // Data fine OdP (stringa YYYY-MM-DD)
      let dataFineOdPStr = odp.data_fine_pianificata || ''
      if (!dataFineOdPStr || dataFineOdPStr < dataOggiIso) {
        dataFineOdPStr = dataOggiIso
      }

      const [y, m, d] = dataFineOdPStr.split('-').map(Number)
      let cursoreData = new Date(y, m - 1, d)

      // Giorno di comporto (buffer di sicurezza spedizione):
      // Il materiale deve essere pronto il giorno lavorativo precedente rispetto alla data di consegna
      if (dataFineOdPStr > dataOggiIso) {
        cursoreData.setDate(cursoreData.getDate() - 1)
      }

      let oreConsumateOdpNelGiorno = 0
      const turnoMaxOdp = 8 // Massimo 8h al giorno per questo OdP

      // Backward scheduling: dall'ultima fase alla prima
      for (let i = fasiOrdinate.length - 1; i >= 0; i--) {
        const fase = fasiOrdinate[i]
        if (fase.stato === 'completata') continue

        const oreFase = Math.max(0.1, Number(fase.tempo_stimato_totale_min || 60) / 60)

        // Se la fase è GIÀ "in_corso", deve stare obbligatoriamente su OGGI
        if (fase.stato === 'in_corso') {
          aggiungiCarico(fase.centro_lavoro_id, dataOggiIso, oreFase, odp.codice_odp)
          continue
        }

        // Assicurati che il cursore sia su un giorno lavorativo per questa macchina
        while (!isGiornoLavorativo(fase.centro_lavoro_id, cursoreData)) {
          cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          oreConsumateOdpNelGiorno = 0
        }

        // Se la fase si incastra nelle ore residue di questo giorno
        if (oreConsumateOdpNelGiorno + oreFase <= turnoMaxOdp) {
          const dataIsoAssegnata = cursoreData.toISOString().split('T')[0]
          // Se la data calcolata è già nel passato rispetto ad oggi, accumulala su OGGI
          const targetDataIso = dataIsoAssegnata < dataOggiIso ? dataOggiIso : dataIsoAssegnata
          aggiungiCarico(fase.centro_lavoro_id, targetDataIso, oreFase, odp.codice_odp)
          oreConsumateOdpNelGiorno += oreFase
        } else {
          // Divisione fase se supera il turno:
          const oreOggi = Math.max(0, turnoMaxOdp - oreConsumateOdpNelGiorno)
          if (oreOggi > 0) {
            const dataIsoAssegnata = cursoreData.toISOString().split('T')[0]
            const targetDataIso = dataIsoAssegnata < dataOggiIso ? dataOggiIso : dataIsoAssegnata
            aggiungiCarico(fase.centro_lavoro_id, targetDataIso, oreOggi, odp.codice_odp)
          }

          const oreResiduo = oreFase - oreOggi
          // Retrocedi al giorno lavorativo precedente per questa macchina
          cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          oreConsumateOdpNelGiorno = oreResiduo

          const dataIsoPrec = cursoreData.toISOString().split('T')[0]
          const targetDataIsoPrec = dataIsoPrec < dataOggiIso ? dataOggiIso : dataIsoPrec
          aggiungiCarico(fase.centro_lavoro_id, targetDataIsoPrec, oreResiduo, odp.codice_odp)
        }
      }
    })

    return mappa
  }, [giorniCalendario, centriLavoro, odpAttivi])
  
  const odpCompletati = odpList.filter((o) => o.stato === 'completato' || o.stato === 'spedito' || (o.fasi && o.fasi.length > 0 && o.fasi.every((f) => f.stato === 'completata')))
  const odpGiaSpediti = odpCompletati.filter((o) => o.stato === 'spedito')
  const odpInAttesaSpedizione = odpCompletati.length - odpGiaSpediti.length
  const sottoTestoCommesseChiuse =
    odpInAttesaSpedizione > 0
      ? `${odpGiaSpediti.length} consegnate con DDT • ${odpInAttesaSpedizione} in attesa`
      : 'Tutte consegnate al cliente con DDT'

  // Ore totali stimate vs effettive (calcolate ESCLUSIVAMENTE per gli OdP attivi in officina)
  let oreTotaliStimate = 0
  let oreCompletate = 0

  odpAttivi.forEach((odp) => {
    odp.fasi.forEach((fase) => {
      oreTotaliStimate += Number(fase.tempo_stimato_totale_min) / 60
      if (fase.stato === 'completata') {
        oreCompletate += Number(fase.tempo_effettivo_min || fase.tempo_stimato_totale_min) / 60
      }
    })
  })

  // Moltiplicatori di giorni e capacità lavorativa per orizzonte temporale
  const infoOrizzonte = {
    oggi: { label: 'Oggi (Turno Giornaliero)', giorni: 1, fattore: 1, desc: 'Capacità calcolata su 1 giorno lavorativo' },
    settimana: { label: '7 Giorni (Settimanale)', giorni: 5, fattore: 5, desc: 'Capacità calcolata su 5 giorni lavorativi (1 settimana)' },
    mese: { label: '30 Giorni (Mensile)', giorni: 22, fattore: 22, desc: 'Capacità calcolata su 22 giorni lavorativi (1 mese)' },
    trimestre: { label: '3 Mesi (Trimestrale)', giorni: 66, fattore: 66, desc: 'Capacità calcolata su 66 giorni lavorativi (3 mesi)' },
    semestre: { label: '6 Mesi (Portafoglio Ordini)', giorni: 130, fattore: 130, desc: 'Capacità calcolata su 130 giorni lavorativi (6 mesi)' }
  }

  // Calcolo carico per macchina scalato sull'orizzonte temporale
  const carichiMacchine = centriLavoro.map((centro) => {
    let oreAssegnate = 0
    let fasiInCorso = 0

    odpAttivi.forEach((odp) => {
      odp.fasi.forEach((fase) => {
        if (fase.centro_lavoro_id === centro.id && fase.stato !== 'completata') {
          oreAssegnate += Number(fase.tempo_stimato_totale_min) / 60
          if (fase.stato === 'in_corso') fasiInCorso++
        }
      })
    })

    const giorniLavorativi = infoOrizzonte[orizzonte].giorni
    const capacitaPeriodoOre = centro.capacita_giornaliera_ore * giorniLavorativi
    const percentuale = capacitaPeriodoOre > 0 ? Math.round((oreAssegnate / capacitaPeriodoOre) * 100) : 0

    let stato = 'Disponibile'
    if (fasiInCorso > 0) stato = 'In Lavorazione'
    if (percentuale >= 90) stato = 'Sovraccarico'

    return {
      ...centro,
      caricoOre: Number(oreAssegnate.toFixed(1)),
      capacitaPeriodoOre,
      percentuale,
      stato
    }
  })

  // Materiali Sotto Scorta (MRP): calcolato ESCLUSIVAMENTE sui fabbisogni reali degli OdP attivi in produzione
  // Formula MRP: Fabbisogno lordo generato dagli OdP attivi vs Giacenza disponibile di materie prime/semilavorati
  const fabbisogniOdPAttivi = new Map<string, number>()
  odpAttivi.forEach((odp) => {
    // Non conteggiare se la materia prima è già stata scaricata a bordo macchina
    if (odp.materia_prima_scaricata) return
    const componenti = distinte.filter((d) => d.articolo_padre_id === odp.articolo_id)
    componenti.forEach((comp) => {
      const consumo = Number(comp.quantita_necessaria || 1) * Number(odp.quantita_da_produrre || 1)
      const attuale = fabbisogniOdPAttivi.get(comp.articolo_componente_id) || 0
      fabbisogniOdPAttivi.set(comp.articolo_componente_id, attuale + consumo)
    })
  })

  // Un materiale è sotto scorta se è richiesto da un OdP attivo e la giacenza attuale non copre il fabbisogno (o la scorta minima di sicurezza)
  let countSottoScorta = 0
  fabbisogniOdPAttivi.forEach((fabbisognoLordo, articoloId) => {
    const art = articoli.find((a) => a.id === articoloId)
    if (art) {
      const giacenza = art.giacenza_attuale || 0
      const scortaSicurezza = art.scorta_minima || 0
      // Mancanza fisica o intacco della scorta di sicurezza
      if (giacenza < (fabbisognoLordo + scortaSicurezza)) {
        countSottoScorta++
      }
    }
  })

  const kpis = [
    {
      titolo: 'Ordini di Produzione Attivi',
      valore: odpAttivi.length.toString(),
      sottoTesto: odpAttivi.length === 0 ? 'Nessun ordine aperto sui reparti' : `${odpAttivi.filter((o) => o.stato === 'in_lavorazione').length} in lavorazione sui reparti`,
      icona: Factory,
      colore: 'text-orange-400',
      bg: 'bg-orange-950/40 border-orange-500/20'
    },
    {
      titolo: 'Carico Lavoro Stimato OdP',
      valore: `${Math.round(oreTotaliStimate)} h`,
      sottoTesto: `${Math.round(oreCompletate)} h avanzate (${oreTotaliStimate > 0 ? Math.round((oreCompletate / oreTotaliStimate) * 100) : 0}%)`,
      icona: Clock,
      colore: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-500/20'
    },
    {
      titolo: 'Materiali Sotto Scorta (MRP)',
      valore: countSottoScorta.toString(),
      sottoTesto: countSottoScorta > 0 ? 'Richiede emissione ordini acquisto' : 'Tutti i fabbisogni coperti da stock',
      icona: AlertTriangle,
      colore: countSottoScorta > 0 ? 'text-rose-400' : 'text-emerald-400',
      bg: countSottoScorta > 0 ? 'bg-rose-950/40 border-rose-500/20' : 'bg-emerald-950/40 border-emerald-500/20'
    },
    {
      titolo: 'Commesse Chiuse con Successo',
      valore: odpCompletati.length.toString(),
      sottoTesto: sottoTestoCommesseChiuse,
      icona: CheckCircle2,
      colore: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/20'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Intestazione Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Pianificazione & Controllo Produzione
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Panoramica in tempo reale del carico delle macchine, ordini clienti e avanzamento reparti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/processi-macchine"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            Nuovo Processo / Macchina
          </Link>
          <Link
            href="/ordini"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Nuovo Ordine Cliente
          </Link>
        </div>
      </div>

      {/* Barra Selettore Orizzonte Temporale (Timeline Strategica) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <span className="text-xs font-bold text-white block">Orizzonte di Capacità Produttiva:</span>
            <span className="text-[11px] text-slate-400">{infoOrizzonte[orizzonte].desc}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          {(['oggi', 'settimana', 'mese', 'trimestre', 'semestre'] as OrizzonteTemporale[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setOrizzonte(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                orizzonte === tab
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'oggi' && '⚡ Oggi'}
              {tab === 'settimana' && '📅 7 Giorni'}
              {tab === 'mese' && '🗓️ 30 Giorni'}
              {tab === 'trimestre' && '📊 3 Mesi'}
              {tab === 'semestre' && '🌐 6 Mesi'}
            </button>
          ))}
        </div>
      </div>

      {/* Griglia KPI Principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icona
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${kpi.bg} backdrop-blur-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.titolo}
                </span>
                <div className={`p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${kpi.colore}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-white">{kpi.valore}</div>
                <div className="text-xs text-slate-400 mt-1">{kpi.sottoTesto}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sezione Carico Centri di Lavoro / Macchine */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-orange-500" />
              Carico Attuale dei Centri di Lavoro & Macchine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapporto tra ore di lavoro assegnate dagli OdP e capacità della macchina con analisi visiva dei buchi liberi.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Selettore Vista Sintetica vs Matrice Buchi Giornalieri */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setVistaCarico('sintetica')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vistaCarico === 'sintetica'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Percentuali</span>
              </button>
              <button
                type="button"
                onClick={() => setVistaCarico('calendario')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vistaCarico === 'calendario'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Buchi 7 Giorni</span>
              </button>
            </div>

            <Link
              href="/processi-macchine"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 ml-2"
            >
              Gestisci Macchine
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {vistaCarico === 'sintetica' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carichiMacchine.map((centro) => (
            <div
              key={centro.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/20">
                      {centro.codice}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-100 mt-1.5">{centro.nome}</h3>
                    <p className="text-xs text-slate-400">Reparto: {centro.reparto}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      centro.percentuale > 90
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : centro.percentuale > 75
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {centro.stato}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">
                    Ore Impegnate: <strong className="text-white">{centro.caricoOre}h</strong> / {centro.capacitaPeriodoOre}h
                  </span>
                  <span
                    className={`font-bold ${
                      centro.percentuale > 90
                        ? 'text-rose-400'
                        : centro.percentuale > 75
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {centro.percentuale}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      centro.percentuale > 90
                        ? 'bg-rose-500'
                        : centro.percentuale > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(centro.percentuale, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
          /* VISTA CALENDARIO / MATRICE SATURAZIONE GIORNALIERA & BUCHI LIBERI */
          <div className="space-y-4">
            {/* Barra Navigazione Settimane & Selettore Rapido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => spostaSettimana(-1)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                  title="Settimana Precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={vaiAOggi}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    settimanaSelezionataInfo.isSettimanaCorrente
                      ? 'bg-orange-950/70 text-orange-400 border-orange-800/80 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Torna alla settimana corrente"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Oggi</span>
                </button>

                <button
                  type="button"
                  onClick={() => spostaSettimana(1)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                  title="Settimana Successiva"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="ml-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Settimana {settimanaSelezionataInfo.numeroSettimana} / {settimanaSelezionataInfo.anno}
                    </span>
                    {settimanaSelezionataInfo.isSettimanaCorrente && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                        Corrente
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block">
                    {settimanaSelezionataInfo.etichettaPeriodo}
                  </span>
                </div>
              </div>

              {/* Selettore rapido Settimana & Anno nativo del tema */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Vai a:</span>
                
                {/* Selettore Numero Settimana (1-52) */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                  <span className="text-[11px] text-slate-500 font-bold mr-1.5 uppercase tracking-wider">Sett.</span>
                  <select
                    value={settimanaSelezionataInfo.numeroSettimana}
                    onChange={(e) =>
                      selezionaSettimanaEAnno(Number(e.target.value), settimanaSelezionataInfo.anno)
                    }
                    className="bg-transparent text-xs text-orange-400 font-bold focus:outline-hidden cursor-pointer"
                  >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {String(s).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selettore Anno */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                  <select
                    value={settimanaSelezionataInfo.anno}
                    onChange={(e) =>
                      selezionaSettimanaEAnno(settimanaSelezionataInfo.numeroSettimana, Number(e.target.value))
                    }
                    className="bg-transparent text-xs text-white font-bold focus:outline-hidden cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((a) => (
                      <option key={a} value={a} className="bg-slate-900 text-white">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3 min-w-[200px] font-semibold">Centro di Lavoro / Macchina</th>
                  {giorniCalendario.map((g) => (
                    <th
                      key={g.dataIso}
                      className={`py-2 px-2 text-center min-w-[100px] ${
                        g.isOggi ? 'bg-orange-950/30 text-orange-400 font-bold border-x border-orange-900/30' : ''
                      } ${g.isWeekend ? 'opacity-40' : ''}`}
                    >
                      <span className="block text-[11px] uppercase tracking-wider">{g.giornoSettimana}</span>
                      <span className="block text-xs font-mono text-slate-200">{g.giornoMese}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {centriLavoro.map((centro) => {
                  const capGiornaliera = centro.capacita_giornaliera_ore || 8

                  return (
                    <tr key={centro.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-orange-400 border border-slate-700">
                            {centro.codice}
                          </span>
                          <span className="truncate max-w-[180px]">{centro.nome}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Capacità turno: {capGiornaliera}h / giorno
                        </span>
                      </td>

                      {giorniCalendario.map((g) => {
                        // Verifica se il giorno è lavorativo per questo specifico centro
                        const isSabato = g.giornoSettimana === 'SAB'
                        const isDomenica = g.giornoSettimana === 'DOM'
                        const isGiornoChiuso = (isSabato && !centro.lavora_sabato) || (isDomenica && !centro.lavora_domenica)
                        const capEffettivaGiorno = isGiornoChiuso ? 0 : capGiornaliera

                        // Recupera dal calcolo sequenziale a ritroso (con accumulo su oggi)
                        const infoCella = mappaCaricoCalendario.get(`${centro.id}_${g.dataIso}`) || { ore: 0, odp: [] }
                        const oreImpegnateGiorno = infoCella.ore
                        const odpInGiorno = infoCella.odp

                        const oreArrotondate = Number(oreImpegnateGiorno.toFixed(1))
                        const oreLibere = Math.max(0, Number((capEffettivaGiorno - oreArrotondate).toFixed(1)))
                        const percGiorno = capEffettivaGiorno > 0 ? Math.min(100, Math.round((oreArrotondate / capEffettivaGiorno) * 100)) : 0

                        // Stato cella: Chiuso, Buco totale (libera), Carico parziale, Saturata, o Sovraccarica
                        const isVuota = oreArrotondate === 0
                        const isSovraccarica = oreArrotondate > capEffettivaGiorno && capEffettivaGiorno > 0
                        const isQuasiPiena = oreArrotondate >= capEffettivaGiorno * 0.75 && capEffettivaGiorno > 0

                        return (
                          <td
                            key={g.dataIso}
                            className={`p-2 text-center align-middle border-l border-slate-800/40 ${
                              g.isOggi ? 'bg-orange-950/10' : ''
                            } ${g.isWeekend ? 'bg-slate-950/20' : ''}`}
                          >
                            {isGiornoChiuso && isVuota ? (
                              <div
                                className="p-2 rounded-xl bg-slate-950/30 border border-slate-900 text-slate-600 opacity-60"
                                title="Giorno non lavorativo per questa macchina (puoi abilitarlo in Gestisci Macchine)."
                              >
                                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Riposo</span>
                                <span className="block text-[9px] text-slate-600 font-mono">0h turno</span>
                              </div>
                            ) : isVuota ? (
                              <div
                                className="p-2 rounded-xl bg-slate-950/50 border border-dashed border-emerald-800/40 text-emerald-400 hover:border-emerald-500 transition-colors"
                                title={`Macchina completamente libera! ${capEffettivaGiorno}h disponibili per inserire nuovi ordini.`}
                              >
                                <span className="block text-[11px] font-bold text-emerald-400">LIBERA</span>
                                <span className="block text-[10px] text-slate-500 font-mono">+{capEffettivaGiorno}h buco</span>
                              </div>
                            ) : (
                              <div
                                className={`p-2 rounded-xl border transition-all ${
                                  isSovraccarica
                                    ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                                    : isQuasiPiena
                                    ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                                    : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                                }`}
                                title={`OdP: ${odpInGiorno.join(', ')} | Impegnate: ${oreArrotondate}h su ${capEffettivaGiorno}h`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span>{oreArrotondate}h</span>
                                  <span className="text-[10px] opacity-80">{percGiorno}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      isSovraccarica ? 'bg-rose-500' : isQuasiPiena ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${percGiorno}%` }}
                                  />
                                </div>
                                {oreLibere > 0 && (
                                  <span className="block text-[9px] text-slate-400 mt-1">
                                    {oreLibere}h libere
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Scorciatoie Modulari Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/articoli"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors text-sm">
              Articoli, Distinte & Cicli
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              BOM unitarie e sequenza fasi con tempi ciclo/setup.
            </p>
          </div>
        </Link>

        <Link
          href="/ordini"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors text-sm">
              Ordini Clienti (Vendite)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inserisci commesse e genera gli Ordini di Produzione in un click.
            </p>
          </div>
        </Link>

        <Link
          href="/mrp"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors text-sm">
              Fabbisogni MRP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calcolo automatico deficit e liste riordino ai fornitori.
            </p>
          </div>
        </Link>

        <Link
          href="/officina"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
              Terminale Touch MES
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Avanzamento fasi a bordo macchina e lettura QR Code.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
