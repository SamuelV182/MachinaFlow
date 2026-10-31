'use client'

import { useState, useEffect, useMemo } from 'react'
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
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  PackageCheck,
  Truck
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
  CentroLavoro,
  DocumentoTrasportoCliente
} from '@/types/database'
import {
  SEED_CLIENTI,
  SEED_ORDINI_CLIENTI,
  SEED_ARTICOLI,
  SEED_FASI_CICLO,
  SEED_ODP,
  SEED_DISTINTA_BASE,
  SEED_CENTRI_LAVORO,
  SEED_DDT_CLIENTI
} from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

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
  const [ddtClienti, setDdtClienti] = useState<DocumentoTrasportoCliente[]>([])

  const [tabAttivo, setTabAttivo] = useState<'ordini' | 'clienti'>('ordini')

  // Stato Anagrafica Clienti
  const [ricercaClienti, setRicercaClienti] = useState('')
  const [modaleClienteAperta, setModaleClienteAperta] = useState(false)
  const [clienteInModifica, setClienteInModifica] = useState<Cliente | null>(null)
  const [formCliente, setFormCliente] = useState<Omit<Cliente, 'id' | 'creato_il'>>({
    ragione_sociale: '',
    partita_iva: '',
    email: '',
    telefono: '',
    indirizzo: ''
  })

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

  // Paginazione per Schede (Ordini) e per Tabella (Righe Articolo)
  const [paginaCards, setPaginaCards] = useState<number>(1)
  const [paginaTabella, setPaginaTabella] = useState<number>(1)
  const ORDINI_PER_PAGINA_CARDS = 10
  const RIGHE_PER_PAGINA_TABELLA = 25

  // Stato espansione ordini multi-riga (fisarmonica/accordion per ordini con più di 3 righe)
  const [ordiniEspansiIds, setOrdiniEspansiIds] = useState<Record<string, boolean>>({})
  const toggleEspandiOrdine = (ordineId: string) => {
    setOrdiniEspansiIds((prev) => ({
      ...prev,
      [ordineId]: !prev[ordineId]
    }))
  }

  // Selezione per lancio batch OdP (array di ID righe ordine)
  const [righeSelezionate, setRigheSelezionate] = useState<string[]>([])

  // Modale Nuovo Ordine Multi-Riga
  const [modaleAperta, setModaleAperta] = useState(false)
  const [ordineInModifica, setOrdineInModifica] = useState<OrdineCompleto | null>(null)
  const [modalePinModificaAperta, setModalePinModificaAperta] = useState(false)
  const [ordineTargetPerPin, setOrdineTargetPerPin] = useState<OrdineCompleto | null>(null)
  const [azionePin, setAzionePin] = useState<'modifica' | 'elimina'>('modifica')
  const [pinInserito, setPinInserito] = useState("")
  const [pinErrore, setPinErrore] = useState(false)

  const handleRichiediModificaOrdine = (ordine: OrdineCompleto) => {
    setOrdineTargetPerPin(ordine)
    setAzionePin('modifica')
    setPinInserito("")
    setPinErrore(false)
    setModalePinModificaAperta(true)
  }

  const handleRichiediEliminaOrdine = (ordine: OrdineCompleto) => {
    // Controllo sicurezza: se ci sono OdP già avviati o completati, avvisa
    const righeIds = new Set(ordine.righe.map((r) => r.id))
    const odpInCorso = odpList.filter(
      (o) =>
        ((o.riga_ordine_cliente_id && righeIds.has(o.riga_ordine_cliente_id)) || o.ordine_cliente_id === ordine.id) &&
        o.stato !== 'pianificato' && o.stato !== 'scartato'
    )

    if (odpInCorso.length > 0) {
      alert(`Attenzione: l'ordine ${ordine.numero_ordine} ha OdP già avviati in lavorazione o spediti (${odpInCorso.map(o => o.codice_odp).join(', ')}). Annulla o gestisci prima gli OdP collegati.`)
      return
    }

    setOrdineTargetPerPin(ordine)
    setAzionePin('elimina')
    setPinInserito("")
    setPinErrore(false)
    setModalePinModificaAperta(true)
  }

  const handleConfermaPinModifica = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInserito === '1234' || pinInserito === '2026') {
      const ordine = ordineTargetPerPin
      setModalePinModificaAperta(false)
      if (ordine) {
        if (azionePin === 'elimina') {
          await handleEseguiEliminazioneOrdine(ordine)
        } else {
          handleApriModificaOrdine(ordine)
        }
      }
    } else {
      setPinErrore(true)
    }
  }

  const handleEseguiEliminazioneOrdine = async (ordine: OrdineCompleto) => {
    // 1. Rimuovi dall'array ordini locale
    const ordiniAggiornati = ordini.filter((o) => o.id !== ordine.id)
    setOrdini(ordiniAggiornati)
    localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))

    // 2. Rimuovi eventuali OdP pianificati non ancora avviati collegati a quest'ordine
    const righeIds = new Set(ordine.righe.map((r) => r.id))
    const odpDaRimuovere = odpList.filter(
      (o) =>
        ((o.riga_ordine_cliente_id && righeIds.has(o.riga_ordine_cliente_id)) || o.ordine_cliente_id === ordine.id) &&
        o.stato === 'pianificato'
    )
    if (odpDaRimuovere.length > 0) {
      const idsDaRimuovere = new Set(odpDaRimuovere.map((o) => o.id))
      const odpAggiornati = odpList.filter((o) => !idsDaRimuovere.has(o.id))
      setOdpList(odpAggiornati)
      localStorage.setItem('machinaflow_odp', JSON.stringify(odpAggiornati))
    }

    // 3. Sincronizza eliminazione su Supabase Cloud
    await syncService.eliminaOrdineCliente(ordine.id)

    setNotifica(`✓ Commessa ${ordine.numero_ordine} eliminata con successo!`)
    setTimeout(() => setNotifica(null), 4000)
  }

  const handleApriModificaOrdine = (ordine: OrdineCompleto) => {
    setOrdineInModifica(ordine)
    setFormOrdine({
      numero_ordine: ordine.numero_ordine,
      riferimento_ordine_cliente: ordine.riferimento_ordine_cliente || '',
      cliente_id: ordine.cliente_id,
      nuovo_cliente_nome: '',
      data_consegna_concordata: ordine.data_consegna_concordata ? ordine.data_consegna_concordata.split('T')[0] : '',
      note: ordine.note || '',
      righe: ordine.righe.map(r => ({
        pos_riga_cliente: String(r.pos_riga_cliente || ''),
        articolo_id: r.articolo_id,
        quantita: r.quantita,
        prezzo_unitario: Number(r.prezzo_unitario || 0)
      }))
    })
    setModaleAperta(true)
  }
  const [formOrdine, setFormOrdine] = useState({
    numero_ordine: '',
    riferimento_ordine_cliente: '',
    cliente_id: '',
    nuovo_cliente_nome: '',
    data_consegna_concordata: '',
    note: '',
    righe: [
      {
        pos_riga_cliente: '1',
        articolo_id: '',
        quantita: 2,
        prezzo_unitario: 500
      }
    ]
  })

  // Notifica flash successo
  const [notifica, setNotifica] = useState<string | null>(null)

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

      const clientiList = parseSicuro('machinaflow_clienti', SEED_CLIENTI)
      setClienti(clientiList)

      // Unisci articoli salvati con seed
      const articoliSalvati = parseSicuro<Articolo[]>('machinaflow_articoli', [])
      const mappaArticoli = new Map<string, Articolo>()
      SEED_ARTICOLI.forEach((a) => mappaArticoli.set(a.id, a))
      articoliSalvati.forEach((a) => mappaArticoli.set(a.id, a))
      const articoliList = Array.from(mappaArticoli.values())
      setArticoli(articoliList)

      // Unisci cicli salvati con seed
      const cicliSalvati = parseSicuro<FaseCicloStandard[]>('machinaflow_cicli', [])
      const mappaCicli = new Map<string, FaseCicloStandard>()
      SEED_FASI_CICLO.forEach((c) => mappaCicli.set(c.id, c))
      cicliSalvati.forEach((c) => mappaCicli.set(c.id, c))
      const cicliList = Array.from(mappaCicli.values())
      setCicli(cicliList)

      // Unisci distinte salvate con seed
      const distinteSalvate = parseSicuro<ComponenteDistintaBase[]>('machinaflow_distinte', [])
      const mappaDistinte = new Map<string, ComponenteDistintaBase>()
      SEED_DISTINTA_BASE.forEach((d) => mappaDistinte.set(d.id, d))
      distinteSalvate.forEach((d) => mappaDistinte.set(d.id, d))
      const distinteList = Array.from(mappaDistinte.values())
      setDistinte(distinteList)

      const centriList = parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO)
      setCentriLavoro(centriList)

      // Carica e sincronizza OdP da Supabase Cloud
      const odpCaricati = await syncService.getOrdiniProduzione()
      setOdpList(odpCaricati)

      // Carica ordini clienti sincronizzati da Supabase Cloud + fallback locale e seed
      const ordiniCaricati = await syncService.getOrdiniClienti()

      // Carica DDT Clienti per calcolo esatto delle quantità già consegnate e saldi (Cloud Supabase + Locale)
      const ddtCloud = await syncService.getDdtClienti()
      const ddtLocali = parseSicuro<DocumentoTrasportoCliente[]>('machinaflow_ddt_clienti', SEED_DDT_CLIENTI)
      const mappaDdt = new Map<string, DocumentoTrasportoCliente>()
      ddtLocali.forEach((d) => mappaDdt.set(d.id, d))
      ;(ddtCloud || []).forEach((d) => mappaDdt.set(d.id, d))
      const ddtCaricati = Array.from(mappaDdt.values())
      setDdtClienti(ddtCaricati)

      // Arricchisci con oggetti collegati e determina lo stato reale in base agli OdP e ai DDT
      const arricchiti: OrdineCompleto[] = ordiniCaricati.map((ord) => {
        // Calcola avanzamento OdP per questo ordine (trovando sia per riga ID che per sotto-lotti /A /B /R o commessa)
        const righeIds = new Set(ord.righe.map((r) => r.id))
        const odpDellOrdine = odpCaricati.filter((o) =>
          (o.riga_ordine_cliente_id && righeIds.has(o.riga_ordine_cliente_id)) ||
          o.ordine_cliente_id === ord.id ||
          (o.codice_ordine_cliente && o.codice_ordine_cliente.toUpperCase() === ord.numero_ordine.toUpperCase()) ||
          (o.note && o.note.toUpperCase().includes(ord.numero_ordine.toUpperCase()))
        )

        // Verifica per ciascuna riga dell'ordine se è coperta da OdP completati
        const righeCoperteECompletate = ord.righe.every((r) => {
          const odpDellaRiga = odpDellOrdine.filter((o) => 
            o.riga_ordine_cliente_id === r.id || 
            (o.articolo_id === r.articolo_id && o.ordine_cliente_id === ord.id)
          )
          if (odpDellaRiga.length === 0) return false
          // Almeno uno completato e nessuno ancora incompleto tra quelli validi
          return odpDellaRiga.some((o) => o.stato === 'completato' || o.fasi?.every((f) => f.stato === 'completata'))
        })

        const almenoUnOdpCompletato = odpDellOrdine.some(
          (o) => o.stato === 'completato' || o.fasi?.every((f) => f.stato === 'completata')
        )

        // Calcola quantità spedite tramite DDT
        const totalePezziOrdinati = ord.righe.reduce((acc, r) => acc + (r.quantita || 0), 0)
        let totalePezziSpediti = 0
        ddtCaricati.forEach((doc) => {
          doc.righe.forEach((r) => {
            if (r.ordine_cliente_id === ord.id || r.codice_ordine_cliente === ord.numero_ordine) {
              totalePezziSpediti += r.quantita_spedita
            }
          })
        })

        // Verifica se ci sono OdP completati ma non ancora interamente spediti
        const haOdpProntiNonSpediti = odpDellOrdine.some((o) => {
          const tutteChiuse = o.fasi && o.fasi.length > 0 && o.fasi.every((f) => f.stato === 'completata')
          const isCompletato = o.stato === 'completato' || tutteChiuse
          if (!isCompletato || o.stato === 'spedito') return false

          // Verifica se è presente in un DDT
          let qtaSpeditaOdp = 0
          ddtCaricati.forEach((doc) => {
            doc.righe?.forEach((r) => {
              if (r.odp_id === o.id || r.codice_odp === o.codice_odp) {
                qtaSpeditaOdp += r.quantita_spedita
              }
            })
          })
          return qtaSpeditaOdp < (o.quantita_da_produrre || 0)
        })

        let statoReale = ord.stato
        if (totalePezziSpediti >= totalePezziOrdinati && totalePezziOrdinati > 0) {
          statoReale = 'evaso'
        } else if (totalePezziSpediti > 0) {
          // Se ha spedito parzialmente e non ci sono altri OdP completati in attesa di DDT, rimane parzialmente evaso (o in produzione)
          statoReale = haOdpProntiNonSpediti ? 'pronto_spedizione' : 'parzialmente_evaso'
        } else if (haOdpProntiNonSpediti) {
          statoReale = 'pronto_spedizione'
        } else if (odpDellOrdine.length > 0) {
          statoReale = 'in_produzione'
        }

        return {
          ...ord,
          stato: statoReale,
          cliente: clientiList.find((c) => c.id === ord.cliente_id),
          righe: ord.righe.map((r) => ({
            ...r,
            articolo: articoliList.find((a) => a.id === r.articolo_id)
          }))
        }
      })
      setOrdini(arricchiti)

      // Preimposta data consegna suggerita a +10 giorni
      const dataSuggerita = new Date()
      dataSuggerita.setDate(dataSuggerita.getDate() + 10)
      setFormOrdine((prev) => ({
        ...prev,
        numero_ordine: `ORD-2026-${String(ordiniCaricati.length + 1).padStart(3, '0')}`,
        data_consegna_concordata: dataSuggerita.toISOString().split('T')[0]
      }))
    }

    caricaDati()

    // Sottoscrizione Real-Time nativa Supabase:
    // Riceve gli aggiornamenti istantanei da qualsiasi terminale (deploy, tablet, altri PC)
    const disiscrivi = syncService.sottoscriviAvanzamentoProduzione(() => {
      caricaDati()
    })

    return () => {
      if (disiscrivi && typeof disiscrivi === 'function') {
        disiscrivi()
      }
    }
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
      riferimento_ordine_cliente: '',
      cliente_id: '',
      nuovo_cliente_nome: '',
      data_consegna_concordata: dataDefault.toISOString().split('T')[0],
      note: '',
      righe: [
        {
          pos_riga_cliente: '1',
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

    if (ordineInModifica) {
      const ordineId = ordineInModifica.id
      let odpModificati = [...odpList]
      let countOdpAggiornati = 0

      const righeFinali: RigaOrdineCliente[] = righeValide.map((r, idx) => {
        const rigaPrecedente = ordineInModifica.righe[idx] && ordineInModifica.righe[idx].articolo_id === r.articolo_id
          ? ordineInModifica.righe[idx]
          : ordineInModifica.righe.find((orig) => orig.articolo_id === r.articolo_id)

        const rigaId = rigaPrecedente ? rigaPrecedente.id : `riga-${Date.now()}-${idx}`
        const quantitaNuova = Number(r.quantita)

        if (rigaPrecedente) {
          odpModificati = odpModificati.map((odp) => {
            if (odp.riga_ordine_cliente_id === rigaPrecedente.id) {
              countOdpAggiornati++
              const odpAgg = {
                ...odp,
                fasi: odp.fasi || [],
                riferimento_ordine_cliente: formOrdine.riferimento_ordine_cliente.trim() || undefined,
                pos_riga_cliente: r.pos_riga_cliente ? String(r.pos_riga_cliente).trim() : (idx + 1),
                quantita_da_produrre: odp.stato === 'pianificato' ? quantitaNuova : odp.quantita_da_produrre
              }
              syncService.salvaOrdineProduzione(odpAgg)
              return odpAgg
            }
            return odp
          })
        }

        return {
          id: rigaId,
          ordine_cliente_id: ordineId,
          pos_riga_cliente: r.pos_riga_cliente ? String(r.pos_riga_cliente).trim() : (idx + 1),
          articolo_id: r.articolo_id,
          quantita: quantitaNuova,
          prezzo_unitario: Number(r.prezzo_unitario),
          articolo: articoli.find((a) => a.id === r.articolo_id)
        }
      })

      const ordineModificato: OrdineCompleto = {
        ...ordineInModifica,
        numero_ordine: formOrdine.numero_ordine.trim().toUpperCase(),
        riferimento_ordine_cliente: formOrdine.riferimento_ordine_cliente.trim() || undefined,
        cliente_id: finalClienteId,
        data_consegna_concordata: formOrdine.data_consegna_concordata,
        note: formOrdine.note,
        cliente: clientiAggiornati.find((c) => c.id === finalClienteId),
        righe: righeFinali
      }

      const ordiniAggiornati = ordini.map((o) => (o.id === ordineId ? ordineModificato : o))
      setOrdini(ordiniAggiornati)
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))
      syncService.salvaOrdineCliente(ordineModificato)

      if (countOdpAggiornati > 0) {
        setOdpList(odpModificati)
        localStorage.setItem('machinaflow_odp', JSON.stringify(odpModificati))
      }

      chiudiModaleOrdine()
      setNotifica(`✓ Commessa ${ordineModificato.numero_ordine} modificata con successo!`)
      setTimeout(() => setNotifica(null), 4000)
      return
    }

    const nuovoId = 'ord-' + Date.now()

    const nuovoOrdine: OrdineCompleto = {
      id: nuovoId,
      numero_ordine: formOrdine.numero_ordine.trim().toUpperCase(),
      riferimento_ordine_cliente: formOrdine.riferimento_ordine_cliente.trim() || undefined,
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
        pos_riga_cliente: r.pos_riga_cliente ? String(r.pos_riga_cliente).trim() : (idx + 1),
        articolo_id: r.articolo_id,
        quantita: Number(r.quantita),
        prezzo_unitario: Number(r.prezzo_unitario),
        articolo: articoli.find((a) => a.id === r.articolo_id)
      }))
    }

    const aggiornati = [nuovoOrdine, ...ordini]
    setOrdini(aggiornati)
    localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(aggiornati))

    // Sincronizza su Supabase Cloud
    syncService.salvaOrdineCliente(nuovoOrdine)

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
          const tempoStimatoTotale = faseStd.is_esterna
            ? (faseStd.giorni_rientro_previsti || 5) * 8 * 60 // stima indicativa 8h lavorative per giorno di rientro
            : faseStd.tempo_attrezzaggio_min + (faseStd.tempo_ciclo_pezzo_min * riga.quantita)

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
            note_officina: faseStd.note_operative,
            preleva_materia_prima: faseStd.preleva_materia_prima,
            // Campi lavorazione esterna c/terzi
            is_esterna: faseStd.is_esterna,
            fornitore_nome: faseStd.fornitore_nome,
            giorni_rientro_previsti: faseStd.giorni_rientro_previsti,
            modello_tariffa: faseStd.modello_tariffa,
            costo_tariffa_valore: faseStd.costo_tariffa_valore,
            costo_minimo_fornitura: faseStd.costo_minimo_fornitura,
            stato_esterna: faseStd.is_esterna ? 'in_attesa_uscita' : undefined
          }
        })

        const nuovoOdP: OrdineProduzione & { fasi: FaseOdP[] } = {
          id: nuovoOdpId,
          codice_odp: codiceOdp,
          riga_ordine_cliente_id: riga.id,
          ordine_cliente_id: ord.id,
          codice_ordine_cliente: ord.numero_ordine,
          riferimento_ordine_cliente: ord.riferimento_ordine_cliente,
          pos_riga_cliente: riga.pos_riga_cliente,
          cliente_id: ord.cliente_id,
          cliente_nome: ord.cliente?.ragione_sociale,
          numero_riga_ordine: rigaIdx + 1,
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

      // Sincronizza tutti gli OdP creati su Supabase
      tempOdpList.slice(0, countCreati).forEach((odp) => {
        syncService.salvaOrdineProduzione(odp)
      })

      const ordiniAggiornati = ordini.map((o) =>
        ordiniCoinvoltiIds.has(o.id) ? { ...o, stato: 'in_produzione' as const } : o
      )
      setOrdini(ordiniAggiornati)
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))

      // Sincronizza stato ordini coinvolti su Supabase
      ordiniCoinvoltiIds.forEach((ordId) => {
        syncService.aggiornaStatoOrdineCliente(ordId, 'in_produzione')
      })

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
        const tempoStimatoTotale = faseStd.is_esterna
          ? (faseStd.giorni_rientro_previsti || 5) * 8 * 60
          : faseStd.tempo_attrezzaggio_min + (faseStd.tempo_ciclo_pezzo_min * riga.quantita)

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
          note_officina: faseStd.note_operative,
          preleva_materia_prima: faseStd.preleva_materia_prima,
          // Campi lavorazione esterna c/terzi
          is_esterna: faseStd.is_esterna,
          fornitore_nome: faseStd.fornitore_nome,
          giorni_rientro_previsti: faseStd.giorni_rientro_previsti,
          modello_tariffa: faseStd.modello_tariffa,
          costo_tariffa_valore: faseStd.costo_tariffa_valore,
          costo_minimo_fornitura: faseStd.costo_minimo_fornitura,
          stato_esterna: faseStd.is_esterna ? 'in_attesa_uscita' : undefined
        }
      })

      const nuovoOdP: OrdineProduzione & { fasi: FaseOdP[] } = {
        id: nuovoOdpId,
        codice_odp: codiceOdp,
        riga_ordine_cliente_id: riga.id,
        ordine_cliente_id: ordine.id,
        codice_ordine_cliente: ordine.numero_ordine,
        riferimento_ordine_cliente: ordine.riferimento_ordine_cliente,
        pos_riga_cliente: riga.pos_riga_cliente,
        cliente_id: ordine.cliente_id,
        cliente_nome: ordine.cliente?.ragione_sociale,
        numero_riga_ordine: rigaIdx + 1,
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

      // Sincronizza tutti i nuovi OdP su Supabase
      tempOdpList.slice(0, countCreati).forEach((odp) => {
        syncService.salvaOrdineProduzione(odp)
      })

      const ordiniAggiornati = ordini.map((o) =>
        o.id === ordine.id ? { ...o, stato: 'in_produzione' as const } : o
      )
      setOrdini(ordiniAggiornati)
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))
      // Sincronizza stato su Supabase
      syncService.aggiornaStatoOrdineCliente(ordine.id, 'in_produzione')

      setNotifica(`Generati ${countCreati} OdP per l'ordine ${ordine.numero_ordine}! Tutti i pezzi sono ora in officina.`)
      setTimeout(() => setNotifica(null), 5000)
    } else {
      // Se erano già stati creati in precedenza, aggiorna lo stato dell'ordine
      const ordiniAggiornati = ordini.map((o) =>
        o.id === ordine.id ? { ...o, stato: 'in_produzione' as const } : o
      )
      setOrdini(ordiniAggiornati)
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))
      syncService.aggiornaStatoOrdineCliente(ordine.id, 'in_produzione')
      setNotifica(`L'ordine ${ordine.numero_ordine} è già interamente coperto da OdP in officina!`)
      setTimeout(() => setNotifica(null), 4000)
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
      const tempoStimatoTotale = faseStd.is_esterna
        ? (faseStd.giorni_rientro_previsti || 5) * 8 * 60
        : faseStd.tempo_attrezzaggio_min + (faseStd.tempo_ciclo_pezzo_min * riga.quantita)

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
        note_officina: faseStd.note_operative,
        preleva_materia_prima: faseStd.preleva_materia_prima,
        // Campi lavorazione esterna c/terzi
        is_esterna: faseStd.is_esterna,
        fornitore_nome: faseStd.fornitore_nome,
        giorni_rientro_previsti: faseStd.giorni_rientro_previsti,
        modello_tariffa: faseStd.modello_tariffa,
        costo_tariffa_valore: faseStd.costo_tariffa_valore,
        costo_minimo_fornitura: faseStd.costo_minimo_fornitura,
        stato_esterna: faseStd.is_esterna ? 'in_attesa_uscita' : undefined
      }
    })

    // 3. Crea l'OdP
    const rigaIdx = ordine.righe.findIndex((r) => r.id === riga.id)
    const nuovoOdP: OrdineProduzione & { fasi: FaseOdP[] } = {
      id: nuovoOdpId,
      codice_odp: codiceOdp,
      riga_ordine_cliente_id: riga.id,
      ordine_cliente_id: ordine.id,
      codice_ordine_cliente: ordine.numero_ordine,
      riferimento_ordine_cliente: ordine.riferimento_ordine_cliente,
      pos_riga_cliente: riga.pos_riga_cliente,
      cliente_id: ordine.cliente_id,
      cliente_nome: ordine.cliente?.ragione_sociale,
      numero_riga_ordine: rigaIdx >= 0 ? rigaIdx + 1 : 1,
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
    // Sincronizza su Supabase Cloud
    syncService.salvaOrdineProduzione(nuovoOdP)

    // 4. Aggiorna stato ordine a "in_produzione"
    const ordiniAggiornati = ordini.map((o) =>
      o.id === ordine.id ? { ...o, stato: 'in_produzione' as const } : o
    )
    setOrdini(ordiniAggiornati)
    localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))
    // Sincronizza stato su Supabase
    syncService.aggiornaStatoOrdineCliente(ordine.id, 'in_produzione')

    setNotifica(`Generato OdP ${codiceOdp} per ${riga.quantita} pz con ${fasiEsecutive.length} fasi di lavorazione!`)
    setTimeout(() => setNotifica(null), 5000)
  }

  // GESTIONE ANAGRAFICA CLIENTI
  const handleApriNuovoCliente = () => {
    setClienteInModifica(null)
    setFormCliente({
      ragione_sociale: '',
      partita_iva: '',
      email: '',
      telefono: '',
      indirizzo: ''
    })
    setModaleClienteAperta(true)
  }

  const handleApriModificaCliente = (c: Cliente) => {
    setClienteInModifica(c)
    setFormCliente({
      ragione_sociale: c.ragione_sociale,
      partita_iva: c.partita_iva || '',
      email: c.email || '',
      telefono: c.telefono || '',
      indirizzo: c.indirizzo || ''
    })
    setModaleClienteAperta(true)
  }

  const handleSalvaCliente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.ragione_sociale.trim()) return

    let aggiornati: Cliente[]
    if (clienteInModifica) {
      aggiornati = clienti.map((c) =>
        c.id === clienteInModifica.id
          ? { ...c, ...formCliente, ragione_sociale: formCliente.ragione_sociale.trim() }
          : c
      )
      setNotifica(`✓ Cliente "${formCliente.ragione_sociale}" aggiornato con successo!`)
    } else {
      const nuovoCliente: Cliente = {
        id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...formCliente,
        ragione_sociale: formCliente.ragione_sociale.trim(),
        creato_il: new Date().toISOString()
      }
      aggiornati = [nuovoCliente, ...clienti]
      setNotifica(`✓ Nuovo cliente "${nuovoCliente.ragione_sociale}" inserito con successo!`)
    }

    setClienti(aggiornati)
    localStorage.setItem('machinaflow_clienti', JSON.stringify(aggiornati))
    setModaleClienteAperta(false)
    setClienteInModifica(null)
    setTimeout(() => setNotifica(null), 4000)
  }

  const handleEliminaCliente = (id: string, ragioneSociale: string) => {
    const haOrdini = ordini.some((o) => o.cliente_id === id)
    if (haOrdini) {
      alert(`Impossibile eliminare "${ragioneSociale}": sono presenti commesse o ordini cliente associati a questo cliente.`)
      return
    }
    if (!confirm(`Sei sicuro di voler eliminare il cliente "${ragioneSociale}"?`)) return

    const filtrati = clienti.filter((c) => c.id !== id)
    setClienti(filtrati)
    localStorage.setItem('machinaflow_clienti', JSON.stringify(filtrati))
    setNotifica(`Cliente "${ragioneSociale}" rimosso dall'anagrafica.`)
    setTimeout(() => setNotifica(null), 3000)
  }

  const clientiFiltrati = useMemo(() => {
    if (!ricercaClienti.trim()) return clienti
    const q = ricercaClienti.toLowerCase()
    return clienti.filter(
      (c) =>
        c.ragione_sociale.toLowerCase().includes(q) ||
        (c.partita_iva && c.partita_iva.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.indirizzo && c.indirizzo.toLowerCase().includes(q))
    )
  }, [clienti, ricercaClienti])

  // Reset pagina al cambio filtro o ricerca
  useEffect(() => {
    setPaginaCards(1)
    setPaginaTabella(1)
  }, [filtroStato, termineRicerca])

  // Filtro
  const ordiniFiltrati = ordini.filter((o) => {
    const combaciaStato = filtroStato === 'tutti' || o.stato === filtroStato
    const matchNumeroOCliente =
      o.numero_ordine.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      (o.riferimento_ordine_cliente && o.riferimento_ordine_cliente.toLowerCase().includes(termineRicerca.toLowerCase())) ||
      (o.cliente && o.cliente.ragione_sociale.toLowerCase().includes(termineRicerca.toLowerCase()))
    
    const matchArticolo = o.righe.some((r) =>
      r.articolo && (
        r.articolo.codice_articolo.toLowerCase().includes(termineRicerca.toLowerCase()) ||
        r.articolo.descrizione.toLowerCase().includes(termineRicerca.toLowerCase())
      )
    )

    return combaciaStato && (matchNumeroOCliente || matchArticolo)
  })

  // 1. Paginazione per VISTA SCHEDE (Cards = Ordini Completi)
  const totaleOrdiniCards = ordiniFiltrati.length
  const totalePagineCards = Math.ceil(totaleOrdiniCards / ORDINI_PER_PAGINA_CARDS) || 1
  const inizioCards = (paginaCards - 1) * ORDINI_PER_PAGINA_CARDS
  const ordiniPaginatiCards = ordiniFiltrati.slice(inizioCards, inizioCards + ORDINI_PER_PAGINA_CARDS)

  // 2. Paginazione per VISTA TABELLA (Tabella = Righe Articolo Flattened)
  // Trasforma tutti gli ordini filtrati in un elenco lineare di righe articolo
  const tutteLeRigheFiltrate = ordiniFiltrati.flatMap((ordine) =>
    ordine.righe.map((riga, indexInOrdine) => ({
      ordine,
      riga,
      indexInOrdine,
      totaleRigheInOrdine: ordine.righe.length
    }))
  )
  const totaleRigheTabella = tutteLeRigheFiltrate.length
  const totalePagineTabella = Math.ceil(totaleRigheTabella / RIGHE_PER_PAGINA_TABELLA) || 1
  const inizioTabella = (paginaTabella - 1) * RIGHE_PER_PAGINA_TABELLA
  const righePaginateTabella = tutteLeRigheFiltrate.slice(inizioTabella, inizioTabella + RIGHE_PER_PAGINA_TABELLA)

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

      {/* Barra di Navigazione Tab */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setTabAttivo('ordini')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabAttivo === 'ordini'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Commesse & Ordini Clienti ({ordini.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAttivo('clienti')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabAttivo === 'clienti'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Anagrafica Clienti ({clienti.length})</span>
        </button>
      </div>

      {tabAttivo === 'ordini' ? (
        <>
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
            { id: 'pronto_spedizione', label: 'Pronti per Spedizione' },
            { id: 'parzialmente_evaso', label: 'Parzialmente Evasi' },
            { id: 'evaso', label: 'Evasi Completi' }
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

      {/* Elenco Ordini Clienti - Vista a Schede (Cards) con Fisarmonica e Paginazione */}
      {modalitaVista === 'cards' && (
        <div className="space-y-6">
          {ordiniPaginatiCards.map((ordine) => {
            const totaleCommessa = ordine.righe.reduce(
              (acc, r) => acc + r.quantita * (r.prezzo_unitario || 0),
              0
            )
            const righeSenzaOdP = ordine.righe.filter(
              (r) => !odpList.some((o) => o.riga_ordine_cliente_id === r.id)
            )

            const haMolteRighe = ordine.righe.length > 3
            const isEspanso = ordiniEspansiIds[ordine.id] ?? false
            const righeDaVisualizzare = haMolteRighe && !isEspanso ? ordine.righe.slice(0, 3) : ordine.righe

            return (
              <div
                key={ordine.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
              >
                {/* Intestazione Card Commessa */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-mono font-bold text-orange-400 bg-orange-950/80 px-3 py-0.5 rounded-lg border border-orange-500/20 inline-flex items-center gap-1.5">
                    <span>{ordine.numero_ordine}</span>
                    <button
                      type="button"
                      onClick={() => handleRichiediModificaOrdine(ordine)}
                      className="text-orange-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-orange-800/60"
                      title="Modifica Commessa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRichiediEliminaOrdine(ordine)}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-rose-950/60"
                      title="Elimina Ordine Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                      {ordine.riferimento_ordine_cliente && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1" title="Commessa / Riferimento Ordine Cliente">
                          <span className="text-[10px] text-emerald-300 font-sans uppercase">Rif. Cliente:</span>
                          {ordine.riferimento_ordine_cliente}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          ordine.stato === 'in_produzione'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : ordine.stato === 'pronto_spedizione'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse'
                            : ordine.stato === 'parzialmente_pronto'
                            ? 'bg-teal-950 text-teal-300 border border-teal-700'
                            : ordine.stato === 'parzialmente_evaso'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : ordine.stato === 'evaso'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {ordine.stato === 'pronto_spedizione'
                          ? '📦 PRONTO PER SPEDIZIONE'
                          : ordine.stato === 'parzialmente_pronto'
                          ? '⏳ PARZIALMENTE PRONTO'
                          : ordine.stato === 'parzialmente_evaso'
                          ? '🚚 PARZIALMENTE EVASO'
                          : ordine.stato.replace('_', ' ')}
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

                    {/* Calcola se questa commessa ha almeno un articolo con pezzi effettivamente pronti o stock da poter spedire */}
                    {(() => {
                      // Verifica se c'è almeno un pezzo pronto da OdP o da stock non ancora interamente spedito
                      const haPezziSpedibili = ordine.righe.some((riga) => {
                        // Calcola quanto già spedito per questa riga
                        let giaSpedito = 0
                        ddtClienti.forEach((doc) => {
                          doc.righe?.forEach((dr) => {
                            if (dr.riga_ordine_cliente_id === riga.id || (dr.ordine_cliente_id === ordine.id && dr.articolo_id === riga.articolo_id)) {
                              giaSpedito += dr.quantita_spedita
                            }
                          })
                        })

                        const residuoOrdine = Math.max(0, (riga.quantita || 0) - giaSpedito)
                        if (residuoOrdine <= 0) return false

                        // Trova OdP della riga
                        const odpDellaRiga = odpList.filter((o) =>
                          o.riga_ordine_cliente_id === riga.id ||
                          (o.ordine_cliente_id === ordine.id && o.articolo_id === riga.articolo_id)
                        )

                        // Pezzi finiti da OdP non ancora inclusi in DDT (spedibili SOLO se l'OdP ha concluso tutte le fasi)
                        const pezziProntiOdp = odpDellaRiga.reduce((acc, o) => {
                          const tutteChiuse = o.fasi && o.fasi.length > 0 && o.fasi.every((f) => f.stato === 'completata')
                          const isCompletato = o.stato === 'completato' || tutteChiuse
                          
                          // Se l'OdP è ancora in lavorazione o pianificato, i pezzi non sono pronti per la spedizione
                          if (!isCompletato || o.stato === 'spedito') return acc

                          const qtaProdotta = o.quantita_da_produrre || o.quantita_prodotta || 0
                          
                          // Calcola quanto di questo specifico OdP è già stato spedito in DDT
                          let qtaGiaSpeditaQuestoOdp = 0
                          ddtClienti.forEach((doc) => {
                            doc.righe?.forEach((dr) => {
                              if (dr.odp_id === o.id || dr.codice_odp === o.codice_odp) {
                                qtaGiaSpeditaQuestoOdp += dr.quantita_spedita
                              }
                            })
                          })

                          const rimanenzaQuestoOdp = Math.max(0, qtaProdotta - qtaGiaSpeditaQuestoOdp)
                          return acc + rimanenzaQuestoOdp
                        }, 0)

                        return pezziProntiOdp > 0
                      })

                      if (!haPezziSpedibili) return null

                      return (
                        <Link
                          href={`/spedizioni?clienteId=${ordine.cliente_id}`}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Emetti DDT Consegna Merci</span>
                        </Link>
                      )
                    })()}
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
                    {righeDaVisualizzare.map((riga) => {
                      // Trova tutti gli OdP associati a questa riga (inclusi sdoppiati /A, /B o ripristini /R)
                      const odpTrovatiPerRiga = odpList.filter((o) => {
                        if (o.riga_ordine_cliente_id === riga.id) return true
                        // Fallback per sotto-lotti sdoppiati che condividono il codice base
                        if (o.ordine_cliente_id === ordine.id && o.articolo_id === riga.articolo_id) return true
                        return false
                      })
                      const odpEsistente = odpTrovatiPerRiga[0] || null
                      const importoRiga = (riga.quantita || 0) * (riga.prezzo_unitario || 0)
                      const isSelected = righeSelezionate.includes(riga.id)

                      // Calcolo stato avanzamento e spedizione per la riga
                      let quantitaSpeditaRiga = 0
                      ddtClienti.forEach((doc) => {
                        doc.righe?.forEach((dr) => {
                          if (dr.riga_ordine_cliente_id === riga.id || (dr.ordine_cliente_id === ordine.id && dr.articolo_id === riga.articolo_id)) {
                            quantitaSpeditaRiga += dr.quantita_spedita
                          }
                        })
                      })

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

                          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-1.5 pl-7 sm:pl-0">
                            {odpTrovatiPerRiga.length > 0 ? (
                              odpTrovatiPerRiga.map((currOdp) => {
                                const fasiOdp = currOdp.fasi || []
                                const fasiChiuse = fasiOdp.filter((f) => f.stato === 'completata').length
                                const totFasi = fasiOdp.length
                                const tutteChiuse = totFasi > 0 && fasiChiuse === totFasi

                                // Trova il numero di DDT in cui è stato inserito questo OdP specifico o riga commessa
                                const ddtAssociati = ddtClienti.filter((doc) =>
                                  doc.righe?.some(
                                    (dr) =>
                                      dr.odp_id === currOdp.id ||
                                      dr.codice_odp === currOdp.codice_odp ||
                                      dr.riga_ordine_cliente_id === riga.id ||
                                      (dr.ordine_cliente_id === ordine.id && dr.articolo_id === riga.articolo_id)
                                  )
                                )
                                const numeriDdt = Array.from(new Set(ddtAssociati.map((d) => d.numero_ddt)))
                                const etichettaDdt = numeriDdt.length > 0 ? numeriDdt.join(', ') : 'DDT'

                                // Calcola quantità spedita specifica per questo OdP
                                let quantitaSpeditaQuestoOdp = 0
                                ddtClienti.forEach((doc) => {
                                  doc.righe?.forEach((dr) => {
                                    if (dr.odp_id === currOdp.id || dr.codice_odp === currOdp.codice_odp) {
                                      quantitaSpeditaQuestoOdp += dr.quantita_spedita
                                    }
                                  })
                                })

                                const isSpeditoQuestoOdp =
                                  currOdp.stato === 'spedito' ||
                                  (quantitaSpeditaQuestoOdp >= currOdp.quantita_da_produrre && quantitaSpeditaQuestoOdp > 0) ||
                                  (ddtAssociati.length > 0 && currOdp.codice_odp && ddtAssociati.some((d) => d.righe?.some((dr) => dr.codice_odp === currOdp.codice_odp)))
                                const isSpeditoRiga = quantitaSpeditaRiga >= riga.quantita && quantitaSpeditaRiga > 0
                                const isSpedito = isSpeditoQuestoOdp || isSpeditoRiga

                                let stileBadge = 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
                                let testoStato = 'In Lavorazione'
                                let iconaStato = '⚙️'

                                if (isSpedito) {
                                  stileBadge = 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/50'
                                  testoStato = `Spedito (${etichettaDdt})`
                                  iconaStato = '✓'
                                } else if (tutteChiuse || currOdp.stato === 'completato') {
                                  stileBadge = 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                                  testoStato = 'Pronto Spedizione'
                                  iconaStato = '✨'
                                } else if (fasiChiuse > 0 || currOdp.stato === 'in_lavorazione') {
                                  stileBadge = 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30'
                                  testoStato = totFasi > 0 ? `In Lav. (${fasiChiuse}/${totFasi})` : 'In Lavorazione'
                                  iconaStato = '⚙️'
                                } else if (currOdp.stato === 'pianificato') {
                                  stileBadge = 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                                  testoStato = 'Pianificato'
                                  iconaStato = '⏳'
                                }

                                return (
                                  <Link
                                    key={currOdp.id}
                                    href={`/produzione/${currOdp.id}`}
                                    className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-xs w-full sm:w-auto min-w-[210px] ${stileBadge}`}
                                    title={`Clicca per aprire la scheda di lavorazione di ${currOdp.codice_odp}`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span>{iconaStato}</span>
                                      <span className="font-mono">{currOdp.codice_odp}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-[11px] opacity-90">{testoStato}</span>
                                      <ArrowRight className="w-3 h-3 opacity-60" />
                                    </div>
                                  </Link>
                                )
                              })
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

                  {/* Pulsante Espansione / Chiusura Fisarmonica per ordini con molti articoli */}
                  {haMolteRighe && (
                    <div className="p-2.5 bg-slate-950/90 text-center border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => toggleEspandiOrdine(ordine.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-900"
                      >
                        {isEspanso ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span>Comprimi elenco (mostra solo i primi 3)</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Mostra tutti gli altri {ordine.righe.length - 3} articoli della commessa ▾</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
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

          {/* Paginazione Vista Schede (a 10 ordini per pagina) */}
          {totalePagineCards > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
              <div className="text-xs text-slate-400 font-semibold">
                Mostrati da <span className="text-white font-bold">{Math.min(inizioCards + 1, totaleOrdiniCards)}</span> a{' '}
                <span className="text-white font-bold">{Math.min(inizioCards + ORDINI_PER_PAGINA_CARDS, totaleOrdiniCards)}</span> di{' '}
                <span className="text-orange-400 font-bold">{totaleOrdiniCards}</span> commesse clienti
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaCards((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaCards === 1}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Precedenti</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-orange-400">
                  Pagina {paginaCards} / {totalePagineCards}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaCards((prev) => Math.min(prev + 1, totalePagineCards))}
                  disabled={paginaCards === totalePagineCards}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-600/30"
                >
                  <span>Successivi 10</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Elenco Ordini Clienti - Vista a Lista (Tabella Paginata per Righe Articolo) */}
      {modalitaVista === 'tabella' && (
        <div className="space-y-4">
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
                          righePaginateTabella.filter(({ riga }) => !odpList.some((o) => o.riga_ordine_cliente_id === riga.id)).length > 0 &&
                          righePaginateTabella.filter(({ riga }) => !odpList.some((o) => o.riga_ordine_cliente_id === riga.id)).every(({ riga }) => righeSelezionate.includes(riga.id))
                        }
                        className="w-4 h-4 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer"
                        title="Seleziona/Deseleziona tutti gli articoli visibili in questa pagina pronti al lancio"
                      />
                    </th>
                    <th className="py-3 px-3">N. Ordine</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Codice & Articolo</th>
                    <th className="py-3 px-2.5 text-center">Quantità</th>
                    <th className="py-3 px-2.5 text-right">Prezzo Unit.</th>
                    <th className="py-3 px-2.5 text-right">Totale Riga</th>
                    <th className="py-3 px-3 text-center">Consegna</th>
                    <th className="py-3 px-2.5 text-center">Stato</th>
                    <th className="py-3 px-3 text-center">Azione OdP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {righePaginateTabella.map(({ ordine, riga, indexInOrdine }) => {
                    // Trova tutti gli OdP associati a questa riga (inclusi sdoppiati /A, /B o ripristini /R)
                    const odpTrovatiPerRiga = odpList.filter((o) => {
                      if (o.riga_ordine_cliente_id === riga.id) return true
                      if (o.ordine_cliente_id === ordine.id && o.articolo_id === riga.articolo_id) return true
                      return false
                    })
                    const odpEsistente = odpTrovatiPerRiga[0] || null
                    const totaleImportoRiga = (riga.quantita || 0) * (riga.prezzo_unitario || 0)
                    const isFirstRowOfOrder = indexInOrdine === 0
                    const isSelected = righeSelezionate.includes(riga.id)

                    // Calcolo quantità spedita per la riga
                    let quantitaSpeditaRiga = 0
                    ddtClienti.forEach((doc) => {
                      doc.righe?.forEach((dr) => {
                        if (dr.riga_ordine_cliente_id === riga.id || (dr.ordine_cliente_id === ordine.id && dr.articolo_id === riga.articolo_id)) {
                          quantitaSpeditaRiga += dr.quantita_spedita
                        }
                      })
                    })

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
                        <td className="py-2.5 px-3 text-center">
                          {!odpEsistente ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelezioneRiga(riga.id)}
                              className="w-4 h-4 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-600 font-bold" title="OdP già lanciato">✓</span>
                          )}
                        </td>

                        {/* Numero Ordine */}
                        <td className="py-2.5 px-3 font-mono font-bold text-orange-400 whitespace-nowrap">
                          {isFirstRowOfOrder ? (
                            <div>
                            <div className="flex items-center gap-1.5">
                              <span>{ordine.numero_ordine}</span>
                              <button
                                type="button"
                                onClick={() => handleRichiediModificaOrdine(ordine)}
                                className="text-orange-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-800"
                                title="Modifica Commessa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRichiediEliminaOrdine(ordine)}
                                className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-800"
                                title="Elimina Ordine Cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="block text-[10px] text-slate-500 font-sans font-normal">
                              {ordine.righe.length} art.
                            </span>
                          </div>
                          ) : (
                            <span className="text-slate-600 text-[10px] font-mono">↳ {ordine.numero_ordine}</span>
                          )}
                        </td>

                        {/* Cliente */}
                        <td className="py-2.5 px-3 font-medium text-white max-w-[170px]">
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
                        <td className="py-2.5 px-3">
                          {riga.articolo ? (
                            <div className="space-y-0.5">
                              <span className="font-mono font-semibold text-white block">
                                {riga.articolo.codice_articolo}
                              </span>
                              <span className="text-[11px] text-slate-400 line-clamp-1" title={riga.articolo.descrizione}>
                                {riga.articolo.descrizione}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* Quantità */}
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <span className="font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
                            {riga.quantita} {riga.articolo?.unita_misura || 'pz'}
                          </span>
                        </td>

                        {/* Prezzo Unitario */}
                        <td className="py-2.5 px-2.5 text-right font-mono text-slate-300 whitespace-nowrap">
                          € {riga.prezzo_unitario?.toFixed(2) || '0.00'}
                        </td>

                        {/* Totale Riga */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                          € {totaleImportoRiga.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Scadenza */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isFirstRowOfOrder ? (
                            <div className="inline-flex items-center gap-1 text-slate-300 font-medium">
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
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
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
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {odpTrovatiPerRiga.length > 0 ? (
                            <div className="flex flex-col items-center justify-center gap-1">
                              {odpTrovatiPerRiga.map((currOdp) => {
                                const fasiOdp = currOdp.fasi || []
                                const fasiChiuse = fasiOdp.filter((f) => f.stato === 'completata').length
                                const totFasi = fasiOdp.length
                                const tutteChiuse = totFasi > 0 && fasiChiuse === totFasi

                                // Trova il numero di DDT per la vista tabellare
                                const ddtAssociatiTab = ddtClienti.filter((doc) =>
                                  doc.righe?.some(
                                    (dr) =>
                                      dr.odp_id === currOdp.id ||
                                      dr.codice_odp === currOdp.codice_odp ||
                                      dr.riga_ordine_cliente_id === riga.id ||
                                      (dr.ordine_cliente_id === ordine.id && dr.articolo_id === riga.articolo_id)
                                  )
                                )
                                const numeriDdtTab = Array.from(new Set(ddtAssociatiTab.map((d) => d.numero_ddt)))
                                const etichettaDdtTab = numeriDdtTab.length > 0 ? numeriDdtTab.join(', ') : 'DDT'

                                // Calcola quantità spedita specifica per questo OdP
                                let quantitaSpeditaQuestoOdpTab = 0
                                ddtClienti.forEach((doc) => {
                                  doc.righe?.forEach((dr) => {
                                    if (dr.odp_id === currOdp.id || dr.codice_odp === currOdp.codice_odp) {
                                      quantitaSpeditaQuestoOdpTab += dr.quantita_spedita
                                    }
                                  })
                                })

                                const isSpeditoQuestoOdpTab =
                                  currOdp.stato === 'spedito' ||
                                  (quantitaSpeditaQuestoOdpTab >= currOdp.quantita_da_produrre && quantitaSpeditaQuestoOdpTab > 0) ||
                                  (ddtAssociatiTab.length > 0 && currOdp.codice_odp && ddtAssociatiTab.some((d) => d.righe?.some((dr) => dr.codice_odp === currOdp.codice_odp)))
                                const isSpeditoRigaTab = quantitaSpeditaRiga >= riga.quantita && quantitaSpeditaRiga > 0
                                const isSpedito = isSpeditoQuestoOdpTab || isSpeditoRigaTab

                                let stileBadge = 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
                                let testoStato = 'In Lavorazione'
                                let iconaStato = '⚙️'

                                if (isSpedito) {
                                  stileBadge = 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/50'
                                  testoStato = `Spedito (${etichettaDdtTab})`
                                  iconaStato = '✓'
                                } else if (tutteChiuse || currOdp.stato === 'completato') {
                                  stileBadge = 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                                  testoStato = 'Pronto'
                                  iconaStato = '✨'
                                } else if (fasiChiuse > 0 || currOdp.stato === 'in_lavorazione') {
                                  stileBadge = 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30'
                                  testoStato = totFasi > 0 ? `${fasiChiuse}/${totFasi}` : 'In corso'
                                  iconaStato = '⚙️'
                                } else if (currOdp.stato === 'pianificato') {
                                  stileBadge = 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                                  testoStato = 'Pianificato'
                                  iconaStato = '⏳'
                                }

                                return (
                                  <Link
                                    key={currOdp.id}
                                    href={`/produzione/${currOdp.id}`}
                                    className={`inline-flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all min-w-[170px] ${stileBadge}`}
                                    title={`OdP: ${currOdp.codice_odp} - ${testoStato}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span>{iconaStato}</span>
                                      <span className="font-mono">{currOdp.codice_odp}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold text-[10px] opacity-85">{testoStato}</span>
                                      <ArrowRight className="w-3 h-3 opacity-60" />
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
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
                  })}

                  {totaleRigheTabella === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Nessun articolo o ordine cliente trovato corrispondente ai filtri.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginazione Vista Tabella (a 25 righe articolo per pagina) */}
          {totalePagineTabella > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
              <div className="text-xs text-slate-400 font-semibold">
                Mostrati da <span className="text-white font-bold">{Math.min(inizioTabella + 1, totaleRigheTabella)}</span> a{' '}
                <span className="text-white font-bold">{Math.min(inizioTabella + RIGHE_PER_PAGINA_TABELLA, totaleRigheTabella)}</span> di{' '}
                <span className="text-orange-400 font-bold">{totaleRigheTabella}</span> articoli in commessa
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaTabella((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaTabella === 1}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Precedenti</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-orange-400">
                  Pagina {paginaTabella} / {totalePagineTabella}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaTabella((prev) => Math.min(prev + 1, totalePagineTabella))}
                  disabled={paginaTabella === totalePagineTabella}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-600/30"
                >
                  <span>Successivi 25</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      ) : (
        /* =========================================================================
           TAB 2: ANAGRAFICA CLIENTI
           ========================================================================= */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca cliente per ragione sociale, P.IVA, email o città..."
                value={ricercaClienti}
                onChange={(e) => setRicercaClienti(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={handleApriNuovoCliente}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-orange-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Cliente</span>
            </button>
          </div>

          {/* Griglia Schede Clienti */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientiFiltrati.map((c: Cliente) => {
              const commesseCliente = ordini.filter((o) => o.cliente_id === c.id)
              const attive = commesseCliente.filter((o) => o.stato === 'in_produzione' || o.stato === 'confermato').length

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition-all shadow-xl space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white leading-tight">
                            {c.ragione_sociale}
                          </h3>
                          {c.partita_iva && (
                            <span className="font-mono text-[10px] text-slate-400 block">
                              P.IVA: {c.partita_iva}
                            </span>
                          )}
                        </div>
                      </div>

                      {attive > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {attive} in corso
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {commesseCliente.length} commesse
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                      {c.indirizzo && (
                        <div className="flex items-start gap-2 text-[11px] text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>{c.indirizzo}</span>
                        </div>
                      )}
                      {c.telefono && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{c.telefono}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleApriModificaCliente(c)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Modifica anagrafica cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminaCliente(c.id, c.ragione_sociale)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs cursor-pointer transition-colors"
                      title="Elimina cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            {clientiFiltrati.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                Nessun cliente trovato con i criteri di ricerca.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALE INSERIMENTO / MODIFICA CLIENTE */}
      {modaleClienteAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border-2 border-orange-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-orange-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {clienteInModifica ? 'Modifica Cliente' : 'Nuovo Cliente'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Anagrafica cliente per emissione commesse e fatturazione
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModaleClienteAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaCliente} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ragione Sociale Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Brembo S.p.A."
                  value={formCliente.ragione_sociale}
                  onChange={(e) => setFormCliente({ ...formCliente, ragione_sociale: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Partita IVA / Codice Fiscale
                </label>
                <input
                  type="text"
                  placeholder="IT01234567890"
                  value={formCliente.partita_iva}
                  onChange={(e) => setFormCliente({ ...formCliente, partita_iva: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Indirizzo Sede Legale / Stabilimento
                </label>
                <input
                  type="text"
                  placeholder="Via delle Industrie 10, 24040 Stezzano (BG)"
                  value={formCliente.indirizzo}
                  onChange={(e) => setFormCliente({ ...formCliente, indirizzo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Telefono / Ufficio Acquisti
                  </label>
                  <input
                    type="text"
                    placeholder="+39 035 ..."
                    value={formCliente.telefono}
                    onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Email Invio Conferme / Ordini
                  </label>
                  <input
                    type="email"
                    placeholder="ordini@cliente.it"
                    value={formCliente.email}
                    onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModaleClienteAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase shadow-md shadow-orange-600/30 transition-all cursor-pointer active:scale-95"
                >
                  {clienteInModifica ? 'Salva Modifiche' : 'Registra Cliente'}
                </button>
              </div>
            </form>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ns. Ordine Interno *
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
                  <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center justify-between">
                    <span>Commessa Cliente (Rif. Esterno)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Es: BR2524, PO-9988..."
                    value={formOrdine.riferimento_ordine_cliente}
                    onChange={(e) => setFormOrdine({ ...formOrdine, riferimento_ordine_cliente: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-900/60 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
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
                          { pos_riga_cliente: String(formOrdine.righe.length + 1), articolo_id: '', quantita: 2, prezzo_unitario: 350 }
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
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-emerald-400 mb-0.5">Item/Pos. Cliente</label>
                          <input
                            type="text"
                            placeholder="es. 1, 10"
                            value={riga.pos_riga_cliente || ''}
                            onChange={(e) => {
                              const nuoveRighe = [...formOrdine.righe]
                              nuoveRighe[index].pos_riga_cliente = e.target.value
                              setFormOrdine({ ...formOrdine, righe: nuoveRighe })
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-emerald-900/70 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-5">
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

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Prezzo (€)</label>
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
                    {ordineInModifica ? 'Salva Modifiche Commessa' : 'Registra Commessa Multi-Articolo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE AUTORIZZAZIONE PIN SUPERVISORE PER MODIFICA / ELIMINAZIONE ORDINE */}
      {modalePinModificaAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  azionePin === 'elimina' ? 'bg-rose-600/20 text-rose-400' : 'bg-orange-600/20 text-orange-400'
                }`}>
                  {azionePin === 'elimina' ? <Trash2 className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {azionePin === 'elimina' ? 'Eliminazione Commessa' : 'Accesso Ufficio / Supervisore'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {azionePin === 'elimina' ? 'Conferma eliminazione' : 'Modifica'} {ordineTargetPerPin?.numero_ordine}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalePinModificaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfermaPinModifica} className="p-5 space-y-4">
              <p className="text-xs text-slate-300">
                {azionePin === 'elimina'
                  ? "L'eliminazione della commessa rimuoverà l'ordine e gli OdP pianificati collegati. Inserisci il PIN per confermare:"
                  : "La modifica di una commessa è riservata all'Ufficio Tecnico o al Capo Officina. Inserisci il PIN:"}
              </p>

              <div>
                <input
                  type="password"
                  autoFocus
                  maxLength={4}
                  placeholder="••••"
                  value={pinInserito}
                  onChange={(e) => {
                    setPinInserito(e.target.value)
                    setPinErrore(false)
                  }}
                  className={`w-full text-center text-2xl tracking-[0.5em] py-2.5 rounded-xl bg-slate-950 border text-white font-mono focus:outline-none ${
                    azionePin === 'elimina' ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {pinErrore && (
                  <p className="text-rose-400 text-xs text-center mt-1.5 font-semibold">
                    PIN errato. Inserisci il PIN Supervisore (1234 o 2026).
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalePinModificaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs uppercase cursor-pointer shadow-md ${
                    azionePin === 'elimina'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                  }`}
                >
                  {azionePin === 'elimina' ? 'Conferma Eliminazione' : 'Autorizza Modifica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
