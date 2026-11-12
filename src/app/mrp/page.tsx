'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  Clock,
  Printer,
  Download,
  PlusCircle,
  Truck,
  Plus,
  RotateCcw,
  Search,
  Check,
  Lock,
  X,
  Mail,
  Copy,
  ExternalLink,
  FileText,
  Trash2
} from 'lucide-react'
import {
  Articolo,
  ComponenteDistintaBase,
  OrdineProduzione,
  FaseOdP,
  OrdineFornitore,
  FornitoreTerzista,
  RigaOrdineFornitore
} from '@/types/database'
import SelettoreFornitoriMultiplo from '@/components/SelettoreFornitoriMultiplo'
import SelettoreFornitoreRicerca from '@/components/SelettoreFornitoreRicerca'
import SchedaOdAStampabile from '@/components/SchedaOdAStampabile'
import {
  SEED_ARTICOLI,
  SEED_DISTINTA_BASE,
  SEED_ODP
} from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

interface RigaMRP {
  componente: Articolo
  fabbisognoLordo: number
  giacenzaAttuale: number
  scortaMinima: number
  fabbisognoNetto: number // Mancante totale (inclusa scorta minima)
  mancanteProduzione: number // Mancante effettivo per gli OdP (esclusa scorta minima)
  quantitaInArrivo: number // Ordini aperti verso fornitori
  ordiniFornitoreAperti: OrdineFornitore[]
  stato: 'critico' | 'in_arrivo' | 'attenzione' | 'sufficiente'
  ordiniCoinvolti: string[]
  dataLimiteProduzione?: string // Data primo avvio OdP in officina (Per Quando)
  giorniRimanenti?: number // Giorni rimasti per negoziare e ricevere il materiale
  inRitardoConsegna?: boolean // Vero se il materiale non è a terra e la data prevista di arrivo supera la data OdP o è scaduta
  dataArrivoPrevistaFornitore?: string // Data promessa di consegna dal fornitore
  valoreStimatoAcquisto?: number // Stima economica (€) per trattativa
}

