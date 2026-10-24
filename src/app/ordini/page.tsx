'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Plus,
  Search,
  Factory,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  FileText,
  LayoutGrid,
  List
} from 'lucide-react'
import {
  Cliente,
  OrdineCliente,
  RigaOrdineCliente,
  Articolo,
  FaseCicloStandard,
  OrdineProduzione,
  FaseOdP,
  ComponenteDistintaBase,
  CentroLavoro
} from '@/types/database'
import {
  SEED_CLIENTI,
  SEED_ORDINI_CLIENTI,
  SEED_ARTICOLI,
  SEED_FASI_CICLO,
  SEED_ODP,
  SEED_DISTINTA_BASE,
  SEED_CENTRI_LAVORO
} from '@/lib/data-service'

type OrdineCompleto = OrdineCliente & {
  cliente?: Cliente
  righe: (RigaOrdineCliente & { articolo?: Articolo })[]
}

export default function OrdiniPage() {
  const [ordini, setOrdini] = useState<OrdineCompleto[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [cicli, setCicli] = useState<FaseCicloStandard[]>([])
  const [distinte, setDistinte] = useState<ComponenteDistintaBase[]>([])
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi: FaseOdP[] })[]>([])

  // Simulatore CTP Data Consegna
  const [dettaglioSimulazione, setDettaglioSimulazione] = useState<{
    dataSuggerita: string
    giorniMateriale: number
    materialeBottleneck: string
    oreLavorazioneTotali: number
    giorniLavorazione: number
    giorniCodaMacchine: number
    giorniBuffer: number
    giorniTotali: number
  } | null>(null)

  const [termineRicerca, setTermineRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [modalitaVista, setModalitaVista] = useState<'cards' | 'tabella'>('cards')

  // Selezione per lancio batch OdP (array di ID righe ordine)
  const [righeSelezionate, setRigheSelezionate] = useState<string[]>([])

  // Modale Nuovo Ordine Multi-Riga
  const [modaleAperta, setModaleAperta] = useState(false)
  const [formOrdine, setFormOrdine] = useState({
    numero_ordine: '',
    cliente_id: '',
    nuovo_cliente_nome: '',
    data_consegna_concordata: '',
    note: '',
    righe: [
      {
        articolo_id: '',
        quantita: 2,
        prezzo_unitario: 500
      }
    ]
  })

  // Notifica flash successo
  const [notifica, setNotifica] = useState<string | null>(null)

  useEffect(() => {
    const parseSicuro = <T,>(chiave: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(chiave)
        if (!item || item === 'undefined' || item === 'null') return fallback
        return JSON.parse(item) as T
      } catch {
        return fallback
      }
    }

    const clientiList = parseSicuro('machinaflow_clienti', SEED_CLIENTI)
    setClienti(clientiList)

    const articoliList = parseSicuro('machinaflow_articoli', SEED_ARTICOLI)
    setArticoli(articoliList)

    const cicliList = parseSicuro('machinaflow_fasi_ciclo', SEED_FASI_CICLO)
    setCicli(cicliList)

    const distinteList = parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE)
    setDistinte(distinteList)

    const centriList = parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO)
    setCentriLavoro(centriList)

    const odpCaricati = parseSicuro('machinaflow_odp', SEED_ODP)
    setOdpList(odpCaricati)

    const ordiniCaricati = parseSicuro('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI)

    // Arricchisci con oggetti collegati
    const arricchiti: OrdineCompleto[] = ordiniCaricati.map((ord) => ({
      ...ord,
      cliente: clientiList.find((c) => c.id === ord.cliente_id),
      righe: ord.righe.map((r) => ({
        ...r,
        articolo: articoliList.find((a) => a.id === r.articolo_id)
      }))
    }))
    setOrdini(arricchiti)

    // Preimposta data consegna suggerita a +10 giorni
    const dataSuggerita = new Date()
    dataSuggerita.setDate(dataSuggerita.getDate() + 10)
    setFormOrdine((prev) => ({
      ...prev,
      numero_ordine: `ORD-2026-${String(ordiniCaricati.length + 1).padStart(3, '0')}`,
      data_consegna_concordata: dataSuggerita.toISOString().split('T')[0]
    }))
  }, [])

  // SIMULATORE CAPABLE-TO-PROMISE (CTP) DATA DI CONSEGNA
  const calcolaDataConsegnaSuggerita = () => {
    const righeValide = formOrdine.righe.filter((r) => r.articolo_id && r.quantita > 0)
    if (righeValide.length === 0) {
      alert('Seleziona almeno un articolo per calcolare la data di consegna stimata.')
      return
    }

    let maxLeadTimeMateriali = 0
    let materialeCriticoNome = 'Tutti i materiali disponibili a stock'
    let oreLavorazioneTotaliMinuti = 0

    // Calcolo fabbisogni e tempi per ogni riga
    righeValide.forEach((riga) => {
      const art = articoli.find((a) => a.id === riga.articolo_id)
      if (!art) return

      // 1. Analisi BOM e Disponibilità Materiali
      const componentiBOM = distinte.filter((d) => d.articolo_padre_id === art.id)
      componentiBOM.forEach((comp) => {
        const mat = articoli.find((a) => a.id === comp.articolo_componente_id)
        if (!mat) return

        const quantitaNecessaria = comp.quantita_necessaria * riga.quantita
        const isMancante = mat.giacenza_attuale < quantitaNecessaria
        const leadTime = mat.lead_time_giorni_fornitore !== undefined ? mat.lead_time_giorni_fornitore : 5

        if (isMancante && leadTime > maxLeadTimeMateriali) {
          maxLeadTimeMateriali = leadTime
          materialeCriticoNome = `${mat.codice_articolo} (${leadTime} gg)`
        }
      })

      // 2. Analisi Ciclo e Ore Lavorazione (Setup + Ciclo * Qty)
      const fasi = cicli.filter((c) => c.articolo_id === art.id)
      fasi.forEach((fase) => {
        const minutiFase = (fase.tempo_attrezzaggio_min || 0) + (fase.tempo_ciclo_pezzo_min || 0) * riga.quantita
        oreLavorazioneTotaliMinuti += minutiFase
      })
    })

    const oreLavorazioneTotali = Number((oreLavorazioneTotaliMinuti / 60).toFixed(1))
    // Consideriamo un turno di 8h/giorno per macchine CNC
    const giorniLavorazione = Math.max(1, Math.ceil(oreLavorazioneTotali / 8))

    // 3. Stima Coda Attuale Macchine in Officina (dagli OdP aperti)
    const odpAperti = odpList.filter((o) => o.stato !== 'completato')
    const giorniCodaMacchine = odpAperti.length > 6 ? 4 : odpAperti.length > 3 ? 2 : 1

    // 4. Margine di sicurezza industriale (2 giorni lavorativi per collaudo CMM e imballaggio)
    const giorniBuffer = 2

    // Giorni lavorativi totali necessari
    const giorniTotali = maxLeadTimeMateriali + giorniLavorazione + giorniCodaMacchine + giorniBuffer

    // Calcolo data futura saltando sabati e domeniche
    const dataTarget = new Date()
    let giorniAggiunti = 0
    while (giorniAggiunti < giorniTotali) {
      dataTarget.setDate(dataTarget.getDate() + 1)
      const giornoSettimana = dataTarget.getDay()
      if (giornoSettimana !== 0 && giornoSettimana !== 6) {
        giorniAggiunti++
      }
    }

    const dataSuggeritaIso = dataTarget.toISOString().split('T')[0]

    setDettaglioSimulazione({
      dataSuggerita: dataSuggeritaIso,
      giorniMateriale: maxLeadTimeMateriali,
      materialeBottleneck: materialeCriticoNome,
      oreLavorazioneTotali,
      giorniLavorazione,
      giorniCodaMacchine,
      giorniBuffer,
      giorniTotali
    })

    setFormOrdine((prev) => ({
      ...prev,
      data_consegna_concordata: dataSuggeritaIso
    }))
  }

  // Reset e apertura del form per un nuovo ordine
  const apriNuovoOrdine = () => {
    const dataDefault = new Date()
    dataDefault.setDate(dataDefault.getDate() + 10)
    setDettaglioSimulazione(null)
    setFormOrdine({
      numero_ordine: `ORD-2026-${String(ordini.length + 1).padStart(3, '0')}`,
      cliente_id: '',
      nuovo_cliente_nome: '',
      data_consegna_concordata: dataDefault.toISOString().split('T')[0],
      note: '',
      righe: [
        {
          articolo_id: '',
          quantita: 2,
          prezzo_unitario: 500
        }
      ]
    })
    setModaleAperta(true)
  }

  // Chiusura con pulizia stato modale
  const chiudiModaleOrdine = () => {
    setModaleAperta(false)
    setDettaglioSimulazione(null)
  }

  // Creazione Nuovo Ordine Multi-Riga
  const handleCreaOrdine = (e: React.FormEvent) => {
    e.preventDefault()
    const righeValide = formOrdine.righe.filter((r) => r.articolo_id && r.quantita > 0)
    if (righeValide.length === 0 || !formOrdine.data_consegna_concordata) {
      alert('Inserisci almeno un articolo valido con quantità positiva.')
      return
    }

    let finalClienteId = formOrdine.cliente_id
    let clientiAggiornati = [...clienti]

    // Se l'utente ha inserito una nuova ragione sociale
    if (!finalClienteId && formOrdine.nuovo_cliente_nome.trim()) {
      const nuovoCliente: Cliente = {
        id: 'cli-' + Date.now(),
        ragione_sociale: formOrdine.nuovo_cliente_nome.trim(),
        creato_il: new Date().toISOString()
      }
      clientiAggiornati = [nuovoCliente, ...clienti]
      setClienti(clientiAggiornati)
      localStorage.setItem('machinaflow_clienti', JSON.stringify(clientiAggiornati))
      finalClienteId = nuovoCliente.id
    }

    if (!finalClienteId) {
      alert('Seleziona o specifica un cliente per la commessa.')
      return
    }

    const nuovoId = 'ord-' + Date.now()

    const nuovoOrdine: OrdineCompleto = {
      id: nuovoId,
      numero_ordine: formOrdine.numero_ordine.trim().toUpperCase(),
      cliente_id: finalClienteId,
      data_ordine: new Date().toISOString().split('T')[0],
      data_consegna_concordata: formOrdine.data_consegna_concordata,
      stato: 'confermato',
      note: formOrdine.note,
      creato_il: new Date().toISOString(),
      cliente: clientiAggiornati.find((c) => c.id === finalClienteId),
      righe: righeValide.map((r, idx) => ({
        id: `riga-${Date.now()}-${idx}`,
        ordine_cliente_id: nuovoId,
        articolo_id: r.articolo_id,
        quantita: Number(r.quantita),
        prezzo_unitario: Number(r.prezzo_unitario),
        articolo: articoli.find((a) => a.id === r.articolo_id)
      }))
    }

    const aggiornati = [nuovoOrdine, ...ordini]
    setOrdini(aggiornati)
    localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(aggiornati))

    chiudiModaleOrdine()
    setNotifica(`Ordine ${nuovoOrdine.numero_ordine} con ${nuovoOrdine.righe.length} articoli creato con successo!`)
    setTimeout(() => setNotifica(null), 4000)
  }

  // Gestione Selezione Checkbox Righe
  const toggleSelezioneRiga = (rigaId: string) => {
    setRigheSelezionate((prev) =>
      prev.includes(rigaId) ? prev.filter((id) => id !== rigaId) : [...prev, rigaId]
    )
  }

  const toggleSelezioneOrdine = (ordine: OrdineCompleto) => {
    const righeNonLanciate = ordine.righe
      .filter((r) => !odpList.some((o) => o.riga_ordine_cliente_id === r.id))
      .map((r) => r.id)

    const tutteGiaSelezionate = righeNonLanciate.every((id) => righeSelezionate.includes(id))

    if (tutteGiaSelezionate) {
      setRigheSelezionate((prev) => prev.filter((id) => !righeNonLanciate.includes(id)))
    } else {
      setRigheSelezionate((prev) => Array.from(new Set([...prev, ...righeNonLanciate])))
    }
  }

  const toggleSelezionaTuttiVisibili = () => {
    const tutteRigheNonLanciate = ordiniFiltrati
      .flatMap((o) => o.righe)
      .filter((r) => !odpList.some((o) => o.riga_ordine_cliente_id === r.id))
      .map((r) => r.id)

    const tutteGiaSelezionate = tutteRigheNonLanciate.length > 0 &&
      tutteRigheNonLanciate.every((id) => righeSelezionate.includes(id))

    if (tutteGiaSelezionate) {
      setRigheSelezionate([])
    } else {
      setRigheSelezionate(tutteRigheNonLanciate)
    }
  }

  // Generazione Massiva OdP per tutte le righe selezionate con Checkbox
  const handleLanciaSelezionati = () => {
    if (righeSelezionate.length === 0) return

    let countCreati = 0
    let tempOdpList = [...odpList]
    const ordiniCoinvoltiIds = new Set<string>()

    // Trova le righe corrispondenti
    ordini.forEach((ord) => {
      ord.righe.forEach((riga, rigaIdx) => {
        if (!righeSelezionate.includes(riga.id)) return
        if (tempOdpList.some((o) => o.riga_ordine_cliente_id === riga.id)) return

        const fasiArticolo = cicli.filter((c) => c.articolo_id === riga.articolo_id).sort((a, b) => a.sequenza - b.sequenza)
        const nuovoOdpId = `odp-${Date.now()}-${rigaIdx}-${Math.random().toString(36).substring(2, 5)}`
        const codiceOdp = `ODP-2026-${String(tempOdpList.length + 1).padStart(3, '0')}`

        const fasiEsecutive: FaseOdP[] = fasiArticolo.map((faseStd, index) => {
          const tempoStimatoTotale = faseStd.tempo_attrezzaggio_min + (faseStd.tempo_ciclo_pezzo_min * riga.quantita)
          return {
            id: `fase-odp-${Date.now()}-${rigaIdx}-${index}`,
            odp_id: nuovoOdpId,
            sequenza: faseStd.sequenza,
            nome_fase: faseStd.nome_fase,
            tipo_processo_id: faseStd.tipo_processo_id,
            centro_lavoro_id: faseStd.centro_lavoro_id,
            centri_lavoro_alternativi_ids: faseStd.centri_lavoro_alternativi_ids || [],
            tempo_stimato_totale_min: tempoStimatoTotale,
            tempo_effettivo_min: 0,
            stato: 'non_iniziata',
            note_officina: faseStd.note_operative
          }
        })

        const nuovoOdP: OrdineProduzione & { fasi: FaseOdP[] } = {
          id: nuovoOdpId,
          codice_odp: codiceOdp,
          riga_ordine_cliente_id: riga.id,
          articolo_id: riga.articolo_id,
          quantita_da_produrre: riga.quantita,
          quantita_prodotta: 0,
          data_inizio_pianificata: new Date().toISOString().split('T')[0],
          data_fine_pianificata: ord.data_consegna_concordata,
          stato: 'pianificato',
          priorita: 2,
          qr_code_token: `${codiceOdp}-TOKEN-${Date.now().toString().slice(-4)}`,
          note: `Lancio Batch da Commessa ${ord.numero_ordine} per ${ord.cliente?.ragione_sociale || 'Cliente'}`,
          creato_il: new Date().toISOString(),
          fasi: fasiEsecutive
        }

        tempOdpList = [nuovoOdP, ...tempOdpList]
        ordiniCoinvoltiIds.add(ord.id)
        countCreati++
      })
    })

    if (countCreati > 0) {
      setOdpList(tempOdpList)
      localStorage.setItem('machinaflow_odp', JSON.stringify(tempOdpList))

      const ordiniAggiornati = ordini.map((o) =>
        ordiniCoinvoltiIds.has(o.id) ? { ...o, stato: 'in_produzione' as const } : o
      )
      setOrdini(ordiniAggiornati)
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))

      setRigheSelezionate([])
      setNotifica(`🚀 Lanciati con successo in produzione ${countCreati} OdP con tutte le relative fasi di ciclo e postazione CAD/CAM!`)
      setTimeout(() => setNotifica(null), 5000)
    }
  }

  // Generazione Automatica di TUTTI gli OdP dell'ordine con 1 click
  const handleGeneraTuttiOdP = (ordine: OrdineCompleto) => {
    let countCreati = 0
    let tempOdpList = [...odpList]

    ordine.righe.forEach((riga, rigaIdx) => {
      // Controlla se esiste già un OdP per questa riga
      const esisteGia = tempOdpList.some((o) => o.riga_ordine_cliente_id === riga.id)
      if (esisteGia) return

      const fasiArticolo = cicli.filter((c) => c.articolo_id === riga.articolo_id).sort((a, b) => a.sequenza - b.sequenza)
      const nuovoOdpId = `odp-${Date.now()}-${rigaIdx}`
      const codiceOdp = `ODP-2026-${String(tempOdpList.length + 1).padStart(3, '0')}`

      const fasiEsecutive: FaseOdP[] = fasiArticolo.map((faseStd, index) => {
        const tempoStimatoTotale = faseStd.tempo_attrezzaggio_min + (faseStd.tempo_ciclo_pezzo_min * riga.quantita)
        return {
          id: `fase-odp-${Date.now()}-${rigaIdx}-${index}`,
          odp_id: nuovoOdpId,
          sequenza: faseStd.sequenza,
          nome_fase: faseStd.nome_fase,
          tipo_processo_id: faseStd.tipo_processo_id,
          centro_lavoro_id: faseStd.centro_lavoro_id,
          centri_lavoro_alternativi_ids: faseStd.centri_lavoro_alternativi_ids || [],
          tempo_stimato_totale_min: tempoStimatoTotale,
          tempo_effettivo_min: 0,
          stato: 'non_iniziata',
          note_officina: faseStd.note_operative
        }
      })

      const nuovoOdP: OrdineProduzione & { fasi: FaseOdP[] } = {
        id: nuovoOdpId,
        codice_odp: codiceOdp,
        riga_ordine_cliente_id: riga.id,
        articolo_id: riga.articolo_id,
        quantita_da_produrre: riga.quantita,
        quantita_prodotta: 0,
        data_inizio_pianificata: new Date().toISOString().split('T')[0],
        data_fine_pianificata: ordine.data_consegna_concordata,
        stato: 'pianificato',
        priorita: 2,
        qr_code_token: `${codiceOdp}-TOKEN-${Date.now().toString().slice(-4)}`,
        note: `Generato da Ordine Cliente ${ordine.numero_ordine} per ${ordine.cliente?.ragione_sociale || 'Cliente'}`,
        creato_il: new Date().toISOString(),
        fasi: fasiEsecutive
      }

      tempOdpList = [nuovoOdP, ...tempOdpList]
      countCreati++
    })

    if (countCreati > 0) {
      setOdpList(tempOdpList)
      localStorage.setItem('machinaflow_odp', JSON.stringify(tempOdpList))

      const ordiniAggiornati = ordini.map((o) =>
        o.id === ordine.id ? { ...o, stato: 'in_produzione' as const } : o
      )
      setOrdini(ordiniAggiornati)
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))

      setNotifica(`Generati ${countCreati} OdP per l'ordine ${ordine.numero_ordine}! Tutti i pezzi sono ora in officina.`)
      setTimeout(() => setNotifica(null), 5000)
    }
  }

  // Generazione Automatica OdP dalla riga d'ordine
  const handleGeneraOdP = (ordine: OrdineCompleto, riga: RigaOrdineCliente & { articolo?: Articolo }) => {
    // 1. Trova le fasi del ciclo standard dell'articolo
    const fasiArticolo = cicli.filter((c) => c.articolo_id === riga.articolo_id).sort((a, b) => a.sequenza - b.sequenza)

    const nuovoOdpId = 'odp-' + Date.now()
    const codiceOdp = `ODP-2026-${String(odpList.length + 1).padStart(3, '0')}`

    // 2. Crea le fasi OdP moltiplicando i tempi ciclo per la quantità
    const fasiEsecutive: FaseOdP[] = fasiArticolo.map((faseStd, index) => {
      const tempoStimatoTotale = faseStd.tempo_attrezzaggio_min + (faseStd.tempo_ciclo_pezzo_min * riga.quantita)

      return {
        id: `fase-odp-${Date.now()}-${index}`,
        odp_id: nuovoOdpId,
        sequenza: faseStd.sequenza,
        nome_fase: faseStd.nome_fase,
        tipo_processo_id: faseStd.tipo_processo_id,
        centro_lavoro_id: faseStd.centro_lavoro_id,
        centri_lavoro_alternativi_ids: faseStd.centri_lavoro_alternativi_ids || [],
        tempo_stimato_totale_min: tempoStimatoTotale,
        tempo_effettivo_min: 0,
        stato: 'non_iniziata',
        note_officina: faseStd.note_operative
      }
    })

    // 3. Crea l'OdP
    const nuovoOdP: OrdineProduzione & { fasi: FaseOdP[] } = {
      id: nuovoOdpId,
      codice_odp: codiceOdp,
      riga_ordine_cliente_id: riga.id,
      articolo_id: riga.articolo_id,
      quantita_da_produrre: riga.quantita,
      quantita_prodotta: 0,
      data_inizio_pianificata: new Date().toISOString().split('T')[0],
      data_fine_pianificata: ordine.data_consegna_concordata,
      stato: 'pianificato',
      priorita: 2, // Media
      qr_code_token: `${codiceOdp}-TOKEN-${Date.now().toString().slice(-4)}`,
      note: `Generato da Ordine Cliente ${ordine.numero_ordine} per ${ordine.cliente?.ragione_sociale || 'Cliente'}`,
      creato_il: new Date().toISOString(),
      fasi: fasiEsecutive
    }

    const odpAggiornati = [nuovoOdP, ...odpList]
    setOdpList(odpAggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(odpAggiornati))

    // 4. Aggiorna stato ordine a "in_produzione"
    const ordiniAggiornati = ordini.map((o) =>
      o.id === ordine.id ? { ...o, stato: 'in_produzione' as const } : o
    )
    setOrdini(ordiniAggiornati)
    localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))

    setNotifica(`Generato OdP ${codiceOdp} per ${riga.quantita} pz con ${fasiEsecutive.length} fasi di lavorazione!`)
    setTimeout(() => setNotifica(null), 5000)
  }

  // Filtro
  const ordiniFiltrati = ordini.filter((o) => {
    const combaciaStato = filtroStato === 'tutti' || o.stato === filtroStato
    const matchNumeroOCliente =
      o.numero_ordine.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      (o.cliente && o.cliente.ragione_sociale.toLowerCase().includes(termineRicerca.toLowerCase()))
    
    const matchArticolo = o.righe.some((r) =>
      r.articolo && (
        r.articolo.codice_articolo.toLowerCase().includes(termineRicerca.toLowerCase()) ||
        r.articolo.descrizione.toLowerCase().includes(termineRicerca.toLowerCase())
      )
    )

    return combaciaStato && (matchNumeroOCliente || matchArticolo)
  })

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-orange-500" />
            Ordini Clienti (Sales Orders)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestisci le commesse dei clienti, le date di consegna concordate e genera con un click gli Ordini di Produzione.
          </p>
        </div>

        <button
          onClick={apriNuovoOrdine}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuovo Ordine Cliente
        </button>
      </div>

      {/* Notifica Flash */}
      {notifica && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{notifica}</span>
          </div>
          <Link
            href="/produzione"
            className="text-xs font-bold underline hover:text-white transition-colors"
          >
            Vai agli OdP →
          </Link>
        </div>
      )}

      {/* Barra Azioni Batch Selezione Flottante */}
      {righeSelezionate.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/90 via-slate-900 to-slate-950 border-2 border-orange-500/60 shadow-2xl shadow-orange-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-orange-600/40">
              {righeSelezionate.length}
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                {righeSelezionate.length === 1 ? '1 articolo selezionato' : `${righeSelezionate.length} articoli selezionati`} per il lancio in produzione
              </p>
              <p className="text-xs text-slate-400">
                Verranno generati automaticamente gli OdP con le relative fasi (inclusa programmazione CAD/CAM).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRigheSelezionate([])}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Deseleziona tutti
            </button>
            <button
              onClick={handleLanciaSelezionati}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/40 transition-all cursor-pointer group"
            >
              <Factory className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Lancia Selezionati ({righeSelezionate.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra Filtri, Ricerca e Toggle Vista */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'tutti', label: 'Tutti gli Ordini' },
            { id: 'confermato', label: 'Confermati (Da Lanciare)' },
            { id: 'in_produzione', label: 'In Produzione (OdP Attivo)' },
            { id: 'evaso', label: 'Evasi' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroStato(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filtroStato === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Selettore Vista Cards / Lista */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setModalitaVista('cards')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                modalitaVista === 'cards'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista a Schede / Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schede</span>
            </button>
            <button
              type="button"
              onClick={() => setModalitaVista('tabella')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                modalitaVista === 'tabella'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista a Tabella Compatta / Lista"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termineRicerca}
              onChange={(e) => setTermineRicerca(e.target.value)}
              placeholder="Cerca numero, cliente o pezzo..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Elenco Ordini Clienti - Vista a Schede (Cards) */}
      {modalitaVista === 'cards' && (
        <div className="space-y-6">
          {ordiniFiltrati.map((ordine) => {
            const totaleCommessa = ordine.righe.reduce(
              (acc, r) => acc + r.quantita * (r.prezzo_unitario || 0),
              0
            )
            const righeSenzaOdP = ordine.righe.filter(
              (r) => !odpList.some((o) => o.riga_ordine_cliente_id === r.id)
            )

            return (
              <div
                key={ordine.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
              >
                {/* Intestazione Card Commessa */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-mono font-bold text-orange-400 bg-orange-950/80 px-3 py-0.5 rounded-lg border border-orange-500/20">
                        {ordine.numero_ordine}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          ordine.stato === 'in_produzione'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : ordine.stato === 'evaso'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {ordine.stato.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Emesso: {ordine.data_ordine ? new Date(ordine.data_ordine).toLocaleDateString('it-IT') : '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                      <h3 className="font-bold text-lg text-white">
                        {ordine.cliente ? ordine.cliente.ragione_sociale : 'Cliente Sconosciuto'}
                      </h3>
                    </div>

                    {ordine.note && (
                      <p className="text-xs text-slate-400 italic">
                        &quot;{ordine.note}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center lg:items-end flex-col gap-2">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 justify-start lg:justify-end">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Scadenza Consegna
                      </span>
                      <span className="text-base font-bold text-white">
                        {new Date(ordine.data_consegna_concordata).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="text-left lg:text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Valore Commessa</span>
                      <span className="text-base font-mono font-bold text-emerald-400">
                        € {totaleCommessa.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {righeSenzaOdP.length > 1 && (
                      <button
                        onClick={() => handleGeneraTuttiOdP(ordine)}
                        className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-white text-xs font-bold shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Lancia Tutti gli OdP ({righeSenzaOdP.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabella Dettaglio Articoli della Commessa */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {righeSenzaOdP.length > 0 && (
                        <input
                          type="checkbox"
                          checked={righeSenzaOdP.every((r) => righeSelezionate.includes(r.id))}
                          onChange={() => toggleSelezioneOrdine(ordine)}
                          className="w-4 h-4 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer"
                          title="Seleziona tutti gli articoli da lanciare di questa commessa"
                        />
                      )}
                      <span>Articoli Ordinati in Commessa ({ordine.righe.length})</span>
                    </div>
                    <span>Stato OdP & Azioni</span>
                  </div>

                  <div className="divide-y divide-slate-800/50">
                    {ordine.righe.map((riga) => {
                      const odpEsistente = odpList.find((o) => o.riga_ordine_cliente_id === riga.id)
                      const importoRiga = (riga.quantita || 0) * (riga.prezzo_unitario || 0)
                      const isSelected = righeSelezionate.includes(riga.id)

                      return (
                        <div
                          key={riga.id}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isSelected ? 'bg-orange-950/20' : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!odpEsistente ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelezioneRiga(riga.id)}
                                className="w-4 h-4 mt-0.5 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer shrink-0"
                              />
                            ) : (
                              <div className="w-4 shrink-0" />
                            )}

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-orange-400 text-xs">
                                  {riga.articolo?.codice_articolo || 'COD-ART'}
                                </span>
                                <span className="text-white text-xs font-medium">
                                  {riga.articolo?.descrizione || 'Descrizione Articolo'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                                <span>
                                  Quantità: <strong className="text-slate-200">{riga.quantita} {riga.articolo?.unita_misura || 'pz'}</strong>
                                </span>
                                {riga.prezzo_unitario ? (
                                  <span>
                                    Prezzo: € {riga.prezzo_unitario.toFixed(2)} / {riga.articolo?.unita_misura || 'pz'}
                                  </span>
                                ) : null}
                                <span className="font-mono text-slate-300 font-semibold">
                                  Totale: € {importoRiga.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 pl-7 sm:pl-0">
                            {odpEsistente ? (
                              <Link
                                href={`/produzione/${odpEsistente.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all"
                              >
                                <Factory className="w-3.5 h-3.5 text-blue-400" />
                                <span>OdP: {odpEsistente.codice_odp}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleGeneraOdP(ordine, riga)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm shadow-orange-600/30 transition-all cursor-pointer group"
                              >
                                <Factory className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                <span>Genera OdP</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {ordiniFiltrati.length === 0 && (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">Nessun ordine cliente trovato</p>
              <p className="text-xs text-slate-500 mt-1">
                Inserisci un nuovo ordine cliente per pianificare la produzione in officina.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Elenco Ordini Clienti - Vista a Lista (Tabella con Checkbox e Righe Dettaglio) */}
      {modalitaVista === 'tabella' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={toggleSelezionaTuttiVisibili}
                      checked={
                        ordiniFiltrati.flatMap((o) => o.righe).filter((r) => !odpList.some((o) => o.riga_ordine_cliente_id === r.id)).length > 0 &&
                        ordiniFiltrati.flatMap((o) => o.righe).filter((r) => !odpList.some((o) => o.riga_ordine_cliente_id === r.id)).every((r) => righeSelezionate.includes(r.id))
                      }
                      className="w-4 h-4 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer"
                      title="Seleziona/Deseleziona tutti gli articoli visibili pronti al lancio"
                    />
                  </th>
                  <th className="py-3 px-4">N. Ordine</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Codice & Articolo</th>
                  <th className="py-3 px-4 text-center">Quantità</th>
                  <th className="py-3 px-4 text-right">Prezzo Unit.</th>
                  <th className="py-3 px-4 text-right">Totale Riga</th>
                  <th className="py-3 px-4">Consegna</th>
                  <th className="py-3 px-4 text-center">Stato</th>
                  <th className="py-3 px-4 text-right">Azione OdP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ordiniFiltrati.map((ordine) => {
                  return ordine.righe.map((riga, rigaIndex) => {
                    const odpEsistente = odpList.find((o) => o.riga_ordine_cliente_id === riga.id)
                    const totaleImportoRiga = (riga.quantita || 0) * (riga.prezzo_unitario || 0)
                    const isFirstRowOfOrder = rigaIndex === 0
                    const isSelected = righeSelezionate.includes(riga.id)

                    return (
                      <tr
                        key={`${ordine.id}-${riga.id}`}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-orange-950/25 hover:bg-orange-950/35'
                            : 'hover:bg-slate-800/40'
                        } ${isFirstRowOfOrder ? 'border-t-2 border-slate-800' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          {!odpEsistente ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelezioneRiga(riga.id)}
                              className="w-4 h-4 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-600" title="OdP già lanciato">✓</span>
                          )}
                        </td>

                        {/* Numero Ordine */}
                        <td className="py-3 px-4 font-mono font-bold text-orange-400 whitespace-nowrap">
                          {isFirstRowOfOrder ? (
                            <div>
                              <span>{ordine.numero_ordine}</span>
                              <span className="block text-[10px] text-slate-500 font-sans font-normal">
                                {ordine.righe.length} art.
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px] font-mono">↳ {ordine.numero_ordine}</span>
                          )}
                        </td>

                        {/* Cliente */}
                        <td className="py-3 px-4 font-medium text-white max-w-[180px]">
                          {isFirstRowOfOrder ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate" title={ordine.cliente?.ragione_sociale}>
                                {ordine.cliente ? ordine.cliente.ragione_sociale : 'Cliente Sconosciuto'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">〃</span>
                          )}
                        </td>

                        {/* Articolo */}
                        <td className="py-3 px-4">
                          {riga.articolo ? (
                            <div className="space-y-0.5">
                              <span className="font-mono font-semibold text-white block">
                                {riga.articolo.codice_articolo}
                              </span>
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {riga.articolo.descrizione}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* Quantità */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
                            {riga.quantita} {riga.articolo?.unita_misura || 'pz'}
                          </span>
                        </td>

                        {/* Prezzo Unitario */}
                        <td className="py-3 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                          € {riga.prezzo_unitario?.toFixed(2) || '0.00'}
                        </td>

                        {/* Totale Riga */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                          € {totaleImportoRiga.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Scadenza */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isFirstRowOfOrder ? (
                            <div className="flex items-center gap-1 text-slate-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                {new Date(ordine.data_consegna_concordata).toLocaleDateString('it-IT', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">〃</span>
                          )}
                        </td>

                        {/* Stato */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isFirstRowOfOrder ? (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                ordine.stato === 'in_produzione'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : ordine.stato === 'evaso'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {ordine.stato.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">〃</span>
                          )}
                        </td>

                        {/* Azione OdP */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {odpEsistente ? (
                            <Link
                              href={`/produzione/${odpEsistente.id}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all"
                            >
                              <Factory className="w-3.5 h-3.5 text-blue-400" />
                              <span>{odpEsistente.codice_odp}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleGeneraOdP(ordine, riga)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm shadow-orange-600/30 transition-all cursor-pointer group"
                            >
                              <Factory className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                              <span>Lancia OdP</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                })}

                {ordiniFiltrati.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nessun ordine cliente trovato corrispondente ai filtri.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE NUOVO ORDINE CLIENTE (MULTI-RIGA) */}
      {modaleAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                Nuova Commessa / Ordine Cliente Multi-Articolo
              </h2>
              <button
                onClick={chiudiModaleOrdine}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreaOrdine} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numero Ordine / Commessa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formOrdine.numero_ordine}
                    onChange={(e) => setFormOrdine({ ...formOrdine, numero_ordine: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Data Consegna Concordata *
                    </label>
                    <button
                      type="button"
                      onClick={calcolaDataConsegnaSuggerita}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                      title="Calcola data realistica CTP combinando lead time acquisto sagome/materiali + ore lavorazione CNC + coda officina"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>⚡ Calcola Data Suggerita (CTP)</span>
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={formOrdine.data_consegna_concordata}
                    onChange={(e) => setFormOrdine({ ...formOrdine, data_consegna_concordata: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* BOX SPIEGAZIONE SIMULATORE CTP */}
              {dettaglioSimulazione && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-slate-900 border border-orange-500/30 space-y-2 animate-in fade-in slide-in-from-top-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Simulazione Consegna Promettibile (CTP): {dettaglioSimulazione.giorniTotali} gg lavorativi stimati
                    </span>
                    <span className="font-mono font-bold text-white bg-orange-600/30 border border-orange-500/40 px-2 py-0.5 rounded text-[11px]">
                      {dettaglioSimulazione.dataSuggerita}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Lead Time Materiali:</div>
                      <div className="font-bold text-rose-300 font-mono">+{dettaglioSimulazione.giorniMateriale} gg lav.</div>
                      <div className="text-[9px] text-slate-500 truncate" title={dettaglioSimulazione.materialeBottleneck}>
                        {dettaglioSimulazione.materialeBottleneck}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Lavorazioni Meccaniche:</div>
                      <div className="font-bold text-amber-300 font-mono">+{dettaglioSimulazione.giorniLavorazione} gg ({dettaglioSimulazione.oreLavorazioneTotali}h)</div>
                      <div className="text-[9px] text-slate-500">Setup + cicli CNC</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Coda Macchine Officina:</div>
                      <div className="font-bold text-cyan-300 font-mono">+{dettaglioSimulazione.giorniCodaMacchine} gg lav.</div>
                      <div className="text-[9px] text-slate-500">Carico OdP aperti</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Buffer CMM & Spedizione:</div>
                      <div className="font-bold text-emerald-300 font-mono">+{dettaglioSimulazione.giorniBuffer} gg lav.</div>
                      <div className="text-[9px] text-slate-500">Collaudo 3D e logistica</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cliente Registrato
                </label>
                <select
                  value={formOrdine.cliente_id}
                  onChange={(e) => setFormOrdine({ ...formOrdine, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Seleziona o inserisci nuovo sotto --</option>
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ragione_sociale} {c.partita_iva ? `(${c.partita_iva})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!formOrdine.cliente_id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Oppure Ragione Sociale Nuovo Cliente:
                  </label>
                  <input
                    type="text"
                    placeholder="es: Meccanica Industriale S.p.A."
                    value={formOrdine.nuovo_cliente_nome}
                    onChange={(e) => setFormOrdine({ ...formOrdine, nuovo_cliente_nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {/* SEZIONE ARTICOLI DELLA COMMESSA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Particolari Meccanici in Commessa ({formOrdine.righe.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormOrdine({
                        ...formOrdine,
                        righe: [
                          ...formOrdine.righe,
                          { articolo_id: '', quantita: 2, prezzo_unitario: 350 }
                        ]
                      })
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-500" />
                    <span>Aggiungi Altro Articolo</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formOrdine.righe.map((riga, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          Posizione #{index + 1}
                        </span>
                        {formOrdine.righe.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormOrdine({
                                ...formOrdine,
                                righe: formOrdine.righe.filter((_, i) => i !== index)
                              })
                            }}
                            className="text-slate-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Articolo *</label>
                          <select
                            required
                            value={riga.articolo_id}
                            onChange={(e) => {
                              const selArt = articoli.find((a) => a.id === e.target.value)
                              const nuoveRighe = [...formOrdine.righe]
                              nuoveRighe[index] = {
                                ...nuoveRighe[index],
                                articolo_id: e.target.value,
                                prezzo_unitario: selArt?.prezzo_riferimento || nuoveRighe[index].prezzo_unitario
                              }
                              setFormOrdine({ ...formOrdine, righe: nuoveRighe })
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                          >
                            <option value="">-- Seleziona particolare finito --</option>
                            {articoli
                              .filter((a) => a.tipo !== 'materia_prima')
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.codice_articolo} - {a.descrizione}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Quantità *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={riga.quantita}
                            onChange={(e) => {
                              const nuoveRighe = [...formOrdine.righe]
                              nuoveRighe[index].quantita = Number(e.target.value)
                              setFormOrdine({ ...formOrdine, righe: nuoveRighe })
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Prezzo Unit. (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={riga.prezzo_unitario}
                            onChange={(e) => {
                              const nuoveRighe = [...formOrdine.righe]
                              nuoveRighe[index].prezzo_unitario = Number(e.target.value)
                              setFormOrdine({ ...formOrdine, righe: nuoveRighe })
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Ordine / Prescrizioni Consegna
                </label>
                <textarea
                  rows={2}
                  placeholder="Istruzioni imballaggio, trasporto o vincoli cliente..."
                  value={formOrdine.note}
                  onChange={(e) => setFormOrdine({ ...formOrdine, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between -mx-5 -mb-5 bg-slate-950/80 shrink-0">
                <div className="text-xs text-slate-400">
                  Valore Totale Commessa:{' '}
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    €{' '}
                    {formOrdine.righe
                      .reduce((sum, r) => sum + r.quantita * (r.prezzo_unitario || 0), 0)
                      .toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={chiudiModaleOrdine}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    Registra Commessa Multi-Articolo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
