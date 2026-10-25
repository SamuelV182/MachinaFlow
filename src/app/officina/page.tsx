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
  Scissors
} from 'lucide-react'
import {
  CentroLavoro,
  OrdineProduzione,
  FaseOdP,
  Articolo,
  ComponenteDistintaBase
} from '@/types/database'
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

      setCentriLavoro(parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO))
      setArticoli(parseSicuro('machinaflow_articoli', SEED_ARTICOLI))
      setDistinte(parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE))

      // Carica OdP sincronizzati dal Cloud Supabase
      const odpSincronizzati = await syncService.getOrdiniProduzione()
      setOdpList(odpSincronizzati)

      // Recupera la postazione salvata nel tablet
      const salvata = localStorage.getItem('machinaflow_postazione_corrente_id')
      if (salvata) {
        setPostazioneLoginId(salvata)
        setMacchinaSelezionataId(salvata === 'supervisore' ? 'tutte' : salvata)
      }
      setCaricamentoSessione(false)
    }

    caricaDati()
  }, [])

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
          if (mat.giacenza_attuale < fabbisognoTotale) {
            // Calcola quanti pezzi completi si possono fare con la giacenza attuale
            const fattibili = comp.quantita_necessaria > 0 ? Math.floor(mat.giacenza_attuale / comp.quantita_necessaria) : 0
            if (fattibili < pezziFattibili) {
              pezziFattibili = fattibili
            }

            if (fattibili > 0) {
              materiaPrimaParziale = true
            } else {
              materiaPrimaMancante = true
            }

            nomeMateriaPrimaMancante = `${mat.codice_articolo} (Giacenza: ${mat.giacenza_attuale} ${mat.unita_misura}, serve: ${fabbisognoTotale})`
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
        // La mancanza di materia prima impatta le fasi di prima lavorazione (es. Taglio, CAD o prima operazione meccanica)
        const isFaseIniziale = fase.sequenza <= 20
        const matMancanteSuQuestaFase = isFaseIniziale && materiaPrimaMancante
        const matParzialeSuQuestaFase = isFaseIniziale && materiaPrimaParziale && !materiaPrimaMancante

        lista.push({
          odp,
          fase,
          articolo,
          centro,
          fasePrecedenteCompletata,
          materiaPrimaMancante: matMancanteSuQuestaFase,
          materiaPrimaParziale: matParzialeSuQuestaFase,
          pezziFattibiliConGiacenza: pezziFattibili,
          nomeMateriaPrimaMancante
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

  // Filtra per macchina selezionata e ricerca QR/testo
  const fasiFiltrateRaw = useMemo(() => {
    return fasiInOfficina.filter((item) => {
      const isPrincipale = item.fase.centro_lavoro_id === macchinaSelezionataId
      const isAlternativa = item.fase.centri_lavoro_alternativi_ids?.includes(macchinaSelezionataId)
      const matchMacchina = macchinaSelezionataId === 'tutte' || isPrincipale || isAlternativa

      const matchRicerca =
        !ricercaQr.trim() ||
        item.odp.codice_odp.toLowerCase().includes(ricercaQr.toLowerCase()) ||
        item.odp.qr_code_token.toLowerCase().includes(ricercaQr.toLowerCase()) ||
        (item.articolo && item.articolo.codice_articolo.toLowerCase().includes(ricercaQr.toLowerCase()))

      return matchMacchina && matchRicerca
    })
  }, [fasiInOfficina, macchinaSelezionataId, ricercaQr])

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
        // Se a una manca la materia prima, scivola dopo quelle che hanno il materiale a stock
        if (!a.materiaPrimaMancante && b.materiaPrimaMancante) return -1
        if (a.materiaPrimaMancante && !b.materiaPrimaMancante) return 1

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

  // Identifica per CIASCUNA macchina la prima fase autorizzata ad essere avviata
  // Una macchina può avviare un pezzo solo se attualmente non ne ha già un altro "in_corso"
  const idsFasiAutorizzateDaAvviare = useMemo(() => {
    const autorizzate = new Set<string>()

    // Trova l'insieme di tutti i centri di lavoro presenti nelle fasi
    const centriIds = new Set(fasiOrdinate.map((item) => item.fase.centro_lavoro_id))

    centriIds.forEach((centroId) => {
      // Controlla se QUESTA specifica macchina ha già una lavorazione attiva sul mandrino
      const macchinaOccupata = fasiOrdinate.some(
        (item) => item.fase.centro_lavoro_id === centroId && item.fase.stato === 'in_corso'
      )

      // Se la macchina è libera, la sua prima fase con materiale disponibile e fasi precedenti completate è autorizzata
      if (!macchinaOccupata) {
        const primaPronta = fasiOrdinate.find(
          (item) =>
            item.fase.centro_lavoro_id === centroId &&
            item.fase.stato !== 'completata' &&
            item.fasePrecedenteCompletata &&
            !item.materiaPrimaMancante
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
                return (
                  <button
                    key={centro.id}
                    onClick={() => setMacchinaSelezionataId(centro.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      macchinaSelezionataId === centro.id
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{centro.codice}</span>
                    {countFasi > 0 && (
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-orange-400 text-[10px] flex items-center justify-center font-bold">
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

        {/* Switch Vista Cards / Tabella */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0 self-start md:self-end">
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

      {/* VISTA A SCHEDE (CARDS TOUCH) */}
      {modalitaVista === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fasiOrdinate.map((item) => {
            const { odp, fase, articolo, centro, fasePrecedenteCompletata, materiaPrimaMancante, materiaPrimaParziale, pezziFattibiliConGiacenza, nomeMateriaPrimaMancante } = item
            const isCompletata = fase.stato === 'completata'
            const isInCorso = fase.stato === 'in_corso'

            // Controlla se la specifica macchina di questa fase ha già un pezzo in lavorazione attiva
            const macchinaQuestaFaseOccupata = fasiOrdinate.some(
              (item) => item.fase.centro_lavoro_id === fase.centro_lavoro_id && item.fase.stato === 'in_corso'
            )

            // Controllo autorizzazione di avvio per centro di lavoro
            const isAutorizzataAdAvviare = idsFasiAutorizzateDaAvviare.has(fase.id)
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
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-white text-[11px] font-black tracking-wider uppercase rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    ⚡ IN LAVORAZIONE ATTIVA
                  </div>
                )}

                <div>
                  {/* Header Card Fase */}
                  <div className="flex items-start justify-between gap-3 pt-1">
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

                    {/* Badge Stato Lavorazione */}
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${
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
                      <span className="font-semibold text-slate-200">
                        {centro ? `${centro.codice} - ${centro.nome}` : 'N/D'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Tempo Previsto:</span>
                      <span className="font-bold text-slate-200">{fase.tempo_stimato_totale_min} minuti</span>
                    </div>

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
                    {item.materiaPrimaParziale && item.fasePrecedenteCompletata && !macchinaQuestaFaseOccupata && !isInCorso && !isCompletata && (
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
                            setDatiCompleta({
                              odp,
                              fase,
                              pezziBuoni: odp.quantita_da_produrre,
                              pezziScarto: 0,
                              opzioneResiduo: 'splitta_residuo',
                              generaRipristinoScarto: true
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

          {fasiOrdinate.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-200 font-bold text-base">Nessuna lavorazione in coda per i criteri selezionati</p>
              <p className="text-xs text-slate-400 mt-1">
                Tutte le fasi risultano completate o non ci sono ordini assegnati a questa macchina.
              </p>
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
                  <th className="py-2.5 px-3 whitespace-nowrap">Centro / Macchina</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Q.tà</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Previsto</th>
                  {isSupervisore && <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Scadenza</th>}
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Stato Monte</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Stato Fase</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-slate-950/95 shadow-l">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {fasiOrdinate.map((item, index) => {
                  const { odp, fase, articolo, centro, fasePrecedenteCompletata, materiaPrimaMancante, materiaPrimaParziale, pezziFattibiliConGiacenza, nomeMateriaPrimaMancante } = item
                  const isCompletata = fase.stato === 'completata'
                  const isInCorso = fase.stato === 'in_corso'
                  const isAutorizzataAdAvviare = idsFasiAutorizzateDaAvviare.has(fase.id)
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
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isInCorso
                                ? 'bg-blue-500 text-white'
                                : isAutorizzataAdAvviare
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{index + 1}
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
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-orange-400 text-xs">
                          {odp.codice_odp}
                        </div>
                        <div className="text-slate-300 text-[11px] truncate max-w-[170px]" title={articolo?.descrizione}>
                          {articolo?.codice_articolo} &bull; {articolo?.descrizione}
                        </div>
                      </td>

                      {/* Fase */}
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-slate-400 block font-mono">Fase #{fase.sequenza}</span>
                        <span className="font-bold text-slate-100 text-xs">{fase.nome_fase}</span>
                      </td>

                      {/* Macchina */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-200 font-medium text-xs truncate max-w-[160px]" title={centro?.nome}>
                          {centro ? centro.nome : 'N/D'}
                        </div>
                        {macchinaSelezionataId !== 'tutte' && fase.centro_lavoro_id !== macchinaSelezionataId && (
                          <span className="text-[9px] text-blue-400 font-bold block">⚡ Macchina Alternativa</span>
                        )}
                      </td>

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
                                  setDatiCompleta({
                                    odp,
                                    fase,
                                    pezziBuoni: odp.quantita_da_produrre,
                                    pezziScarto: 0,
                                    opzioneResiduo: 'splitta_residuo',
                                    generaRipristinoScarto: true
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

                          {isBloccata && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-bold select-none"
                              title="L'operatore deve prima eseguire l'ordine prioritario o attendere che il materiale sia pronto."
                            >
                              <Lock className="w-2.5 h-2.5 text-slate-500" />
                              Bloccato
                            </span>
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

                {fasiOrdinate.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Nessuna lavorazione in coda per i criteri selezionati.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      {/* MODALE BLINDATA SCHEDA LAVORO A4 (TOUCH KIOSK BORDO MACCHINA) */}
      {schedaA4OdpId && (() => {
        const odpDettaglio = odpList.find((o) => o.id === schedaA4OdpId)
        if (!odpDettaglio) return null
        const articoloDettaglio = articoli.find((a) => a.id === odpDettaglio.articolo_id)

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            {/* Barra superiore Kiosk Blindata */}
            <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
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
            <div className="max-w-5xl w-full mx-auto bg-white text-slate-950 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
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

              {/* Note OdP */}
              {odpDettaglio.note && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <strong>Note di produzione:</strong> {odpDettaglio.note}
                </div>
              )}

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
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{f.nome_fase}</td>
                            <td className="py-2.5 px-3 text-slate-700">{centro?.nome || centro?.codice || f.centro_lavoro_id}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">{f.tempo_stimato_totale_min} min</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.stato === 'completata'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f.stato === 'in_corso'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {f.stato === 'in_corso' ? 'In Macchina' : f.stato === 'completata' ? 'Completata' : 'In Coda'}
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
              <div className="pt-4 border-t border-slate-200 flex justify-end">
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-400 mb-1">
                    Pezzi Buoni Conformi *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={datiCompleta.odp.quantita_da_produrre}
                    value={datiCompleta.pezziBuoni}
                    onChange={(e) => {
                      const lottoTotale = datiCompleta.odp.quantita_da_produrre
                      const valBuoni = Math.min(lottoTotale, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il lotto totale, scala automaticamente gli scarti
                      let nuovoScarto = datiCompleta.pezziScarto
                      if (valBuoni + nuovoScarto > lottoTotale) {
                        nuovoScarto = Math.max(0, lottoTotale - valBuoni)
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
                    max={datiCompleta.odp.quantita_da_produrre}
                    value={datiCompleta.pezziScarto}
                    onChange={(e) => {
                      const lottoTotale = datiCompleta.odp.quantita_da_produrre
                      const valScarti = Math.min(lottoTotale, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il lotto totale, scala automaticamente i pezzi buoni
                      let nuovoBuoni = datiCompleta.pezziBuoni
                      if (nuovoBuoni + valScarti > lottoTotale) {
                        nuovoBuoni = Math.max(0, lottoTotale - valScarti)
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

      {/* MODALE BLINDATA SCHEDA LAVORO A4 (TOUCH KIOSK BORDO MACCHINA) */}
      {schedaA4OdpId && (() => {
        const odpDettaglio = odpList.find((o) => o.id === schedaA4OdpId)
        if (!odpDettaglio) return null
        const articoloDettaglio = articoli.find((a) => a.id === odpDettaglio.articolo_id)

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            {/* Barra superiore Kiosk Blindata */}
            <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
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
            <div className="max-w-5xl w-full mx-auto bg-white text-slate-950 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
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

              {/* Note OdP */}
              {odpDettaglio.note && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <strong>Note di produzione:</strong> {odpDettaglio.note}
                </div>
              )}

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
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{f.nome_fase}</td>
                            <td className="py-2.5 px-3 text-slate-700">{centro?.nome || centro?.codice || f.centro_lavoro_id}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">{f.tempo_stimato_totale_min} min</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.stato === 'completata'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f.stato === 'in_corso'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {f.stato === 'in_corso' ? 'In Macchina' : f.stato === 'completata' ? 'Completata' : 'In Coda'}
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
              <div className="pt-4 border-t border-slate-200 flex justify-end">
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-400 mb-1">
                    Pezzi Buoni Conformi *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={datiCompleta.odp.quantita_da_produrre}
                    value={datiCompleta.pezziBuoni}
                    onChange={(e) => {
                      const lottoTotale = datiCompleta.odp.quantita_da_produrre
                      const valBuoni = Math.min(lottoTotale, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il lotto totale, scala automaticamente gli scarti
                      let nuovoScarto = datiCompleta.pezziScarto
                      if (valBuoni + nuovoScarto > lottoTotale) {
                        nuovoScarto = Math.max(0, lottoTotale - valBuoni)
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
                    max={datiCompleta.odp.quantita_da_produrre}
                    value={datiCompleta.pezziScarto}
                    onChange={(e) => {
                      const lottoTotale = datiCompleta.odp.quantita_da_produrre
                      const valScarti = Math.min(lottoTotale, Math.max(0, Number(e.target.value)))
                      // Se la somma supera il lotto totale, scala automaticamente i pezzi buoni
                      let nuovoBuoni = datiCompleta.pezziBuoni
                      if (nuovoBuoni + valScarti > lottoTotale) {
                        nuovoBuoni = Math.max(0, lottoTotale - valScarti)
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
    </div>
  )
}