export default function MRPPage() {
  const [righeMrp, setRigheMrp] = useState<RigaMRP[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [distinte, setDistinte] = useState<ComponenteDistintaBase[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi: FaseOdP[] })[]>([])
  const [ordiniFornitori, setOrdiniFornitori] = useState<OrdineFornitore[]>([])
  const [filtroRicerca, setFiltroRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'critico' | 'in_arrivo' | 'sufficiente'>('tutti')
  const [paginaCorrente, setPaginaCorrente] = useState(1)
  const [elementiPerPagina, setElementiPerPagina] = useState<number>(15)

  // Stato Modale Ordine a Fornitore (Anti-Doppio Ordine & Trattativa)
  const [modaleOrdineAperta, setModaleOrdineAperta] = useState(false)
  const [aggiornaPrezzoArticolo, setAggiornaPrezzoArticolo] = useState(true)
  const [righeOrdineMultiplo, setRigheOrdineMultiplo] = useState<{
    articolo_id: string
    codice_articolo: string
    descrizione: string
    unita_misura: string
    quantita_ordinata: number
    quantita_teorica: number
    prezzo_unitario: number
    odp_coinvolti_stringa: string
    data_limite_richiesta: string
  }[]>([])
  const [formOrdineFornitore, setFormOrdineFornitore] = useState({
    articolo_id: '',
    nome_materiale: '',
    unita_misura: 'm',
    prezzo_unitario: 0,
    quantita_ordinata: 10,
    quantita_teorica: 10,
    fornitore_nome: 'Rodacciai S.p.A.',
    data_arrivo_prevista: '',
    data_limite_richiesta: '',
    odp_coinvolti_stringa: '',
    note: ''
  })

  // Stato Modale Modifica/Sollecito Ordine Fornitore
  const [modaleSollecitoAperta, setModaleSollecitoAperta] = useState(false)
  const [ordineInModifica, setOrdineInModifica] = useState<OrdineFornitore | null>(null)
  const [formSollecito, setFormSollecito] = useState({
    data_arrivo_prevista: '',
    fornitore_nome: '',
    quantita_ordinata: 0,
    note: ''
  })

  // Stato Modale Carico Merce Rapido
  const [modaleCaricoAperta, setModaleCaricoAperta] = useState(false)
  const [ordineFornitoreInRicezioneId, setOrdineFornitoreInRicezioneId] = useState<string | null>(null)
  const [ordiniFornitoreDisponibiliArticolo, setOrdiniFornitoreDisponibiliArticolo] = useState<OrdineFornitore[]>([])
  const [altriMaterialiFornitoreSelezionati, setAltriMaterialiFornitoreSelezionati] = useState<{
    ordine_id: string
    articolo_id: string
    codice_articolo: string
    descrizione: string
    unita_misura: string
    quantita_ordinata: number
    quantita_entrata: number
    selezionato: boolean
    numero_oda?: string
  }[]>([])
  const [ricercaMaterialeCarico, setRicercaMaterialeCarico] = useState('')
  const [formCarico, setFormCarico] = useState({
    articolo_id: '',
    quantita_entrata: 10,
    ddt_riferimento: '',
    fornitore_nome: '',
    note: ''
  })
  const [notificaCarico, setNotificaCarico] = useState<string | null>(null)
  const [dataStampa, setDataStampa] = useState('')
  const [codiceDocStampa, setCodiceDocStampa] = useState('MRP-2026')

  // Anagrafica Fornitori caricata
  const [fornitoriDisponibili, setFornitoriDisponibili] = useState<FornitoreTerzista[]>([])

  // Selezione Multipla Materiali per Richiesta Preventivo / Ordine
  const [materialiSelezionatiIds, setMaterialiSelezionatiIds] = useState<string[]>([])

  // Stato Modale Richiesta Preventivo Email (Multi-Materiale)
  const [modalePreventivoAperta, setModalePreventivoAperta] = useState(false)
  const [fornitoriPreventivoSelezionati, setFornitoriPreventivoSelezionati] = useState<{ id?: string; nome: string; email: string }[]>([])
  const [testoNotaRichiesta, setTestoNotaRichiesta] = useState(
    'Gentile Fornitore, vi chiediamo cortesemente la vostra migliore offerta di prezzo e tempi di consegna per i seguenti materiali:'
  )
  const [vociPreventivo, setVociPreventivo] = useState<{
    articolo_id: string
    codice_articolo: string
    descrizione: string
    unita_misura: string
    fabbisognoCalcolato: number
    quantitaDaChiedere: number
    dataRichiesta?: string
  }[]>([])
  const [materialiInPreventivoIds, setMaterialiInPreventivoIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('machinaflow_materiali_in_preventivo')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Stato Visualizzazione / Stampa Documento OdA A4
  const [odaInVisualizzazione, setOdaInVisualizzazione] = useState<OrdineFornitore | null>(null)

  // Reset pagina corrente quando cambiano ricerca, filtri o elementi per pagina
  useEffect(() => {
    setPaginaCorrente(1)
  }, [filtroRicerca, filtroStato, elementiPerPagina])

  // Blocca lo scroll del body quando una modale è aperta
  useEffect(() => {
    if (modaleCaricoAperta || modaleOrdineAperta || modaleSollecitoAperta) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modaleCaricoAperta, modaleOrdineAperta, modaleSollecitoAperta])

  useEffect(() => {
    const oggi = new Date()
    setDataStampa(
      oggi.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    )
    setCodiceDocStampa(`MRP-${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}`)
  }, [])

  const ricalcolaMrp = (
    articoliList: Articolo[],
    distinteList: ComponenteDistintaBase[],
    odpCaricati: (OrdineProduzione & { fasi: FaseOdP[] })[],
    ordiniFornitoreList?: OrdineFornitore[]
  ) => {
    // =========================================================================
    // CALCOLO MRP (FABBISOGNO MATERIALI)
    // Esclude OdP completati, spediti o con MATERIA PRIMA GIÀ SCARICATA da magazzino
    // =========================================================================
    const odpConFabbisogno = odpCaricati.filter((o) => {
      if (o.stato === 'completato' || o.stato === 'spedito' || o.stato === 'scartato') return false
      // Se la materia prima è già stata scaricata/prelevata esplicitamente:
      if (o.materia_prima_scaricata || o.data_scarico_materia_prima) return false

      // Controllo di robustezza operativa: se l'OdP ha già avviato o completato la fase designata al prelievo
      // (o una qualsiasi lavorazione fisica successiva al CAD/CAM), il materiale è già stato prelevato dal magazzino
      const haAvviatoFaseFisica = o.fasi?.some((f) => {
        const isCadCam = f.centro_lavoro_id === 'mc-cam-01' || f.nome_fase.toLowerCase().includes('cam')
        const preleva = f.preleva_materia_prima === true || (!isCadCam && f.preleva_materia_prima === undefined)
        return preleva && (f.stato === 'in_corso' || f.stato === 'completata')
      })
      if (haAvviatoFaseFisica) return false

      return true
    })

    const accumulatoreFabbisogni: Record<
      string,
      { qtaLorda: number; odpCodes: Set<string>; dateInizio: string[] }
    > = {}

    odpConFabbisogno.forEach((odp) => {
      const componentiBom = distinteList.filter((d) => d.articolo_padre_id === odp.articolo_id)
      const dataOdP = odp.data_inizio_pianificata || odp.data_fine_pianificata || null

      componentiBom.forEach((comp) => {
        const fabbisognoOdP = comp.quantita_necessaria * odp.quantita_da_produrre
        if (!accumulatoreFabbisogni[comp.articolo_componente_id]) {
          accumulatoreFabbisogni[comp.articolo_componente_id] = {
            qtaLorda: 0,
            odpCodes: new Set(),
            dateInizio: []
          }
        }
        accumulatoreFabbisogni[comp.articolo_componente_id].qtaLorda += fabbisognoOdP
        accumulatoreFabbisogni[comp.articolo_componente_id].odpCodes.add(odp.codice_odp)
        if (dataOdP) {
          accumulatoreFabbisogni[comp.articolo_componente_id].dateInizio.push(dataOdP)
        }
      })
    })

    const materiePrime = articoliList.filter((a) => a.tipo !== 'prodotto_finito')
    const ordiniFornitoreSalvati: OrdineFornitore[] = ordiniFornitoreList || (() => {
      try {
        const item = localStorage.getItem('machinaflow_ordini_fornitori')
        return item ? JSON.parse(item) : []
      } catch {
        return []
      }
    })()

    const risultatiMrp: RigaMRP[] = materiePrime.map((materia) => {
      const infoFabbisogno = accumulatoreFabbisogni[materia.id] || { qtaLorda: 0, odpCodes: new Set(), dateInizio: [] }
      const fabbisognoLordo = Number(infoFabbisogno.qtaLorda.toFixed(3))
      const giacenzaAttuale = materia.giacenza_attuale
      const scortaMinima = materia.scorta_minima

      // Data limite: la data più ravvicinata tra gli OdP che richiedono questo materiale
      const dateInizioValide = (infoFabbisogno.dateInizio || []).filter(Boolean).sort()
      const dataLimite = dateInizioValide.length > 0 ? dateInizioValide[0] : undefined

      let giorniRimanenti: number | undefined = undefined
      if (dataLimite) {
        const oggi = new Date()
        oggi.setHours(0, 0, 0, 0)
        const target = new Date(dataLimite)
        target.setHours(0, 0, 0, 0)
        const diffMs = target.getTime() - oggi.getTime()
        giorniRimanenti = Math.round(diffMs / (1000 * 60 * 60 * 24))
      }

      // Calcola gli ordini fornitore già aperti (in arrivo) per questa materia prima
      // Gestisce sia ordini a riga singola che ordini multi-riga cumulativi
      const aperti: OrdineFornitore[] = []
      let quantitaInArrivo = 0

      ordiniFornitoreSalvati.forEach((o) => {
        if (o.stato === 'in_ordine') {
          if (o.righe && o.righe.length > 0) {
            const rigaMatch = o.righe.find((r) => r.articolo_id === materia.id)
            if (rigaMatch) {
              aperti.push(o)
              quantitaInArrivo += rigaMatch.quantita_ordinata
            }
          } else if (o.articolo_id === materia.id) {
            aperti.push(o)
            quantitaInArrivo += o.quantita_ordinata
          }
        }
      })

      // Formula MRP reale: Fabbisogno Netto = Fabbisogno Lordo + Scorta Minima - Giacenza - Quantità già ordinata
      const nettoCalcolato = Math.max(0, fabbisognoLordo + scortaMinima - giacenzaAttuale - quantitaInArrivo)
      // Mancante effettivo per la sola produzione degli OdP attivi
      const mancanteProduzione = Math.max(0, fabbisognoLordo - giacenzaAttuale - quantitaInArrivo)

      let stato: 'critico' | 'in_arrivo' | 'attenzione' | 'sufficiente' = 'sufficiente'
      if (mancanteProduzione > 0) {
        // Manca materiale indispensabile per produrre gli OdP
        stato = 'critico'
      } else if (quantitaInArrivo > 0 && giacenzaAttuale < fabbisognoLordo) {
        // La produzione era scoperta ma il materiale in arrivo la copre per intero
        stato = 'in_arrivo'
      } else if (nettoCalcolato > 0) {
        // La produzione è coperta, ma si scende sotto la scorta minima di sicurezza
        stato = quantitaInArrivo > 0 ? 'in_arrivo' : 'attenzione'
      }

      // Data prevista di arrivo dal fornitore (la più imminente tra gli ordini aperti)
      const dateArrivoValide = aperti.map((o) => o.data_arrivo_prevista).filter(Boolean).sort()
      const dataArrivoPrevistaFornitore = dateArrivoValide.length > 0 ? dateArrivoValide[0] : undefined

      // Verifica se c'è un ritardo rispetto alla produzione:
      // Se il materiale a magazzino non basta a coprire gli OdP (giacenzaAttuale < fabbisognoLordo)
      // e o la data di inizio OdP è già passata, oppure la data promessa dal fornitore è successiva alla data limite dell'OdP
      let inRitardoConsegna = false
      if (fabbisognoLordo > giacenzaAttuale) {
        if (dataLimite) {
          const oggiIso = new Date().toISOString().split('T')[0]
          if (dataLimite < oggiIso) {
            inRitardoConsegna = true // La produzione doveva già essere partita!
          } else if (dataArrivoPrevistaFornitore && dataArrivoPrevistaFornitore > dataLimite) {
            inRitardoConsegna = true // Il camion arriverà dopo la data in cui serve all'officina!
          }
        }
      }

      // Valore economico stimato per trattativa acquisto (€)
      const prezzoUnitario = materia.prezzo_riferimento || 0
      const qtaDaComprare = nettoCalcolato > 0 ? nettoCalcolato : 0
      const valoreStimatoAcquisto = Number((qtaDaComprare * prezzoUnitario).toFixed(2))

      return {
        componente: materia,
        fabbisognoLordo,
        giacenzaAttuale,
        scortaMinima,
        fabbisognoNetto: Number(nettoCalcolato.toFixed(3)),
        mancanteProduzione: Number(mancanteProduzione.toFixed(3)),
        quantitaInArrivo,
        ordiniFornitoreAperti: aperti,
        stato,
        ordiniCoinvolti: Array.from(infoFabbisogno.odpCodes),
        dataLimiteProduzione: dataLimite,
        giorniRimanenti,
        inRitardoConsegna,
        dataArrivoPrevistaFornitore,
        valoreStimatoAcquisto
      }
    })

    risultatiMrp.sort((a, b) => {
      const priorita = { critico: 0, attenzione: 1, in_arrivo: 2, sufficiente: 3 }
      return priorita[a.stato] - priorita[b.stato]
    })

    setRigheMrp(risultatiMrp)
  }

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

    const azIsolata = syncService.isAziendaClienteIsolata ? syncService.isAziendaClienteIsolata() : false

    const distinteLocali = parseSicuro<ComponenteDistintaBase[]>('machinaflow_distinte', azIsolata ? [] : SEED_DISTINTA_BASE)
    setDistinte(distinteLocali)

    const fornitoriLocali = parseSicuro<FornitoreTerzista[]>('machinaflow_fornitori_terzisti', [])
    setFornitoriDisponibili(fornitoriLocali)
    syncService.getFornitoriTerzisti().then((fCloud) => {
      if (fCloud && fCloud.length > 0) setFornitoriDisponibili(fCloud)
    })

    const ordiniFornitoreCaricati = parseSicuro<OrdineFornitore[]>('machinaflow_ordini_fornitori', [])
    setOrdiniFornitori(ordiniFornitoreCaricati)

    const caricaDatiRealtime = async () => {
      // 1. Carica prima dalla cache locale per reattività immediata
      const articoliLocali = parseSicuro<Articolo[]>('machinaflow_articoli', azIsolata ? [] : SEED_ARTICOLI)
      const odpLocali = parseSicuro<(OrdineProduzione & { fasi: FaseOdP[] })[]>('machinaflow_odp', azIsolata ? [] : SEED_ODP)
      setArticoli(articoliLocali)
      setOdpList(odpLocali)
      ricalcolaMrp(articoliLocali, distinteLocali, odpLocali, ordiniFornitoreCaricati)

      // 2. Allinea con Supabase Cloud in background
      try {
        const [articoliCloud, odpCloud, fornitoriCloud, distinteCloud] = await Promise.all([
          syncService.getArticoli(),
          syncService.getOrdiniProduzione(),
          syncService.getOrdiniFornitori(),
          syncService.getDistinte()
        ])
        const articoliEffettivi = articoliCloud && articoliCloud.length > 0 ? articoliCloud : (azIsolata ? [] : articoliLocali)
        const odpEffettivi = odpCloud && odpCloud.length > 0 ? (odpCloud as (OrdineProduzione & { fasi: FaseOdP[] })[]) : (azIsolata ? [] : odpLocali)
        const distinteEffettive = distinteCloud && distinteCloud.length > 0 ? distinteCloud : distinteLocali
        setDistinte(distinteEffettive)
        
        // Auto-push verso Cloud per eventuali ordini fornitore creati offline o in locale
        const idCloud = new Set((fornitoriCloud || []).map((f) => f.id))
        const localiDaInviare = ordiniFornitoreCaricati.filter((f) => !idCloud.has(f.id))
        if (localiDaInviare.length > 0) {
          for (const ord of localiDaInviare) {
            syncService.salvaOrdineFornitore(ord)
          }
        }

        // Unisci ordini fornitore cloud e locali
        const mappaForn = new Map<string, OrdineFornitore>()
        ordiniFornitoreCaricati.forEach((o) => mappaForn.set(o.id, o))
        ;(fornitoriCloud || []).forEach((o) => mappaForn.set(o.id, o))
        const fornitoriEffettivi = Array.from(mappaForn.values())

        setArticoli(articoliEffettivi)
        setOdpList(odpEffettivi)
        setOrdiniFornitori(fornitoriEffettivi)
        localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(fornitoriEffettivi))

        // Ricava anche l'elenco sincronizzato dei materiali con preventivo attivo da Supabase
        const idsInPreventivoCloud: string[] = []
        fornitoriEffettivi.forEach((o) => {
          if (o.stato === 'in_preventivo') {
            if (o.righe && o.righe.length > 0) {
              o.righe.forEach((r) => idsInPreventivoCloud.push(r.articolo_id))
            } else if (o.articolo_id) {
              idsInPreventivoCloud.push(o.articolo_id)
            }
          }
        })
        if (idsInPreventivoCloud.length > 0) {
          setMaterialiInPreventivoIds((prev) => Array.from(new Set([...prev, ...idsInPreventivoCloud])))
        }

        ricalcolaMrp(articoliEffettivi, distinteEffettive, odpEffettivi, fornitoriEffettivi)
      } catch (err) {
        console.warn('Sync cloud MRP fallback locale:', err)
      }
    }

    caricaDatiRealtime()

    // 3. Sottoscrizione Real-Time nativa Supabase:
    // Quando qualsiasi postazione in officina avvia un OdP e scarica la materia prima,
    // l'MRP di tutte le postazioni si aggiorna istantaneamente in tempo reale.
    const disiscrivi = syncService.sottoscriviAvanzamentoProduzione(() => {
      caricaDatiRealtime()
    })

    return () => {
      if (disiscrivi && typeof disiscrivi === 'function') {
        disiscrivi()
      }
    }
  }, [])

  // Gestione Selezione Checkbox Materiali
  const toggleSelezioneMateriale = (id: string) => {
    setMaterialiSelezionatiIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelezionaTuttiFabbisogni = () => {
    const daOrdinare = righeMrp.filter((r) => r.fabbisognoNetto > 0).map((r) => r.componente.id)
    const tuttiSelezionati = daOrdinare.length > 0 && daOrdinare.every((id) => materialiSelezionatiIds.includes(id))
    if (tuttiSelezionati) {
      setMaterialiSelezionatiIds([])
    } else {
      setMaterialiSelezionatiIds(daOrdinare)
    }
  }

  // Apertura Modale Richiesta Preventivo per i materiali selezionati
  const apriRichiestaPreventivoMultipla = (idsSelezionati: string[]) => {
    const righeTarget = righeMrp.filter((r) => idsSelezionati.includes(r.componente.id))
    if (righeTarget.length === 0) return

    const voci = righeTarget.map((r) => ({
      articolo_id: r.componente.id,
      codice_articolo: r.componente.codice_articolo,
      descrizione: r.componente.descrizione,
      unita_misura: r.componente.unita_misura || 'm',
      fabbisognoCalcolato: r.fabbisognoNetto > 0 ? r.fabbisognoNetto : 10,
      quantitaDaChiedere: r.fabbisognoNetto > 0 ? r.fabbisognoNetto : 10,
      dataRichiesta: r.dataLimiteProduzione || ''
    }))

    // Cerca fornitore suggerito (es. Rodacciai per barre, Eural per alluminio)
    const primoArt = righeTarget[0]?.componente
    const fornitorePredefinito = fornitoriDisponibili.find((f) =>
      primoArt?.codice_articolo.includes('ALL')
        ? f.ragione_sociale.toLowerCase().includes('allum') || f.ragione_sociale.toLowerCase().includes('gnutti')
        : f.ragione_sociale.toLowerCase().includes('rodacciai')
    ) || fornitoriDisponibili[0]

    if (fornitorePredefinito) {
      setFornitoriPreventivoSelezionati([
        { id: fornitorePredefinito.id, nome: fornitorePredefinito.ragione_sociale, email: fornitorePredefinito.email || '' }
      ])
    } else {
      setFornitoriPreventivoSelezionati([])
    }

    setTestoNotaRichiesta('Gentile Fornitore, vi chiediamo cortesemente la vostra migliore offerta di prezzo e tempi di consegna per i seguenti materiali:')
    setVociPreventivo(voci)
    setModalePreventivoAperta(true)
  }

  // Genera il testo email formattato per il fornitore
  const generaTestoEmailPreventivo = () => {
    const dataOggi = new Date().toLocaleDateString('it-IT')
    let testo = `Buongiorno,\n\n${testoNotaRichiesta}\n\n`
    testo += `RIFERIMENTO RICHIESTA PREVENTIVO DEL ${dataOggi}:\n`
    testo += `------------------------------------------------------------\n`

    vociPreventivo.forEach((v, idx) => {
      const dataStr = v.dataRichiesta ? ` (Consegna desiderata entro: ${v.dataRichiesta.split('-').reverse().join('/')})` : ''
      testo += `${idx + 1}) COD. ${v.codice_articolo} - ${v.descrizione}\n`
      testo += `   Quantità richiesta: ${v.quantitaDaChiedere} ${v.unita_misura}${dataStr}\n\n`
    })

    testo += `------------------------------------------------------------\n`
    testo += `In attesa di un vostro cortese riscontro con quotazioni e disponibilità, porgiamo cordiali saluti.\n\n`
    testo += `Ufficio Acquisti & Programmazione Produzione`
    return testo
  }

  // Apertura client email dell'impiegato con destinatari multipli in CCO (Copia Conoscenza Nascosta / Blind Carbon Copy)
  const handleInviaEmailPreventivo = () => {
    // Estrai tutte le email dei fornitori selezionati
    const listaEmail = fornitoriPreventivoSelezionati
      .map((f) => f.email.trim())
      .filter((email) => email.length > 0 && email.includes('@'))

    const nomiFornitori = fornitoriPreventivoSelezionati.map((f) => f.nome).join(', ')
    const oggetto = encodeURIComponent(`Richiesta Preventivo Materiali`)
    const corpo = encodeURIComponent(generaTestoEmailPreventivo())

    let mailto = ''
    if (listaEmail.length === 0) {
      // Se nessun fornitore ha l'email registrata, apri la bozza con oggetto e testo
      mailto = `mailto:?subject=${oggetto}&body=${corpo}`
    } else if (listaEmail.length === 1) {
      // Singolo fornitore: destinatario To diretto
      mailto = `mailto:${listaEmail[0]}?subject=${oggetto}&body=${corpo}`
    } else {
      // PIÙ FORNITORI IN CCO:
      // Inseriamo tutti i fornitori nel campo 'bcc' per non far sapere tra loro che sono in concorrenza!
      const bcc = listaEmail.join(',')
      mailto = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${oggetto}&body=${corpo}`
    }

    // Segna i materiali come "Preventivo Richiesto" sia localmente che su Supabase Cloud (stato: 'in_preventivo')
    const ids = vociPreventivo.map((v) => v.articolo_id)
    const aggiornati = Array.from(new Set([...materialiInPreventivoIds, ...ids]))
    setMaterialiInPreventivoIds(aggiornati)
    try {
      localStorage.setItem('machinaflow_materiali_in_preventivo', JSON.stringify(aggiornati))
    } catch {}

    // Salva un record di ordine preventivo su Supabase per ogni materiale richiesto
    const dataOggiIso = new Date().toISOString().split('T')[0]
    const nomiFornitoriStr = fornitoriPreventivoSelezionati.map((f) => f.nome).join(', ') || 'Fornitori Selezionati'

    vociPreventivo.forEach((v) => {
      const recordPreventivo: OrdineFornitore = {
        id: `prev-${Date.now()}-${v.articolo_id.slice(-4)}`,
        articolo_id: v.articolo_id,
        quantita_ordinata: v.quantitaDaChiedere,
        fornitore_nome: nomiFornitoriStr,
        data_ordine: dataOggiIso,
        data_arrivo_prevista: v.dataRichiesta || dataOggiIso,
        stato: 'in_preventivo',
        note: `Richiesta Preventivo RDO del ${new Date().toLocaleDateString('it-IT')} a: ${nomiFornitoriStr}`,
        creato_il: new Date().toISOString()
      }
      syncService.salvaOrdineFornitore(recordPreventivo)
    })

    window.open(mailto, '_blank')
    setModalePreventivoAperta(false)
    setMaterialiSelezionatiIds([])
    const infoDest = listaEmail.length > 1 ? `(${listaEmail.length} fornitori in CCO protetto)` : nomiFornitori ? `(${nomiFornitori})` : ''
    setNotificaCarico(`✓ Richiesta preventivo generata per ${vociPreventivo.length} materiali ${infoDest}! Aperta bozza email.`)
    setTimeout(() => setNotificaCarico(null), 5000)
  }

  // Copia negli appunti
  const handleCopiaTestoPreventivo = () => {
    navigator.clipboard.writeText(generaTestoEmailPreventivo())
    const ids = vociPreventivo.map((v) => v.articolo_id)
    const aggiornati = Array.from(new Set([...materialiInPreventivoIds, ...ids]))
    setMaterialiInPreventivoIds(aggiornati)
    try {
      localStorage.setItem('machinaflow_materiali_in_preventivo', JSON.stringify(aggiornati))
    } catch {}

    // Salva un record di ordine preventivo su Supabase per ogni materiale richiesto
    const dataOggiIso = new Date().toISOString().split('T')[0]
    const nomiFornitoriStr = fornitoriPreventivoSelezionati.map((f) => f.nome).join(', ') || 'Fornitori Selezionati'

    vociPreventivo.forEach((v) => {
      const recordPreventivo: OrdineFornitore = {
        id: `prev-${Date.now()}-${v.articolo_id.slice(-4)}`,
        articolo_id: v.articolo_id,
        quantita_ordinata: v.quantitaDaChiedere,
        fornitore_nome: nomiFornitoriStr,
        data_ordine: dataOggiIso,
        data_arrivo_prevista: v.dataRichiesta || dataOggiIso,
        stato: 'in_preventivo',
        note: `Richiesta Preventivo RDO del ${new Date().toLocaleDateString('it-IT')} a: ${nomiFornitoriStr}`,
        creato_il: new Date().toISOString()
      }
      syncService.salvaOrdineFornitore(recordPreventivo)
    })

    setNotificaCarico('✓ Testo email copiato negli appunti e sincronizzato su Supabase!')
    setTimeout(() => setNotificaCarico(null), 4000)
  }

  // Apertura modale rapida ordine fornitore (Anti-Doppio Ordine & Negoziazione)
  const apriModaleOrdineFornitore = (riga: RigaMRP) => {
    const leadTime = riga.componente.lead_time_giorni_fornitore || 3
    const dataArrivo = new Date()
    dataArrivo.setDate(dataArrivo.getDate() + leadTime)

    // Data limite richiesta (se presente dagli OdP, altrimenti data arrivo prevista standard)
    const dataTarget = riga.dataLimiteProduzione || dataArrivo.toISOString().split('T')[0]
    const qtaDefault = riga.fabbisognoNetto > 0 ? riga.fabbisognoNetto : 10

    // Calcola il fornitore predefinito consigliato (se presente in anagrafica o in base al tipo di materiale)
    const fornitoriMateriaPrima = fornitoriDisponibili.filter(
      (f) => !f.tipo_fornitore || f.tipo_fornitore === 'materia_prima'
    )
    let fornitoreDefault = riga.componente.codice_articolo.includes('ALL') ? 'Eural Gnutti S.p.A.' : 'Rodacciai S.p.A.'
    const trovatoInAnagrafica = fornitoriMateriaPrima.find((f) =>
      f.ragione_sociale.toLowerCase().includes(fornitoreDefault.toLowerCase().split(' ')[0])
    )
    if (trovatoInAnagrafica) {
      fornitoreDefault = trovatoInAnagrafica.ragione_sociale
    } else if (fornitoriMateriaPrima.length > 0) {
      fornitoreDefault = fornitoriMateriaPrima[0].ragione_sociale
    }

    setAggiornaPrezzoArticolo(true)
    setRigheOrdineMultiplo([
      {
        articolo_id: riga.componente.id,
        codice_articolo: riga.componente.codice_articolo,
        descrizione: riga.componente.descrizione,
        unita_misura: riga.componente.unita_misura || 'm',
        quantita_ordinata: qtaDefault,
        quantita_teorica: qtaDefault,
        prezzo_unitario: riga.componente.prezzo_riferimento || 0,
        odp_coinvolti_stringa: riga.ordiniCoinvolti.join(', '),
        data_limite_richiesta: riga.dataLimiteProduzione || ''
      }
    ])
    setFormOrdineFornitore({
      articolo_id: riga.componente.id,
      nome_materiale: `${riga.componente.codice_articolo} - ${riga.componente.descrizione}`,
      unita_misura: riga.componente.unita_misura || 'm',
      prezzo_unitario: riga.componente.prezzo_riferimento || 0,
      quantita_ordinata: qtaDefault,
      quantita_teorica: qtaDefault,
      fornitore_nome: fornitoreDefault,
      data_arrivo_prevista: dataTarget,
      data_limite_richiesta: riga.dataLimiteProduzione || '',
      odp_coinvolti_stringa: riga.ordiniCoinvolti.join(', '),
      note: `Copertura fabbisogno OdP: ${riga.ordiniCoinvolti.join(', ')}`
    })
    setModaleOrdineAperta(true)
  }

  // Apertura modale per emissione Ordine Cumulativo Multi-Materiale (dalla selezione checkbox)
  const apriModaleOrdineMultiplo = (materialiIds: string[]) => {
    const righeSelezionate = righeMrp.filter((r) => materialiIds.includes(r.componente.id))
    if (righeSelezionate.length === 0) return

    // Trova lead time massimo e calcola la data di arrivo stimata
    let maxLeadTime = 3
    let dataLimiteMin: string | null = null
    const odpCoinvoltiTotali: string[] = []

    const righeConfigurate = righeSelezionate.map((r) => {
      const lt = r.componente.lead_time_giorni_fornitore || 3
      if (lt > maxLeadTime) maxLeadTime = lt
      if (r.dataLimiteProduzione) {
        if (!dataLimiteMin || r.dataLimiteProduzione < dataLimiteMin) {
          dataLimiteMin = r.dataLimiteProduzione
        }
      }
      r.ordiniCoinvolti.forEach((c) => {
        if (!odpCoinvoltiTotali.includes(c)) odpCoinvoltiTotali.push(c)
      })

      const qtaDefault = r.fabbisognoNetto > 0 ? r.fabbisognoNetto : 10

      return {
        articolo_id: r.componente.id,
        codice_articolo: r.componente.codice_articolo,
        descrizione: r.componente.descrizione,
        unita_misura: r.componente.unita_misura || 'm',
        quantita_ordinata: qtaDefault,
        quantita_teorica: qtaDefault,
        prezzo_unitario: r.componente.prezzo_riferimento || 0,
        odp_coinvolti_stringa: r.ordiniCoinvolti.join(', '),
        data_limite_richiesta: r.dataLimiteProduzione || ''
      }
    })

    const dataArrivo = new Date()
    dataArrivo.setDate(dataArrivo.getDate() + maxLeadTime)
    const dataTarget = dataLimiteMin || dataArrivo.toISOString().split('T')[0]

    // Prendi fornitore predefinito in anagrafica
    const fornitoriMateriaPrima = fornitoriDisponibili.filter(
      (f) => !f.tipo_fornitore || f.tipo_fornitore === 'materia_prima'
    )
    const fornitoreDefault = fornitoriMateriaPrima.length > 0 ? fornitoriMateriaPrima[0].ragione_sociale : 'Rodacciai S.p.A.'

    setAggiornaPrezzoArticolo(true)
    setRigheOrdineMultiplo(righeConfigurate)
    setFormOrdineFornitore({
      articolo_id: righeConfigurate[0].articolo_id,
      nome_materiale: `${righeConfigurate.length} materiali selezionati`,
      unita_misura: righeConfigurate[0].unita_misura,
      prezzo_unitario: righeConfigurate[0].prezzo_unitario,
      quantita_ordinata: righeConfigurate.reduce((acc, r) => acc + r.quantita_ordinata, 0),
      quantita_teorica: righeConfigurate.reduce((acc, r) => acc + r.quantita_teorica, 0),
      fornitore_nome: fornitoreDefault,
      data_arrivo_prevista: dataTarget,
      data_limite_richiesta: dataLimiteMin || '',
      odp_coinvolti_stringa: odpCoinvoltiTotali.join(', '),
      note: odpCoinvoltiTotali.length > 0 ? `Copertura fabbisogni OdP: ${odpCoinvoltiTotali.join(', ')}` : ''
    })
    setModaleOrdineAperta(true)
  }

  // Registrazione Ordine Fornitore Ufficiale (Con Progressivo ODA e Documento Stampabile A4)
  const handleConfermaOrdineFornitore = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formOrdineFornitore.fornitore_nome.trim()) return

    // Se stiamo lavorando su righe multiple o singole
    const righeDaProcessare =
      righeOrdineMultiplo.length > 0
        ? righeOrdineMultiplo
        : [
            {
              articolo_id: formOrdineFornitore.articolo_id,
              codice_articolo:
                articoli.find((a) => a.id === formOrdineFornitore.articolo_id)?.codice_articolo || 'MAT-RAW',
              descrizione:
                articoli.find((a) => a.id === formOrdineFornitore.articolo_id)?.descrizione ||
                formOrdineFornitore.nome_materiale,
              unita_misura: formOrdineFornitore.unita_misura || 'm',
              quantita_ordinata: Number(formOrdineFornitore.quantita_ordinata),
              quantita_teorica: Number(formOrdineFornitore.quantita_teorica),
              prezzo_unitario: Number(formOrdineFornitore.prezzo_unitario) || 0,
              odp_coinvolti_stringa: formOrdineFornitore.odp_coinvolti_stringa,
              data_limite_richiesta: formOrdineFornitore.data_limite_richiesta
            }
          ]

    if (righeDaProcessare.length === 0) return

    // Calcolo progressivo ODA-YYYY-XXX
    const annoCorrente = new Date().getFullYear()
    const prefissoOda = `ODA-${annoCorrente}-`
    let maxNum = 0
    ordiniFornitori.forEach((o) => {
      if (o.numero_oda && o.numero_oda.startsWith(prefissoOda)) {
        const numPart = parseInt(o.numero_oda.replace(prefissoOda, ''), 10)
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart
      }
    })
    const numeroOda = `${prefissoOda}${String(maxNum + 1).padStart(3, '0')}`

    let totaleImponibileOdA = 0
    const righeFinaliOdA: RigaOrdineFornitore[] = righeDaProcessare.map((r) => {
      const qta = Number(r.quantita_ordinata) || 0
      const pz = Number(r.prezzo_unitario) || 0
      const totRiga = Number((qta * pz).toFixed(2))
      totaleImponibileOdA += totRiga

      return {
        articolo_id: r.articolo_id,
        codice_articolo: r.codice_articolo,
        descrizione: r.descrizione,
        unita_misura: r.unita_misura,
        quantita_ordinata: qta,
        prezzo_unitario: pz,
        totale_riga: totRiga,
        data_arrivo_prevista: formOrdineFornitore.data_arrivo_prevista
      }
    })

    const quantitaTotaleSomma = righeFinaliOdA.reduce((acc, r) => acc + r.quantita_ordinata, 0)

    const nuovoOrdine: OrdineFornitore = {
      id: 'ord-forn-' + Date.now(),
      numero_oda: numeroOda,
      articolo_id: righeFinaliOdA[0].articolo_id,
      quantita_ordinata: quantitaTotaleSomma,
      fornitore_nome: formOrdineFornitore.fornitore_nome,
      data_ordine: new Date().toISOString().split('T')[0],
      data_arrivo_prevista: formOrdineFornitore.data_arrivo_prevista,
      stato: 'in_ordine',
      totale_imponibile: Number(totaleImponibileOdA.toFixed(2)),
      note: formOrdineFornitore.note,
      righe: righeFinaliOdA,
      creato_il: new Date().toISOString()
    }

    const aggiornati = [nuovoOrdine, ...ordiniFornitori]
    setOrdiniFornitori(aggiornati)
    localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(aggiornati))

    // Salva immediatamente su Supabase Cloud con azienda_id (Prezzo congelato e immutabile in questo OdA)
    syncService.salvaOrdineFornitore(nuovoOrdine)

    // Se richiesto, aggiorna il prezzo_riferimento degli articoli coinvolti su Supabase per il calcolo costi futuro
    let articoliAggiornati = articoli
    if (aggiornaPrezzoArticolo) {
      righeFinaliOdA.forEach((r) => {
        if (r.prezzo_unitario && r.prezzo_unitario > 0) {
          const matchArt = articoliAggiornati.find((a) => a.id === r.articolo_id)
          if (matchArt) {
            const artAgg: Articolo = {
              ...matchArt,
              prezzo_riferimento: r.prezzo_unitario
            }
            articoliAggiornati = articoliAggiornati.map((a) => (a.id === artAgg.id ? artAgg : a))
            syncService.salvaArticolo(artAgg)
          }
        }
      })
      setArticoli(articoliAggiornati)
      try {
        localStorage.setItem('machinaflow_articoli', JSON.stringify(articoliAggiornati))
      } catch {}
    }

    // Se i materiali erano contrassegnati come "In Preventivo", rimuovili dallo stato temporaneo e archivia i vecchi preventivi su Supabase
    const idsInclusi = righeFinaliOdA.map((r) => r.articolo_id)
    const restantiInPreventivo = materialiInPreventivoIds.filter((id) => !idsInclusi.includes(id))
    setMaterialiInPreventivoIds(restantiInPreventivo)
    try {
      localStorage.setItem('machinaflow_materiali_in_preventivo', JSON.stringify(restantiInPreventivo))
    } catch {}

    // Chiudi/annulla eventuali ordini con stato 'in_preventivo' per questi articoli su Supabase
    ordiniFornitori.forEach((o) => {
      if (o.stato === 'in_preventivo' && idsInclusi.includes(o.articolo_id)) {
        syncService.salvaOrdineFornitore({ ...o, stato: 'annullato' })
      }
    })

    // Resetta selezione checkbox
    setMaterialiSelezionatiIds([])
    setModaleOrdineAperta(false)
    ricalcolaMrp(articoliAggiornati, distinte, odpList, aggiornati)

    // Apri subito il documento stampabile OdA A4 per consultazione o invio formale
    setOdaInVisualizzazione(nuovoOrdine)
    setNotificaCarico(
      `✓ Ordine d'Acquisto ${numeroOda} emesso con successo per ${formOrdineFornitore.fornitore_nome} (${righeFinaliOdA.length} materiale/i, Tot: € ${totaleImponibileOdA.toFixed(2)})!`
    )
    setTimeout(() => setNotificaCarico(null), 5000)
  }

  // Apertura modale per modificare data o sollecito di un ordine fornitore
  const apriModificaOrdineFornitore = (ordine: OrdineFornitore) => {
    setOrdineInModifica(ordine)
    setFormSollecito({
      data_arrivo_prevista: ordine.data_arrivo_prevista || '',
      fornitore_nome: ordine.fornitore_nome || '',
      quantita_ordinata: ordine.quantita_ordinata,
      note: ordine.note || ''
    })
    setModaleSollecitoAperta(true)
  }

  // Salvataggio modifiche ordine fornitore (Nuova data / note sollecito)
  const handleSalvaModificaOrdineFornitore = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ordineInModifica) return

    const ordineAggiornato: OrdineFornitore = {
      ...ordineInModifica,
      data_arrivo_prevista: formSollecito.data_arrivo_prevista,
      fornitore_nome: formSollecito.fornitore_nome,
      quantita_ordinata: Number(formSollecito.quantita_ordinata),
      note: formSollecito.note
    }

    const ordiniAggiornati = ordiniFornitori.map((o) =>
      o.id === ordineInModifica.id ? ordineAggiornato : o
    )

    setOrdiniFornitori(ordiniAggiornati)
    localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(ordiniAggiornati))
    syncService.salvaOrdineFornitore(ordineAggiornato)

    setModaleSollecitoAperta(false)
    setOrdineInModifica(null)
    ricalcolaMrp(articoli, distinte, odpList, ordiniAggiornati)

    setNotificaCarico(`✓ Ordine Fornitore aggiornato: nuova data arrivo prevista ${ordineAggiornato.data_arrivo_prevista || 'non definita'}`)
    setTimeout(() => setNotificaCarico(null), 4000)
  }

  // Annullamento Ordine Fornitore (Cancella fabbisogno in arrivo e sincronizza Supabase)
  const handleAnnullaOrdineFornitore = (ordine: OrdineFornitore) => {
    const conferma = window.confirm(
      `Confermi l'annullamento dell'ordine fornitore ${ordine.numero_oda || ordine.id} da ${ordine.fornitore_nome}?\n\nQuesta operazione rimuoverà la merce in arrivo dal calcolo MRP ripristinando il fabbisogno.`
    )
    if (!conferma) return

    const ordineAnnullato: OrdineFornitore = {
      ...ordine,
      stato: 'annullato'
    }

    const ordiniAggiornati = ordiniFornitori.map((o) =>
      o.id === ordine.id ? ordineAnnullato : o
    )

    setOrdiniFornitori(ordiniAggiornati)
    try {
      localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(ordiniAggiornati))
    } catch {}
    syncService.salvaOrdineFornitore(ordineAnnullato)

    setModaleSollecitoAperta(false)
    setOrdineInModifica(null)
    ricalcolaMrp(articoli, distinte, odpList, ordiniAggiornati)

    setNotificaCarico(`✓ Ordine d'acquisto ${ordine.numero_oda || ordine.id} annullato con successo.`)
    setTimeout(() => setNotificaCarico(null), 4000)
  }

  // Apertura modale Ricezione Merce da Ordine Fornitore con Tracciabilità DDT
  const apriRicezioneOrdineFornitore = (ordine: OrdineFornitore, tuttiAperti?: OrdineFornitore[]) => {
    setOrdineFornitoreInRicezioneId(ordine.id)
    setOrdiniFornitoreDisponibiliArticolo(tuttiAperti || [ordine])

    // Cerca tutti gli altri ordini o righe aperte per questo stesso fornitore
    const nomeForn = ordine.fornitore_nome || ''
    const altriAperti: {
      ordine_id: string
      articolo_id: string
      codice_articolo: string
      descrizione: string
      unita_misura: string
      quantita_ordinata: number
      quantita_entrata: number
      selezionato: boolean
      numero_oda?: string
    }[] = []

    ordiniFornitori.forEach((o) => {
      if (
        o.stato === 'in_ordine' &&
        o.fornitore_nome &&
        o.fornitore_nome.trim().toLowerCase() === nomeForn.trim().toLowerCase()
      ) {
        if (o.righe && o.righe.length > 0) {
          o.righe.forEach((r) => {
            // Escludi solo la riga dell'ordine principale attivo
            if (o.id === ordine.id && r.articolo_id === ordine.articolo_id) return
            const artInfo = articoli.find((a) => a.id === r.articolo_id)
            altriAperti.push({
              ordine_id: o.id,
              articolo_id: r.articolo_id,
              codice_articolo: r.codice_articolo || artInfo?.codice_articolo || 'MAT-RAW',
              descrizione: r.descrizione || artInfo?.descrizione || 'Materia prima',
              unita_misura: r.unita_misura || artInfo?.unita_misura || 'm',
              quantita_ordinata: r.quantita_ordinata,
              quantita_entrata: r.quantita_ordinata,
              selezionato: true, // Di default selezionato per carico rapido con 1 clic
              numero_oda: o.numero_oda
            })
          })
        } else if (o.id !== ordine.id) {
          const artInfo = articoli.find((a) => a.id === o.articolo_id)
          altriAperti.push({
            ordine_id: o.id,
            articolo_id: o.articolo_id,
            codice_articolo: artInfo?.codice_articolo || 'MAT-RAW',
            descrizione: artInfo?.descrizione || 'Materia prima',
            unita_misura: artInfo?.unita_misura || 'm',
            quantita_ordinata: o.quantita_ordinata,
            quantita_entrata: o.quantita_ordinata,
            selezionato: true,
            numero_oda: o.numero_oda
          })
        }
      }
    })

    setAltriMaterialiFornitoreSelezionati(altriAperti)
    setFormCarico({
      articolo_id: ordine.articolo_id,
      quantita_entrata: ordine.quantita_ordinata,
      ddt_riferimento: '',
      fornitore_nome: ordine.fornitore_nome || '',
      note: ordine.note ? `Rif. Ordine Fornitore: ${ordine.note}` : ''
    })
    setRicercaMaterialeCarico('')
    setModaleCaricoAperta(true)
  }

  // Apertura rapida per specifico articolo cliccato in tabella (Carico manuale)
  const apriCaricoPerArticolo = (artId: string, ordiniApertiArticolo?: OrdineFornitore[]) => {
    const aperti = ordiniApertiArticolo || ordiniFornitori.filter((o) => o.articolo_id === artId && o.stato === 'in_ordine')
    setOrdiniFornitoreDisponibiliArticolo(aperti)
    setAltriMaterialiFornitoreSelezionati([])
    if (aperti.length > 0) {
      setOrdineFornitoreInRicezioneId(aperti[0].id)
      setFormCarico({
        articolo_id: artId,
        quantita_entrata: aperti[0].quantita_ordinata,
        ddt_riferimento: '',
        fornitore_nome: aperti[0].fornitore_nome || '',
        note: aperti[0].note ? `Rif. Ordine: ${aperti[0].note}` : ''
      })
    } else {
      setOrdineFornitoreInRicezioneId(null)
      setFormCarico({
        articolo_id: artId,
        quantita_entrata: 10,
        ddt_riferimento: '',
        fornitore_nome: '',
        note: ''
      })
    }
    setRicercaMaterialeCarico('')
    setModaleCaricoAperta(true)
  }

  // Funzione di Carico Merce (DDT e Chiusura Ordine Fornitore se collegato - Supporta Carico Multiplo)
  const handleRegistraCarico = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCarico.articolo_id || formCarico.quantita_entrata <= 0) return

    let articoliAggiornati = [...articoli]
    const ddtDoc = formCarico.ddt_riferimento ? `DDT Fornitore #${formCarico.ddt_riferimento}` : 'Carico Merci Diretto'
    const fornitoreMitt = formCarico.fornitore_nome || 'fornitore'
    const noteCarico = formCarico.note || ''

    // 1. Carica l'articolo principale
    const artTarget = articoliAggiornati.find((a) => a.id === formCarico.articolo_id)
    if (artTarget) {
      const vecchiaGiacenza = artTarget.giacenza_attuale
      const nuovaGiacenza = Number((vecchiaGiacenza + Number(formCarico.quantita_entrata)).toFixed(2))

      articoliAggiornati = articoliAggiornati.map((a) =>
        a.id === artTarget.id ? { ...a, giacenza_attuale: nuovaGiacenza } : a
      )

      syncService.salvaArticolo({ ...artTarget, giacenza_attuale: nuovaGiacenza })
      syncService.registraMovimentoMagazzino({
        articolo_id: artTarget.id,
        tipo_movimento: 'carico_fornitore',
        quantita: Number(formCarico.quantita_entrata),
        giacenza_precedente: vecchiaGiacenza,
        giacenza_risultante: nuovaGiacenza,
        unita_misura: artTarget.unita_misura,
        riferimento_documento: ddtDoc,
        note: noteCarico ? `${noteCarico} - Ricevimento da ${fornitoreMitt}` : `Ricevimento da ${fornitoreMitt}`
      })
    }

    // 2. Carica eventuali altri materiali arrivati con lo stesso DDT (selezionati dall'utente)
    const altriDaCaricare = altriMaterialiFornitoreSelezionati.filter((item) => item.selezionato && item.quantita_entrata > 0)
    const idsOrdiniExtraChiusi = new Set<string>()

    altriDaCaricare.forEach((extra) => {
      const artExtra = articoliAggiornati.find((a) => a.id === extra.articolo_id)
      if (artExtra) {
        const vGiac = artExtra.giacenza_attuale
        const nGiac = Number((vGiac + Number(extra.quantita_entrata)).toFixed(2))

        articoliAggiornati = articoliAggiornati.map((a) =>
          a.id === artExtra.id ? { ...a, giacenza_attuale: nGiac } : a
        )

        syncService.salvaArticolo({ ...artExtra, giacenza_attuale: nGiac })
        syncService.registraMovimentoMagazzino({
          articolo_id: artExtra.id,
          tipo_movimento: 'carico_fornitore',
          quantita: Number(extra.quantita_entrata),
          giacenza_precedente: vGiac,
          giacenza_risultante: nGiac,
          unita_misura: artExtra.unita_misura,
          riferimento_documento: ddtDoc,
          note: `Arrivo congiunto con DDT da ${fornitoreMitt} (Rif. OdA ${extra.numero_oda || extra.ordine_id})`
        })

        idsOrdiniExtraChiusi.add(extra.ordine_id)
      }
    })

    setArticoli(articoliAggiornati)
    try {
      localStorage.setItem('machinaflow_articoli', JSON.stringify(articoliAggiornati))
    } catch {}

    // 3. Chiusura ordini fornitori saldati
    let ordiniAggiornati = ordiniFornitori.map((o) => {
      let deveChiudere = false
      if (ordineFornitoreInRicezioneId === 'TUTTI_APERTI') {
        if (ordiniFornitoreDisponibiliArticolo.some((oda) => oda.id === o.id)) deveChiudere = true
      } else if (ordineFornitoreInRicezioneId === o.id) {
        deveChiudere = true
      }

      // Se questo ordine include righe caricate tra gli extra
      if (idsOrdiniExtraChiusi.has(o.id)) {
        deveChiudere = true
      }

      if (deveChiudere && o.stato === 'in_ordine') {
        const ordRicevuto: OrdineFornitore = { ...o, stato: 'ricevuto' }
        syncService.salvaOrdineFornitore(ordRicevuto)
        return ordRicevuto
      }
      return o
    })

    setOrdiniFornitori(ordiniAggiornati)
    try {
      localStorage.setItem('machinaflow_ordini_fornitori', JSON.stringify(ordiniAggiornati))
    } catch {}

    setOrdineFornitoreInRicezioneId(null)
    setOrdiniFornitoreDisponibiliArticolo([])
    setAltriMaterialiFornitoreSelezionati([])

    // Ricalcola subito MRP con le nuove giacenze e ordini fornitori aggiornati
    ricalcolaMrp(articoliAggiornati, distinte, odpList, ordiniAggiornati)

    setModaleCaricoAperta(false)
    const ddtInfo = formCarico.ddt_riferimento ? ` (DDT: ${formCarico.ddt_riferimento})` : ''
    const totMaterialiCaricati = 1 + altriDaCaricare.length
    setNotificaCarico(
      `✓ Registrata entrata merce per ${totMaterialiCaricati} materiale/i con ${ddtInfo || 'DDT'} da ${fornitoreMitt}! Giacenze aggiornate a magazzino.`
    )
    setTimeout(() => setNotificaCarico(null), 5000)

    // Reset form
    setFormCarico({
      articolo_id: '',
      quantita_entrata: 10,
      ddt_riferimento: '',
      fornitore_nome: '',
      note: ''
    })
  }

  // Export Excel / CSV Professionale e Pulito
  const handleDownloadExcel = () => {
    // Esporta prioritariamente i materiali con fabbisogno o deficit per gli OdP attivi
    const materialiDaEsportare = righeMrp.filter((r) => r.fabbisognoLordo > 0 || r.fabbisognoNetto > 0 || r.stato !== 'sufficiente')
    
    // Se non ci sono deficit, esporta comunque tutto l'elenco ordinato
    const elencoFinale = materialiDaEsportare.length > 0 ? materialiDaEsportare : righeMrp

    const intestazioni = [
      'Codice Materiale',
      'Tipologia Materiale',
      'Descrizione Tecnica',
      'U.M.',
      'Lead Time Fornitore (gg)',
      'Giacenza Magazzino',
      'Impegnato OdP',
      'Scorta Minima',
      'QUANTITÀ DA ORDINARE',
      'Stato Approvvigionamento',
      'Prezzo Unitario Stimato (€)',
      'Valore Ordine Stimato (€)',
      'Commesse / OdP Destinazione'
    ]

    const righeCSV = elencoFinale.map((r) => {
      const mat = r.componente
      const importoStimato = Number((r.fabbisognoNetto * (mat.prezzo_riferimento || 0)).toFixed(2))

      // Identifica tipologia chiara
      let tipologia = 'Commerciale / Barra'
      if (mat.codice_articolo.startsWith('SAG-')) {
        tipologia = 'Sagoma Taglio Esterno (JIT)'
      } else if (mat.codice_articolo.startsWith('TON-') || mat.codice_articolo.startsWith('LAM-') || mat.codice_articolo.startsWith('TUB-')) {
        tipologia = 'Materia Prima da Taglio (Barra/Lamiera)'
      } else if (mat.codice_articolo.startsWith('VTE-') || mat.codice_articolo.startsWith('CUS-') || mat.codice_articolo.startsWith('FIL-')) {
        tipologia = 'Componente Commerciale / Bulloneria'
      }

      const statoLabel = r.stato === 'critico' ? 'ORDINA SUBITO' : r.stato === 'attenzione' ? 'SOTTO SCORTA' : 'OK COPERTO'
      const leadTime = mat.lead_time_giorni_fornitore !== undefined ? `${mat.lead_time_giorni_fornitore} gg` : '3 gg'

      // Racchiude sempre tra virgolette doppie ogni campo per evitare rotture di colonna con virgole e punti
      return [
        `"${mat.codice_articolo}"`,
        `"${tipologia}"`,
        `"${mat.descrizione.replace(/"/g, '""')}"`,
        `"${mat.unita_misura}"`,
        `"${leadTime}"`,
        `"${r.giacenzaAttuale}"`,
        `"${r.fabbisognoLordo}"`,
        `"${r.scortaMinima}"`,
        `"${r.fabbisognoNetto}"`,
        `"${statoLabel}"`,
        `"${(mat.prezzo_riferimento || 0).toFixed(2)}"`,
        `"${importoStimato.toFixed(2)}"`,
        `"${r.ordiniCoinvolti.join(', ')}"`
      ].join(';')
    })

    // UTF-8 BOM (\uFEFF) per corretta interpretazione caratteri in Excel
    const csvContent = '\uFEFF' + [
      intestazioni.map((h) => `"${h}"`).join(';'),
      ...righeCSV
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `MachinaFlow_Lista_Riordino_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Materiali filtrabili per la ricerca dinamica nel modale DDT
  const materialiDisponibili = articoli.filter((a) => a.tipo !== 'prodotto_finito')
  const materialiFiltratiPerCarico = materialiDisponibili.filter((m: Articolo) =>
    m.codice_articolo.toLowerCase().includes(ricercaMaterialeCarico.toLowerCase()) ||
    m.descrizione.toLowerCase().includes(ricercaMaterialeCarico.toLowerCase())
  )

  const righeMrpFiltrate = righeMrp.filter((riga: RigaMRP) => {
    // Filtro per stato
    if (filtroStato !== 'tutti') {
      if (filtroStato === 'critico' && riga.stato !== 'critico' && riga.stato !== 'attenzione') return false
      if (filtroStato === 'in_arrivo' && riga.stato !== 'in_arrivo') return false
      if (filtroStato === 'sufficiente' && riga.stato !== 'sufficiente') return false
    }

    // Filtro per testo (codice, descrizione, fornitore o ordini coinvolti)
    if (filtroRicerca.trim()) {
      const q = filtroRicerca.toLowerCase()
      const mat = riga.componente
      const matchCodice = mat.codice_articolo.toLowerCase().includes(q)
      const matchDesc = mat.descrizione.toLowerCase().includes(q)
      const matchOdp = (riga.ordiniCoinvolti || []).some((code: string) => code.toLowerCase().includes(q))
      const matchFornitore = (riga.ordiniFornitoreAperti || []).some((o: OrdineFornitore) => (o.fornitore_nome || '').toLowerCase().includes(q))
      if (!matchCodice && !matchDesc && !matchOdp && !matchFornitore) return false
    }

    return true
  })

  // Calcolo Paginazione Intelligente
  const totaleElementi = righeMrpFiltrate.length
  const totalePagine = Math.max(1, Math.ceil(totaleElementi / elementiPerPagina))
  const indiceInizio = (paginaCorrente - 1) * elementiPerPagina
  const indiceFine = Math.min(indiceInizio + elementiPerPagina, totaleElementi)
  const righeMrpPaginate = righeMrpFiltrate.slice(indiceInizio, indiceFine)

  const countCritici = righeMrp.filter((r) => r.stato === 'critico').length
  const countAttenzione = righeMrp.filter((r) => r.stato === 'attenzione').length

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SEZIONE STAMPA MODULO FORMALE A4 (Visibile ESCLUSIVAMENTE in Stampa)
          ========================================================================= */}
      <div className="hidden print:block text-black bg-white font-sans text-xs p-2">
        {/* Intestazione Aziendale Formale */}
        <div className="border-b-2 border-black pb-4 mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              Richiesta Approvvigionamento & Riordino Materiali
            </h1>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              Ufficio Acquisti & Programmazione Produzione (PCP/MES)
            </p>
            <p className="text-xs text-gray-600">
              MachinaFlow Meccanica di Precisione • Stabilimento di Lucca (Tissue Converting)
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-gray-900">
              DOC: {codiceDocStampa}
            </div>
            <div className="text-xs text-gray-700 mt-1">
              Data Emissione: <strong>{dataStampa}</strong>
            </div>
            <div className="text-xs text-gray-600">
              OdP Aperti Analizzati: <strong>{odpList.filter((o) => o.stato !== 'completato').length}</strong>
            </div>
          </div>
        </div>

        {/* Sommario Sintetico */}
        <div className="mb-4 grid grid-cols-3 gap-3 border border-gray-300 p-3 bg-gray-50 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Articoli in Deficit Critico</span>
            <span className="text-base font-bold text-red-700">{countCritici} Materiali</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Articoli Sotto Scorta</span>
            <span className="text-base font-bold text-amber-700">{countAttenzione} Materiali</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Stato Copertura</span>
            <span className="text-base font-bold text-gray-900">
              {righeMrp.filter((r) => r.stato === 'sufficiente').length} su {righeMrp.length} a stock
            </span>
          </div>
        </div>

        {/* Tabella Ufficiale di Riordino per Fornitori / Magazzino */}
        <table className="w-full border-collapse border border-gray-400 text-left text-[11px] mb-6">
          <thead>
            <tr className="bg-gray-200 text-gray-900 font-bold border-b border-gray-400">
              <th className="p-2 border-r border-gray-300">Codice Materiale</th>
              <th className="p-2 border-r border-gray-300">Descrizione Tecnica / Dimensione</th>
              <th className="p-2 border-r border-gray-300 text-center">Lead Time</th>
              <th className="p-2 border-r border-gray-300 text-center">Giacenza</th>
              <th className="p-2 border-r border-gray-300 text-center">Fabbisogno OdP</th>
              <th className="p-2 border-r border-gray-300 text-center">Scorta Min.</th>
              <th className="p-2 border-r border-gray-300 text-center bg-gray-300 font-black">DA ORDINARE</th>
              <th className="p-2 border-r border-gray-300">Destinazione OdP</th>
              <th className="p-2 text-center w-24">Note Fornitore / DDT</th>
            </tr>
          </thead>
          <tbody>
            {righeMrp
              .filter((r) => r.stato !== 'sufficiente' || r.fabbisognoNetto > 0)
              .map((riga) => {
                const mat = riga.componente
                const isCritico = riga.stato === 'critico'
                const leadTime = mat.lead_time_giorni_fornitore !== undefined ? `${mat.lead_time_giorni_fornitore} gg` : '3 gg'

                return (
                  <tr key={`print-${mat.id}`} className="border-b border-gray-300">
                    <td className="p-2 font-mono font-bold text-gray-900 border-r border-gray-300 whitespace-nowrap">
                      {mat.codice_articolo}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-gray-800">
                      {mat.descrizione}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono">
                      {leadTime}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono">
                      {riga.giacenzaAttuale} {mat.unita_misura}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono text-gray-700">
                      {riga.fabbisognoLordo} {mat.unita_misura}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono text-gray-500">
                      {riga.scortaMinima} {mat.unita_misura}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-black text-xs bg-gray-100">
                      {riga.mancanteProduzione > 0 ? (
                        <span className="text-red-700 font-bold">
                          + {riga.mancanteProduzione} {mat.unita_misura} (OdP)
                        </span>
                      ) : riga.fabbisognoNetto > 0 && riga.quantitaInArrivo > 0 ? (
                        <span className="text-sky-700 font-semibold">
                          Coperto (In Arrivo)
                        </span>
                      ) : riga.fabbisognoNetto > 0 ? (
                        <span className="text-amber-800 font-semibold">
                          + {riga.fabbisognoNetto} {mat.unita_misura} (Scorta)
                        </span>
                      ) : (
                        <span className="text-emerald-700">0</span>
                      )}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-[10px] font-mono text-gray-700">
                      {riga.ordiniCoinvolti.join(', ') || '-'}
                    </td>
                    <td className="p-2 border-gray-300">
                      <div className="h-5 border-b border-dotted border-gray-400" />
                    </td>
                  </tr>
                )
              })}

            {righeMrp.filter((r) => r.stato !== 'sufficiente' || r.fabbisognoNetto > 0).length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500 italic">
                  Nessun materiale attualmente in deficit. Tutte le scorte coprono i fabbisogni degli OdP pianificati.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Box Firme per Autorizzazione Ufficio */}
        <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-12 text-xs">
          <div>
            <span className="block text-gray-600 font-semibold mb-6">Compilato da (Responsabile PCP / MES):</span>
            <div className="border-b border-gray-500 w-3/4" />
          </div>
          <div>
            <span className="block text-gray-600 font-semibold mb-6">Approvazione Ufficio Acquisti / Fornitori:</span>
            <div className="border-b border-gray-500 w-3/4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEZIONE GESTIONALE A SCHERMO (Nascosta durante la Stampa)
          ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Intestazione */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-orange-500" />
              Fabbisogno Materiali (MRP Semplificato)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Calcolo automatico del fabbisogno netto materie prime in base agli Ordini di Produzione pianificati e alle distinte base (BOM).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModaleCaricoAperta(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Registra Arrivo Merce (DDT)</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              title="Esporta foglio calcolo editabile compatibile con Microsoft Excel"
            >
              <Download className="w-4 h-4" />
              <span>Esporta Excel (.csv)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Stampa Riordino</span>
            </button>
          </div>
        </div>

        {/* Notifica Flash Carico Merce */}
        {notificaCarico && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{notificaCarico}</span>
          </div>
        )}

        {/* Banner Riassuntivo Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-900/60 text-rose-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-300">{countCritici}</div>
              <div className="text-xs font-semibold text-rose-200 uppercase tracking-wider">
                Materiali in Deficit Critico
              </div>
              <div className="text-[11px] text-slate-400">Giacenza insufficiente per gli OdP</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/60 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-900/60 text-amber-300">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-300">{countAttenzione}</div>
              <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                Sotto Scorta di Sicurezza
              </div>
              <div className="text-[11px] text-slate-400">Consigliato riordino preventivo</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-900/60 text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-300">
                {righeMrp.filter((r) => r.stato === 'sufficiente').length}
              </div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                Materiali a Stock Sufficiente
              </div>
              <div className="text-[11px] text-slate-400">Copertura garantita</div>
            </div>
          </div>
        </div>

        {/* Tabella Fabbisogni Materiali Gestionale */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-orange-500" />
                Matrice di Calcolo Fabbisogni & Suggerimento Acquisti ai Fornitori
              </h2>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                {odpList.filter((o) => o.stato !== 'completato').length} OdP Aperti Analizzati
              </span>
            </div>

            {/* Barra di Ricerca & Filtri Rapidi */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Campo di ricerca rapida */}
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca materiale, codice, OdP..."
                  value={filtroRicerca}
                  onChange={(e) => setFiltroRicerca(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
                />
                {filtroRicerca && (
                  <button
                    type="button"
                    onClick={() => setFiltroRicerca('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    title="Cancella ricerca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtri pillola rapida per stato */}
              <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFiltroStato('tutti')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filtroStato === 'tutti'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tutti ({righeMrp.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStato('critico')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    filtroStato === 'critico'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/80 shadow-xs'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <span>Critici</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({righeMrp.filter((r) => r.stato === 'critico' || r.stato === 'attenzione').length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStato('in_arrivo')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    filtroStato === 'in_arrivo'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-xs'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <span>In Arrivo</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({righeMrp.filter((r) => r.stato === 'in_arrivo').length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStato('sufficiente')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    filtroStato === 'sufficiente'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 shadow-xs'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <span>Coperti</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({righeMrp.filter((r) => r.stato === 'sufficiente').length})
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* BARRA AZIONI MULTIPLE: RICHIESTA PREVENTIVO O EMISSIONE ORDINE MULTI-MATERIALE */}
          {materialiSelezionatiIds.length > 0 && (
            <div className="mx-6 my-2 p-3 rounded-xl bg-orange-950/60 border border-orange-500/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
                <span className="text-xs font-bold text-white">
                  {materialiSelezionatiIds.length} materiale/i selezionato/i
                </span>
                <span className="text-[11px] text-orange-300 hidden sm:inline">
                  (puoi chiedere preventivo a più fornitori o emettere direttamente l&apos;OdA cumulativo)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => apriModaleOrdineMultiplo(materialiSelezionatiIds)}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/30 cursor-pointer"
                  title="Emetti un unico Ordine d'Acquisto (OdA) per tutti i materiali selezionati"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Emetti Ordine d&apos;Acquisto OdA ({materialiSelezionatiIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => apriRichiestaPreventivoMultipla(materialiSelezionatiIds)}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/30 cursor-pointer"
                  title="Genera testo email per chiedere quotazione a 1 o più fornitori in CCO"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Richiedi Preventivo Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMaterialiSelezionatiIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Deseleziona
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-8">
                    <input
                      type="checkbox"
                      checked={
                        materialiSelezionatiIds.length > 0 &&
                        righeMrp.filter((r) => r.fabbisognoNetto > 0).every((r) => materialiSelezionatiIds.includes(r.componente.id))
                      }
                      onChange={toggleSelezionaTuttiFabbisogni}
                      className="rounded border-slate-700 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      title="Seleziona tutti i fabbisogni da ordinare"
                    />
                  </th>
                  <th className="py-3 px-3.5">Materiale / Dimensione</th>
                  <th className="py-3 px-3 text-center">Tempi & Urgenza</th>
                  <th className="py-3 px-3 text-center">Giacenza / Scorta</th>
                  <th className="py-3 px-3 text-center">Fabb. Lordo (OdP)</th>
                  <th className="py-3 px-3.5 text-center">Fabbisogno Netto</th>
                  <th className="py-3 px-3.5 text-center">In Arrivo & Stato</th>
                  <th className="py-3 px-3.5 text-right">Azioni Acquisti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {righeMrpPaginate.map((riga) => {
                  const mat = riga.componente
                  const isCritico = riga.stato === 'critico'
                  const isAttenzione = riga.stato === 'attenzione'
                  const leadTime = mat.lead_time_giorni_fornitore !== undefined ? mat.lead_time_giorni_fornitore : 3

                  return (
                    <tr
                      key={mat.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        materialiSelezionatiIds.includes(mat.id)
                          ? 'bg-orange-950/30'
                          : isCritico
                          ? 'bg-rose-950/20'
                          : isAttenzione
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* 0. Checkbox Selezione */}
                      <td className="py-3 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={materialiSelezionatiIds.includes(mat.id)}
                          onChange={() => toggleSelezioneMateriale(mat.id)}
                          className="rounded border-slate-700 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* 1. Materiale & Descrizione */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-orange-400 text-xs">
                            {mat.codice_articolo}
                          </span>
                          <span className="font-medium text-slate-200 text-[11px] line-clamp-1 max-w-[240px]" title={mat.descrizione}>
                            {mat.descrizione}
                          </span>
                          {mat.prezzo_riferimento ? (
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              Listino: € {mat.prezzo_riferimento.toFixed(2)} / {mat.unita_misura}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* 2. Tempi & Urgenza */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col items-center justify-center min-h-[44px] gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                            <Clock className="w-2.5 h-2.5 text-cyan-400" />
                            {leadTime} gg cons.
                          </span>
                          {riga.dataLimiteProduzione ? (
                            riga.mancanteProduzione > 0 ? (
                              <span
                                className={`text-[10px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded ${
                                  riga.giorniRimanenti !== undefined && riga.giorniRimanenti <= leadTime
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 animate-pulse'
                                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                }`}
                                title={`Materia prima mancante! Inizio produzione OdP previsto per il ${riga.dataLimiteProduzione}`}
                              >
                                ⏳ {riga.dataLimiteProduzione.split('-').slice(1).reverse().join('/')}{' '}
                                {riga.giorniRimanenti !== undefined && `(${riga.giorniRimanenti >= 0 ? `${riga.giorniRimanenti}gg` : 'urgente'})`}
                              </span>
                            ) : riga.inRitardoConsegna ? (
                              /* Materiale ordinato ma in ritardo rispetto all'avvio produzione OdP: lampeggia in rosso per sollecitare! */
                              <span
                                className="text-[10px] font-mono font-black tracking-tight px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600 animate-pulse"
                                title={`SOLLECITARE FORNITORE! OdP richiedeva avvio il ${riga.dataLimiteProduzione}. Consegna stimata: ${
                                  riga.dataArrivoPrevistaFornitore || 'N/D'
                                }`}
                              >
                                ⚠️ RIT. {riga.dataLimiteProduzione.split('-').slice(1).reverse().join('/')}{' '}
                                {riga.dataArrivoPrevistaFornitore && (
                                  <span className="text-[9px] text-rose-200">
                                    (Arr. {riga.dataArrivoPrevistaFornitore.split('-').slice(1).reverse().join('/')})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span
                                className="text-[10px] font-mono text-slate-400"
                                title={`Pezzi coperti. Produzione prevista il ${riga.dataLimiteProduzione}`}
                              >
                                Prev. {riga.dataLimiteProduzione.split('-').slice(1).reverse().join('/')}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-600">A scorta</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Giacenza & Scorta */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col items-center justify-center min-h-[44px]">
                          <span className="font-semibold text-slate-100 text-xs font-mono">
                            {riga.giacenzaAttuale} {mat.unita_misura}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Scorta: {riga.scortaMinima} {mat.unita_misura}
                          </span>
                        </div>
                      </td>

                      {/* 4. Fabbisogno Lordo & OdP Coinvolti */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col items-center justify-center min-h-[44px] gap-1">
                          <span className="font-bold text-amber-400 text-xs font-mono">
                            {riga.fabbisognoLordo} {mat.unita_misura}
                          </span>
                          <div className="flex flex-wrap justify-center gap-1 max-w-[140px]">
                            {riga.ordiniCoinvolti.map((code) => (
                              <span
                                key={code}
                                className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/80"
                                title="OdP in lavorazione che richiede questa barra"
                              >
                                {code}
                              </span>
                            ))}
                            {riga.ordiniCoinvolti.length === 0 && (
                              <span className="text-slate-600 text-[10px]">-</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. Fabbisogno Netto */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <div className="flex flex-col items-center justify-center min-h-[44px] gap-1">
                          {riga.mancanteProduzione > 0 ? (
                            <>
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-mono font-black text-rose-300 bg-rose-950/80 border border-rose-800/80 shadow-xs">
                                + {riga.mancanteProduzione} {mat.unita_misura}
                              </span>
                              <span className="text-[10px] text-rose-400 font-semibold tracking-tight">Deficit Produzione OdP</span>
                            </>
                          ) : riga.fabbisognoNetto > 0 && riga.quantitaInArrivo > 0 ? (
                            <>
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold text-sky-200 bg-sky-950/80 border border-sky-700/80">
                                ✓ OdP Coperti
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium tracking-tight">+{riga.fabbisognoNetto} {mat.unita_misura} p/ Scorta</span>
                            </>
                          ) : riga.fabbisognoNetto > 0 ? (
                            <>
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold text-amber-200 bg-amber-950/80 border border-amber-700/80">
                                + {riga.fabbisognoNetto} {mat.unita_misura}
                              </span>
                              <span className="text-[10px] text-amber-400/90 font-medium tracking-tight">Reintegro Scorta</span>
                            </>
                          ) : (
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60">
                              0 (Coperto)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. In Arrivo & Stato */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <div className="flex flex-col items-center justify-center min-h-[44px] gap-1">
                          {riga.quantitaInArrivo > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center justify-center font-mono font-bold text-xs text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-700/80">
                                📦 {riga.quantitaInArrivo} {mat.unita_misura}
                              </span>
                              {riga.ordiniFornitoreAperti.length > 0 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setOdaInVisualizzazione(riga.ordiniFornitoreAperti[0])}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer"
                                    title={`Visualizza/Stampa Ordine d'Acquisto ${riga.ordiniFornitoreAperti[0].numero_oda || 'OdA'}`}
                                  >
                                    <FileText className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => apriModificaOrdineFornitore(riga.ordiniFornitoreAperti[0])}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500 transition-colors cursor-pointer"
                                    title="Aggiorna data di arrivo prevista o note fornitore (Sollecito Uff. Acquisti)"
                                  >
                                    <Clock className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : null}
                          {/* Badge Preventivo Richiesto */}
                          {materialiInPreventivoIds.includes(mat.id) && riga.quantitaInArrivo === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/60 inline-flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" /> Preventivo Richiesto
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center justify-center gap-1 ${
                              riga.stato === 'in_arrivo'
                                ? 'bg-sky-950/80 text-sky-300 border-sky-700 font-black'
                                : isCritico
                                ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : isAttenzione
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {riga.stato === 'in_arrivo'
                              ? '🔒 IN ARRIVO'
                              : isCritico
                              ? 'ORDINA SUBITO'
                              : isAttenzione
                              ? 'SOTTO SCORTA'
                              : 'OK DISPONIBILE'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Azioni Acquisti */}
                      <td className="py-3 px-3.5 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Se ci sono ordini fornitore aperti (In Arrivo) */}
                          {riga.ordiniFornitoreAperti.length > 0 && (
                            <button
                              onClick={() => apriRicezioneOrdineFornitore(riga.ordiniFornitoreAperti[0], riga.ordiniFornitoreAperti)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                              title={`Registra arrivo DDT (${riga.ordiniFornitoreAperti.length} ordine/i aperto/i)`}
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Arrivato DDT</span>
                              {riga.ordiniFornitoreAperti.length > 1 && (
                                <span className="ml-1 px-1.5 py-0.2 bg-emerald-800 text-[10px] rounded-full">
                                  {riga.ordiniFornitoreAperti.length}
                                </span>
                              )}
                            </button>
                          )}

                          {/* Se c'è ancora fabbisogno scoperto oltre a quello ordinato (o nessun ordine) */}
                          {riga.fabbisognoNetto > 0 && (
                            <button
                              onClick={() => apriModaleOrdineFornitore(riga)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                              title={
                                riga.quantitaInArrivo > 0
                                  ? `Ordina ulteriore quota mancante (+${riga.fabbisognoNetto} ${mat.unita_misura})`
                                  : 'Emetti ordine a fornitore per copertura fabbisogno'
                              }
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Ordina</span>
                            </button>
                          )}

                          {/* Carico manuale rapido se non ci sono ordini fornitore aperti */}
                          {riga.ordiniFornitoreAperti.length === 0 && (
                            <button
                              onClick={() => apriCaricoPerArticolo(mat.id)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                              title={`Carico manuale DDT ${mat.codice_articolo}`}
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {righeMrpFiltrate.length === 0 && (
              <div className="py-12 px-4 text-center space-y-3">
                <Boxes className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  Nessun materiale corrisponde ai criteri di ricerca
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Prova a verificare il codice cercato o clicca su &quot;Tutti&quot; per azzerare i filtri.
                </p>
                {(filtroRicerca || filtroStato !== 'tutti') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroRicerca('')
                      setFiltroStato('tutti')
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-orange-400" />
                    <span>Azzera Ricerca e Filtri</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* BARRA CONTROLLI PAGINAZIONE INTELLIGENTE */}
          {totaleElementi > 0 && (
            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Visualizzati <strong className="text-white">{indiceInizio + 1} - {indiceFine}</strong> di{' '}
                  <strong className="text-white">{totaleElementi}</strong> materiali
                </span>
                <span className="text-slate-600">•</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span>Mostra:</span>
                  <select
                    value={elementiPerPagina}
                    onChange={(e) => setElementiPerPagina(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
              </div>

              {totalePagine > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={paginaCorrente === 1}
                    onClick={() => setPaginaCorrente((prev) => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Pagina Precedente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalePagine }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalePagine || Math.abs(p - paginaCorrente) <= 1)
                      .map((p, idx, array) => {
                        const showEllipsis = idx > 0 && p - array[idx - 1] > 1
                        return (
                          <div key={p} className="flex items-center gap-1">
                            {showEllipsis && <span className="px-1 text-slate-600 font-bold">...</span>}
                            <button
                              type="button"
                              onClick={() => setPaginaCorrente(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                paginaCorrente === p
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        )
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={paginaCorrente === totalePagine}
                    onClick={() => setPaginaCorrente((prev) => Math.min(totalePagine, prev + 1))}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Pagina Successiva"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALE REGISTRA ARRIVO MERCE (DDT) */}
      {modaleCaricoAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  {ordineFornitoreInRicezioneId ? 'Ricezione Merce da Fornitore (DDT)' : 'Registra Entrata Merci (DDT)'}
                </h2>
                {ordineFornitoreInRicezioneId && (
                  <p className="text-xs text-emerald-400 mt-0.5">
                    Riferimento a ordine fornitore in arrivo: la registrazione chiuderà l&apos;ordine e caricherà il materiale a magazzino.
                  </p>
                )}
              </div>
              <button
                onClick={() => setModaleCaricoAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegistraCarico} id="form-carico-ddt" className="p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
              {/* Selezione con Ricerca Rapida del Materiale */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Cerca e Seleziona Materia Prima / Componente *
                </label>

                {/* Input di Ricerca Immediata */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ricercaMaterialeCarico}
                    onChange={(e) => setRicercaMaterialeCarico(e.target.value)}
                    placeholder="Digita codice (es: SAG, TON, ALL) o descrizione..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  {ricercaMaterialeCarico && (
                    <button
                      type="button"
                      onClick={() => setRicercaMaterialeCarico('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Lista Risultati Ricerca con Selezione con 1 Click */}
                <div className="max-h-44 overflow-y-auto space-y-1 border border-slate-800/80 rounded-xl bg-slate-950/80 p-1.5 divide-y divide-slate-800/40">
                  {materialiFiltratiPerCarico.map((m) => {
                    const isSelected = formCarico.articolo_id === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setFormCarico({ ...formCarico, articolo_id: m.id })
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white font-semibold shadow-sm'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className={`font-mono font-bold block ${isSelected ? 'text-white' : 'text-orange-400'}`}>
                            {m.codice_articolo}
                          </span>
                          <span className={`text-[11px] truncate block ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                            {m.descrizione}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`block font-mono text-[11px] ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            Giac: {m.giacenza_attuale} {m.unita_misura}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1 justify-end">
                              <Check className="w-3 h-3" /> Selezionato
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}

                  {materialiFiltratiPerCarico.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Nessun materiale trovato per &quot;{ricercaMaterialeCarico}&quot;.
                    </div>
                  )}
                </div>

                {/* Badge Materiale Attualmente Selezionato */}
                {formCarico.articolo_id && (
                  <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      Materiale pronto al carico:{' '}
                      <strong className="text-orange-400 font-mono">
                        {articoli.find((a) => a.id === formCarico.articolo_id)?.codice_articolo}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      Giacenza attuale: {articoli.find((a) => a.id === formCarico.articolo_id)?.giacenza_attuale}{' '}
                      {articoli.find((a) => a.id === formCarico.articolo_id)?.unita_misura}
                    </span>
                  </div>
                )}
              </div>

              {/* SELEZIONE ORDINE FORNITORE SPECIFICO (Se ce ne sono in arrivo) */}
              {ordiniFornitoreDisponibiliArticolo.length > 0 && (
                <div className="p-3 bg-sky-950/30 border border-sky-800/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-sky-400" />
                      Quale ordine fornitore stai ricevendo con questo DDT?
                    </label>
                    <span className="text-[10px] text-sky-400 font-mono">
                      {ordiniFornitoreDisponibiliArticolo.length} in arrivo
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Opzione 1: Ricezione cumulativa di TUTTI gli ordini aperti */}
                    {ordiniFornitoreDisponibiliArticolo.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const tot = ordiniFornitoreDisponibiliArticolo.reduce((acc, o) => acc + o.quantita_ordinata, 0)
                          setOrdineFornitoreInRicezioneId('TUTTI_APERTI')
                          setFormCarico({
                            ...formCarico,
                            quantita_entrata: Number(tot.toFixed(2)),
                            note: `Ricezione cumulativa di ${ordiniFornitoreDisponibiliArticolo.length} ordini fornitore`
                          })
                        }}
                        className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          ordineFornitoreInRicezioneId === 'TUTTI_APERTI'
                            ? 'bg-sky-600/30 border-sky-400 text-white font-semibold shadow-inner'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white flex items-center gap-1">
                            📦 Salda e ricevi TUTTI gli ordini in arrivo insieme
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Chiuderà tutti i {ordiniFornitoreDisponibiliArticolo.length} ordini aperti per questo articolo
                          </span>
                        </div>
                        <span className="font-mono font-black text-sky-300 text-sm">
                          {Number(ordiniFornitoreDisponibiliArticolo.reduce((acc, o) => acc + o.quantita_ordinata, 0).toFixed(2))}
                        </span>
                      </button>
                    )}

                    {/* Elenco dei singoli ordini specifici */}
                    {ordiniFornitoreDisponibiliArticolo.map((ord, idx) => {
                      const isSelected = ordineFornitoreInRicezioneId === ord.id
                      return (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => {
                            setOrdineFornitoreInRicezioneId(ord.id)
                            setFormCarico({
                              ...formCarico,
                              quantita_entrata: ord.quantita_ordinata,
                              fornitore_nome: ord.fornitore_nome || formCarico.fornitore_nome,
                              note: ord.note ? `Rif. Ordine Fornitore: ${ord.note}` : formCarico.note
                            })
                          }}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-inner'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">
                                {ord.numero_oda || `Ordine #${idx + 1}`}
                              </span>
                              {ord.fornitore_nome && (
                                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/80">
                                  {ord.fornitore_nome}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                Emesso il {ord.data_ordine || 'N/D'}
                              </span>
                              {ord.data_arrivo_prevista && (
                                <span className="text-[10px] text-sky-300">
                                  (Prev. {ord.data_arrivo_prevista})
                                </span>
                              )}
                            </div>
                            {ord.note && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5" title={ord.note}>
                                {ord.note}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-emerald-400 text-sm block">
                              {ord.quantita_ordinata} {articoli.find((a) => a.id === formCarico.articolo_id)?.unita_misura}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-0.5 justify-end">
                                <Check className="w-2.5 h-2.5" /> Selezionato
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}

                    {/* Opzione: Carico svincolato da ordini */}
                    <button
                      type="button"
                      onClick={() => setOrdineFornitoreInRicezioneId(null)}
                      className={`w-full p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        ordineFornitoreInRicezioneId === null
                          ? 'bg-slate-800 border-slate-600 text-white font-medium'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-[11px]">
                        ℹ️ Nessuno di questi (Carico manuale extra senza chiudere gli ordini fornitore)
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantità Arrivata (+) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formCarico.quantita_entrata}
                    onChange={(e) => setFormCarico({ ...formCarico, quantita_entrata: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-bold text-orange-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numero DDT / Bolla
                  </label>
                  <input
                    type="text"
                    placeholder="es: DDT-2026/894"
                    value={formCarico.ddt_riferimento}
                    onChange={(e) => setFormCarico({ ...formCarico, ddt_riferimento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* SELEZIONE ALTRI MATERIALI IN ARRIVO CON LO STESSO DDT */}
              {altriMaterialiFornitoreSelezionati.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-600/50 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-emerald-400" />
                      Altri codici ordinati a {formCarico.fornitore_nome || 'questo fornitore'} (arrivati con lo stesso DDT?):
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {altriMaterialiFornitoreSelezionati.filter((x) => x.selezionato).length} di {altriMaterialiFornitoreSelezionati.length} inclusi
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Spunta gli articoli presenti nella stessa bolla di consegna per registrarli insieme in un solo clic:
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {altriMaterialiFornitoreSelezionati.map((extra, idx) => (
                      <div
                        key={`${extra.ordine_id}-${extra.articolo_id}`}
                        className={`p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between gap-3 ${
                          extra.selezionato
                            ? 'bg-emerald-950/70 border-emerald-500/80 shadow-xs'
                            : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-75'
                        }`}
                      >
                        <label className="flex items-start gap-2.5 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={extra.selezionato}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setAltriMaterialiFornitoreSelezionati((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, selezionato: checked } : item))
                              )
                            }}
                            className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-orange-400">
                                {extra.codice_articolo}
                              </span>
                              {extra.numero_oda && (
                                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1 rounded border border-cyan-800/80">
                                  {extra.numero_oda}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-300 text-[11px] truncate block">
                              {extra.descrizione}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Ordinati: {extra.quantita_ordinata} {extra.unita_misura}
                            </span>
                          </div>
                        </label>

                        {extra.selezionato && (
                          <div className="w-24 shrink-0 text-right">
                            <span className="block text-[10px] text-slate-400 mb-0.5">Q.tà Arrivata:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={extra.quantita_entrata}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setAltriMaterialiFornitoreSelezionati((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, quantita_entrata: val } : item))
                                )
                              }}
                              className="w-full px-2 py-1 rounded bg-slate-900 border border-emerald-600/70 text-right font-mono font-bold text-emerald-300 text-xs focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fornitore / Acciaieria Mittente DDT *
                </label>
                <SelettoreFornitoreRicerca
                  fornitori={fornitoriDisponibili.filter(
                    (f) => !f.tipo_fornitore || f.tipo_fornitore === 'materia_prima'
                  )}
                  fornitoreNomeSelezionato={formCarico.fornitore_nome}
                  onSeleziona={(forn) => {
                    const nome = forn ? forn.ragione_sociale : ''
                    setFormCarico({
                      ...formCarico,
                      fornitore_nome: nome
                    })

                    // Se l'utente cambia fornitore nel selettore, ricalcola al volo gli ordini aperti di quel fornitore!
                    if (nome) {
                      const altri: {
                        ordine_id: string
                        articolo_id: string
                        codice_articolo: string
                        descrizione: string
                        unita_misura: string
                        quantita_ordinata: number
                        quantita_entrata: number
                        selezionato: boolean
                        numero_oda?: string
                      }[] = []

                      ordiniFornitori.forEach((o) => {
                        if (
                          o.stato === 'in_ordine' &&
                          o.fornitore_nome &&
                          o.fornitore_nome.trim().toLowerCase() === nome.trim().toLowerCase()
                        ) {
                          if (o.righe && o.righe.length > 0) {
                            o.righe.forEach((r) => {
                              if (r.articolo_id === formCarico.articolo_id) return
                              const artInfo = articoli.find((a) => a.id === r.articolo_id)
                              altri.push({
                                ordine_id: o.id,
                                articolo_id: r.articolo_id,
                                codice_articolo: r.codice_articolo || artInfo?.codice_articolo || 'MAT-RAW',
                                descrizione: r.descrizione || artInfo?.descrizione || 'Materia prima',
                                unita_misura: r.unita_misura || artInfo?.unita_misura || 'm',
                                quantita_ordinata: r.quantita_ordinata,
                                quantita_entrata: r.quantita_ordinata,
                                selezionato: true,
                                numero_oda: o.numero_oda
                              })
                            })
                          } else if (o.articolo_id !== formCarico.articolo_id) {
                            const artInfo = articoli.find((a) => a.id === o.articolo_id)
                            altri.push({
                              ordine_id: o.id,
                              articolo_id: o.articolo_id,
                              codice_articolo: artInfo?.codice_articolo || 'MAT-RAW',
                              descrizione: artInfo?.descrizione || 'Materia prima',
                              unita_misura: artInfo?.unita_misura || 'm',
                              quantita_ordinata: o.quantita_ordinata,
                              quantita_entrata: o.quantita_ordinata,
                              selezionato: true,
                              numero_oda: o.numero_oda
                            })
                          }
                        }
                      })
                      setAltriMaterialiFornitoreSelezionati(altri)
                    } else {
                      setAltriMaterialiFornitoreSelezionati([])
                    }
                  }}
                  placeholder="Cerca fornitore o seleziona chi ha spedito il DDT..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note di Arrivo / Colata Acciaio / Certificato 3.1
                </label>
                <textarea
                  rows={2}
                  placeholder="Note colata, certificato di conformità, collocazione scaffale..."
                  value={formCarico.note}
                  onChange={(e) => setFormCarico({ ...formCarico, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {formCarico.articolo_id && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Riepilogo Giacenza Post-Carico:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {articoli.find((a) => a.id === formCarico.articolo_id)?.giacenza_attuale || 0} + {formCarico.quantita_entrata} ={' '}
                    {((articoli.find((a) => a.id === formCarico.articolo_id)?.giacenza_attuale || 0) + Number(formCarico.quantita_entrata)).toFixed(2)}{' '}
                    {articoli.find((a) => a.id === formCarico.articolo_id)?.unita_misura}
                  </span>
                </div>
              )}
            </form>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setModaleCaricoAperta(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                form="form-carico-ddt"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Conferma Carico a Magazzino</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ANTI-DOPPIO ORDINE: REGISTRA ORDINE A FORNITORE (SINGOLO O MULTI-RIGA) */}
      {modaleOrdineAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-sky-400" />
                <span>
                  {righeOrdineMultiplo.length > 1
                    ? `Emissione Ordine d'Acquisto Cumulativo (${righeOrdineMultiplo.length} Materiali)`
                    : "Registra Emissione Ordine d'Acquisto (OdA)"}
                </span>
              </h2>
              <button
                onClick={() => setModaleOrdineAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfermaOrdineFornitore} id="form-ordine-fornitore" className="p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
              {/* Selezione Fornitore in Cima */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fornitore Assegnato (Offerta Accettata) *
                </label>
                <SelettoreFornitoreRicerca
                  fornitori={fornitoriDisponibili.filter(
                    (f) => !f.tipo_fornitore || f.tipo_fornitore === 'materia_prima'
                  )}
                  fornitoreNomeSelezionato={formOrdineFornitore.fornitore_nome}
                  onSeleziona={(forn) => {
                    setFormOrdineFornitore({
                      ...formOrdineFornitore,
                      fornitore_nome: forn ? forn.ragione_sociale : ''
                    })
                  }}
                  placeholder="Cerca fornitore per nome, città, P.IVA..."
                />
              </div>

              {/* Data di Consegna Concordata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Consegna Concordata / Promessa dal Fornitore *
                  </label>
                  <input
                    type="date"
                    required
                    value={formOrdineFornitore.data_arrivo_prevista}
                    onChange={(e) =>
                      setFormOrdineFornitore({ ...formOrdineFornitore, data_arrivo_prevista: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                {formOrdineFornitore.data_limite_richiesta && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <span className="text-slate-400 block text-[10px]">Data Limite Officina (Per Quando):</span>
                    <span className="font-mono font-bold text-orange-400">
                      {formOrdineFornitore.data_limite_richiesta.split('-').reverse().join('/')}
                    </span>
                  </div>
                )}
              </div>

              {/* TABELLA RIGHE ARTICOLO (Multipla o Singola) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    Materiali Inclusi nell&apos;Ordine ({righeOrdineMultiplo.length > 0 ? righeOrdineMultiplo.length : 1}):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Modifica q.tà e prezzo pattuito per ciascuna barra
                  </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {(righeOrdineMultiplo.length > 0
                    ? righeOrdineMultiplo
                    : [
                        {
                          articolo_id: formOrdineFornitore.articolo_id,
                          codice_articolo:
                            articoli.find((a) => a.id === formOrdineFornitore.articolo_id)?.codice_articolo || 'MAT-RAW',
                          descrizione:
                            articoli.find((a) => a.id === formOrdineFornitore.articolo_id)?.descrizione ||
                            formOrdineFornitore.nome_materiale,
                          unita_misura: formOrdineFornitore.unita_misura,
                          quantita_ordinata: formOrdineFornitore.quantita_ordinata,
                          quantita_teorica: formOrdineFornitore.quantita_teorica,
                          prezzo_unitario: formOrdineFornitore.prezzo_unitario,
                          odp_coinvolti_stringa: formOrdineFornitore.odp_coinvolti_stringa,
                          data_limite_richiesta: formOrdineFornitore.data_limite_richiesta
                        }
                      ]
                  ).map((riga, index) => {
                    const totaleRiga = Number(((riga.quantita_ordinata || 0) * (riga.prezzo_unitario || 0)).toFixed(2))

                    return (
                      <div
                        key={riga.articolo_id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-orange-400 text-xs">
                              {riga.codice_articolo}
                            </span>
                            <span className="text-xs text-slate-200 ml-2 font-medium">
                              {riga.descrizione}
                            </span>
                            {riga.odp_coinvolti_stringa && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Destinato a OdP: <strong className="font-mono text-slate-300">{riga.odp_coinvolti_stringa}</strong>
                              </div>
                            )}
                          </div>
                          <span className="font-mono font-bold text-xs text-emerald-400 shrink-0">
                            € {totaleRiga.toFixed(2)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <div className="flex items-center justify-between mb-1 text-[11px]">
                              <span className="text-slate-400">Quantità ({riga.unita_misura}):</span>
                              {riga.unita_misura === 'm' && riga.quantita_teorica > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const verghe = Math.ceil(riga.quantita_teorica / 6)
                                    const qtaVerghe = verghe * 6
                                    if (righeOrdineMultiplo.length > 0) {
                                      setRigheOrdineMultiplo((prev) =>
                                        prev.map((item, i) =>
                                          i === index ? { ...item, quantita_ordinata: qtaVerghe } : item
                                        )
                                      )
                                    } else {
                                      setFormOrdineFornitore({ ...formOrdineFornitore, quantita_ordinata: qtaVerghe })
                                    }
                                  }}
                                  className="text-sky-400 hover:text-sky-300 underline font-semibold text-[10px] cursor-pointer"
                                  title="Arrotonda a verghe da 6m"
                                >
                                  ⚡ 6m ({Math.ceil(riga.quantita_teorica / 6) * 6}m)
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              required
                              value={riga.quantita_ordinata}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                if (righeOrdineMultiplo.length > 0) {
                                  setRigheOrdineMultiplo((prev) =>
                                    prev.map((item, i) => (i === index ? { ...item, quantita_ordinata: val } : item))
                                  )
                                } else {
                                  setFormOrdineFornitore({ ...formOrdineFornitore, quantita_ordinata: val })
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <span className="block text-[11px] text-slate-400 mb-1">
                              Prezzo Offerta (€ / {riga.unita_misura}):
                            </span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-bold">€</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={riga.prezzo_unitario || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  if (righeOrdineMultiplo.length > 0) {
                                    setRigheOrdineMultiplo((prev) =>
                                      prev.map((item, i) => (i === index ? { ...item, prezzo_unitario: val } : item))
                                    )
                                  } else {
                                    setFormOrdineFornitore({ ...formOrdineFornitore, prezzo_unitario: val })
                                  }
                                }}
                                placeholder="0.00"
                                className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* RIEPILOGO TOTALE IMPONIBILE OdA */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Totale Imponibile OdA Complessivo:
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    €{' '}
                    {(
                      righeOrdineMultiplo.length > 0
                        ? righeOrdineMultiplo.reduce(
                            (acc, r) => acc + (r.quantita_ordinata || 0) * (r.prezzo_unitario || 0),
                            0
                          )
                        : (formOrdineFornitore.quantita_ordinata || 0) * (formOrdineFornitore.prezzo_unitario || 0)
                    ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Checkbox Opzione Aggiornamento Costo Riferimento Futuro */}
                <label className="flex items-center gap-2 pt-1 text-xs text-slate-300 cursor-pointer border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={aggiornaPrezzoArticolo}
                    onChange={(e) => setAggiornaPrezzoArticolo(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-sky-500"
                  />
                  <span>
                    Aggiorna costo di riferimento materie prime con questi prezzi concordati{' '}
                    <strong className="text-slate-400 text-[11px]">(per i futuri calcoli OdP, senza toccare gli ordini vecchi)</strong>
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Ordine d&apos;Acquisto / Istruzioni di Consegna
                </label>
                <textarea
                  rows={2}
                  value={formOrdineFornitore.note}
                  onChange={(e) =>
                    setFormOrdineFornitore({ ...formOrdineFornitore, note: e.target.value })
                  }
                  placeholder="Riferimento offerta n., certificato 3.1 richiesto..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </form>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setModaleOrdineAperta(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                form="form-ordine-fornitore"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {righeOrdineMultiplo.length > 1
                    ? `Emetti OdA Cumulativo (${righeOrdineMultiplo.length} Righe)`
                    : 'Conferma ed Emetti OdA'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE MODIFICA ORDINE FORNITORE / SOLLECITO UFFICIO ACQUISTI */}
      {modaleSollecitoAperta && ordineInModifica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  Aggiorna Consegna / Sollecito
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ufficio Acquisti: modifica data di arrivo prevista o annota solleciti fornitore
                </p>
              </div>
              <button
                onClick={() => setModaleSollecitoAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaModificaOrdineFornitore} id="form-sollecito" className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Articolo:</span>
                <span className="font-mono font-bold text-orange-400">
                  {articoli.find((a) => a.id === ordineInModifica.articolo_id)?.codice_articolo}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nuova Data di Consegna Prevista *
                </label>
                <input
                  type="date"
                  required
                  value={formSollecito.data_arrivo_prevista}
                  onChange={(e) => setFormSollecito({ ...formSollecito, data_arrivo_prevista: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-sky-300 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantità Ordinata
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formSollecito.quantita_ordinata}
                    onChange={(e) => setFormSollecito({ ...formSollecito, quantita_ordinata: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fornitore
                  </label>
                  <input
                    type="text"
                    value={formSollecito.fornitore_nome}
                    onChange={(e) => setFormSollecito({ ...formSollecito, fornitore_nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Sollecito / Chiamata Fornitore
                </label>
                <textarea
                  rows={3}
                  placeholder="es: Telefonato a Rodacciai, confermano carico camion giovedì mattina..."
                  value={formSollecito.note}
                  onChange={(e) => setFormSollecito({ ...formSollecito, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </form>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80 rounded-b-2xl">
              <button
                type="button"
                onClick={() => handleAnnullaOrdineFornitore(ordineInModifica)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-all cursor-pointer flex items-center gap-1.5"
                title="Annulla questo ordine fornitore e rimuovi dal calcolo in arrivo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Annulla OdA</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModaleSollecitoAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Chiudi
                </button>
                <button
                  type="submit"
                  form="form-sollecito"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salva Aggiornamento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RICHIESTA PREVENTIVO MULTI-MATERIALE EMAIL */}
      {modalePreventivoAperta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modale */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Richiesta Preventivo Fornitori ({vociPreventivo.length} Materiali)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifica le quantità se desideri arrotondare e genera la mail pronta da inviare.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalePreventivoAperta(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo Modale */}
            <div className="p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
              {/* Selezione Multipla Intelligente dei Fornitori (con Ricerca e CCO automatico) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Fornitori Destinatari ({fornitoriPreventivoSelezionati.length} selezionati)
                  </label>
                  {fornitoriPreventivoSelezionati.length > 1 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      🔒 Invio in CCO (Copia Nascosta Protetta)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Cerca e seleziona 1 o più fornitori. Se ne selezioni più d&apos;uno, verranno inseriti automaticamente in <strong>CCN / CCO</strong>, così non sapranno di essere in concorrenza tra loro.
                </p>

                <SelettoreFornitoriMultiplo
                  fornitori={fornitoriDisponibili}
                  fornitoriSelezionati={fornitoriPreventivoSelezionati}
                  onChange={(nuovi) => setFornitoriPreventivoSelezionati(nuovi)}
                  placeholder="Cerca fornitore per nome, tondi, alluminio, acciai..."
                />
              </div>

              {/* Tabella Materiali con quantità modificabili */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Materiali Selezionati (Quantità Proposta vs Richiesta)
                </label>
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/60">
                  {vociPreventivo.map((v, idx) => (
                    <div key={v.articolo_id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-orange-400 text-xs">
                            {v.codice_articolo}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            {v.descrizione}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Fabbisogno calcolato da MRP: <strong className="text-slate-300">{v.fabbisognoCalcolato} {v.unita_misura}</strong>
                          {v.dataRichiesta && ` • Consegna desiderata: ${v.dataRichiesta.split('-').reverse().join('/')}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-400 whitespace-nowrap">
                          Quantità da chiedere:
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={v.quantitaDaChiedere}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setVociPreventivo((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, quantitaDaChiedere: val } : item))
                            )
                          }}
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold font-mono text-white text-center focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-xs font-semibold text-slate-400 w-8">
                          {v.unita_misura}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anteprima Testo Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Anteprima Testo Email che riceverà il Fornitore:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopiaTestoPreventivo}
                    className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copia testo</span>
                  </button>
                </div>
                <textarea
                  rows={7}
                  readOnly
                  value={generaTestoEmailPreventivo()}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer Azioni */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setModalePreventivoAperta(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Chiudi
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiaTestoPreventivo}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copia Testo</span>
                </button>

                <button
                  type="button"
                  onClick={handleInviaEmailPreventivo}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Apri Client Email (Invia)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDA ODA STAMPABILE (MODALE A4 IDENTICA AI DDT) */}
      {odaInVisualizzazione && (
        <SchedaOdAStampabile
          ordine={odaInVisualizzazione}
          fornitore={fornitoriDisponibili.find(
            (f) =>
              f.ragione_sociale.trim().toLowerCase() ===
              (odaInVisualizzazione.fornitore_nome || '').trim().toLowerCase()
          )}
          onChiudi={() => setOdaInVisualizzazione(null)}
        />
      )}
    </div>
  )
}
