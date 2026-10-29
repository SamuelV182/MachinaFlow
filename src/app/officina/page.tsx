'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  QrCode,
  Cpu,
  Clock,
  Play,
  CheckCircle,
  Pause,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Factory,
  MessageSquare,
  Search,
  Maximize2,
  Lock,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  LayoutGrid,
  List,
  LogOut,
  Monitor,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Calendar,
  Hourglass,
  Printer,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Truck,
  ExternalLink
} from 'lucide-react'
import {
  CentroLavoro,
  OrdineProduzione,
  FaseOdP,
  Articolo,
  ComponenteDistintaBase,
  DocumentoTrasportoEsterno,
  FornitoreTerzista,
  OrdineCliente,
  RigaOrdineCliente,
  Cliente
} from '@/types/database'
import { SEED_FORNITORI_TERZISTI, SEED_ORDINI_CLIENTI, SEED_CLIENTI } from '@/lib/data-service'
import SchedaDDTStampabile from '@/components/SchedaDDTStampabile'
import {
  SEED_CENTRI_LAVORO,
  SEED_ODP,
  SEED_ARTICOLI,
  SEED_DISTINTA_BASE
} from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

export default function TerminaleOfficinaPage() {
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi: FaseOdP[] })[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [distinte, setDistinte] = useState<ComponenteDistintaBase[]>([])

  const [macchinaSelezionataId, setMacchinaSelezionataId] = useState<string>('tutte')
  const [modalitaVista, setModalitaVista] = useState<'cards' | 'tabella'>('cards')
  const [ricercaQr, setRicercaQr] = useState<string>('')
  const [notifica, setNotifica] = useState<string | null>(null)

  // Paginazione e Gestione Fasi Completate per Bordo Macchina Ultra-Reattivo
  const [paginaCorrente, setPaginaCorrente] = useState<number>(1)
  const [mostraCompletati, setMostraCompletati] = useState<boolean>(false)
  const ELEMENTI_PER_PAGINA = 10

  // Gestione Login Postazione Kiosk
  // Valori possibili: null (non loggato / mostra login), 'supervisore' (vista globale capo officina), oppure id della specifica macchina
  const [postazioneLoginId, setPostazioneLoginId] = useState<string | null>(null)
  const [caricamentoSessione, setCaricamentoSessione] = useState(true)

  // Gestione PIN Responsabile per Sblocco Postazione
  const PIN_CORRETTO = '123456'
  const [modalePinAperta, setModalePinAperta] = useState(false)
  const [targetPostazioneId, setTargetPostazioneId] = useState<string | null>(null)
  const [azionePin, setAzionePin] = useState<'login' | 'logout'>('login')
  const [pinInserito, setPinInserito] = useState('')
  const [errorePin, setErrorePin] = useState<string | null>(null)

  // Modale inserimento note operatore
  const [modaleNoteAperta, setModaleNoteAperta] = useState(false)
  const [fasePerNota, setFasePerNota] = useState<{ odpId: string; faseId: string; notaAttuale: string } | null>(null)
  const [testoNota, setTestoNota] = useState('')

  // Modale Blindata Scheda A4 per Bordo Macchina (nessuna navigazione fuori dall'officina)
  const [schedaA4OdpId, setSchedaA4OdpId] = useState<string | null>(null)

  // Gestione Sdoppiamento Lotto (Split OdP Parziale)
  const [modaleSplitAperta, setModaleSplitAperta] = useState(false)
  const [datiSplit, setDatiSplit] = useState<{
    odp: OrdineProduzione & { fasi: FaseOdP[] }
    fase: FaseOdP
    quantitaDisponibile: number
    quantitaDaSplittare: number
  } | null>(null)

  // Gestione Completamento Fase con Quantità Reale
  const [modaleCompletaAperta, setModaleCompletaAperta] = useState(false)
  const [datiCompleta, setDatiCompleta] = useState<{
    odp: OrdineProduzione & { fasi: FaseOdP[] }
    fase: FaseOdP
    pezziBuoni: number
    pezziScarto: number
    opzioneResiduo: 'sospendi' | 'splitta_residuo'
    generaRipristinoScarto: boolean
    limiteMassimoConsentito: number
    nomeMateriaPrimaLimite?: string
  } | null>(null)

  // Gestione Lavorazioni Esterne Conto Terzi & DDT Completo
  const [modaleEsternaAperta, setModaleEsternaAperta] = useState(false)
  const [ddtStampabileCorrente, setDdtStampabileCorrente] = useState<DocumentoTrasportoEsterno | null>(null)
  
  // Anagrafica Fornitori Terzisti e Filtro Rapido
  const [fornitoriTerzisti, setFornitoriTerzisti] = useState<FornitoreTerzista[]>(SEED_FORNITORI_TERZISTI)
  const [filtroTerzistaSelezionato, setFiltroTerzistaSelezionato] = useState<string>('tutti')

  // Selezione Massiva OdP per Spedizione Cumulativa (Unico DDT per più ordini)
  const [fasiEsterneSelezionateIds, setFasiEsterneSelezionateIds] = useState<string[]>([])
  const [modaleSpedizioneCumulativaAperta, setModaleSpedizioneCumulativaAperta] = useState(false)
  const [formCumulativo, setFormCumulativo] = useState({
    ddtNumero: '',
    fornitoreNome: '',
    fornitoreId: '',
    fornitoreIndirizzo: '',
    fornitorePiva: '',
    numeroColli: 1,
    pesoTotaleKg: 0,
    vettoreNome: 'Mittente (Mezzo Proprio)',
    aspettoBeni: 'A vista su bancale',
    causaleTrasporto: 'Invio per Conto Lavorazione',
    note: ''
  })

  const [datiEsterna, setDatiEsterna] = useState<{
    odp: OrdineProduzione & { fasi: FaseOdP[] }
    fase: FaseOdP
    tipoAzione: 'spedizione' | 'rientro'
    ddtNumero: string
    note: string
    numeroColli: number
    pesoTotaleKg: number
    vettoreNome: string
    aspettoBeni: string
    causaleTrasporto: string
  } | null>(null)

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

      const centriSalvati = parseSicuro<CentroLavoro[]>('machinaflow_centri_lavoro', [])
      const mappaCentri = new Map<string, CentroLavoro>()
      SEED_CENTRI_LAVORO.forEach((c) => mappaCentri.set(c.id, c))
      centriSalvati.forEach((c) => mappaCentri.set(c.id, c))
      const centriCompleti = Array.from(mappaCentri.values())
      setCentriLavoro(centriCompleti)

      setArticoli(parseSicuro('machinaflow_articoli', SEED_ARTICOLI))
      setDistinte(parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE))

      // Carica anagrafica terzisti aggiornata dall'ufficio
      const terzistiSalvati = parseSicuro<FornitoreTerzista[]>('machinaflow_fornitori_terzisti', [])
      if (terzistiSalvati.length > 0) {
        const mappaTerz = new Map<string, FornitoreTerzista>()
        SEED_FORNITORI_TERZISTI.forEach((t) => mappaTerz.set(t.id, t))
        terzistiSalvati.forEach((t) => mappaTerz.set(t.id, t))
        setFornitoriTerzisti(Array.from(mappaTerz.values()))
      } else {
        setFornitoriTerzisti(SEED_FORNITORI_TERZISTI)
      }

      // Carica OdP sincronizzati dal Cloud Supabase (ottimizzato per tablet: solo ordini attivi)
      const odpSincronizzati = await syncService.getOrdiniProduzione({ soloAttivi: true })
      // Allineamento configurazione: se una fase ha is_esterna: true, assicura centro e stato coerenti
      const odpNormalizzati = odpSincronizzati.map((o) => ({
        ...o,
        fasi: o.fasi.map((f) => {
          // La lavorazione esterna è determinata TASSATIVAMENTE dalla configurazione del ciclo (is_esterna === true oppure centro_lavoro_id === 'mc-esterna-01')
          const isConfigurataEsterna = Boolean(f.is_esterna || f.centro_lavoro_id === 'mc-esterna-01' || f.tipo_processo_id === 'proc-esterna')

          if (isConfigurataEsterna) {
            return {
              ...f,
              is_esterna: true,
              centro_lavoro_id: 'mc-esterna-01',
              stato_esterna: f.stato_esterna || (f.stato === 'in_corso' ? 'inviato_al_terzista' : f.stato === 'completata' ? 'rientrato' : 'in_attesa_uscita')
            }
          }
          return f
        })
      }))
      setOdpList(odpNormalizzati)

      // Recupera la postazione salvata nel tablet
      const salvata = localStorage.getItem('machinaflow_postazione_corrente_id')
      if (salvata) {
        setPostazioneLoginId(salvata)
        setMacchinaSelezionataId(salvata === 'supervisore' ? 'tutte' : salvata)
      }
      setCaricamentoSessione(false)
    }

    caricaDati()

    // Sottoscrizione Real-Time nativa Supabase:
    // Quando qualsiasi postazione in officina o ufficio completa/avvia una fase o aggiorna un OdP,
    // questo terminale aggiorna la sua coda di lavoro istantaneamente e silenziosamente
    const disiscrivi = syncService.sottoscriviAvanzamentoProduzione(async () => {
      const aggiornati = await syncService.getOrdiniProduzione({ soloAttivi: true })
      const normalizzati = aggiornati.map((o) => ({
        ...o,
        fasi: o.fasi.map((f) => {
          const isConfigurataEsterna = Boolean(f.is_esterna || f.centro_lavoro_id === 'mc-esterna-01' || f.tipo_processo_id === 'proc-esterna')

          if (isConfigurataEsterna) {
            return {
              ...f,
              is_esterna: true,
              centro_lavoro_id: 'mc-esterna-01',
              stato_esterna: f.stato_esterna || (f.stato === 'in_corso' ? 'inviato_al_terzista' : f.stato === 'completata' ? 'rientrato' : 'in_attesa_uscita')
            }
          }
          return f
        })
      }))
      setOdpList(normalizzati)
    })

    return () => {
      disiscrivi()
    }
  }, [])

  // Reset pagina alla variazione di macchina selezionata, ricerca o toggle completati
  useEffect(() => {
    setPaginaCorrente(1)
  }, [macchinaSelezionataId, ricercaQr, mostraCompletati])

  // Apertura modale richiesta PIN
  const richiediPinPerLogin = (idPostazione: string) => {
    setTargetPostazioneId(idPostazione)
    setAzionePin('login')
    setPinInserito('')
    setErrorePin(null)
    setModalePinAperta(true)
  }

  const richiediPinPerLogout = () => {
    setAzionePin('logout')
    setPinInserito('')
    setErrorePin(null)
    setModalePinAperta(true)
  }

  // Verifica PIN
  const handleVerificaPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (pinInserito === PIN_CORRETTO) {
      setModalePinAperta(false)
      setErrorePin(null)
      if (azionePin === 'login' && targetPostazioneId) {
        eseguiLoginPostazione(targetPostazioneId)
      } else if (azionePin === 'logout') {
        eseguiLogoutPostazione()
      }
    } else {
      setErrorePin('PIN non corretto. Inserisci il codice autorizzato.')
      setPinInserito('')
    }
  }

  // Azione effettiva di Login Postazione (dopo PIN valido)
  const eseguiLoginPostazione = (idPostazione: string) => {
    setPostazioneLoginId(idPostazione)
    localStorage.setItem('machinaflow_postazione_corrente_id', idPostazione)
    if (idPostazione === 'supervisore') {
      setMacchinaSelezionataId('tutte')
      setNotifica('Accesso autorizzato: Modalità Supervisore / Capo Officina')
    } else {
      setMacchinaSelezionataId(idPostazione)
      const m = centriLavoro.find((c) => c.id === idPostazione)
      setNotifica(`Postazione sbloccata e associata a: ${m?.codice || ''} - ${m?.nome || ''}`)
    }
    setTimeout(() => setNotifica(null), 3500)
  }

  // Logout Postazione (dopo PIN valido)
  const eseguiLogoutPostazione = () => {
    localStorage.removeItem('machinaflow_postazione_corrente_id')
    setPostazioneLoginId(null)
    setMacchinaSelezionataId('tutte')
    setNotifica('Terminale disconnesso con successo.')
    setTimeout(() => setNotifica(null), 3000)
  }

  // Aggiornamento stato fase da terminale touch
  const handleCambiaStatoFase = (
    odpId: string,
    faseId: string,
    nuovoStato: 'in_corso' | 'completata' | 'non_iniziata'
  ) => {
    const aggiornati = odpList.map((odp) => {
      if (odp.id === odpId) {
        const fasiAggiornate = odp.fasi.map((f) => {
          if (f.id === faseId) {
            return {
              ...f,
              stato: nuovoStato,
              data_inizio_reale:
                nuovoStato === 'in_corso' ? (f.data_inizio_reale || new Date().toISOString()) : f.data_inizio_reale,
              data_fine_reale: nuovoStato === 'completata' ? new Date().toISOString() : undefined,
              tempo_effettivo_min:
                nuovoStato === 'completata' && f.tempo_effettivo_min === 0
                  ? f.tempo_stimato_totale_min
                  : f.tempo_effettivo_min
            }
          }
          return f
        })

        const tutteChiuse = fasiAggiornate.every((f) => f.stato === 'completata')
        const almenoUnaAvviata = fasiAggiornate.some((f) => f.stato === 'in_corso')
        const nuovoStatoOdp = tutteChiuse ? ('completato' as const) : almenoUnaAvviata ? ('in_lavorazione' as const) : odp.stato

        return {
          ...odp,
          fasi: fasiAggiornate,
          stato: nuovoStatoOdp,
          quantita_prodotta: tutteChiuse ? odp.quantita_da_produrre : odp.quantita_prodotta
        }
      }
      return odp
    })

    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    // Sincronizza l'avanzamento della fase e lo stato dell'OdP su Supabase
    const odpModificato = aggiornati.find((o) => o.id === odpId)
    const faseModificata = odpModificato?.fasi.find((f) => f.id === faseId)
    if (faseModificata) {
      syncService.aggiornaFaseOdP(faseModificata)
    }

    if (odpModificato) {
      syncService.aggiornaStatoOdP(odpModificato.id, odpModificato.stato, odpModificato.quantita_prodotta)
    }

    const messaggio =
      nuovoStato === 'in_corso'
        ? 'Lavorazione avviata!'
        : nuovoStato === 'completata'
        ? 'Fase completata con successo! Inviata alla fase successiva.'
        : 'Stato ripristinato.'

    setNotifica(messaggio)
    setTimeout(() => setNotifica(null), 4000)
  }

  // Esegue lo Split OdP (Sdoppiamento Lotto per Avvio Parziale)
  const handleEseguiSplitOdP = async () => {
    if (!datiSplit || datiSplit.quantitaDaSplittare <= 0) return
    const { odp, fase, quantitaDaSplittare } = datiSplit

    const quantitaResidua = odp.quantita_da_produrre - quantitaDaSplittare
    if (quantitaResidua <= 0) return

    // 1. Modifica l'OdP corrente (Lotto A) con la quantità parziale da lavorare subito
    const codiceBase = odp.codice_odp.replace(/\/A$|\/B$|\/R\d*$/, '')
    const splitEsistenti = odpList.filter((o) => o.codice_odp.startsWith(`${codiceBase}/`)).length
    const codiceLottoA = odp.codice_odp.includes('/A') ? odp.codice_odp : `${codiceBase}/A`
    const codiceLottoB = splitEsistenti > 1 ? `${codiceBase}/B${splitEsistenti}` : `${codiceBase}/B`

    const odpLottoA: OrdineProduzione & { fasi: FaseOdP[] } = {
      ...odp,
      codice_odp: codiceLottoA,
      quantita_da_produrre: quantitaDaSplittare,
      stato: 'in_lavorazione',
      ordine_cliente_id: odp.ordine_cliente_id,
      codice_ordine_cliente: odp.codice_ordine_cliente,
      cliente_id: odp.cliente_id,
      cliente_nome: odp.cliente_nome,
      numero_riga_ordine: odp.numero_riga_ordine,
      fasi: odp.fasi.map((f) => {
        if (f.id === fase.id) {
          return {
            ...f,
            stato: 'in_corso' as const,
            data_inizio_reale: new Date().toISOString()
          }
        }
        return f
      })
    }

    // 2. Crea il nuovo OdP residuo (Lotto B) con la quantità a saldo
    const nuovoIdB = `odp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
    const odpLottoB: OrdineProduzione & { fasi: FaseOdP[] } = {
      ...odp,
      id: nuovoIdB,
      codice_odp: codiceLottoB,
      quantita_da_produrre: quantitaResidua,
      quantita_prodotta: 0,
      stato: 'pianificato',
      ordine_cliente_id: odp.ordine_cliente_id,
      codice_ordine_cliente: odp.codice_ordine_cliente,
      cliente_id: odp.cliente_id,
      cliente_nome: odp.cliente_nome,
      numero_riga_ordine: odp.numero_riga_ordine,
      qr_code_token: `QR-${codiceLottoB}`,
      fasi: odp.fasi.map((f) => ({
        ...f,
        id: `fase-${Date.now()}-${f.sequenza}-${Math.random().toString(36).substring(2, 4)}`,
        odp_id: nuovoIdB,
        stato: 'non_iniziata' as const,
        data_inizio_reale: undefined,
        data_fine_reale: undefined,
        tempo_effettivo_min: 0
      }))
    }

    // 3. Salva entrambi su Cloud e Locale
    const listaAggiornata = odpList.map((o) => (o.id === odp.id ? odpLottoA : o))
    listaAggiornata.unshift(odpLottoB)

    // 4. Scarico Reale Materia Prima a Magazzino per il Lotto A avviato
    const componentiBom = distinte.filter((d) => d.articolo_padre_id === odp.articolo_id)
    if (componentiBom.length > 0) {
      const articoliAggiornati = articoli.map((a) => {
        const comp = componentiBom.find((c) => c.articolo_componente_id === a.id)
        if (comp) {
          const consumo = comp.quantita_necessaria * quantitaDaSplittare
          const nuovaGiacenza = Math.max(0, a.giacenza_attuale - consumo)
          const articoloScaricato = { ...a, giacenza_attuale: nuovaGiacenza }
          syncService.salvaArticolo(articoloScaricato)
          return articoloScaricato
        }
        return a
      })
      setArticoli(articoliAggiornati)
      localStorage.setItem('machinaflow_articoli', JSON.stringify(articoliAggiornati))
    }

    setOdpList(listaAggiornata)
    localStorage.setItem('machinaflow_odp', JSON.stringify(listaAggiornata))

    // Salva su Supabase Cloud
    await syncService.salvaOrdineProduzione(odpLottoA)
    await syncService.salvaOrdineProduzione(odpLottoB)

    setModaleSplitAperta(false)
    setDatiSplit(null)
    setNotifica(`✓ Lotto sdoppiato con successo! Avviato ${codiceLottoA} (${quantitaDaSplittare} pz). Creato ${codiceLottoB} (${quantitaResidua} pz a saldo).`)
    setTimeout(() => setNotifica(null), 5000)
  }

  // Conferma completamento fase con quantità effettiva e gestione scarti (Opzione B)
  const handleConfermaCompletaFase = async () => {
    if (!datiCompleta) return
    const { odp, fase, pezziBuoni, pezziScarto, opzioneResiduo, generaRipristinoScarto } = datiCompleta

    // 1. Se ci sono scarti registrati e l'operatore/capo officina ha richiesto il ripristino immediato (/R)
    let nuovoOdpRipristino: (OrdineProduzione & { fasi: FaseOdP[] }) | null = null
    if (pezziScarto > 0 && generaRipristinoScarto) {
      const codiceBase = odp.codice_odp.replace(/\/A$|\/B$|\/R\d*$/, '')
      // Controlla se esistono già altri ordini di ripristino per questo codice (es. /R1, /R2)
      const ripristiniEsistenti = odpList.filter((o) => o.codice_odp.startsWith(`${codiceBase}/R`)).length
      const suffissoRipristino = ripristiniEsistenti > 0 ? `/R${ripristiniEsistenti + 1}` : '/R'
      const codiceRipristino = `${codiceBase}${suffissoRipristino}`
      const nuovoIdRipristino = `odp-${Date.now()}-rip-${Math.random().toString(36).substring(2, 4)}`

      nuovoOdpRipristino = {
        ...odp,
        id: nuovoIdRipristino,
        codice_odp: codiceRipristino,
        quantita_da_produrre: pezziScarto,
        quantita_prodotta: 0,
        stato: 'pianificato',
        priorita: 4, // Priorità URGENTE automatica per i ripristini
        ordine_cliente_id: odp.ordine_cliente_id,
        codice_ordine_cliente: odp.codice_ordine_cliente,
        cliente_id: odp.cliente_id,
        cliente_nome: odp.cliente_nome,
        numero_riga_ordine: odp.numero_riga_ordine,
        odp_origine_scarto_id: odp.id,
        qr_code_token: `QR-${codiceRipristino}`,
        note: `⚡ Ripristino URGENTE di ${pezziScarto} pz scartati durante la Fase #${fase.sequenza} (${fase.nome_fase}).`,
        fasi: odp.fasi.map((f) => ({
          ...f,
          id: `fase-${Date.now()}-${f.sequenza}-${Math.random().toString(36).substring(2, 4)}`,
          odp_id: nuovoIdRipristino,
          stato: 'non_iniziata' as const,
          data_inizio_reale: undefined,
          data_fine_reale: undefined,
          tempo_effettivo_min: 0,
          note_officina: `Lotto ripristino scarto (${pezziScarto} pz)`
        }))
      }
    }

    // 2. Se l'operatore ha fatto l'intera quantità del lotto (o di più) oppure ha scelto di sospendere
    if (pezziBuoni >= odp.quantita_da_produrre || opzioneResiduo === 'sospendi') {
      if (pezziBuoni < odp.quantita_da_produrre && opzioneResiduo === 'sospendi') {
        // Sospendi la fase registrando l'avanzamento parziale
        const aggiornati = odpList.map((o) => {
          if (o.id === odp.id) {
            return {
              ...o,
              quantita_prodotta: pezziBuoni,
              fasi: o.fasi.map((f) =>
                f.id === fase.id
                  ? {
                      ...f,
                      stato: 'non_iniziata' as const,
                      note_officina: `Avanzamento parziale: ${pezziBuoni}/${odp.quantita_da_produrre} pz buoni, ${pezziScarto} scarti. ${f.note_officina || ''}`
                    }
                  : f
              )
            }
          }
          return o
        })

        if (nuovoOdpRipristino) {
          aggiornati.unshift(nuovoOdpRipristino)
          await syncService.salvaOrdineProduzione(nuovoOdpRipristino)
        }

        setOdpList(aggiornati)
        localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

        const odpModificato = aggiornati.find((o) => o.id === odp.id)
        const faseModificata = odpModificato?.fasi.find((f) => f.id === fase.id)
        if (faseModificata) syncService.aggiornaFaseOdP(faseModificata)
        if (odpModificato) syncService.aggiornaStatoOdP(odpModificato.id, 'in_lavorazione', pezziBuoni)

        setModaleCompletaAperta(false)
        setDatiCompleta(null)
        const msgRipristino = nuovoOdpRipristino ? ` Generato OdP urgente ${nuovoOdpRipristino.codice_odp} (${pezziScarto} pz)!` : ''
        setNotifica(`Lavorazione sospesa: registrati ${pezziBuoni} pezzi buoni.${msgRipristino}`)
        setTimeout(() => setNotifica(null), 5000)
        return
      }

      // Altrimenti chiudi normalmente la fase
      handleCambiaStatoFase(odp.id, fase.id, 'completata')

      if (nuovoOdpRipristino) {
        // Salva prima l'OdP di ripristino sul cloud
        await syncService.salvaOrdineProduzione(nuovoOdpRipristino)

        setOdpList((prev) => {
          const listaConRipristino = [nuovoOdpRipristino!, ...prev.filter((o) => o.id !== nuovoOdpRipristino!.id)]
          localStorage.setItem('machinaflow_odp', JSON.stringify(listaConRipristino))
          return listaConRipristino
        })

        setNotifica(`✓ Fase completata (${pezziBuoni} pz buoni). Generato OdP urgente di ripristino ${nuovoOdpRipristino.codice_odp} per i ${pezziScarto} pz scartati!`)
        setTimeout(() => setNotifica(null), 5000)
      }

      setModaleCompletaAperta(false)
      setDatiCompleta(null)
      return
    }

    // 3. Se ha fatto meno pezzi e ha scelto di splittare il residuo (invia i pezzi buoni avanti)
    const quantitaResidua = odp.quantita_da_produrre - pezziBuoni
    const codiceBase = odp.codice_odp.replace(/\/A$|\/B\d*$|\/R\d*$/, '')
    const splitEsistenti = odpList.filter((o) => o.codice_odp.startsWith(`${codiceBase}/`)).length
    const codiceFatti = odp.codice_odp.includes('/A') ? odp.codice_odp : `${codiceBase}/A`
    const codiceResiduo = splitEsistenti > 1 ? `${codiceBase}/B${splitEsistenti}` : `${codiceBase}/B`

    // OdP con pezzi completati (avanza alla fase successiva)
    const odpFatti: OrdineProduzione & { fasi: FaseOdP[] } = {
      ...odp,
      codice_odp: codiceFatti,
      quantita_da_produrre: pezziBuoni,
      quantita_prodotta: pezziBuoni,
      ordine_cliente_id: odp.ordine_cliente_id,
      codice_ordine_cliente: odp.codice_ordine_cliente,
      cliente_id: odp.cliente_id,
      cliente_nome: odp.cliente_nome,
      numero_riga_ordine: odp.numero_riga_ordine,
      fasi: odp.fasi.map((f) => {
        if (f.id === fase.id) {
          return {
            ...f,
            stato: 'completata' as const,
            data_fine_reale: new Date().toISOString(),
            tempo_effettivo_min: f.tempo_effettivo_min || f.tempo_stimato_totale_min
          }
        }
        return f
      })
    }

    const tutteChiuse = odpFatti.fasi.every((f) => f.stato === 'completata')
    odpFatti.stato = tutteChiuse ? 'completato' : 'in_lavorazione'

    // OdP Residuo per i pezzi ancora da fare su questa fase
    const nuovoIdResiduo = `odp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
    const odpResiduo: OrdineProduzione & { fasi: FaseOdP[] } = {
      ...odp,
      id: nuovoIdResiduo,
      codice_odp: codiceResiduo,
      quantita_da_produrre: quantitaResidua,
      quantita_prodotta: 0,
      stato: 'in_lavorazione',
      ordine_cliente_id: odp.ordine_cliente_id,
      codice_ordine_cliente: odp.codice_ordine_cliente,
      cliente_id: odp.cliente_id,
      cliente_nome: odp.cliente_nome,
      numero_riga_ordine: odp.numero_riga_ordine,
      qr_code_token: `QR-${codiceResiduo}`,
      fasi: odp.fasi.map((f) => {
        if (f.sequenza < fase.sequenza) {
          return {
            ...f,
            id: `fase-${Date.now()}-${f.sequenza}-${Math.random().toString(36).substring(2, 4)}`,
            odp_id: nuovoIdResiduo
          }
        }
        return {
          ...f,
          id: `fase-${Date.now()}-${f.sequenza}-${Math.random().toString(36).substring(2, 4)}`,
          odp_id: nuovoIdResiduo,
          stato: 'non_iniziata' as const,
          data_inizio_reale: undefined,
          data_fine_reale: undefined,
          tempo_effettivo_min: 0
        }
      })
    }

    // Scarico Reale Materia Prima a Magazzino per i pezzi buoni completati
    const componentiBom = distinte.filter((d) => d.articolo_padre_id === odp.articolo_id)
    if (componentiBom.length > 0 && pezziBuoni > 0) {
      const articoliAggiornati = articoli.map((a) => {
        const comp = componentiBom.find((c) => c.articolo_componente_id === a.id)
        if (comp) {
          const consumo = comp.quantita_necessaria * pezziBuoni
          const nuovaGiacenza = Math.max(0, a.giacenza_attuale - consumo)
          const articoloScaricato = { ...a, giacenza_attuale: nuovaGiacenza }
          syncService.salvaArticolo(articoloScaricato)
          return articoloScaricato
        }
        return a
      })
      setArticoli(articoliAggiornati)
      localStorage.setItem('machinaflow_articoli', JSON.stringify(articoliAggiornati))
    }

    const listaAggiornata = odpList.map((o) => (o.id === odp.id ? odpFatti : o))
    listaAggiornata.unshift(odpResiduo)

    if (nuovoOdpRipristino) {
      listaAggiornata.unshift(nuovoOdpRipristino)
      await syncService.salvaOrdineProduzione(nuovoOdpRipristino)
    }

    setOdpList(listaAggiornata)
    localStorage.setItem('machinaflow_odp', JSON.stringify(listaAggiornata))

    await syncService.salvaOrdineProduzione(odpFatti)
    await syncService.salvaOrdineProduzione(odpResiduo)

    setModaleCompletaAperta(false)
    setDatiCompleta(null)
    const msgRipristino = nuovoOdpRipristino ? ` Generato inoltre OdP urgente ${nuovoOdpRipristino.codice_odp} (${pezziScarto} pz)!` : ''
    setNotifica(`✓ Inviati ${pezziBuoni} pz alle fasi successive (${codiceFatti}). Creato lotto residuo ${codiceResiduo} per i ${quantitaResidua} pz rimanenti.${msgRipristino}`)
    setTimeout(() => setNotifica(null), 5000)
  }

  // Conferma Spedizione o Rientro Conto Terzi Esterno
  const handleConfermaEsterna = async () => {
    if (!datiEsterna) return
    const { odp, fase, tipoAzione, ddtNumero, note } = datiEsterna

    const oggiIso = new Date().toISOString()
    const aggiornati = odpList.map((o) => {
      if (o.id === odp.id) {
        const fasiAggiornate = o.fasi.map((f) => {
          if (f.id === fase.id) {
            if (tipoAzione === 'spedizione') {
              return {
                ...f,
                stato: 'in_corso' as const,
                stato_esterna: 'inviato_al_terzista' as const,
                data_uscita_terzista: oggiIso,
                ddt_uscita_numero: ddtNumero.trim() || undefined,
                note_officina: note.trim()
                  ? `${f.note_officina ? f.note_officina + ' | ' : ''}Spedito a ${f.fornitore_nome || 'terzista'} con DDT ${ddtNumero}: ${note.trim()}`
                  : f.note_officina
              }
            } else {
              // Rientro da terzista -> fase completata
              return {
                ...f,
                stato: 'completata' as const,
                stato_esterna: 'rientrato' as const,
                data_rientro_terzista: oggiIso,
                ddt_rientro_numero: ddtNumero.trim() || undefined,
                data_fine_reale: oggiIso,
                note_officina: note.trim()
                  ? `${f.note_officina ? f.note_officina + ' | ' : ''}Rientrato con DDT ${ddtNumero}: ${note.trim()}`
                  : f.note_officina
              }
            }
          }
          return f
        })

        const tutteChiuse = fasiAggiornate.every((f) => f.stato === 'completata')
        const almenoUnaAvviata = fasiAggiornate.some((f) => f.stato === 'in_corso')
        const nuovoStatoOdp = tutteChiuse ? ('completato' as const) : almenoUnaAvviata ? ('in_lavorazione' as const) : o.stato

        return {
          ...o,
          fasi: fasiAggiornate,
          stato: nuovoStatoOdp,
          quantita_prodotta: tutteChiuse ? o.quantita_da_produrre : o.quantita_prodotta
        }
      }
      return o
    })

    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    const odpModificato = aggiornati.find((o) => o.id === odp.id)
    const faseModificata = odpModificato?.fasi.find((f) => f.id === fase.id)
    if (faseModificata) {
      await syncService.aggiornaFaseOdP(faseModificata)
    }
    if (odpModificato) {
      await syncService.aggiornaStatoOdP(odpModificato.id, odpModificato.stato, odpModificato.quantita_prodotta)
    }

    setModaleEsternaAperta(false)
    setDatiEsterna(null)

    if (tipoAzione === 'spedizione') {
      // Salva nei DDT registrati per interscambio ed eventuale stampa immediata
      const art = articoli.find((a) => a.id === odp.articolo_id)
      const terzistaAnag = fornitoriTerzisti.find((t) => t.ragione_sociale.toLowerCase() === (fase.fornitore_nome || '').toLowerCase())
      const nuovoDdtDoc: DocumentoTrasportoEsterno = {
        id: `ddt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        numero_ddt: ddtNumero.trim(),
        data_emissione: oggiIso,
        fornitore_nome: fase.fornitore_nome || 'Terzista Esterno',
        fornitore_indirizzo: terzistaAnag ? `${terzistaAnag.indirizzo}, ${terzistaAnag.cap || ''} ${terzistaAnag.citta || ''} (${terzistaAnag.provincia || ''})` : 'Zona Industriale - Reparto Trattamenti',
        fornitore_piva: terzistaAnag?.partita_iva || 'IT02984100362',
        causale_trasporto: datiEsterna.causaleTrasporto || 'Invio per Conto Lavorazione',
        porto: 'Franco',
        aspetto_beni: datiEsterna.aspettoBeni || 'A vista su bancale',
        numero_colli: datiEsterna.numeroColli || 1,
        peso_totale_kg: datiEsterna.pesoTotaleKg || 0,
        vettore_nome: datiEsterna.vettoreNome || 'Mittente (Mezzo Proprio)',
        note_trasporto: note.trim() || undefined,
        stato: 'spedito',
        righe: [
          {
            id: `riga-ddt-${Date.now()}`,
            odp_id: odp.id,
            codice_odp: odp.codice_odp,
            articolo_codice: art?.codice_articolo || 'PART-01',
            articolo_descrizione: art?.descrizione || 'Particolare Meccanico',
            fase_sequenza: fase.sequenza,
            nome_fase: fase.nome_fase,
            quantita_spedita: odp.quantita_da_produrre,
            unita_misura: art?.unita_misura || 'pz',
            peso_kg_riga: datiEsterna.pesoTotaleKg,
            note_lavorazione: note.trim() || undefined
          }
        ],
        creato_il: oggiIso
      }

      try {
        const ddtSalvati = JSON.parse(localStorage.getItem('machinaflow_ddt_esterni') || '[]')
        localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify([nuovoDdtDoc, ...ddtSalvati]))
        syncService.salvaDdtEsterno(nuovoDdtDoc)
      } catch {}

      // Apri automaticamente l'anteprima di stampa del DDT A4 per consentire la stampa immediata all'operatore
      setDdtStampabileCorrente(nuovoDdtDoc)
      setNotifica(`📦 Lavorazione inviata al terzista ${fase.fornitore_nome || ''}! (DDT: ${ddtNumero || 'N/D'}) - Aperta Scheda DDT A4`)
    } else {
      setNotifica(`✓ Pezzi rientrati con successo dal terzista! Sbloccata la fase successiva.`)
    }
    setTimeout(() => setNotifica(null), 6000)
  }

  // Conferma Spedizione CUMULATIVA di Più OdP con UNICO DDT
  const handleConfermaSpedizioneCumulativa = async () => {
    if (fasiEsterneSelezionateIds.length === 0) return
    const oggiIso = new Date().toISOString()
    const numeroDdtFinale = formCumulativo.ddtNumero.trim() || `DDT-CUM-${Date.now().toString().slice(-4)}`

    // Recupera tutti gli item selezionati
    const itemsSelezionati = fasiInOfficina.filter((it) => fasiEsterneSelezionateIds.includes(it.fase.id))
    if (itemsSelezionati.length === 0) return

    const righeDdt: import('@/types/database').RigaDDTContoTerzi[] = []

    // Aggiorna gli OdP coinvolti
    const aggiornati = odpList.map((odp) => {
      const fasiCoinvolte = itemsSelezionati.filter((it) => it.odp.id === odp.id).map((it) => it.fase.id)
      if (fasiCoinvolte.length === 0) return odp

      const nuoveFasi = odp.fasi.map((f) => {
        if (fasiCoinvolte.includes(f.id)) {
          const art = articoli.find((a) => a.id === odp.articolo_id)
          righeDdt.push({
            id: `riga-ddt-${Date.now()}-${f.id}`,
            odp_id: odp.id,
            codice_odp: odp.codice_odp,
            articolo_codice: art?.codice_articolo || 'PART-01',
            articolo_descrizione: art?.descrizione || 'Particolare Meccanico',
            fase_sequenza: f.sequenza,
            nome_fase: f.nome_fase,
            quantita_spedita: odp.quantita_da_produrre,
            unita_misura: art?.unita_misura || 'pz',
            peso_kg_riga: Number(((art?.peso_kg_unitario || 2.5) * odp.quantita_da_produrre).toFixed(1)),
            note_lavorazione: formCumulativo.note.trim() || undefined
          })

          return {
            ...f,
            stato: 'in_corso' as const,
            stato_esterna: 'inviato_al_terzista' as const,
            data_uscita_terzista: oggiIso,
            ddt_uscita_numero: numeroDdtFinale,
            note_officina: formCumulativo.note.trim()
              ? `${f.note_officina ? f.note_officina + ' | ' : ''}Spedito cumulativo con DDT ${numeroDdtFinale}: ${formCumulativo.note.trim()}`
              : f.note_officina
          }
        }
        return f
      })

      const almenoUnaAvviata = nuoveFasi.some((f) => f.stato === 'in_corso')
      return {
        ...odp,
        fasi: nuoveFasi,
        stato: almenoUnaAvviata ? ('in_lavorazione' as const) : odp.stato
      }
    })

    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    // Salva su Supabase Cloud per ogni OdP aggiornato
    for (const it of itemsSelezionati) {
      const odpMod = aggiornati.find((o) => o.id === it.odp.id)
      const faseMod = odpMod?.fasi.find((f) => f.id === it.fase.id)
      if (faseMod) await syncService.aggiornaFaseOdP(faseMod)
      if (odpMod) await syncService.aggiornaStatoOdP(odpMod.id, odpMod.stato, odpMod.quantita_prodotta)
    }

    // Salva il documento DDT cumulativo in archivio per l'ufficio e la stampa
    const fornitoreRif = formCumulativo.fornitoreNome || itemsSelezionati[0].fase.fornitore_nome || 'Terzista Esterno'
    const terzistaAnag = fornitoriTerzisti.find((t) => t.ragione_sociale.toLowerCase() === fornitoreRif.toLowerCase())
    const indirizzoRif = formCumulativo.fornitoreIndirizzo || (terzistaAnag ? `${terzistaAnag.indirizzo}, ${terzistaAnag.cap || ''} ${terzistaAnag.citta || ''} (${terzistaAnag.provincia || ''})` : 'Zona Industriale - Reparto Trattamenti')
    const pivaRif = formCumulativo.fornitorePiva || terzistaAnag?.partita_iva || 'IT02984100362'

    const nuovoDdtCumulativo: DocumentoTrasportoEsterno = {
      id: `ddt-cum-${Date.now()}`,
      numero_ddt: numeroDdtFinale,
      data_emissione: oggiIso,
      fornitore_nome: fornitoreRif,
      fornitore_indirizzo: indirizzoRif,
      fornitore_piva: pivaRif,
      causale_trasporto: formCumulativo.causaleTrasporto,
      porto: 'Franco',
      aspetto_beni: formCumulativo.aspettoBeni,
      numero_colli: formCumulativo.numeroColli,
      peso_totale_kg: formCumulativo.pesoTotaleKg,
      vettore_nome: formCumulativo.vettoreNome,
      note_trasporto: formCumulativo.note.trim() || undefined,
      stato: 'spedito',
      righe: righeDdt,
      creato_il: oggiIso
    }

    try {
      const ddtSalvati = JSON.parse(localStorage.getItem('machinaflow_ddt_esterni') || '[]')
      localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify([nuovoDdtCumulativo, ...ddtSalvati]))
      syncService.salvaDdtEsterno(nuovoDdtCumulativo)
    } catch {}

    setFasiEsterneSelezionateIds([])
    setModaleSpedizioneCumulativaAperta(false)
    setDdtStampabileCorrente(nuovoDdtCumulativo)
    setNotifica(`✓ Spedizione CUMULATIVA completata per ${itemsSelezionati.length} ordini con DDT ${numeroDdtFinale}! Aperta Scheda A4.`)
    setTimeout(() => setNotifica(null), 6000)
  }

  // Salvataggio nota operatore
  const handleSalvaNota = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fasePerNota) return

    const aggiornati = odpList.map((odp) => {
      if (odp.id === fasePerNota.odpId) {
        return {
          ...odp,
          fasi: odp.fasi.map((f) =>
            f.id === fasePerNota.faseId ? { ...f, note_officina: testoNota } : f
          )
        }
      }
      return odp
    })

    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    setModaleNoteAperta(false)
    setNotifica('Nota operatore registrata!')
    setTimeout(() => setNotifica(null), 3000)
  }

  // Sposta la fase su una macchina alternativa compatibile per bilanciare il carico
  const handleSpostaMacchina = (odpId: string, faseId: string, nuovaMacchinaId: string) => {
    const macchinaDest = centriLavoro.find((c) => c.id === nuovaMacchinaId)
    const aggiornati = odpList.map((odp) => {
      if (odp.id === odpId) {
        return {
          ...odp,
          fasi: odp.fasi.map((f) => {
            if (f.id === faseId) {
              const vecchieAlt = f.centri_lavoro_alternativi_ids || []
              const nuoveAlt = [f.centro_lavoro_id, ...vecchieAlt.filter((id) => id !== nuovaMacchinaId)]
              return {
                ...f,
                centro_lavoro_id: nuovaMacchinaId,
                centri_lavoro_alternativi_ids: nuoveAlt
              }
            }
            return f
          })
        }
      }
      return odp
    })

    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    // Sincronizza l'avanzamento della fase su Supabase
    const odpModificato = aggiornati.find((o) => o.id === odpId)
    const faseModificata = odpModificato?.fasi.find((f) => f.id === faseId)
    if (faseModificata) {
      syncService.aggiornaFaseOdP(faseModificata)
    }
    setNotifica(`Lavorazione spostata con successo su ${macchinaDest?.codice || 'nuova macchina'}!`)
    setTimeout(() => setNotifica(null), 4000)
  }

  // Helper per controllare se le fasi precedenti dello stesso OdP sono state tutte completate
  const checkFasiPrecedentiCompletate = (odp: OrdineProduzione & { fasi: FaseOdP[] }, sequenzaCorrente: number): boolean => {
    const fasiPrecedenti = odp.fasi.filter((f) => f.sequenza < sequenzaCorrente)
    if (fasiPrecedenti.length === 0) return true
    return fasiPrecedenti.every((f) => f.stato === 'completata')
  }

  // Estrai tutte le fasi da eseguire o in corso con metadati avanzati di sequenza e disponibilità materiale
  const fasiInOfficina = useMemo(() => {
    // 1. Calcola il materiale già impegnato / prelevato dagli OdP in lavorazione attiva
    const materialeGiaImpegnatoPerArticolo = new Map<string, number>()
    odpList.forEach((o) => {
      // Se un OdP è già in corso (ha almeno una fase avviata o completata)
      const haFasiAvviateOCompletate = o.fasi.some((f) => f.stato === 'in_corso' || f.stato === 'completata')
      if (haFasiAvviateOCompletate && o.stato !== 'completato') {
        const componenti = distinte.filter((d) => d.articolo_padre_id === o.articolo_id)
        componenti.forEach((comp) => {
          const consumo = comp.quantita_necessaria * o.quantita_da_produrre
          const att = materialeGiaImpegnatoPerArticolo.get(comp.articolo_componente_id) || 0
          materialeGiaImpegnatoPerArticolo.set(comp.articolo_componente_id, att + consumo)
        })
      }
    })

    const lista: {
      odp: OrdineProduzione & { fasi: FaseOdP[] }
      fase: FaseOdP
      articolo?: Articolo
      centro?: CentroLavoro
      fasePrecedenteCompletata: boolean
      materiaPrimaMancante: boolean
      materiaPrimaParziale: boolean
      pezziFattibiliConGiacenza: number
      nomeMateriaPrimaMancante?: string
      avvisoMaterialeInformativo?: string
    }[] = []

    odpList.forEach((odp) => {
      const articolo = articoli.find((a) => a.id === odp.articolo_id)

      // Controlla se le materie prime in distinta base (BOM) per questo articolo sono disponibili a stock
      let materiaPrimaMancante = false
      let materiaPrimaParziale = false
      let pezziFattibili = odp.quantita_da_produrre
      let nomeMateriaPrimaMancante: string | undefined = undefined

      const componentiBom = distinte.filter((d) => d.articolo_padre_id === odp.articolo_id)
      for (const comp of componentiBom) {
        const mat = articoli.find((a) => a.id === comp.articolo_componente_id)
        if (mat) {
          const fabbisognoTotale = comp.quantita_necessaria * odp.quantita_da_produrre

          // Se l'OdP attuale NON ha ancora preso il materiale sul mandrino,
          // sottrai il materiale già impegnato dagli altri lotti in corso
          const haGiaPresoMateriale = odp.fasi.some((f) => f.stato === 'in_corso' || f.stato === 'completata')
          const impegnatoDaAltri = haGiaPresoMateriale ? 0 : (materialeGiaImpegnatoPerArticolo.get(mat.id) || 0)
          const giacenzaDisponibileReale = Math.max(0, mat.giacenza_attuale - impegnatoDaAltri)

          if (giacenzaDisponibileReale < fabbisognoTotale) {
            // Calcola quanti pezzi completi si possono fare con la giacenza realmente libera
            const fattibili = comp.quantita_necessaria > 0 ? Math.floor(giacenzaDisponibileReale / comp.quantita_necessaria) : 0
            if (fattibili < pezziFattibili) {
              pezziFattibili = fattibili
            }

            if (fattibili > 0) {
              materiaPrimaParziale = true
            } else {
              materiaPrimaMancante = true
            }

            nomeMateriaPrimaMancante = `${mat.codice_articolo} (Disponibile libera: ${giacenzaDisponibileReale} ${mat.unita_misura}, serve: ${fabbisognoTotale})`
          }
        }
      }

      // Se si possono fare zero pezzi, è mancante al 100%
      if (pezziFattibili === 0 && componentiBom.length > 0) {
        materiaPrimaMancante = true
        materiaPrimaParziale = false
      }

      odp.fasi.forEach((fase) => {
        const centro = centriLavoro.find((c) => c.id === fase.centro_lavoro_id)
        const fasePrecedenteCompletata = checkFasiPrecedentiCompletate(odp, fase.sequenza)
        // La mancanza di materia prima fisica NON deve bloccare l'ufficio tecnico (CAD/CAM a video),
        // ma impatta operativamente il Taglio e la lavorazione meccanica (Fresatura/Tornitura).
        // Per il CAD/CAM creiamo un avviso informativo trasparente che avvisa l'operatore senza impedirgli di programmare.
        const isCadCam = fase.centro_lavoro_id === 'mc-cam-01' || fase.nome_fase.toLowerCase().includes('cam')
        const matMancanteSuQuestaFase = !isCadCam && materiaPrimaMancante
        const matParzialeSuQuestaFase = !isCadCam && materiaPrimaParziale && !materiaPrimaMancante

        let avvisoMaterialeInformativo: string | undefined = undefined
        if (isCadCam && (materiaPrimaMancante || materiaPrimaParziale)) {
          avvisoMaterialeInformativo = materiaPrimaMancante
            ? `⚠️ Info stock: Materiale non ancora disponibile a magazzino (${nomeMateriaPrimaMancante || 'da ordinare'}). Puoi comunque anticipare la programmazione CAM a computer.`
            : `ℹ️ Info stock: Materiale parziale a magazzino (${pezziFattibili}/${odp.quantita_da_produrre} pz pronti). Puoi completare la programmazione CAM dell'intero ordine.`
        }

        lista.push({
          odp,
          fase,
          articolo,
          centro,
          fasePrecedenteCompletata,
          materiaPrimaMancante: matMancanteSuQuestaFase,
          materiaPrimaParziale: matParzialeSuQuestaFase,
          pezziFattibiliConGiacenza: pezziFattibili,
          nomeMateriaPrimaMancante,
          avvisoMaterialeInformativo
        })
      })
    })

    return lista
  }, [odpList, articoli, centriLavoro, distinte])

  // Calcolo Puntualità e Scadenza per Capo Officina / Supervisore
  const calcolaScadenzaFase = (odp: OrdineProduzione, fase: FaseOdP) => {
    if (!odp.data_fine_pianificata) return null
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const scadenzaOdP = new Date(odp.data_fine_pianificata)
    scadenzaOdP.setHours(0, 0, 0, 0)

    const diffMs = scadenzaOdP.getTime() - oggi.getTime()
    const diffGiorni = Math.round(diffMs / (1000 * 60 * 60 * 24))

    let statoRitardo: 'in_tempo' | 'scadenza_oggi' | 'in_ritardo' = 'in_tempo'
    let testoLabel = `Mancano ${diffGiorni} gg`
    let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800'

    if (diffGiorni < 0) {
      statoRitardo = 'in_ritardo'
      testoLabel = `IN RITARDO di ${Math.abs(diffGiorni)} gg!`
      badgeColor = 'bg-rose-950 text-rose-300 border-rose-800 font-black animate-pulse'
    } else if (diffGiorni === 0) {
      statoRitardo = 'scadenza_oggi'
      testoLabel = 'Scade OGGI'
      badgeColor = 'bg-amber-950 text-amber-300 border-amber-800 font-bold'
    } else if (diffGiorni <= 2) {
      statoRitardo = 'scadenza_oggi'
      testoLabel = `Urgente: scade tra ${diffGiorni} gg`
      badgeColor = 'bg-amber-950 text-amber-300 border-amber-800'
    }

    return {
      dataScadenza: odp.data_fine_pianificata,
      diffGiorni,
      statoRitardo,
      testoLabel,
      badgeColor
    }
  }

  // Filtra per macchina selezionata, terzista e ricerca QR/testo
  const fasiFiltrateRaw = useMemo(() => {
    return fasiInOfficina.filter((item) => {
      const isPrincipale = item.fase.centro_lavoro_id === macchinaSelezionataId
      const isAlternativa = item.fase.centri_lavoro_alternativi_ids?.includes(macchinaSelezionataId)
      const matchMacchina = macchinaSelezionataId === 'tutte' || isPrincipale || isAlternativa

      // Filtro per specifico Fornitore Terzista su EXT-TERZISTI
      const matchTerzista =
        macchinaSelezionataId !== 'mc-esterna-01' ||
        filtroTerzistaSelezionato === 'tutti' ||
        (item.fase.fornitore_nome || '').toLowerCase() === filtroTerzistaSelezionato.toLowerCase()

      const matchRicerca =
        !ricercaQr.trim() ||
        item.odp.codice_odp.toLowerCase().includes(ricercaQr.toLowerCase()) ||
        item.odp.qr_code_token.toLowerCase().includes(ricercaQr.toLowerCase()) ||
        (item.articolo && item.articolo.codice_articolo.toLowerCase().includes(ricercaQr.toLowerCase()))

      return matchMacchina && matchTerzista && matchRicerca
    })
  }, [fasiInOfficina, macchinaSelezionataId, filtroTerzistaSelezionato, ricercaQr])

  // Coda Ordinata Tassativamente secondo logica MES Industriale:
  // 1. Ordini IN CORSO (hanno la massima priorità sulla macchina attuale)
  // 2. Ordini DA AVVIARE pronti (fasi precedenti completate) ordinati per Priorità (4->1) e poi Data di Consegna (più vicina prima)
  // 3. Ordini DA AVVIARE NON pronti (fase precedente ancora a monte)
  // 4. Ordini COMPLETATI (in fondo alla lista)
  const fasiOrdinate = useMemo(() => {
    return [...fasiFiltrateRaw].sort((a, b) => {
      // Priorità di stato esecuzione:
      // In corso = 0, Da avviare = 1, Completata = 2
      const statoScore = (item: typeof a) => {
        if (item.fase.stato === 'in_corso') return 0
        if (item.fase.stato !== 'completata') return 1
        return 2
      }

      const scoreA = statoScore(a)
      const scoreB = statoScore(b)
      if (scoreA !== scoreB) return scoreA - scoreB

      // Tra quelle da avviare, se una ha il materiale già pronto al banco precede quella in attesa
      if (a.fase.stato !== 'completata' && b.fase.stato !== 'completata') {
        // Ordini con materiale 100% pronto precedono quelli parziali o totalmente mancanti
        const matProntoA = !a.materiaPrimaMancante && !a.materiaPrimaParziale
        const matProntoB = !b.materiaPrimaMancante && !b.materiaPrimaParziale
        if (matProntoA && !matProntoB) return -1
        if (!matProntoA && matProntoB) return 1

        // Tra quelli non completi, quelli parziali precedono quelli a secco (100% mancante)
        if (a.materiaPrimaParziale && b.materiaPrimaMancante) return -1
        if (a.materiaPrimaMancante && b.materiaPrimaParziale) return 1

        if (a.fasePrecedenteCompletata && !b.fasePrecedenteCompletata) return -1
        if (!a.fasePrecedenteCompletata && b.fasePrecedenteCompletata) return 1

        // Ordinamento per Priorità Commerciale OdP: 4 (Urgente) > 3 (Alta) > 2 (Media) > 1 (Bassa)
        const prioritaA = a.odp.priorita || 2
        const prioritaB = b.odp.priorita || 2
        if (prioritaB !== prioritaA) return prioritaB - prioritaA

        // Regola EDD (Earliest Due Date / Data Fine Pianificata)
        const dataA = a.odp.data_fine_pianificata ? new Date(a.odp.data_fine_pianificata).getTime() : 9999999999999
        const dataB = b.odp.data_fine_pianificata ? new Date(b.odp.data_fine_pianificata).getTime() : 9999999999999
        if (dataA !== dataB) return dataA - dataB
      }

      return a.fase.sequenza - b.fase.sequenza
    })
  }, [fasiFiltrateRaw])

  // Esclusione Ordini Completati dalla coda operativa standard (attivabile su richiesta)
  const fasiDaVisualizzare = useMemo(() => {
    if (mostraCompletati) {
      return fasiOrdinate
    }
    return fasiOrdinate.filter((item) => item.fase.stato !== 'completata')
  }, [fasiOrdinate, mostraCompletati])

  // Conteggio Totale e Pagine
  const totaleElementi = fasiDaVisualizzare.length
  const totalePagine = Math.ceil(totaleElementi / ELEMENTI_PER_PAGINA) || 1

  // Fetta di 10 lavori per la pagina corrente
  const fasiPaginate = useMemo(() => {
    const inizio = (paginaCorrente - 1) * ELEMENTI_PER_PAGINA
    return fasiDaVisualizzare.slice(inizio, inizio + ELEMENTI_PER_PAGINA)
  }, [fasiDaVisualizzare, paginaCorrente])

  // Identifica per CIASCUNA macchina la prima fase autorizzata ad essere avviata
  // Una macchina può avviare un pezzo solo se attualmente non ne ha già un altro "in_corso"
  const idsFasiAutorizzateDaAvviare = useMemo(() => {
    const autorizzate = new Set<string>()

    // Trova l'insieme di tutti i centri di lavoro presenti nelle fasi
    const centriIds = new Set(fasiOrdinate.map((item) => item.fase.centro_lavoro_id))

    centriIds.forEach((centroId) => {
      // Per le lavorazioni esterne conto terzi non c'è vincolo di macchina interna occupata:
      // ogni fase esterna con fase precedente completata e materiale disponibile può essere spedita!
      if (centroId === 'mc-esterna-01') {
        fasiOrdinate
          .filter(
            (item) =>
              item.fase.centro_lavoro_id === 'mc-esterna-01' &&
              item.fase.stato !== 'completata' &&
              item.fasePrecedenteCompletata &&
              !item.materiaPrimaMancante
          )
          .forEach((item) => autorizzate.add(item.fase.id))
        return
      }

      // Controlla se QUESTA specifica macchina ha già una lavorazione attiva sul mandrino
      const macchinaOccupata = fasiOrdinate.some(
        (item) => item.fase.centro_lavoro_id === centroId && item.fase.stato === 'in_corso'
      )

      // Se la macchina è libera, la sua prima fase con materiale completo (100%) e fasi precedenti completate è autorizzata
      if (!macchinaOccupata) {
        const primaPronta = fasiOrdinate.find(
          (item) =>
            item.fase.centro_lavoro_id === centroId &&
            item.fase.stato !== 'completata' &&
            item.fasePrecedenteCompletata &&
            !item.materiaPrimaMancante &&
            !item.materiaPrimaParziale
        )
        if (primaPronta) {
          autorizzate.add(primaPronta.fase.id)
        }
      }
    })

    return autorizzate
  }, [fasiOrdinate])

  // Macchina attualmente associata al terminale
  const macchinaAttiva = centriLavoro.find((c) => c.id === postazioneLoginId)
  const isSupervisore = postazioneLoginId === 'supervisore'

  // SE IL TERMINALE NON È ANCORA ASSOCIATO A NESSUNA MACCHINA (SCHERMATA DI LOGIN TOUCH)
  if (!caricamentoSessione && !postazioneLoginId) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
        {/* Header Schermata Login */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-orange-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-orange-600/30">
            <Monitor className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">
            CONFIGURAZIONE TERMINALE TOUCH BORDO MACCHINA (MES)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Autenticazione Postazione di Lavoro
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Tocca la macchina su cui è posizionato questo tablet. Il terminale mostrerà
            esclusivamente la coda di lavoro e i compiti da eseguire per questa postazione.
          </p>
        </div>

        {/* Notifica Flash */}
        {notifica && (
          <div className="p-4 rounded-xl bg-emerald-950 border-2 border-emerald-500 text-emerald-100 font-bold text-center text-base animate-in zoom-in-95 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>{notifica}</span>
          </div>
        )}

        {/* Griglia Selezione Postazione Touch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {centriLavoro.map((centro) => {
            const countFasi = fasiInOfficina.filter(
              (f) => f.fase.centro_lavoro_id === centro.id && f.fase.stato !== 'completata'
            ).length

            return (
              <button
                key={centro.id}
                type="button"
                onClick={() => richiediPinPerLogin(centro.id)}
                className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-orange-500 hover:bg-slate-800/80 transition-all text-left flex flex-col justify-between group shadow-lg cursor-pointer active:scale-95"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-orange-600/20 group-hover:text-orange-400 text-slate-300 flex items-center justify-center transition-colors">
                      <Cpu className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-950 text-orange-400 border border-slate-800">
                      {centro.codice}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                    {centro.nome}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Reparto: {centro.reparto}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ordini in coda:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      countFasi > 0
                        ? 'bg-orange-950 text-orange-300 border border-orange-800/50'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {countFasi} {countFasi === 1 ? 'lavoro' : 'lavori'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Accesso Riservato Capo Officina / Supervisore */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <KeyRound className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Accesso Supervisore / Capo Officina</h4>
              <p className="text-xs text-slate-400">
                Visualizza la panoramica globale e passa liberamente tra tutte le macchine.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => richiediPinPerLogin('supervisore')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 hover:border-orange-500"
          >
            <UserCheck className="w-4 h-4 text-orange-400" />
            Entra come Capo Officina
          </button>
        </div>

        {/* MODALE PIN ANCHE NELLA SCHERMATA INIZIALE DI LOGIN */}
        {modalePinAperta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Autorizzazione Responsabile</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {targetPostazioneId === 'supervisore'
                        ? 'Sblocco Modalità Supervisore'
                        : `Associazione Tablet a ${centriLavoro.find((c) => c.id === targetPostazioneId)?.codice || 'Macchina'}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalePinAperta(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleVerificaPin} className="p-6 space-y-5">
                <div className="text-center space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Inserisci il PIN di sblocco (default: 123456)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={pinInserito}
                    onChange={(e) => {
                      setPinInserito(e.target.value)
                      setErrorePin(null)
                    }}
                    placeholder="••••••"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white focus:outline-none focus:border-orange-500 shadow-inner"
                  />
                  {errorePin && (
                    <p className="text-xs font-bold text-rose-400 animate-in fade-in">
                      ⚠️ {errorePin}
                    </p>
                  )}
                </div>

                {/* Tastierino Numerico Touch su Schermo (0-9) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((cifra) => (
                    <button
                      key={cifra}
                      type="button"
                      onClick={() => {
                        if (pinInserito.length < 6) {
                          setPinInserito((prev) => prev + cifra)
                          setErrorePin(null)
                        }
                      }}
                      className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                    >
                      {cifra}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPinInserito('')}
                    className="py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer transition-all"
                  >
                    CANC
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pinInserito.length < 6) {
                        setPinInserito((prev) => prev + '0')
                        setErrorePin(null)
                      }
                    }}
                    className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinInserito((prev) => prev.slice(0, -1))}
                    className="py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer transition-all"
                  >
                    ⌫
                  </button>
                </div>

                {/* Bottoni Azione */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalePinAperta(false)}
                    className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={pinInserito.length === 0}
                    className="py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wide cursor-pointer shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                  >
                    Conferma PIN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Touch Terminal con Info Macchina Attiva */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 shrink-0">
            {isSupervisore ? <Monitor className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">
                {isSupervisore ? 'MODALITÀ SUPERVISORE (CAPO OFFICINA)' : 'POSTAZIONE DI BORDO MACCHINA'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {isSupervisore ? 'Panoramica Reparto Officina' : `${macchinaAttiva?.codice} — ${macchinaAttiva?.nome}`}
            </h1>
          </div>
        </div>

        {/* Ricerca e Pulsante Disconnetti Postazione */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ricercaQr}
              onChange={(e) => setRicercaQr(e.target.value)}
              placeholder="Scansiona QR o OdP..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="button"
            onClick={richiediPinPerLogout}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            title="Scollega questo tablet dalla postazione (Richiede PIN)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cambia Macchina (PIN)</span>
          </button>
        </div>
      </div>

      {/* Notifica Flash a Grande Visibilità */}
      {notifica && (
        <div className="p-4 rounded-xl bg-emerald-950 border-2 border-emerald-500 text-emerald-100 font-bold text-center text-base animate-in zoom-in-95 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <span>{notifica}</span>
        </div>
      )}

      {/* PANNELLO DI CONTROLLO SCADENZE E RITARDI (ESCLUSIVO SUPERVISORE / CAPO OFFICINA) */}
      {isSupervisore && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(() => {
            const fasiAperte = fasiInOfficina.filter((f) => f.fase.stato !== 'completata')
            const inRitardo = fasiAperte.filter((f) => {
              const sc = calcolaScadenzaFase(f.odp, f.fase)
              return sc && sc.diffGiorni < 0
            }).length

            const inScadenzaOggi = fasiAperte.filter((f) => {
              const sc = calcolaScadenzaFase(f.odp, f.fase)
              return sc && sc.diffGiorni >= 0 && sc.diffGiorni <= 2
            }).length

            const neiTempi = fasiAperte.length - inRitardo - inScadenzaOggi

            return (
              <>
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-rose-300 font-mono">{inRitardo}</div>
                    <div className="text-xs font-bold text-rose-200 uppercase tracking-wider mt-0.5">
                      Fasi Fuori Scadenza (Ritardo)
                    </div>
                    <div className="text-[11px] text-slate-400">Intervento prioritario richiesto</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-900/60 text-rose-300">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-amber-300 font-mono">{inScadenzaOggi}</div>
                    <div className="text-xs font-bold text-amber-200 uppercase tracking-wider mt-0.5">
                      In Scadenza Imminente (≤ 48h)
                    </div>
                    <div className="text-[11px] text-slate-400">Da ultimare nel turno odierno</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-900/60 text-amber-300">
                    <Hourglass className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-emerald-300 font-mono">{neiTempi}</div>
                    <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider mt-0.5">
                      Fasi Regolari Nei Tempi
                    </div>
                    <div className="text-[11px] text-slate-400">Coda di lavorazione in programma</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-900/60 text-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Selettore Macchine: VISIBILE SOLO SE SUPERVISORE / CAPO OFFICINA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {isSupervisore ? (
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Filtra Vista per Macchina Operativa:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMacchinaSelezionataId('tutte')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  macchinaSelezionataId === 'tutte'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                Tutte le Postazioni ({fasiInOfficina.length})
              </button>
              {centriLavoro.map((centro) => {
                const countFasi = fasiInOfficina.filter(
                  (f) => f.fase.centro_lavoro_id === centro.id && f.fase.stato !== 'completata'
                ).length
                const isEsterna = centro.id === 'mc-esterna-01'

                return (
                  <button
                    key={centro.id}
                    onClick={() => setMacchinaSelezionataId(centro.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      macchinaSelezionataId === centro.id
                        ? isEsterna
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                          : 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : isEsterna
                        ? 'bg-pink-950/40 text-pink-300 border border-pink-800/60 hover:bg-pink-900/40'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {isEsterna ? <Truck className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                    <span>{centro.codice}</span>
                    {countFasi > 0 && (
                      <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isEsterna ? 'bg-pink-900 text-pink-200' : 'bg-slate-950 text-orange-400'
                      }`}>
                        {countFasi}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Se l'operatore è loggato su una singola macchina: badge informativo fisso senza pulsanti di altre macchine */
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl">
            <Cpu className="w-4 h-4 text-orange-400" />
            <span>
              Terminale dedicato fisso per <strong>{macchinaAttiva?.nome}</strong> ({macchinaAttiva?.reparto})
            </span>
          </div>
        )}

        {/* Controlli Vista e Opzioni */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
          {/* Selezionatore Fornitore Terzista su EXT-TERZISTI */}
          {macchinaSelezionataId === 'mc-esterna-01' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/40 border border-pink-500/40 text-xs">
              <Truck className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <label htmlFor="filtro-terzista" className="text-pink-300 font-bold hidden sm:inline">Terzista:</label>
              <select
                id="filtro-terzista"
                value={filtroTerzistaSelezionato}
                onChange={(e) => setFiltroTerzistaSelezionato(e.target.value)}
                className="bg-slate-900 border border-pink-500/30 rounded-lg text-slate-100 px-2 py-1 text-xs font-semibold focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="tutti">Tutti i Terzisti ({fasiInOfficina.filter(f => f.fase.centro_lavoro_id === 'mc-esterna-01' && f.fase.stato !== 'completata').length})</option>
                {Array.from(new Set(fasiInOfficina.filter(f => f.fase.centro_lavoro_id === 'mc-esterna-01').map(f => f.fase.fornitore_nome).filter(Boolean))).map((forn) => {
                  const qta = fasiInOfficina.filter(f => f.fase.centro_lavoro_id === 'mc-esterna-01' && f.fase.fornitore_nome === forn && f.fase.stato !== 'completata').length
                  return (
                    <option key={forn} value={forn}>
                      {forn} ({qta})
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* Toggle Mostra/Nascondi Ordini Completati */}
          <button
            type="button"
            onClick={() => setMostraCompletati(!mostraCompletati)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              mostraCompletati
                ? 'bg-slate-800 text-orange-400 border-orange-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Mostra o nascondi le lavorazioni già completate"
          >
            {mostraCompletati ? <Eye className="w-3.5 h-3.5 text-orange-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{mostraCompletati ? 'Nascondi Finiti' : 'Mostra Finiti'}</span>
          </button>

          {/* Switch Vista Cards / Tabella */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setModalitaVista('cards')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modalitaVista === 'cards'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Schede</span>
            </button>
            <button
              type="button"
              onClick={() => setModalitaVista('tabella')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modalitaVista === 'tabella'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista Dettagliata</span>
            </button>
          </div>
        </div>
      </div>

      {/* BARRA AZIONI BATCH SPEDIZIONE CUMULATIVA CONTO TERZI (MULTI-ODP) */}
      {fasiEsterneSelezionateIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/90 via-slate-900 to-slate-950 border-2 border-pink-500/70 shadow-2xl shadow-pink-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-pink-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-pink-600/40">
              {fasiEsterneSelezionateIds.length}
            </span>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-pink-400" />
                Spedizione Cumulativa Conto Terzi ({fasiEsterneSelezionateIds.length} OdP selezionati)
              </p>
              <p className="text-xs text-slate-400">
                Puoi raggruppare tutti questi particolari in un <strong>UNICO DDT di trasporto</strong> verso lo stesso fornitore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFasiEsterneSelezionateIds([])}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Deseleziona tutti
            </button>
            <button
              type="button"
              onClick={() => {
                const itemsSelezionati = fasiInOfficina.filter((it) => fasiEsterneSelezionateIds.includes(it.fase.id))
                const fornitorePrimo = itemsSelezionati[0]?.fase.fornitore_nome || 'Terzista Esterno'
                const terzistaAnag = fornitoriTerzisti.find((t) => t.ragione_sociale.toLowerCase() === fornitorePrimo.toLowerCase())
                const pesoTotale = itemsSelezionati.reduce((acc, it) => {
                  const art = articoli.find((a) => a.id === it.odp.articolo_id)
                  return acc + (art?.peso_kg_unitario || 2.5) * it.odp.quantita_da_produrre
                }, 0)

                setFormCumulativo({
                  ddtNumero: `DDT-CUM-${Date.now().toString().slice(-4)}`,
                  fornitoreNome: fornitorePrimo,
                  fornitoreId: terzistaAnag?.id || '',
                  fornitoreIndirizzo: terzistaAnag ? `${terzistaAnag.indirizzo}, ${terzistaAnag.cap || ''} ${terzistaAnag.citta || ''} (${terzistaAnag.provincia || ''})` : '',
                  fornitorePiva: terzistaAnag?.partita_iva || '',
                  numeroColli: Math.ceil(itemsSelezionati.length / 2),
                  pesoTotaleKg: Number(pesoTotale.toFixed(1)),
                  vettoreNome: 'Mittente (Mezzo Proprio)',
                  aspettoBeni: 'A vista su bancale reggettato',
                  causaleTrasporto: 'Invio per Conto Lavorazione',
                  note: `Spedizione cumulativa per ${itemsSelezionati.map((it) => it.odp.codice_odp).join(', ')}`
                })
                setModaleSpedizioneCumulativaAperta(true)
              }}
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-pink-600/40 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Crea DDT Cumulativo ({fasiEsterneSelezionateIds.length} OdP)</span>
            </button>
          </div>
        </div>
      )}

      {/* VISTA A SCHEDE (CARDS TOUCH) */}
      {modalitaVista === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fasiPaginate.map((item) => {
            const { odp, fase, articolo, centro, fasePrecedenteCompletata, materiaPrimaMancante, materiaPrimaParziale, pezziFattibiliConGiacenza, nomeMateriaPrimaMancante } = item
            const isCompletata = fase.stato === 'completata'
            const isInCorso = fase.stato === 'in_corso'

            // Controlla se la specifica macchina di questa fase ha già un pezzo in lavorazione attiva
            const macchinaQuestaFaseOccupata = fasiOrdinate.some(
              (item) => item.fase.centro_lavoro_id === fase.centro_lavoro_id && item.fase.stato === 'in_corso'
            )

            // Controllo autorizzazione di avvio per centro di lavoro
            // Se la fase è già IN CORSO o COMPLETATA, non può essere conteggiata come "da avviare"
            const isAutorizzataAdAvviare = !isInCorso && !isCompletata && !item.materiaPrimaParziale && idsFasiAutorizzateDaAvviare.has(fase.id)
            const isBloccata = !isInCorso && !isCompletata && !isAutorizzataAdAvviare

            // Configurazione badge Priorità OdP
            const prioritaMappa: Record<number, { label: string; bg: string; icon: typeof Flame }> = {
              4: { label: 'URGENTE', bg: 'bg-red-500/20 text-red-400 border-red-500/40', icon: Flame },
              3: { label: 'ALTA', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertCircle },
              2: { label: 'MEDIA', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Clock },
              1: { label: 'BASSA', bg: 'bg-slate-700/50 text-slate-400 border-slate-600/40', icon: Clock }
            }
            const prioritaConfig = prioritaMappa[odp.priorita] || prioritaMappa[2]
            const PrioritaIcon = prioritaConfig.icon

            return (
              <div
                key={fase.id}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between relative ${
                  isInCorso
                    ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30'
                    : isAutorizzataAdAvviare
                    ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/15'
                    : isCompletata
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-60'
                    : 'bg-slate-900/60 border-slate-800 opacity-90'
                }`}
              >
                {/* Badge "Prossima in Priorità" / "In Macchina" posizionato in alto a destra se autorizzato */}
                {isAutorizzataAdAvviare && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wider uppercase rounded-full shadow-lg flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    🎯 PRIORITÀ N. 1 DA ESEGUIRE
                  </div>
                )}

                {isInCorso && (
                  <div className={`absolute -top-3 left-6 px-3 py-1 text-white text-[11px] font-black tracking-wider uppercase rounded-full shadow-lg flex items-center gap-1.5 animate-pulse ${
                    fase.is_esterna ? 'bg-pink-600' : 'bg-blue-500'
                  }`}>
                    {fase.is_esterna ? <Truck className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {fase.is_esterna ? '🚚 SPEDITO AL TERZISTA (FUORI SEDE)' : '⚡ IN LAVORAZIONE ATTIVA'}
                  </div>
                )}

                <div>
                  {/* Header Card Fase */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox per Spedizione Cumulativa Conto Terzi */}
                      {fase.is_esterna && (!fase.stato_esterna || fase.stato_esterna === 'in_attesa_uscita') && !isCompletata && fasePrecedenteCompletata && (
                        <input
                          type="checkbox"
                          checked={fasiEsterneSelezionateIds.includes(fase.id)}
                          onChange={() => {
                            setFasiEsterneSelezionateIds((prev) =>
                              prev.includes(fase.id) ? prev.filter((id) => id !== fase.id) : [...prev, fase.id]
                            )
                          }}
                          className="w-5 h-5 rounded-md text-pink-600 focus:ring-pink-500 bg-slate-950 border-slate-700 mt-1 cursor-pointer accent-pink-600"
                          title="Seleziona questo particolare per raggrupparlo in un unico DDT con altri ordini"
                        />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950 px-2.5 py-0.5 rounded border border-orange-500/20">
                            {odp.codice_odp}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Seq. {fase.sequenza}
                          </span>
                          {/* Badge Priorità OdP */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${prioritaConfig.bg}`}
                          >
                            <PrioritaIcon className="w-3 h-3" />
                            {prioritaConfig.label}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-white mt-2 leading-tight">
                          {fase.nome_fase}
                        </h2>
                      </div>
                    </div>

                    {/* Badge Stato Lavorazione */}
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${
                        isInCorso
                          ? fase.is_esterna
                            ? 'bg-pink-950 text-pink-300 border border-pink-700 animate-pulse'
                            : 'bg-blue-600 text-white animate-pulse'
                          : isCompletata
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : isAutorizzataAdAvviare
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isInCorso
                        ? fase.is_esterna
                          ? 'FUORI SEDE'
                          : 'IN MACCHINA'
                        : isCompletata
                        ? 'COMPLETATA'
                        : isAutorizzataAdAvviare
                        ? 'PRONTA DA AVVIARE'
                        : 'IN CODA'}
                    </span>
                  </div>

                  {/* Dati Pezzo e Macchina */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400">Articolo:</span>
                      <strong className="text-white text-right max-w-[65%] truncate">
                        {articolo?.codice_articolo} — {articolo?.descrizione}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Quantità Lotto:</span>
                      <strong className="text-orange-400 font-bold text-sm">
                        {odp.quantita_da_produrre} {articolo?.unita_misura}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Centro / Macchina:</span>
                      {fase.is_esterna ? (
                        <span className="font-bold text-pink-400 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          EXT: {fase.fornitore_nome || 'Terzista Esterno'}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-200">
                          {centro ? `${centro.codice} - ${centro.nome}` : 'N/D'}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Tempo / Lead Time:</span>
                      {fase.is_esterna ? (
                        <span className="font-bold text-pink-300">
                          {fase.giorni_rientro_previsti || 5} gg rientro previsti
                        </span>
                      ) : (
                        <span className="font-bold text-slate-200">{fase.tempo_stimato_totale_min} minuti</span>
                      )}
                    </div>

                    {/* Dettagli specifici Conto Terzi: DDT, Stato Uscita/Rientro e Tariffa */}
                    {fase.is_esterna && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Stato Esterno:</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            fase.stato_esterna === 'rientrato'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : fase.stato_esterna === 'inviato_al_terzista'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {fase.stato_esterna === 'rientrato'
                              ? '✓ RIENTRATO IN OFFICINA'
                              : fase.stato_esterna === 'inviato_al_terzista'
                              ? '🚚 INVIATO AL TERZISTA'
                              : '⏳ IN ATTESA DI SPEDIZIONE'}
                          </span>
                        </div>

                        {fase.ddt_uscita_numero && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">DDT Uscita:</span>
                            <span className="font-mono text-white font-semibold">
                              {fase.ddt_uscita_numero} ({fase.data_uscita_terzista ? new Date(fase.data_uscita_terzista).toLocaleDateString('it-IT') : ''})
                            </span>
                          </div>
                        )}

                        {fase.ddt_rientro_numero && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">DDT Rientro:</span>
                            <span className="font-mono text-emerald-400 font-semibold">
                              {fase.ddt_rientro_numero} ({fase.data_rientro_terzista ? new Date(fase.data_rientro_terzista).toLocaleDateString('it-IT') : ''})
                            </span>
                          </div>
                        )}

                        {fase.costo_tariffa_valore ? (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Costo concordato:</span>
                            <span className="font-mono text-emerald-400">
                              € {fase.costo_tariffa_valore.toFixed(2)} / {
                                fase.modello_tariffa === 'peso_kg' ? 'kg' :
                                fase.modello_tariffa === 'superficie_m2' ? 'm²' :
                                fase.modello_tariffa === 'superficie_dm2' ? 'dm²' :
                                fase.modello_tariffa === 'lotto_forfettario' ? 'lotto fisso' : 'pz'
                              }
                              {fase.costo_minimo_fornitura ? ` (min. € ${fase.costo_minimo_fornitura.toFixed(2)})` : ''}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Scadenza & Ritardo: VISIBILE ESCLUSIVAMENTE AL SUPERVISORE / CAPO OFFICINA */}
                    {isSupervisore && odp.data_fine_pianificata && (() => {
                      const scadenza = calcolaScadenzaFase(odp, fase)
                      if (!scadenza) return null

                      return (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-orange-400" />
                            Scadenza & Ritardo:
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${scadenza.badgeColor}`}>
                            {scadenza.testoLabel} ({new Date(odp.data_fine_pianificata).toLocaleDateString('it-IT')})
                          </span>
                        </div>
                      )
                    })()}

                    {/* Verifica Flusso: Materiale / Fase Precedente */}
                    {!isCompletata && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400">Stato Materiale monte:</span>
                        {fasePrecedenteCompletata ? (
                          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pronto al banco (fase a monte conclusa)
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            In attesa della fase precedente
                          </span>
                        )}
                      </div>
                    )}

                    {fase.note_officina && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300 italic">
                        💬 Nota operatore: {fase.note_officina}
                      </div>
                    )}

                    {/* Avviso Informativo Materiale per Ufficio Tecnico (CAD/CAM) */}
                    {item.avvisoMaterialeInformativo && !isCompletata && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
                        {item.avvisoMaterialeInformativo}
                      </div>
                    )}

                    {/* Avviso compatibilità alternativa */}
                    {macchinaSelezionataId !== 'tutte' && fase.centro_lavoro_id !== macchinaSelezionataId && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs bg-blue-950/40 p-2 rounded-lg border border-blue-800/40">
                        <span className="text-blue-300 font-semibold flex items-center gap-1">
                          ⚡ Macchina Alternativa Compatibile
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSpostaMacchina(odp.id, fase.id, macchinaSelezionataId)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Prendi in Carico Qui
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PULSANTI DI AZIONE TOUCH PER L'OPERATORE CON BLOCCO PRIORITÀ */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* CASO SPECIALE: LAVORAZIONE ESTERNA CONTO TERZI */}
                    {fase.is_esterna ? (
                      <>
                        {/* Se non ancora spedita: visibile SOLO se la fase a monte è stata completata e il pezzo è fisicamente pronto */}
                        {(!fase.stato_esterna || fase.stato_esterna === 'in_attesa_uscita') && !isCompletata && (
                          fasePrecedenteCompletata ? (
                            <button
                              type="button"
                              onClick={() => {
                                const art = articoli.find((a) => a.id === odp.articolo_id)
                                const pesoStimato = Number(((art?.peso_kg_unitario || 2.5) * odp.quantita_da_produrre).toFixed(1))
                                setDatiEsterna({
                                  odp,
                                  fase,
                                  tipoAzione: 'spedizione',
                                  ddtNumero: `DDT-EXT-${Date.now().toString().slice(-4)}`,
                                  note: '',
                                  numeroColli: 1,
                                  pesoTotaleKg: pesoStimato,
                                  vettoreNome: 'Mittente (Mezzo Proprio)',
                                  aspettoBeni: 'A vista su bancale',
                                  causaleTrasporto: 'Invio per Conto Lavorazione'
                                })
                                setModaleEsternaAperta(true)
                              }}
                              className="col-span-2 py-4 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-pink-600/40 transition-all cursor-pointer active:scale-95"
                            >
                              <Truck className="w-5 h-5" />
                              REGISTRA SPEDIZIONE AL TERZISTA ({fase.fornitore_nome || 'Esterno'})
                            </button>
                          ) : (
                            <div className="col-span-2 py-3 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs flex items-center justify-between select-none">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                                <div>
                                  <p className="font-bold text-slate-400">
                                    Spedizione bloccata: pezzo non ancora pronto a monte
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    I pezzi devono prima essere finiti sulle macchine interne prima di poter generare il DDT di uscita.
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono font-black text-xs text-slate-600 shrink-0">
                                🔒 IN CODA
                              </span>
                            </div>
                          )
                        )}

                        {/* Se già spedita e fuori sede */}
                        {fase.stato_esterna === 'inviato_al_terzista' && !isCompletata && (
                          <button
                            type="button"
                            onClick={() => {
                              setDatiEsterna({
                                odp,
                                fase,
                                tipoAzione: 'rientro',
                                ddtNumero: '',
                                note: '',
                                numeroColli: 1,
                                pesoTotaleKg: 0,
                                vettoreNome: 'Vettore incaricato dal Fornitore',
                                aspettoBeni: 'A vista',
                                causaleTrasporto: 'Reso da Conto Lavorazione'
                              })
                              setModaleEsternaAperta(true)
                            }}
                            className="col-span-2 py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40 transition-all cursor-pointer active:scale-95 animate-pulse"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            REGISTRA RIENTRO DA TERZISTA (COMPLETA FASE)
                          </button>
                        )}

                        {/* Se completata/rientrata */}
                        {isCompletata && (
                          <div className="col-span-2 py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              Lavorazione esterna rientrata e verificata
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* CASO 1: FASE AUTORIZZATA AD ESSERE AVVIATA (Priorità N. 1) */}
                        {isAutorizzataAdAvviare && (
                          <button
                            onClick={() => handleCambiaStatoFase(odp.id, fase.id, 'in_corso')}
                            className="col-span-2 py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40 transition-all cursor-pointer active:scale-95"
                          >
                            <Play className="w-5 h-5 fill-current" />
                            AVVIA LAVORAZIONE (PRIORITÀ N. 1)
                          </button>
                        )}

                        {/* CASO SPECIFICO: DISPONIBILITÀ PARZIALE DI MATERIA PRIMA (Sdoppiamento Lotto / Split OdP) */}
                        {item.materiaPrimaParziale && item.fasePrecedenteCompletata && !isInCorso && !isCompletata && (
                          <div className="col-span-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-400" />
                                Giacenza parziale: {item.pezziFattibiliConGiacenza} su {odp.quantita_da_produrre} pz pronti
                              </span>
                              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-black">
                                Disponibile Subito
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              Il materiale a magazzino non copre l&apos;intero ordine, ma puoi avviare subito la parte pronta ({item.pezziFattibiliConGiacenza} pz) sdoppiando l&apos;ordine.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setDatiSplit({
                                  odp,
                                  fase,
                                  quantitaDisponibile: item.pezziFattibiliConGiacenza,
                                  quantitaDaSplittare: item.pezziFattibiliConGiacenza
                                })
                                setModaleSplitAperta(true)
                              }}
                              className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Avvia Lotto Parziale ({item.pezziFattibiliConGiacenza} pz)</span>
                            </button>
                          </div>
                        )}

                        {/* CASO 2: FASE BLOCCATA DALLA CODA, DA LAVORAZIONE IN CORSO O MATERIA PRIMA TOTALMENTE MANCANTE */}
                        {isBloccata && !item.materiaPrimaParziale && (
                          <div className="col-span-2 py-3 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs flex items-center justify-between select-none">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                              <div>
                                <p className={`font-bold ${materiaPrimaMancante ? 'text-amber-400' : 'text-slate-400'}`}>
                                  {materiaPrimaMancante
                                    ? '⚠️ In attesa materia prima da fornitore (Stock insufficiente)'
                                    : macchinaQuestaFaseOccupata
                                    ? 'Macchina occupata: lavorazione già in corso'
                                    : !fasePrecedenteCompletata
                                    ? 'Fase bloccata: attesa completamento fase precedente'
                                    : 'In attesa del tuo turno (segui la priorità di coda)'}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {materiaPrimaMancante && nomeMateriaPrimaMancante
                                    ? `Materiale: ${nomeMateriaPrimaMancante} - La macchina esegue intanto il pezzo successivo disponibile.`
                                    : 'L’operatore non può avviare questo ordine prima degli ordini prioritari pronti.'}
                                </p>
                              </div>
                            </div>
                            <span className={`font-mono font-black text-sm shrink-0 ${materiaPrimaMancante ? 'text-amber-500' : 'text-slate-600'}`}>
                              {materiaPrimaMancante ? '⚠️ MATERIA PRIMA' : '🔒 BLOCCO'}
                            </span>
                          </div>
                        )}

                        {/* CASO 3: FASE GIÀ IN CORSO */}
                        {isInCorso && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const isCadCam = fase.centro_lavoro_id === 'mc-cam-01' || fase.nome_fase.toLowerCase().includes('cam')
                                // Se la fase lavora il grezzo fisico ed esiste un vincolo di magazzino, il limite massimo è la giacenza reale
                                const limiteReale = !isCadCam && item.materiaPrimaParziale
                                  ? item.pezziFattibiliConGiacenza
                                  : odp.quantita_da_produrre

                                setDatiCompleta({
                                  odp,
                                  fase,
                                  pezziBuoni: limiteReale,
                                  pezziScarto: 0,
                                  opzioneResiduo: 'splitta_residuo',
                                  generaRipristinoScarto: true,
                                  limiteMassimoConsentito: limiteReale,
                                  nomeMateriaPrimaLimite: item.nomeMateriaPrimaMancante
                                })
                                setModaleCompletaAperta(true)
                              }}
                              className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                            >
                              <CheckCircle className="w-5 h-5" />
                              COMPLETA FASE
                            </button>

                            <button
                              onClick={() => handleCambiaStatoFase(odp.id, fase.id, 'non_iniziata')}
                              className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Pause className="w-4 h-4" />
                              Sospendi
                            </button>
                          </>
                        )}

                        {/* CASO 4: FASE COMPLETATA */}
                        {isCompletata && (
                          <div className="col-span-2 py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              Fase conclusa alle {fase.data_fine_reale ? new Date(fase.data_fine_reale).toLocaleTimeString('it-IT') : '-'}
                            </span>
                            <button
                              onClick={() => handleCambiaStatoFase(odp.id, fase.id, 'in_corso')}
                              className="text-[10px] text-slate-500 hover:text-white underline cursor-pointer"
                            >
                              Riapri
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => {
                        setFasePerNota({
                          odpId: odp.id,
                          faseId: fase.id,
                          notaAttuale: fase.note_officina || ''
                        })
                        setTestoNota(fase.note_officina || '')
                        setModaleNoteAperta(true)
                      }}
                      className="text-slate-400 hover:text-orange-400 font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {fase.note_officina ? 'Modifica Nota Operatore' : '+ Aggiungi Nota Operatore'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSchedaA4OdpId(odp.id)}
                      className="text-orange-400 hover:text-orange-300 font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Vedi Scheda A4
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {fasiDaVisualizzare.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-200 font-bold text-base">Nessuna lavorazione in coda per i criteri selezionati</p>
              <p className="text-xs text-slate-400 mt-1">
                {mostraCompletati
                  ? 'Non ci sono ordini o lavorazioni registrate per questa selezione.'
                  : 'Tutte le fasi risultano completate o non ci sono ordini assegnati a questa macchina.'}
              </p>
            </div>
          )}
        </div>

        {/* Paginazione Touch per Vista a Schede */}
        {totalePagine > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <div className="text-xs text-slate-400 font-semibold">
              Mostrati da <span className="text-white font-bold">{Math.min((paginaCorrente - 1) * ELEMENTI_PER_PAGINA + 1, totaleElementi)}</span> a{' '}
              <span className="text-white font-bold">{Math.min(paginaCorrente * ELEMENTI_PER_PAGINA, totaleElementi)}</span> di{' '}
              <span className="text-orange-400 font-bold">{totaleElementi}</span> lavorazioni in coda
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaginaCorrente((prev) => Math.max(prev - 1, 1))}
                disabled={paginaCorrente === 1}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Precedenti</span>
              </button>

              <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-orange-400">
                Pagina {paginaCorrente} / {totalePagine}
              </div>

              <button
                type="button"
                onClick={() => setPaginaCorrente((prev) => Math.min(prev + 1, totalePagine))}
                disabled={paginaCorrente === totalePagine}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-600/30"
              >
                <span>Successivi 10</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* VISTA A LISTA DETTAGLIATA (TABELLA COMPATTA ULTRA-RESPONSIVA) */}
      {modalitaVista === 'tabella' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap"># / Priorità</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">OdP / Particolare</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Fase Operativa</th>
                  {macchinaSelezionataId === 'tutte' && (
                    <th className="py-2.5 px-3 whitespace-nowrap">Centro / Macchina</th>
                  )}
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Q.tà</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Tempo Ciclo</th>
                  {isSupervisore && <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Scadenza</th>}
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Stato Monte</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Stato Fase</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-slate-950/95 shadow-l">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {fasiPaginate.map((item, index) => {
                  const numeroPosizioneAssoluta = (paginaCorrente - 1) * ELEMENTI_PER_PAGINA + index + 1
                  const { odp, fase, articolo, centro, fasePrecedenteCompletata, materiaPrimaMancante, materiaPrimaParziale, pezziFattibiliConGiacenza, nomeMateriaPrimaMancante } = item
                  const isCompletata = fase.stato === 'completata'
                  const isInCorso = fase.stato === 'in_corso'
                  const isAutorizzataAdAvviare = !isInCorso && !isCompletata && !item.materiaPrimaParziale && idsFasiAutorizzateDaAvviare.has(fase.id)
                  const isBloccata = !isInCorso && !isCompletata && !isAutorizzataAdAvviare

                  const prioritaMappa: Record<number, { label: string; bg: string; icon: typeof Flame }> = {
                    4: { label: 'URG.', bg: 'bg-red-500/20 text-red-400 border-red-500/40', icon: Flame },
                    3: { label: 'ALTA', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertCircle },
                    2: { label: 'MED.', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Clock },
                    1: { label: 'BAS.', bg: 'bg-slate-700/50 text-slate-400 border-slate-600/40', icon: Clock }
                  }
                  const prioritaConfig = prioritaMappa[odp.priorita] || prioritaMappa[2]
                  const PrioritaIcon = prioritaConfig.icon

                  return (
                    <tr
                      key={fase.id}
                      className={`transition-colors ${
                        isInCorso
                          ? 'bg-blue-950/30 font-semibold'
                          : isAutorizzataAdAvviare
                          ? 'bg-emerald-950/20'
                          : isCompletata
                          ? 'opacity-60 bg-slate-950/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Posizione in Coda & Priorità */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* Checkbox Spedizione Cumulativa */}
                          {fase.is_esterna && (!fase.stato_esterna || fase.stato_esterna === 'in_attesa_uscita') && !isCompletata && fasePrecedenteCompletata && (
                            <input
                              type="checkbox"
                              checked={fasiEsterneSelezionateIds.includes(fase.id)}
                              onChange={() => {
                                setFasiEsterneSelezionateIds((prev) =>
                                  prev.includes(fase.id) ? prev.filter((id) => id !== fase.id) : [...prev, fase.id]
                                )
                              }}
                              className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-slate-950 border-slate-700 cursor-pointer accent-pink-600 mr-1"
                              title="Seleziona per DDT cumulativo"
                            />
                          )}
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isInCorso
                                ? 'bg-blue-500 text-white'
                                : isAutorizzataAdAvviare
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{numeroPosizioneAssoluta}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${prioritaConfig.bg}`}
                          >
                            <PrioritaIcon className="w-2.5 h-2.5" />
                            {prioritaConfig.label}
                          </span>
                        </div>
                      </td>

                      {/* OdP & Articolo */}
                      <td className="py-2.5 px-3 min-w-[140px] max-w-[200px]">
                        <div className="font-mono font-bold text-orange-400 text-xs truncate">
                          {odp.codice_odp}
                        </div>
                        <div className="text-slate-300 text-[11px] truncate" title={`${articolo?.codice_articolo} • ${articolo?.descrizione}`}>
                          {articolo?.codice_articolo} &bull; {articolo?.descrizione}
                        </div>
                      </td>

                      {/* Fase */}
                      <td className="py-2.5 px-3 min-w-[140px] max-w-[220px]">
                        <span className="text-[10px] text-slate-400 block font-mono">Fase #{fase.sequenza}</span>
                        <span className="font-bold text-slate-100 text-xs truncate block" title={fase.nome_fase}>{fase.nome_fase}</span>
                      </td>

                      {/* Macchina: VISIBILE SOLO SE VISTA GLOBALE 'TUTTE' */}
                      {macchinaSelezionataId === 'tutte' && (
                        <td className="py-2.5 px-3 min-w-[130px] max-w-[180px]">
                          <div className="text-slate-200 font-medium text-xs truncate" title={centro?.nome}>
                            {centro ? centro.nome : 'N/D'}
                          </div>
                          {fase.centro_lavoro_id !== macchinaSelezionataId && (
                            <span className="text-[9px] text-blue-400 font-bold block">⚡ Macchina Alternativa</span>
                          )}
                        </td>
                      )}

                      {/* Quantità */}
                      <td className="py-2.5 px-2.5 font-bold text-white text-center whitespace-nowrap text-xs">
                        {odp.quantita_da_produrre} <span className="text-[10px] text-slate-400 font-normal">{articolo?.unita_misura}</span>
                      </td>

                      {/* Tempo */}
                      <td className="py-2.5 px-2.5 text-slate-300 font-mono text-center whitespace-nowrap text-xs">
                        {fase.tempo_stimato_totale_min} <span className="text-[10px] text-slate-500">m</span>
                      </td>

                      {/* Scadenza: VISIBILE SOLO AL SUPERVISORE */}
                      {isSupervisore && (
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          {(() => {
                            const sc = calcolaScadenzaFase(odp, fase)
                            if (!sc) return <span className="text-slate-500">-</span>
                            return (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                                {sc.testoLabel}
                              </span>
                            )
                          })()}
                        </td>
                      )}

                          {/* Stato Flusso Monte / Materiali */}
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            {isCompletata ? (
                              <span className="text-slate-500 text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-slate-500" />
                                Conclusa
                              </span>
                            ) : item.materiaPrimaParziale ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDatiSplit({
                                    odp,
                                    fase,
                                    quantitaDisponibile: item.pezziFattibiliConGiacenza,
                                    quantitaDaSplittare: item.pezziFattibiliConGiacenza
                                  })
                                  setModaleSplitAperta(true)
                                }}
                                className="text-amber-400 hover:text-amber-300 font-bold text-[10px] inline-flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/80 cursor-pointer"
                                title={`Disponibile per ${item.pezziFattibiliConGiacenza} pz su ${odp.quantita_da_produrre}. Clicca per sdoppiare il lotto.`}
                              >
                                <Clock className="w-3 h-3 text-amber-400" />
                                Parziale ({item.pezziFattibiliConGiacenza}/{odp.quantita_da_produrre})
                              </button>
                            ) : materiaPrimaMancante ? (
                              <span className="text-amber-400 font-bold text-[10px] inline-flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80" title={nomeMateriaPrimaMancante}>
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                Manca Grezzo
                              </span>
                            ) : fasePrecedenteCompletata ? (
                              <span className="text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Pronto banco
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold text-[10px] inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                In attesa monte
                              </span>
                            )}
                          </td>

                      {/* Badge Stato */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isInCorso
                              ? 'bg-blue-600 text-white animate-pulse'
                              : isCompletata
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isAutorizzataAdAvviare
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isInCorso
                            ? 'IN MACCHINA'
                            : isCompletata
                            ? 'FATTA'
                            : isAutorizzataAdAvviare
                            ? 'PRONTA'
                            : 'IN CODA'}
                        </span>
                      </td>

                      {/* Azioni con Sicurezza e Blocco (Sticky colonna a destra) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-slate-900/95 group-hover:bg-slate-800/95 shadow-l">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lavorazione Esterna C/Terzi */}
                          {fase.is_esterna ? (
                            <>
                              {(!fase.stato_esterna || fase.stato_esterna === 'in_attesa_uscita') && !isCompletata && (
                                fasePrecedenteCompletata ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const art = articoli.find((a) => a.id === odp.articolo_id)
                                      const pesoStimato = Number(((art?.peso_kg_unitario || 2.5) * odp.quantita_da_produrre).toFixed(1))
                                      setDatiEsterna({
                                        odp,
                                        fase,
                                        tipoAzione: 'spedizione',
                                        ddtNumero: `DDT-EXT-${Date.now().toString().slice(-4)}`,
                                        note: '',
                                        numeroColli: 1,
                                        pesoTotaleKg: pesoStimato,
                                        vettoreNome: 'Mittente (Mezzo Proprio)',
                                        aspettoBeni: 'A vista su bancale',
                                        causaleTrasporto: 'Invio per Conto Lavorazione'
                                      })
                                      setModaleEsternaAperta(true)
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] uppercase flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Spedisci al terzista"
                                  >
                                    <Truck className="w-3 h-3" />
                                    Spedisci
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-bold select-none"
                                    title="Spedizione non ancora possibile: i pezzi sono ancora in lavorazione sulle macchine interne a monte."
                                  >
                                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                                    In lavoraz. monte
                                  </span>
                                )
                              )}

                              {fase.stato_esterna === 'inviato_al_terzista' && !isCompletata && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDatiEsterna({
                                      odp,
                                      fase,
                                      tipoAzione: 'rientro',
                                      ddtNumero: '',
                                      note: '',
                                      numeroColli: 1,
                                      pesoTotaleKg: 0,
                                      vettoreNome: 'Vettore incaricato dal Fornitore',
                                      aspettoBeni: 'A vista',
                                      causaleTrasporto: 'Reso da Conto Lavorazione'
                                    })
                                    setModaleEsternaAperta(true)
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase flex items-center gap-1 cursor-pointer active:scale-95 animate-pulse"
                                  title="Registra rientro terzista"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Rientrato
                                </button>
                              )}

                              {isCompletata && (
                                <span className="text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Rientrato
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {isAutorizzataAdAvviare && (
                                <button
                                  onClick={() => handleCambiaStatoFase(odp.id, fase.id, 'in_corso')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wide flex items-center gap-1 shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  Avvia
                                </button>
                              )}

                              {isInCorso && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isCadCam = fase.centro_lavoro_id === 'mc-cam-01' || fase.nome_fase.toLowerCase().includes('cam')
                                      const limiteReale = !isCadCam && item.materiaPrimaParziale
                                        ? item.pezziFattibiliConGiacenza
                                        : odp.quantita_da_produrre

                                      setDatiCompleta({
                                        odp,
                                        fase,
                                        pezziBuoni: limiteReale,
                                        pezziScarto: 0,
                                        opzioneResiduo: 'splitta_residuo',
                                        generaRipristinoScarto: true,
                                        limiteMassimoConsentito: limiteReale,
                                        nomeMateriaPrimaLimite: item.nomeMateriaPrimaMancante
                                      })
                                      setModaleCompletaAperta(true)
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Fatta
                                  </button>
                                  <button
                                    onClick={() => handleCambiaStatoFase(odp.id, fase.id, 'non_iniziata')}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                                    title="Sospendi"
                                  >
                                    <Pause className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {isBloccata && !item.materiaPrimaParziale && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-bold select-none"
                                  title="L'operatore deve prima eseguire l'ordine prioritario o attendere che il materiale sia pronto."
                                >
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                                  Bloccato
                                </span>
                              )}

                              {item.materiaPrimaParziale && item.fasePrecedenteCompletata && !isInCorso && !isCompletata && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDatiSplit({
                                      odp,
                                      fase,
                                      quantitaDisponibile: item.pezziFattibiliConGiacenza,
                                      quantitaDaSplittare: item.pezziFattibiliConGiacenza
                                    })
                                    setModaleSplitAperta(true)
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] uppercase flex items-center gap-1 cursor-pointer active:scale-95 shadow-md shadow-amber-600/30"
                                  title={`Avvia solo i ${item.pezziFattibiliConGiacenza} pz disponibili sdoppiando l'ordine`}
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  Split ({item.pezziFattibiliConGiacenza} pz)
                                </button>
                              )}
                            </>
                          )}

                          {isCompletata && (
                            <button
                              onClick={() => handleCambiaStatoFase(odp.id, fase.id, 'in_corso')}
                              className="text-[9px] text-slate-500 hover:text-white underline cursor-pointer px-1"
                            >
                              Riapri
                            </button>
                          )}

                          {/* Pulsante rapido Nota */}
                          <button
                            type="button"
                            onClick={() => {
                              setFasePerNota({
                                odpId: odp.id,
                                faseId: fase.id,
                                notaAttuale: fase.note_officina || ''
                              })
                              setTestoNota(fase.note_officina || '')
                              setModaleNoteAperta(true)
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-orange-400 cursor-pointer"
                            title="Aggiungi / Modifica Nota Operatore"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>

                          {/* Pulsante Scheda A4 in Overlay Touch */}
                          <button
                            type="button"
                            onClick={() => setSchedaA4OdpId(odp.id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-orange-400 cursor-pointer"
                            title="Apri Scheda Lavoro A4"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {fasiDaVisualizzare.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Nessuna lavorazione in coda per i criteri selezionati.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginazione Touch per Vista a Tabella Compatta */}
          {totalePagine > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-semibold">
                Mostrati da <span className="text-white font-bold">{Math.min((paginaCorrente - 1) * ELEMENTI_PER_PAGINA + 1, totaleElementi)}</span> a{' '}
                <span className="text-white font-bold">{Math.min(paginaCorrente * ELEMENTI_PER_PAGINA, totaleElementi)}</span> di{' '}
                <span className="text-orange-400 font-bold">{totaleElementi}</span> lavorazioni in coda
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaCorrente((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaCorrente === 1}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Precedenti</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-orange-400">
                  Pagina {paginaCorrente} / {totalePagine}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaCorrente((prev) => Math.min(prev + 1, totalePagine))}
                  disabled={paginaCorrente === totalePagine}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-600/30"
                >
                  <span>Successivi 10</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALE NOTA OPERATORE */}
      {modaleNoteAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Nota Operatore / Segnalazione
              </h2>
              <button
                onClick={() => setModaleNoteAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaNota} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dettagli lavorazione, bava, usura utensile o controlli dimensionali:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="es: Sostituito inserto dopo 15 pezzi per usura. Tolleranza diametro 60 H7 verificata con alesametro."
                  value={testoNota}
                  onChange={(e) => setTestoNota(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModaleNoteAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                >
                  Salva Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE GESTIONE SPEDIZIONE / RIENTRO CONTO TERZI ESTERNO */}
      {modaleEsternaAperta && datiEsterna && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${datiEsterna.tipoAzione === 'spedizione' ? 'bg-pink-600/20 text-pink-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {datiEsterna.tipoAzione === 'spedizione'
                      ? 'Registra Spedizione al Terzista'
                      : 'Registra Rientro Lavorazione Esterna'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {datiEsterna.odp.codice_odp} • Fase #{datiEsterna.fase.sequenza} ({datiEsterna.fase.nome_fase})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModaleEsternaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Terzista incaricato:</span>
                  <strong className="text-pink-400 font-bold">{datiEsterna.fase.fornitore_nome || 'Esterno non specificato'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantità Pezzi da inviare/ricevere:</span>
                  <strong className="text-orange-400 font-bold">{datiEsterna.odp.quantita_da_produrre} pz</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lead time previsto:</span>
                  <span className="text-slate-200 font-semibold">{datiEsterna.fase.giorni_rientro_previsti || 5} giorni lavorativi</span>
                </div>
                {datiEsterna.fase.costo_tariffa_valore ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tariffa applicata:</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      € {datiEsterna.fase.costo_tariffa_valore.toFixed(2)} / {
                        datiEsterna.fase.modello_tariffa === 'peso_kg' ? 'kg' :
                        datiEsterna.fase.modello_tariffa === 'superficie_m2' ? 'm²' :
                        datiEsterna.fase.modello_tariffa === 'superficie_dm2' ? 'dm²' :
                        datiEsterna.fase.modello_tariffa === 'lotto_forfettario' ? 'lotto fisso' : 'pz'
                      }
                    </span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {datiEsterna.tipoAzione === 'spedizione'
                    ? 'Numero Documento di Trasporto (DDT di Uscita) *'
                    : 'Numero Documento di Rientro (DDT Fornitore) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={datiEsterna.tipoAzione === 'spedizione' ? 'es: DDT-2026/045' : 'es: DDT-FORN-9843'}
                  value={datiEsterna.ddtNumero}
                  onChange={(e) => setDatiEsterna({ ...datiEsterna, ddtNumero: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Campi Dettagliati Spedizione Operativa DDT (Visibili solo in uscita) */}
              {datiEsterna.tipoAzione === 'spedizione' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Numero Colli / Casse
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={datiEsterna.numeroColli}
                      onChange={(e) => setDatiEsterna({ ...datiEsterna, numeroColli: Math.max(1, Number(e.target.value)) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Peso Totale Stimato (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={datiEsterna.pesoTotaleKg}
                      onChange={(e) => setDatiEsterna({ ...datiEsterna, pesoTotaleKg: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Vettore Incaricato
                    </label>
                    <select
                      value={datiEsterna.vettoreNome}
                      onChange={(e) => setDatiEsterna({ ...datiEsterna, vettoreNome: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    >
                      <option value="Mittente (Mezzo Proprio)">Mittente (Mezzo Proprio)</option>
                      <option value="Corriere Espresso (Arcese / BRT / TNT)">Corriere Espresso (Arcese / BRT / TNT)</option>
                      <option value="Destinatario (Ritiro a cura fornitore)">Destinatario (Ritiro a cura fornitore)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Aspetto Beni
                    </label>
                    <input
                      type="text"
                      value={datiEsterna.aspettoBeni}
                      onChange={(e) => setDatiEsterna({ ...datiEsterna, aspettoBeni: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Operative, Spedizioniere o Controllo Qualità Rientro:
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    datiEsterna.tipoAzione === 'spedizione'
                      ? 'es: Spedito con corriere Arcese. Imballati su bancale 80x120 con reggette.'
                      : 'es: Verificato spessore zincatura (12 micron ok). Nessun difetto visivo.'
                  }
                  value={datiEsterna.note}
                  onChange={(e) => setDatiEsterna({ ...datiEsterna, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModaleEsternaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaEsterna}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-95 ${
                    datiEsterna.tipoAzione === 'spedizione'
                      ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {datiEsterna.tipoAzione === 'spedizione'
                    ? 'Conferma Spedizione Esterna'
                    : 'Conferma Rientro Pezzi in Officina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* MODALE SPEDIZIONE CUMULATIVA CONTO TERZI (MULTI-ODP CON UNICO DDT) */}
      {modaleSpedizioneCumulativaAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border-2 border-pink-500/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-pink-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Emissione DDT Cumulativo Conto Lavoro
                    <span className="text-xs px-2 py-0.5 rounded bg-pink-900 text-pink-200 font-mono">
                      {fasiEsterneSelezionateIds.length} OdP accorpati
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Genera un solo documento di trasporto unificato per tutti i particolari selezionati.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModaleSpedizioneCumulativaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              {/* Elenco Ordini Selezionati per questo DDT */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Particolari che viaggeranno insieme nel documento:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {fasiInOfficina
                    .filter((it) => fasiEsterneSelezionateIds.includes(it.fase.id))
                    .map((it) => {
                      const art = articoli.find((a) => a.id === it.odp.articolo_id)
                      return (
                        <div key={it.fase.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div>
                            <span className="font-mono font-bold text-orange-400 mr-2">{it.odp.codice_odp}</span>
                            <span className="text-white font-medium">{art?.codice_articolo}</span>
                            <span className="text-slate-400 text-[11px] block">{it.fase.nome_fase}</span>
                          </div>
                          <span className="font-bold text-pink-400 font-mono">
                            {it.odp.quantita_da_produrre} {art?.unita_misura || 'pz'}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Alert Poka-Yoke: Controllo Terzisti Differenti tra gli OdP selezionati */}
              {(() => {
                const terzistiDiversi = Array.from(
                  new Set(
                    fasiInOfficina
                      .filter((it) => fasiEsterneSelezionateIds.includes(it.fase.id))
                      .map((it) => it.fase.fornitore_nome || 'Non specificato')
                  )
                )
                if (terzistiDiversi.length > 1) {
                  return (
                    <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 block font-bold">Avviso Poka-Yoke: Fornitori di origine differenti</strong>
                        <span>
                          Gli OdP selezionati prevedono a ciclo terzisti diversi: <strong>{terzistiDiversi.join(' / ')}</strong>.
                          Confermi di volerli accorpare e inviare tutti a <strong>{formCumulativo.fornitoreNome || 'questo fornitore'}</strong>?
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numero DDT di Trasporto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCumulativo.ddtNumero}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, ddtNumero: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Fornitore Terzista Destinatario *
                    </label>
                    {fornitoriTerzisti.length > 0 && (
                      <span className="text-[10px] text-pink-400 font-bold">
                        Anagrafica Rapida
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <select
                      value={formCumulativo.fornitoreNome}
                      onChange={(e) => {
                        const nomeSelezionato = e.target.value
                        const forn = fornitoriTerzisti.find((t) => t.ragione_sociale === nomeSelezionato)
                        setFormCumulativo({
                          ...formCumulativo,
                          fornitoreNome: nomeSelezionato,
                          fornitoreId: forn?.id || '',
                          fornitoreIndirizzo: forn ? `${forn.indirizzo}, ${forn.cap || ''} ${forn.citta || ''} (${forn.provincia || ''})` : formCumulativo.fornitoreIndirizzo,
                          fornitorePiva: forn?.partita_iva || formCumulativo.fornitorePiva
                        })
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-semibold focus:outline-none focus:border-pink-500 cursor-pointer"
                    >
                      <option value="">-- Seleziona o digita sotto --</option>
                      {fornitoriTerzisti.map((f) => (
                        <option key={f.id} value={f.ragione_sociale}>
                          {f.ragione_sociale} {f.specialita ? `(${f.specialita})` : ''}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      required
                      placeholder="Oppure inserisci fornitore manuale..."
                      value={formCumulativo.fornitoreNome}
                      onChange={(e) => setFormCumulativo({ ...formCumulativo, fornitoreNome: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dati Fiscali Destinatario DDT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Indirizzo di Consegna / Sede Terzista
                  </label>
                  <input
                    type="text"
                    value={formCumulativo.fornitoreIndirizzo}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, fornitoreIndirizzo: e.target.value })}
                    placeholder="Via, CAP, Città (Prov)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Partita IVA / Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={formCumulativo.fornitorePiva}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, fornitorePiva: e.target.value })}
                    placeholder="IT01234567890"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Numero Colli Totali
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formCumulativo.numeroColli}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, numeroColli: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Peso Complessivo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formCumulativo.pesoTotaleKg}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, pesoTotaleKg: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Aspetto Beni
                  </label>
                  <input
                    type="text"
                    value={formCumulativo.aspettoBeni}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, aspettoBeni: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vettore Incaricato del Trasporto
                </label>
                <select
                  value={formCumulativo.vettoreNome}
                  onChange={(e) => setFormCumulativo({ ...formCumulativo, vettoreNome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
                >
                  <option value="Mittente (Mezzo Proprio)">Mittente (Mezzo Proprio)</option>
                  <option value="Corriere Espresso (Arcese / BRT / TNT)">Corriere Espresso (Arcese / BRT / TNT)</option>
                  <option value="Destinatario (Ritiro a cura fornitore)">Destinatario (Ritiro a cura fornitore)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Trasporto e Istruzioni Generali:
                </label>
                <textarea
                  rows={2}
                  value={formCumulativo.note}
                  onChange={(e) => setFormCumulativo({ ...formCumulativo, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModaleSpedizioneCumulativaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaSpedizioneCumulativa}
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-pink-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Conferma e Stampa DDT Cumulativo ({fasiEsterneSelezionateIds.length} OdP)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE BLINDATA SCHEDA LAVORO A4 (TOUCH KIOSK BORDO MACCHINA) */}
      {schedaA4OdpId && (() => {
        const odpDettaglio = odpList.find((o) => o.id === schedaA4OdpId)
        if (!odpDettaglio) return null
        const articoloDettaglio = articoli.find((a) => a.id === odpDettaglio.articolo_id)

        return (
          <div className="scheda-a4-container fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
            {/* Barra superiore Kiosk Blindata */}
            <div className="no-print max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-2">
                    {odpDettaglio.codice_odp}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-semibold">
                      SCHEDA OPERATIVA A4
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Consultazione bordo macchina &bull; Nessun accesso al gestionale esterno
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Stampa Scheda
                </button>

                <button
                  type="button"
                  onClick={() => setSchedaA4OdpId(null)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                >
                  ✕ Chiudi Scheda (Torna al Banco)
                </button>
              </div>
            </div>

            {/* Foglio Scheda Lavoro A4 Blindato in sola lettura */}
            <div className="scheda-a4-foglio max-w-5xl w-full mx-auto bg-white text-slate-950 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none">
              {/* Intestazione A4 */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">
                    OFFICINA MECCANICA DI PRECISIONE &bull; SCHEDA TECNICA DI PRODUZIONE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
                    {odpDettaglio.codice_odp}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Data emissione: {new Date(odpDettaglio.creato_il).toLocaleDateString('it-IT')} &bull; Consegna richiesta:{' '}
                    <strong>{odpDettaglio.data_fine_pianificata || 'N/D'}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Codice Disegno / Token</span>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded border border-slate-300">
                    {odpDettaglio.qr_code_token}
                  </span>
                </div>
              </div>

              {/* Dati Articolo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Codice Particolare</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {articoloDettaglio?.codice_articolo || 'N/D'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Descrizione Tecnica</span>
                  <span className="text-sm font-bold text-slate-800">
                    {articoloDettaglio?.descrizione || 'Particolare Meccanico'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Quantità da Lavorare</span>
                  <span className="text-xl font-black text-orange-600 font-mono">
                    {odpDettaglio.quantita_da_produrre} {articoloDettaglio?.unita_misura || 'pz'}
                  </span>
                </div>
              </div>

              {/* Riferimento Commessa & Cliente */}
              {(() => {
                let nomeCli = odpDettaglio.cliente_nome || ''
                let codOrd = odpDettaglio.codice_ordine_cliente || ''
                let rigaNum = odpDettaglio.numero_riga_ordine ? `Riga / Item #${odpDettaglio.numero_riga_ordine}` : ''

                if (!nomeCli || !codOrd) {
                  const parseSicuro = <T,>(chiave: string, fallback: T): T => {
                    try {
                      const item = localStorage.getItem(chiave)
                      if (!item || item === 'undefined' || item === 'null') return fallback
                      return JSON.parse(item) as T
                    } catch {
                      return fallback
                    }
                  }
                  const clientiList = parseSicuro<Cliente[]>('machinaflow_clienti', SEED_CLIENTI)
                  const ordiniSalvati = parseSicuro<(OrdineCliente & { cliente?: Cliente; righe: (RigaOrdineCliente & { articolo?: Articolo })[] })[]>('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI)

                  let ordineTrovato: (OrdineCliente & { cliente?: Cliente; righe: (RigaOrdineCliente & { articolo?: Articolo })[] }) | undefined

                  if (odpDettaglio.ordine_cliente_id) {
                    ordineTrovato = ordiniSalvati.find((o) => o.id === odpDettaglio.ordine_cliente_id)
                  } else if (odpDettaglio.riga_ordine_cliente_id) {
                    ordineTrovato = ordiniSalvati.find((o) => o.righe?.some((r) => r.id === odpDettaglio.riga_ordine_cliente_id))
                  }

                  if (!ordineTrovato && odpDettaglio.note) {
                    const matchOrd = odpDettaglio.note.match(/ORD-[A-Z]+-[0-9]+-[0-9]+/i)
                    if (matchOrd) {
                      const codiceEstratto = matchOrd[0].toUpperCase()
                      ordineTrovato = ordiniSalvati.find((o) => o.numero_ordine.toUpperCase() === codiceEstratto)
                    }
                  }

                  if (ordineTrovato) {
                    codOrd = codOrd || ordineTrovato.numero_ordine
                    const clienteRel = clientiList.find((c) => c.id === ordineTrovato!.cliente_id) || ordineTrovato.cliente
                    nomeCli = nomeCli || clienteRel?.ragione_sociale || 'Cliente'

                    if (!rigaNum && odpDettaglio.riga_ordine_cliente_id) {
                      const idx = ordineTrovato.righe?.findIndex((r) => r.id === odpDettaglio.riga_ordine_cliente_id)
                      if (idx !== undefined && idx >= 0) {
                        rigaNum = `Riga / Item #${idx + 1}`
                      }
                    }
                  }
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-orange-50/50 p-3.5 rounded-xl border border-orange-200/80 text-xs">
                    <div>
                      <span className="text-[10px] font-black text-orange-800 uppercase block">Destinatario / Cliente</span>
                      <span className="text-sm font-black text-slate-900">
                        {nomeCli || 'Cliente Interno / Stock'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-orange-800 uppercase block">Rif. Ordine Cliente</span>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {codOrd || 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-orange-800 uppercase block">Posizione / Riga Item</span>
                      <span className="text-sm font-bold text-slate-900">
                        {rigaNum || 'Item #1'}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Note OdP */}
              {odpDettaglio.note && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <strong>Note di produzione:</strong> {odpDettaglio.note}
                </div>
              )}

              {/* Materia Prima & Distinta Base (BOM) */}
              {(() => {
                const componenti = distinte.filter((d) => d.articolo_padre_id === odpDettaglio.articolo_id)
                return (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-orange-600" />
                      Materia Prima di Partenza & Distinta Base (BOM)
                    </h3>
                    {componenti.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="py-2.5 px-3">Codice Grezzo / Componente</th>
                              <th className="py-2.5 px-3">Descrizione Tecnica</th>
                              <th className="py-2.5 px-3 text-center">Fabbisogno Unit.</th>
                              <th className="py-2.5 px-3 text-center">Fabbisogno Lotto ({odpDettaglio.quantita_da_produrre} pz)</th>
                              {/* A video mostriamo Giacenza Stock */}
                              <th className="py-2.5 px-3 text-center print:hidden">Giacenza Stock</th>
                              {/* In stampa A4 sostituiamo con Lotto / Colata per tracciabilità ISO */}
                              <th className="py-2.5 px-3 text-center w-32 hidden print:table-cell">Lotto / Colata MP</th>
                              <th className="py-2.5 px-3">Note Taglio / Preparazione</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {componenti.map((comp) => {
                              const mat = articoli.find((a) => a.id === comp.articolo_componente_id)
                              const fabbisognoTotale = comp.quantita_necessaria * odpDettaglio.quantita_da_produrre
                              const haGiacenza = (mat?.giacenza_attuale || 0) >= fabbisognoTotale

                              return (
                                <tr key={comp.id} className="hover:bg-slate-50/80">
                                  <td className="py-2.5 px-3 font-mono font-bold text-orange-600">
                                    {mat?.codice_articolo || 'N/D'}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    {mat?.descrizione || 'Materia Prima'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                    {comp.quantita_necessaria} {mat?.unita_misura}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                                    {fabbisognoTotale} {mat?.unita_misura}
                                  </td>
                                  {/* A video: Giacenza Stock */}
                                  <td className="py-2.5 px-3 text-center print:hidden">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      haGiacenza
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800 font-black'
                                    }`}>
                                      {mat?.giacenza_attuale ?? 0} {mat?.unita_misura}
                                      {!haGiacenza && ' ⚠️ SOTTO SCORTA'}
                                    </span>
                                  </td>
                                  {/* In stampa cartacea: Box tratteggiato per penna */}
                                  <td className="py-2.5 px-3 text-center hidden print:table-cell">
                                    <div className="w-24 h-5 border-b border-dashed border-slate-900 mx-auto" />
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">
                                    {comp.note || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        Nessun componente o materia prima associata in distinta base.
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Sequenza Ciclo di Lavorazione */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-600" />
                  Ciclo di Fabbricazione & Sequenza Macchine
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Fase</th>
                        <th className="py-2.5 px-3">Operazione</th>
                        <th className="py-2.5 px-3">Centro di Lavoro</th>
                        <th className="py-2.5 px-3 text-right">Tempo Stimato</th>
                        <th className="py-2.5 px-3 text-center">Stato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {odpDettaglio.fasi.map((f) => {
                        const centro = centriLavoro.find((c) => c.id === f.centro_lavoro_id)
                        return (
                          <tr key={f.id} className={f.stato === 'completata' ? 'bg-emerald-50/50' : f.stato === 'in_corso' ? 'bg-blue-50/50 font-bold' : ''}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-500">#{f.sequenza}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {f.nome_fase}
                              {f.is_esterna && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-pink-100 text-pink-700 font-bold border border-pink-300">
                                  CONTO TERZI
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {f.is_esterna ? (
                                <span className="text-pink-700 font-semibold flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5" />
                                  {f.fornitore_nome || 'Terzista Esterno'}
                                </span>
                              ) : (
                                centro?.nome || centro?.codice || f.centro_lavoro_id
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {f.is_esterna ? `${f.giorni_rientro_previsti || 5} gg rientro` : `${f.tempo_stimato_totale_min} min`}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.stato === 'completata'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f.stato === 'in_corso'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {f.is_esterna
                                  ? (f.stato_esterna === 'rientrato' ? 'Rientrato' : f.stato_esterna === 'inviato_al_terzista' ? 'Fuori Sede' : 'In Attesa Invio')
                                  : (f.stato === 'in_corso' ? 'In Macchina' : f.stato === 'completata' ? 'Completata' : 'In Coda')}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pulsante Chiusura Footer A4 */}
              <div className="no-print pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSchedaA4OdpId(null)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Torna alla Postazione
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* =========================================================================
          MODALE 1: SPLIT ODP (AVVIO PARZIALE PER MATERIALE LIMITATO)
          ========================================================================= */}
      {modaleSplitAperta && datiSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-amber-950/30">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Sdoppiamento Ordine (Split Parziale)
                </h2>
              </div>
              <button
                onClick={() => setModaleSplitAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-200 leading-relaxed">
                Stai per avviare subito la parte di ordine con materiale già disponibile a magazzino, senza bloccare la macchina.
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ordine Originale:</span>
                  <span className="font-mono font-bold text-orange-400">{datiSplit.odp.codice_odp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantità Totale Prevista:</span>
                  <span className="font-bold text-white">{datiSplit.odp.quantita_da_produrre} pz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Copertura Attuale Materiale:</span>
                  <span className="font-bold text-amber-400">{datiSplit.quantitaDisponibile} pz</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Quantità da Avviare Subito (Lotto A) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={datiSplit.odp.quantita_da_produrre - 1}
                  value={datiSplit.quantitaDaSplittare}
                  onChange={(e) =>
                    setDatiSplit({
                      ...datiSplit,
                      quantitaDaSplittare: Math.min(
                        Math.max(1, Number(e.target.value)),
                        datiSplit.odp.quantita_da_produrre - 1
                      )
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Il residuo di <strong>{datiSplit.odp.quantita_da_produrre - datiSplit.quantitaDaSplittare} pz</strong> rimarrà come lotto a saldo (/B) in attesa del resto del materiale.
                </span>
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleSplitAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleEseguiSplitOdP}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Conferma e Avvia {datiSplit.quantitaDaSplittare} pz</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE 2: COMPLETAMENTO FASE CON QUANTITÀ REALE (GOOD PARTS / SCRAP)
          ========================================================================= */}
      {modaleCompletaAperta && datiCompleta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Registra Chiusura Lavorazione
                </h2>
              </div>
              <button
                onClick={() => setModaleCompletaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ordine / Fase:</span>
                  <span className="font-mono font-bold text-white">
                    {datiCompleta.odp.codice_odp} • Fase #{datiCompleta.fase.sequenza}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Lotto Teorico Previsto:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-400">{datiCompleta.odp.quantita_da_produrre} pz</span>
                    {datiCompleta.limiteMassimoConsentito >= datiCompleta.odp.quantita_da_produrre && (
                      <button
                        type="button"
                        onClick={() =>
                          setDatiCompleta({
                            ...datiCompleta,
                            pezziBuoni: datiCompleta.odp.quantita_da_produrre,
                            pezziScarto: 0
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold cursor-pointer transition-colors"
                        title="Reimposta intero lotto con zero scarti"
                      >
                        Tutto il lotto
                      </button>
                    )}
                  </div>
                </div>

                {/* Box Vincolo Giacenza Grezzo (Poka-Yoke Industriale) */}
                {datiCompleta.limiteMassimoConsentito < datiCompleta.odp.quantita_da_produrre && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Blocco di Sicurezza: Giacenza Grezzo Limitata a {datiCompleta.limiteMassimoConsentito} pz</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      A magazzino è presente materiale sufficiente per soli <strong>{datiCompleta.limiteMassimoConsentito} pezzi</strong> su {datiCompleta.odp.quantita_da_produrre}.
                      Non è possibile dichiarare una quantità superiore. I <strong>{datiCompleta.odp.quantita_da_produrre - datiCompleta.limiteMassimoConsentito} pezzi rimanenti</strong> verranno automaticamente sdoppiati in un lotto residuo a saldo in attesa della fornitura.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-400 mb-1">
                    Pezzi Buoni Conformi * (Max {datiCompleta.limiteMassimoConsentito})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={datiCompleta.limiteMassimoConsentito}
                    value={datiCompleta.pezziBuoni}
                    onChange={(e) => {
                      const tettoConsentito = datiCompleta.limiteMassimoConsentito
                      const valBuoni = Math.min(tettoConsentito, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il tetto consentito dal grezzo, scala automaticamente gli scarti
                      let nuovoScarto = datiCompleta.pezziScarto
                      if (valBuoni + nuovoScarto > tettoConsentito) {
                        nuovoScarto = Math.max(0, tettoConsentito - valBuoni)
                      }
                      setDatiCompleta({
                        ...datiCompleta,
                        pezziBuoni: valBuoni,
                        pezziScarto: nuovoScarto
                      })
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Pezzi che avanzano alla fase successiva.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-rose-400 mb-1">
                    Pezzi Scartati / Difettosi
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={datiCompleta.limiteMassimoConsentito}
                    value={datiCompleta.pezziScarto}
                    onChange={(e) => {
                      const tettoConsentito = datiCompleta.limiteMassimoConsentito
                      const valScarti = Math.min(tettoConsentito, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il tetto consentito dal grezzo, scala automaticamente i pezzi buoni
                      let nuovoBuoni = datiCompleta.pezziBuoni
                      if (nuovoBuoni + valScarti > tettoConsentito) {
                        nuovoBuoni = Math.max(0, tettoConsentito - valScarti)
                      }
                      setDatiCompleta({
                        ...datiCompleta,
                        pezziScarto: valScarti,
                        pezziBuoni: nuovoBuoni
                      })
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Pezzi non conformi da rifare.
                  </span>
                </div>
              </div>

              {/* Box Riepilogo Matematico Dinamico */}
              {(() => {
                const totaleLavorati = datiCompleta.pezziBuoni + datiCompleta.pezziScarto
                const residuoDaFare = Math.max(0, datiCompleta.odp.quantita_da_produrre - totaleLavorati)
                return (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Totale Pezzi Trattati sul Mandrino:</span>
                      <strong className="text-white font-mono">{totaleLavorati} su {datiCompleta.odp.quantita_da_produrre} pz</strong>
                    </div>
                    {residuoDaFare > 0 ? (
                      <div className="flex justify-between text-amber-400 font-semibold border-t border-slate-800/60 pt-1">
                        <span>Pezzi Residui Ancora da Lavorare:</span>
                        <span className="font-mono">{residuoDaFare} pz a saldo</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-emerald-400 font-semibold border-t border-slate-800/60 pt-1">
                        <span>Copertura Lotto:</span>
                        <span>100% lavorato ({datiCompleta.pezziBuoni} buoni, {datiCompleta.pezziScarto} scarti)</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* SEZIONE GESTIONE SCARTI (OPZIONE B: RIPRISTINO IMMEDIATO) */}
              {datiCompleta.pezziScarto > 0 && (
                <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Rilevati {datiCompleta.pezziScarto} pezzi scartati / difettosi
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-black">
                      Scarto
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Per garantire che il cliente riceva il 100% dell&apos;ordine pattuito, il sistema può lanciare subito un lotto urgente di ripristino per i pezzi scartati.
                  </p>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-rose-900/60 hover:border-rose-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={datiCompleta.generaRipristinoScarto}
                        onChange={(e) =>
                          setDatiCompleta({
                            ...datiCompleta,
                            generaRipristinoScarto: e.target.checked
                          })
                        }
                        className="rounded text-rose-600 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-200">
                        ⚡ <strong>Lancia subito OdP Urgente (/R)</strong> per rifare i {datiCompleta.pezziScarto} pz scartati
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Se rimangono pezzi ancora da fare (produzione parziale) */}
              {datiCompleta.pezziBuoni + datiCompleta.pezziScarto < datiCompleta.odp.quantita_da_produrre && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-amber-400 block text-xs">
                    ⚠️ Produzione Parziale ({datiCompleta.pezziBuoni + datiCompleta.pezziScarto} su {datiCompleta.odp.quantita_da_produrre} pz trattati)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Cosa desideri fare con i <strong>{datiCompleta.odp.quantita_da_produrre - (datiCompleta.pezziBuoni + datiCompleta.pezziScarto)} pezzi ancora da lavorare</strong>?
                  </span>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="opzioneResiduo"
                        checked={datiCompleta.opzioneResiduo === 'splitta_residuo'}
                        onChange={() => setDatiCompleta({ ...datiCompleta, opzioneResiduo: 'splitta_residuo' })}
                        className="text-emerald-500"
                      />
                      <span className="text-[11px] text-slate-200">
                        <strong>Invia {datiCompleta.pezziBuoni} pz buoni avanti</strong> e crea il lotto residuo per i rimanenti {datiCompleta.odp.quantita_da_produrre - (datiCompleta.pezziBuoni + datiCompleta.pezziScarto)} pz
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="opzioneResiduo"
                        checked={datiCompleta.opzioneResiduo === 'sospendi'}
                        onChange={() => setDatiCompleta({ ...datiCompleta, opzioneResiduo: 'sospendi' })}
                        className="text-amber-500"
                      />
                      <span className="text-[11px] text-slate-200">
                        <strong>Sospendi fase su questa macchina</strong> e riprendi dopo per completare l&apos;intero lotto
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleCompletaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaCompletaFase}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Conferma Chiusura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DI SBLOCCO CON PIN CAPO OFFICINA / RESPONSABILE */}
      {modalePinAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Autorizzazione Responsabile</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {azionePin === 'login'
                      ? targetPostazioneId === 'supervisore'
                        ? 'Sblocco Modalità Supervisore'
                        : `Associazione Tablet a ${centriLavoro.find((c) => c.id === targetPostazioneId)?.codice || 'Macchina'}`
                      : 'Sblocco Cambio Postazione'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalePinAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerificaPin} className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Inserisci il PIN di sblocco (default: 123456)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInserito}
                  onChange={(e) => {
                    setPinInserito(e.target.value)
                    setErrorePin(null)
                  }}
                  placeholder="••••••"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white focus:outline-none focus:border-orange-500 shadow-inner"
                />
                {errorePin && (
                  <p className="text-xs font-bold text-rose-400 animate-in fade-in">
                    ⚠️ {errorePin}
                  </p>
                )}
              </div>

              {/* Tastierino Numerico Touch su Schermo (0-9) */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((cifra) => (
                  <button
                    key={cifra}
                    type="button"
                    onClick={() => {
                      if (pinInserito.length < 6) {
                        setPinInserito((prev) => prev + cifra)
                        setErrorePin(null)
                      }
                    }}
                    className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    {cifra}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinInserito('')}
                  className="py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer transition-all"
                >
                  CANC
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinInserito.length < 6) {
                      setPinInserito((prev) => prev + '0')
                      setErrorePin(null)
                    }
                  }}
                  className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPinInserito((prev) => prev.slice(0, -1))}
                  className="py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer transition-all"
                >
                  ⌫
                </button>
              </div>

              {/* Bottoni Azione */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalePinAperta(false)}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={pinInserito.length === 0}
                  className="py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wide cursor-pointer shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                >
                  Conferma PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* MODALE SPEDIZIONE CUMULATIVA CONTO TERZI (MULTI-ODP CON UNICO DDT) */}
      {modaleSpedizioneCumulativaAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border-2 border-pink-500/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-pink-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Emissione DDT Cumulativo Conto Lavoro
                    <span className="text-xs px-2 py-0.5 rounded bg-pink-900 text-pink-200 font-mono">
                      {fasiEsterneSelezionateIds.length} OdP accorpati
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Genera un solo documento di trasporto unificato per tutti i particolari selezionati.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModaleSpedizioneCumulativaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              {/* Elenco Ordini Selezionati per questo DDT */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Particolari che viaggeranno insieme nel documento:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {fasiInOfficina
                    .filter((it) => fasiEsterneSelezionateIds.includes(it.fase.id))
                    .map((it) => {
                      const art = articoli.find((a) => a.id === it.odp.articolo_id)
                      return (
                        <div key={it.fase.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div>
                            <span className="font-mono font-bold text-orange-400 mr-2">{it.odp.codice_odp}</span>
                            <span className="text-white font-medium">{art?.codice_articolo}</span>
                            <span className="text-slate-400 text-[11px] block">{it.fase.nome_fase}</span>
                          </div>
                          <span className="font-bold text-pink-400 font-mono">
                            {it.odp.quantita_da_produrre} {art?.unita_misura || 'pz'}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Alert Poka-Yoke: Controllo Terzisti Differenti tra gli OdP selezionati */}
              {(() => {
                const terzistiDiversi = Array.from(
                  new Set(
                    fasiInOfficina
                      .filter((it) => fasiEsterneSelezionateIds.includes(it.fase.id))
                      .map((it) => it.fase.fornitore_nome || 'Non specificato')
                  )
                )
                if (terzistiDiversi.length > 1) {
                  return (
                    <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 block font-bold">Avviso Poka-Yoke: Fornitori di origine differenti</strong>
                        <span>
                          Gli OdP selezionati prevedono a ciclo terzisti diversi: <strong>{terzistiDiversi.join(' / ')}</strong>.
                          Confermi di volerli accorpare e inviare tutti a <strong>{formCumulativo.fornitoreNome || 'questo fornitore'}</strong>?
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numero DDT di Trasporto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCumulativo.ddtNumero}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, ddtNumero: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Fornitore Terzista Destinatario *
                    </label>
                    {fornitoriTerzisti.length > 0 && (
                      <span className="text-[10px] text-pink-400 font-bold">
                        Anagrafica Rapida
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <select
                      value={formCumulativo.fornitoreNome}
                      onChange={(e) => {
                        const nomeSelezionato = e.target.value
                        const forn = fornitoriTerzisti.find((t) => t.ragione_sociale === nomeSelezionato)
                        setFormCumulativo({
                          ...formCumulativo,
                          fornitoreNome: nomeSelezionato,
                          fornitoreId: forn?.id || '',
                          fornitoreIndirizzo: forn ? `${forn.indirizzo}, ${forn.cap || ''} ${forn.citta || ''} (${forn.provincia || ''})` : formCumulativo.fornitoreIndirizzo,
                          fornitorePiva: forn?.partita_iva || formCumulativo.fornitorePiva
                        })
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-semibold focus:outline-none focus:border-pink-500 cursor-pointer"
                    >
                      <option value="">-- Seleziona o digita sotto --</option>
                      {fornitoriTerzisti.map((f) => (
                        <option key={f.id} value={f.ragione_sociale}>
                          {f.ragione_sociale} {f.specialita ? `(${f.specialita})` : ''}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      required
                      placeholder="Oppure inserisci fornitore manuale..."
                      value={formCumulativo.fornitoreNome}
                      onChange={(e) => setFormCumulativo({ ...formCumulativo, fornitoreNome: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dati Fiscali Destinatario DDT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Indirizzo di Consegna / Sede Terzista
                  </label>
                  <input
                    type="text"
                    value={formCumulativo.fornitoreIndirizzo}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, fornitoreIndirizzo: e.target.value })}
                    placeholder="Via, CAP, Città (Prov)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Partita IVA / Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={formCumulativo.fornitorePiva}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, fornitorePiva: e.target.value })}
                    placeholder="IT01234567890"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Numero Colli Totali
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formCumulativo.numeroColli}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, numeroColli: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Peso Complessivo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formCumulativo.pesoTotaleKg}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, pesoTotaleKg: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Aspetto Beni
                  </label>
                  <input
                    type="text"
                    value={formCumulativo.aspettoBeni}
                    onChange={(e) => setFormCumulativo({ ...formCumulativo, aspettoBeni: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vettore Incaricato del Trasporto
                </label>
                <select
                  value={formCumulativo.vettoreNome}
                  onChange={(e) => setFormCumulativo({ ...formCumulativo, vettoreNome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
                >
                  <option value="Mittente (Mezzo Proprio)">Mittente (Mezzo Proprio)</option>
                  <option value="Corriere Espresso (Arcese / BRT / TNT)">Corriere Espresso (Arcese / BRT / TNT)</option>
                  <option value="Destinatario (Ritiro a cura fornitore)">Destinatario (Ritiro a cura fornitore)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Trasporto e Istruzioni Generali:
                </label>
                <textarea
                  rows={2}
                  value={formCumulativo.note}
                  onChange={(e) => setFormCumulativo({ ...formCumulativo, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModaleSpedizioneCumulativaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaSpedizioneCumulativa}
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-pink-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Conferma e Stampa DDT Cumulativo ({fasiEsterneSelezionateIds.length} OdP)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE BLINDATA SCHEDA LAVORO A4 (TOUCH KIOSK BORDO MACCHINA) */}
      {schedaA4OdpId && (() => {
        const odpDettaglio = odpList.find((o) => o.id === schedaA4OdpId)
        if (!odpDettaglio) return null
        const articoloDettaglio = articoli.find((a) => a.id === odpDettaglio.articolo_id)

        return (
          <div className="scheda-a4-container fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
            {/* Barra superiore Kiosk Blindata */}
            <div className="no-print max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-2">
                    {odpDettaglio.codice_odp}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-semibold">
                      SCHEDA OPERATIVA A4
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Consultazione bordo macchina &bull; Nessun accesso al gestionale esterno
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Stampa Scheda
                </button>

                <button
                  type="button"
                  onClick={() => setSchedaA4OdpId(null)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                >
                  ✕ Chiudi Scheda (Torna al Banco)
                </button>
              </div>
            </div>

            {/* Foglio Scheda Lavoro A4 Blindato in sola lettura */}
            <div className="scheda-a4-foglio max-w-5xl w-full mx-auto bg-white text-slate-950 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none">
              {/* Intestazione A4 */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">
                    OFFICINA MECCANICA DI PRECISIONE &bull; SCHEDA TECNICA DI PRODUZIONE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
                    {odpDettaglio.codice_odp}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Data emissione: {new Date(odpDettaglio.creato_il).toLocaleDateString('it-IT')} &bull; Consegna richiesta:{' '}
                    <strong>{odpDettaglio.data_fine_pianificata || 'N/D'}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Codice Disegno / Token</span>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded border border-slate-300">
                    {odpDettaglio.qr_code_token}
                  </span>
                </div>
              </div>

              {/* Dati Articolo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Codice Particolare</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {articoloDettaglio?.codice_articolo || 'N/D'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Descrizione Tecnica</span>
                  <span className="text-sm font-bold text-slate-800">
                    {articoloDettaglio?.descrizione || 'Particolare Meccanico'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Quantità da Lavorare</span>
                  <span className="text-xl font-black text-orange-600 font-mono">
                    {odpDettaglio.quantita_da_produrre} {articoloDettaglio?.unita_misura || 'pz'}
                  </span>
                </div>
              </div>

              {/* Riferimento Commessa & Cliente */}
              {(() => {
                let nomeCli = odpDettaglio.cliente_nome || ''
                let codOrd = odpDettaglio.codice_ordine_cliente || ''
                let rigaNum = odpDettaglio.numero_riga_ordine ? `Riga / Item #${odpDettaglio.numero_riga_ordine}` : ''

                if (!nomeCli || !codOrd) {
                  const parseSicuro = <T,>(chiave: string, fallback: T): T => {
                    try {
                      const item = localStorage.getItem(chiave)
                      if (!item || item === 'undefined' || item === 'null') return fallback
                      return JSON.parse(item) as T
                    } catch {
                      return fallback
                    }
                  }
                  const clientiList = parseSicuro<Cliente[]>('machinaflow_clienti', SEED_CLIENTI)
                  const ordiniSalvati = parseSicuro<(OrdineCliente & { cliente?: Cliente; righe: (RigaOrdineCliente & { articolo?: Articolo })[] })[]>('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI)

                  let ordineTrovato: (OrdineCliente & { cliente?: Cliente; righe: (RigaOrdineCliente & { articolo?: Articolo })[] }) | undefined

                  if (odpDettaglio.ordine_cliente_id) {
                    ordineTrovato = ordiniSalvati.find((o) => o.id === odpDettaglio.ordine_cliente_id)
                  } else if (odpDettaglio.riga_ordine_cliente_id) {
                    ordineTrovato = ordiniSalvati.find((o) => o.righe?.some((r) => r.id === odpDettaglio.riga_ordine_cliente_id))
                  }

                  if (!ordineTrovato && odpDettaglio.note) {
                    const matchOrd = odpDettaglio.note.match(/ORD-[A-Z]+-[0-9]+-[0-9]+/i)
                    if (matchOrd) {
                      const codiceEstratto = matchOrd[0].toUpperCase()
                      ordineTrovato = ordiniSalvati.find((o) => o.numero_ordine.toUpperCase() === codiceEstratto)
                    }
                  }

                  if (ordineTrovato) {
                    codOrd = codOrd || ordineTrovato.numero_ordine
                    const clienteRel = clientiList.find((c) => c.id === ordineTrovato!.cliente_id) || ordineTrovato.cliente
                    nomeCli = nomeCli || clienteRel?.ragione_sociale || 'Cliente'

                    if (!rigaNum && odpDettaglio.riga_ordine_cliente_id) {
                      const idx = ordineTrovato.righe?.findIndex((r) => r.id === odpDettaglio.riga_ordine_cliente_id)
                      if (idx !== undefined && idx >= 0) {
                        rigaNum = `Riga / Item #${idx + 1}`
                      }
                    }
                  }
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-orange-50/50 p-3.5 rounded-xl border border-orange-200/80 text-xs">
                    <div>
                      <span className="text-[10px] font-black text-orange-800 uppercase block">Destinatario / Cliente</span>
                      <span className="text-sm font-black text-slate-900">
                        {nomeCli || 'Cliente Interno / Stock'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-orange-800 uppercase block">Rif. Ordine Cliente</span>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {codOrd || 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-orange-800 uppercase block">Posizione / Riga Item</span>
                      <span className="text-sm font-bold text-slate-900">
                        {rigaNum || 'Item #1'}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Note OdP */}
              {odpDettaglio.note && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <strong>Note di produzione:</strong> {odpDettaglio.note}
                </div>
              )}

              {/* Materia Prima & Distinta Base (BOM) */}
              {(() => {
                const componenti = distinte.filter((d) => d.articolo_padre_id === odpDettaglio.articolo_id)
                return (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-orange-600" />
                      Materia Prima di Partenza & Distinta Base (BOM)
                    </h3>
                    {componenti.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="py-2.5 px-3">Codice Grezzo / Componente</th>
                              <th className="py-2.5 px-3">Descrizione Tecnica</th>
                              <th className="py-2.5 px-3 text-center">Fabbisogno Unit.</th>
                              <th className="py-2.5 px-3 text-center">Fabbisogno Lotto ({odpDettaglio.quantita_da_produrre} pz)</th>
                              {/* A video mostriamo Giacenza Stock */}
                              <th className="py-2.5 px-3 text-center print:hidden">Giacenza Stock</th>
                              {/* In stampa A4 sostituiamo con Lotto / Colata per tracciabilità ISO */}
                              <th className="py-2.5 px-3 text-center w-32 hidden print:table-cell">Lotto / Colata MP</th>
                              <th className="py-2.5 px-3">Note Taglio / Preparazione</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {componenti.map((comp) => {
                              const mat = articoli.find((a) => a.id === comp.articolo_componente_id)
                              const fabbisognoTotale = comp.quantita_necessaria * odpDettaglio.quantita_da_produrre
                              const haGiacenza = (mat?.giacenza_attuale || 0) >= fabbisognoTotale

                              return (
                                <tr key={comp.id} className="hover:bg-slate-50/80">
                                  <td className="py-2.5 px-3 font-mono font-bold text-orange-600">
                                    {mat?.codice_articolo || 'N/D'}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    {mat?.descrizione || 'Materia Prima'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                    {comp.quantita_necessaria} {mat?.unita_misura}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                                    {fabbisognoTotale} {mat?.unita_misura}
                                  </td>
                                  {/* A video: Giacenza Stock */}
                                  <td className="py-2.5 px-3 text-center print:hidden">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      haGiacenza
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800 font-black'
                                    }`}>
                                      {mat?.giacenza_attuale ?? 0} {mat?.unita_misura}
                                      {!haGiacenza && ' ⚠️ SOTTO SCORTA'}
                                    </span>
                                  </td>
                                  {/* In stampa cartacea: Box tratteggiato per penna */}
                                  <td className="py-2.5 px-3 text-center hidden print:table-cell">
                                    <div className="w-24 h-5 border-b border-dashed border-slate-900 mx-auto" />
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">
                                    {comp.note || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        Nessun componente o materia prima associata in distinta base.
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Sequenza Ciclo di Lavorazione */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-600" />
                  Ciclo di Fabbricazione & Sequenza Macchine
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Fase</th>
                        <th className="py-2.5 px-3">Operazione</th>
                        <th className="py-2.5 px-3">Centro di Lavoro</th>
                        <th className="py-2.5 px-3 text-right">Tempo Stimato</th>
                        <th className="py-2.5 px-3 text-center">Stato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {odpDettaglio.fasi.map((f) => {
                        const centro = centriLavoro.find((c) => c.id === f.centro_lavoro_id)
                        return (
                          <tr key={f.id} className={f.stato === 'completata' ? 'bg-emerald-50/50' : f.stato === 'in_corso' ? 'bg-blue-50/50 font-bold' : ''}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-500">#{f.sequenza}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {f.nome_fase}
                              {f.is_esterna && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-pink-100 text-pink-700 font-bold border border-pink-300">
                                  CONTO TERZI
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {f.is_esterna ? (
                                <span className="text-pink-700 font-semibold flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5" />
                                  {f.fornitore_nome || 'Terzista Esterno'}
                                </span>
                              ) : (
                                centro?.nome || centro?.codice || f.centro_lavoro_id
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {f.is_esterna ? `${f.giorni_rientro_previsti || 5} gg rientro` : `${f.tempo_stimato_totale_min} min`}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.stato === 'completata'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f.stato === 'in_corso'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {f.is_esterna
                                  ? (f.stato_esterna === 'rientrato' ? 'Rientrato' : f.stato_esterna === 'inviato_al_terzista' ? 'Fuori Sede' : 'In Attesa Invio')
                                  : (f.stato === 'in_corso' ? 'In Macchina' : f.stato === 'completata' ? 'Completata' : 'In Coda')}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pulsante Chiusura Footer A4 */}
              <div className="no-print pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSchedaA4OdpId(null)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Torna alla Postazione
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* =========================================================================
          MODALE 1: SPLIT ODP (AVVIO PARZIALE PER MATERIALE LIMITATO)
          ========================================================================= */}
      {modaleSplitAperta && datiSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-amber-950/30">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Sdoppiamento Ordine (Split Parziale)
                </h2>
              </div>
              <button
                onClick={() => setModaleSplitAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-200 leading-relaxed">
                Stai per avviare subito la parte di ordine con materiale già disponibile a magazzino, senza bloccare la macchina.
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ordine Originale:</span>
                  <span className="font-mono font-bold text-orange-400">{datiSplit.odp.codice_odp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantità Totale Prevista:</span>
                  <span className="font-bold text-white">{datiSplit.odp.quantita_da_produrre} pz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Copertura Attuale Materiale:</span>
                  <span className="font-bold text-amber-400">{datiSplit.quantitaDisponibile} pz</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Quantità da Avviare Subito (Lotto A) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={datiSplit.odp.quantita_da_produrre - 1}
                  value={datiSplit.quantitaDaSplittare}
                  onChange={(e) =>
                    setDatiSplit({
                      ...datiSplit,
                      quantitaDaSplittare: Math.min(
                        Math.max(1, Number(e.target.value)),
                        datiSplit.odp.quantita_da_produrre - 1
                      )
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Il residuo di <strong>{datiSplit.odp.quantita_da_produrre - datiSplit.quantitaDaSplittare} pz</strong> rimarrà come lotto a saldo (/B) in attesa del resto del materiale.
                </span>
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleSplitAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleEseguiSplitOdP}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Conferma e Avvia {datiSplit.quantitaDaSplittare} pz</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE 2: COMPLETAMENTO FASE CON QUANTITÀ REALE (GOOD PARTS / SCRAP)
          ========================================================================= */}
      {modaleCompletaAperta && datiCompleta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Registra Chiusura Lavorazione
                </h2>
              </div>
              <button
                onClick={() => setModaleCompletaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ordine / Fase:</span>
                  <span className="font-mono font-bold text-white">
                    {datiCompleta.odp.codice_odp} • Fase #{datiCompleta.fase.sequenza}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Lotto Teorico Previsto:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-400">{datiCompleta.odp.quantita_da_produrre} pz</span>
                    {datiCompleta.limiteMassimoConsentito >= datiCompleta.odp.quantita_da_produrre && (
                      <button
                        type="button"
                        onClick={() =>
                          setDatiCompleta({
                            ...datiCompleta,
                            pezziBuoni: datiCompleta.odp.quantita_da_produrre,
                            pezziScarto: 0
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold cursor-pointer transition-colors"
                        title="Reimposta intero lotto con zero scarti"
                      >
                        Tutto il lotto
                      </button>
                    )}
                  </div>
                </div>

                {/* Box Vincolo Giacenza Grezzo (Poka-Yoke Industriale) */}
                {datiCompleta.limiteMassimoConsentito < datiCompleta.odp.quantita_da_produrre && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Blocco di Sicurezza: Giacenza Grezzo Limitata a {datiCompleta.limiteMassimoConsentito} pz</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      A magazzino è presente materiale sufficiente per soli <strong>{datiCompleta.limiteMassimoConsentito} pezzi</strong> su {datiCompleta.odp.quantita_da_produrre}.
                      Non è possibile dichiarare una quantità superiore. I <strong>{datiCompleta.odp.quantita_da_produrre - datiCompleta.limiteMassimoConsentito} pezzi rimanenti</strong> verranno automaticamente sdoppiati in un lotto residuo a saldo in attesa della fornitura.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-400 mb-1">
                    Pezzi Buoni Conformi * (Max {datiCompleta.limiteMassimoConsentito})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={datiCompleta.limiteMassimoConsentito}
                    value={datiCompleta.pezziBuoni}
                    onChange={(e) => {
                      const tettoConsentito = datiCompleta.limiteMassimoConsentito
                      const valBuoni = Math.min(tettoConsentito, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il tetto consentito dal grezzo, scala automaticamente gli scarti
                      let nuovoScarto = datiCompleta.pezziScarto
                      if (valBuoni + nuovoScarto > tettoConsentito) {
                        nuovoScarto = Math.max(0, tettoConsentito - valBuoni)
                      }
                      setDatiCompleta({
                        ...datiCompleta,
                        pezziBuoni: valBuoni,
                        pezziScarto: nuovoScarto
                      })
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Pezzi che avanzano alla fase successiva.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-rose-400 mb-1">
                    Pezzi Scartati / Difettosi
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={datiCompleta.limiteMassimoConsentito}
                    value={datiCompleta.pezziScarto}
                    onChange={(e) => {
                      const tettoConsentito = datiCompleta.limiteMassimoConsentito
                      const valScarti = Math.min(tettoConsentito, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il tetto consentito dal grezzo, scala automaticamente i pezzi buoni
                      let nuovoBuoni = datiCompleta.pezziBuoni
                      if (nuovoBuoni + valScarti > tettoConsentito) {
                        nuovoBuoni = Math.max(0, tettoConsentito - valScarti)
                      }
                      setDatiCompleta({
                        ...datiCompleta,
                        pezziScarto: valScarti,
                        pezziBuoni: nuovoBuoni
                      })
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Pezzi non conformi da rifare.
                  </span>
                </div>
              </div>

              {/* Box Riepilogo Matematico Dinamico */}
              {(() => {
                const totaleLavorati = datiCompleta.pezziBuoni + datiCompleta.pezziScarto
                const residuoDaFare = Math.max(0, datiCompleta.odp.quantita_da_produrre - totaleLavorati)
                return (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Totale Pezzi Trattati sul Mandrino:</span>
                      <strong className="text-white font-mono">{totaleLavorati} su {datiCompleta.odp.quantita_da_produrre} pz</strong>
                    </div>
                    {residuoDaFare > 0 ? (
                      <div className="flex justify-between text-amber-400 font-semibold border-t border-slate-800/60 pt-1">
                        <span>Pezzi Residui Ancora da Lavorare:</span>
                        <span className="font-mono">{residuoDaFare} pz a saldo</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-emerald-400 font-semibold border-t border-slate-800/60 pt-1">
                        <span>Copertura Lotto:</span>
                        <span>100% lavorato ({datiCompleta.pezziBuoni} buoni, {datiCompleta.pezziScarto} scarti)</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* SEZIONE GESTIONE SCARTI (OPZIONE B: RIPRISTINO IMMEDIATO) */}
              {datiCompleta.pezziScarto > 0 && (
                <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Rilevati {datiCompleta.pezziScarto} pezzi scartati / difettosi
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-black">
                      Scarto
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Per garantire che il cliente riceva il 100% dell&apos;ordine pattuito, il sistema può lanciare subito un lotto urgente di ripristino per i pezzi scartati.
                  </p>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-rose-900/60 hover:border-rose-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={datiCompleta.generaRipristinoScarto}
                        onChange={(e) =>
                          setDatiCompleta({
                            ...datiCompleta,
                            generaRipristinoScarto: e.target.checked
                          })
                        }
                        className="rounded text-rose-600 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-200">
                        ⚡ <strong>Lancia subito OdP Urgente (/R)</strong> per rifare i {datiCompleta.pezziScarto} pz scartati
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Se rimangono pezzi ancora da fare (produzione parziale) */}
              {datiCompleta.pezziBuoni + datiCompleta.pezziScarto < datiCompleta.odp.quantita_da_produrre && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-amber-400 block text-xs">
                    ⚠️ Produzione Parziale ({datiCompleta.pezziBuoni + datiCompleta.pezziScarto} su {datiCompleta.odp.quantita_da_produrre} pz trattati)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Cosa desideri fare con i <strong>{datiCompleta.odp.quantita_da_produrre - (datiCompleta.pezziBuoni + datiCompleta.pezziScarto)} pezzi ancora da lavorare</strong>?
                  </span>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="opzioneResiduo"
                        checked={datiCompleta.opzioneResiduo === 'splitta_residuo'}
                        onChange={() => setDatiCompleta({ ...datiCompleta, opzioneResiduo: 'splitta_residuo' })}
                        className="text-emerald-500"
                      />
                      <span className="text-[11px] text-slate-200">
                        <strong>Invia {datiCompleta.pezziBuoni} pz buoni avanti</strong> e crea il lotto residuo per i rimanenti {datiCompleta.odp.quantita_da_produrre - (datiCompleta.pezziBuoni + datiCompleta.pezziScarto)} pz
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="opzioneResiduo"
                        checked={datiCompleta.opzioneResiduo === 'sospendi'}
                        onChange={() => setDatiCompleta({ ...datiCompleta, opzioneResiduo: 'sospendi' })}
                        className="text-amber-500"
                      />
                      <span className="text-[11px] text-slate-200">
                        <strong>Sospendi fase su questa macchina</strong> e riprendi dopo per completare l&apos;intero lotto
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleCompletaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaCompletaFase}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Conferma Chiusura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANTEPRIMA STAMPA DDT CONTO LAVORO A4 */}
      {ddtStampabileCorrente && (
        <SchedaDDTStampabile
          ddt={ddtStampabileCorrente}
          onChiudi={() => setDdtStampabileCorrente(null)}
        />
      )}
    </div>
  )
}
