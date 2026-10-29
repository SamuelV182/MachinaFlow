'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Truck,
  Printer,
  Download,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  FileSpreadsheet,
  Building,
  ArrowUpRight,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  PackageCheck,
  Check,
  UserCheck
} from 'lucide-react'
import {
  DocumentoTrasportoEsterno,
  DocumentoTrasportoCliente,
  FornitoreTerzista,
  Cliente,
  OrdineCliente,
  RigaOrdineCliente,
  OrdineProduzione,
  FaseOdP,
  Articolo
} from '@/types/database'
import {
  SEED_FORNITORI_TERZISTI,
  SEED_DDT_CLIENTI,
  SEED_CLIENTI,
  SEED_ORDINI_CLIENTI,
  SEED_ODP,
  SEED_ARTICOLI
} from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'
import SchedaDDTStampabile from '@/components/SchedaDDTStampabile'

// Esempio di DDT di conto lavoro iniziali per testing e demo immediata
const SEED_DDT_ESTERNI: DocumentoTrasportoEsterno[] = [
  {
    id: 'ddt-demo-01',
    numero_ddt: 'DDT-EXT-2026/041',
    data_emissione: '2026-10-24T08:30:00Z',
    fornitore_nome: 'Zincatura Veneta Srl',
    fornitore_indirizzo: 'Via dell\'Elettrogalvanica 12, 35010 Cadoneghe (PD)',
    fornitore_piva: 'IT04581290281',
    causale_trasporto: 'Invio per Conto Lavorazione',
    porto: 'Franco',
    aspetto_beni: 'A vista su pallet reggettato',
    numero_colli: 2,
    peso_totale_kg: 145.0,
    vettore_nome: 'Mittente (Mezzo Proprio)',
    note_trasporto: 'Trattamento di Zincatura Bianca Trivalente 12µm con sigillatura. Consegna urgente entro 5 gg.',
    stato: 'spedito',
    creato_il: '2026-10-24T08:30:00Z',
    righe: [
      {
        id: 'riga-ddt-1',
        odp_id: 'odp-15',
        codice_odp: 'ODP-2026-015',
        articolo_codice: 'PIA-SUP-ZINC-31',
        articolo_descrizione: 'Piastra Supporto Slitta con Zincatura Bianca',
        fase_sequenza: 40,
        nome_fase: 'Zincatura Bianca Trivalente Esterna 12µm',
        quantita_spedita: 8,
        unita_misura: 'pz',
        peso_kg_riga: 96.0,
        note_lavorazione: 'Proteggere filetti M10 con tappi siliconici'
      },
      {
        id: 'riga-ddt-2',
        odp_id: 'odp-16',
        codice_odp: 'ODP-2026-016',
        articolo_codice: 'STA-ANC-30',
        articolo_descrizione: 'Staffa di Ancoraggio Saldato',
        fase_sequenza: 30,
        nome_fase: 'Zincatura Bianca Elettrolitica',
        quantita_spedita: 14,
        unita_misura: 'pz',
        peso_kg_riga: 49.0
      }
    ]
  },
  {
    id: 'ddt-demo-02',
    numero_ddt: 'DDT-EXT-2026/039',
    data_emissione: '2026-10-21T14:15:00Z',
    fornitore_nome: 'Ossidazione Anodica Modenese Srl',
    fornitore_indirizzo: 'Via Vignolese 820, 41126 Modena (MO)',
    fornitore_piva: 'IT01928400369',
    causale_trasporto: 'Invio per Conto Lavorazione',
    porto: 'Franco',
    aspetto_beni: 'Scatole su bancale con pluriball',
    numero_colli: 1,
    peso_totale_kg: 28.5,
    vettore_nome: 'Corriere Espresso (Arcese)',
    note_trasporto: 'Anodizzazione dura spessore 40 micron nera opaca. Ritiro a nostro carico.',
    stato: 'rientrato_totale',
    creato_il: '2026-10-21T14:15:00Z',
    righe: [
      {
        id: 'riga-ddt-3',
        odp_id: 'odp-11',
        codice_odp: 'ODP-2026-011',
        articolo_codice: 'SUP-MAN-ANOD-32',
        articolo_descrizione: 'Corpo Supporto 5 Assi con Anodizzazione',
        fase_sequenza: 40,
        nome_fase: 'Anodizzazione Dura Nera 40µm Esterna',
        quantita_spedita: 2,
        unita_misura: 'pz',
        peso_kg_riga: 28.5,
        note_lavorazione: 'Sedi cuscinetto H7 mascherate con tappi'
      }
    ]
  }
]

export default function SpedizioniDdtPage() {
  const [tabAttivo, setTabAttivo] = useState<'clienti' | 'ddt' | 'terzisti'>('clienti')

  // Stato DDT Conto Terzi
  const [listaDdt, setListaDdt] = useState<DocumentoTrasportoEsterno[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'spedito' | 'rientrato_totale'>('tutti')
  const [ddtSelezionatoPerStampa, setDdtSelezionatoPerStampa] = useState<DocumentoTrasportoEsterno | null>(null)
  const [notifica, setNotifica] = useState<string | null>(null)

  // Stato DDT Vendite Clienti
  const [listaDdtClienti, setListaDdtClienti] = useState<DocumentoTrasportoCliente[]>([])
  const [ricercaDdtClienti, setRicercaDdtClienti] = useState('')
  const [ddtClientePerStampa, setDdtClientePerStampa] = useState<DocumentoTrasportoCliente | null>(null)

  // Stato Modale Emissione DDT Cliente
  const [modaleDdtClienteAperta, setModaleDdtClienteAperta] = useState(false)
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [ordiniClienti, setOrdiniClienti] = useState<(OrdineCliente & { righe?: RigaOrdineCliente[] })[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi?: FaseOdP[] })[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])

  // Form Nuovo DDT Cliente
  const [formDdtCliente, setFormDdtCliente] = useState<{
    cliente_id: string
    destinazione_diversa: string
    causale_trasporto: string
    porto: 'Franco' | 'Assegnato'
    aspetto_beni: string
    numero_colli: number
    peso_totale_kg: number
    vettore_nome: string
    note_trasporto: string
    righeSelezionate: {
      riga_ordine_id: string
      ordine_id: string
      codice_ordine: string
      odp_id: string
      codice_odp: string
      articolo_id: string
      articolo_codice: string
      articolo_descrizione: string
      quantita_ordinata: number
      quantita_pronta: number
      giacenza_magazzino: number
      quantita_gia_spedita: number
      quantita_da_spedire: number
      unita_misura: string
      peso_unitario: number
      selezionato: boolean
    }[]
  }>({
    cliente_id: '',
    destinazione_diversa: '',
    causale_trasporto: 'Vendita Beni di Produzione',
    porto: 'Franco',
    aspetto_beni: 'Scatole su Europallet',
    numero_colli: 1,
    peso_totale_kg: 0,
    vettore_nome: 'Mittente (Mezzo Proprio)',
    note_trasporto: '',
    righeSelezionate: []
  })

  // Stato Anagrafica Fornitori Terzisti
  const [terzisti, setTerzisti] = useState<FornitoreTerzista[]>([])
  const [ricercaTerzisti, setRicercaTerzisti] = useState('')
  const [modaleTerzistaAperta, setModaleTerzistaAperta] = useState(false)
  const [terzistaInModifica, setTerzistaInModifica] = useState<FornitoreTerzista | null>(null)
  const [formTerzista, setFormTerzista] = useState<Omit<FornitoreTerzista, 'id'>>({
    ragione_sociale: '',
    partita_iva: '',
    codice_fiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    specialita: ''
  })

  // Caricamento Dati
  useEffect(() => {
    try {
      const parseSicuro = <T,>(chiave: string, fallback: T): T => {
        try {
          const item = localStorage.getItem(chiave)
          if (!item || item === 'undefined' || item === 'null') return fallback
          return JSON.parse(item) as T
        } catch {
          return fallback
        }
      }

      // 1. DDT Esterni Terzisti
      const salvatiDdt = parseSicuro<DocumentoTrasportoEsterno[]>('machinaflow_ddt_esterni', SEED_DDT_ESTERNI)
      const mappaDdt = new Map<string, DocumentoTrasportoEsterno>()
      SEED_DDT_ESTERNI.forEach((d) => mappaDdt.set(d.id, d))
      salvatiDdt.forEach((d) => mappaDdt.set(d.id, d))
      setListaDdt(Array.from(mappaDdt.values()))

      // Sincronizza DDT Esterni da Supabase Cloud
      syncService.getDdtEsterni().then((ddtEstCloud) => {
        if (ddtEstCloud && ddtEstCloud.length > 0) {
          const mappa = new Map<string, DocumentoTrasportoEsterno>()
          SEED_DDT_ESTERNI.forEach((d) => mappa.set(d.id, d))
          ddtEstCloud.forEach((d) => mappa.set(d.id, d))
          setListaDdt(Array.from(mappa.values()))
        }
      })

      // 2. DDT Clienti: carica da cache e sincronizza subito da Supabase Cloud
      const salvatiDdtCli = parseSicuro<DocumentoTrasportoCliente[]>('machinaflow_ddt_clienti', [])
      const ddtCliReali = salvatiDdtCli.filter((d) => d.id !== 'ddt-cli-demo-01' && d.numero_ddt !== 'DDT-2026/054')
      setListaDdtClienti(ddtCliReali)

      // 3. Clienti, Ordini, OdP e Articoli
      const cList = parseSicuro<Cliente[]>('machinaflow_clienti', SEED_CLIENTI)
      const ordList = parseSicuro<typeof ordiniClienti>('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI)
      const odpLocali = parseSicuro<(OrdineProduzione & { fasi?: FaseOdP[] })[]>('machinaflow_odp', SEED_ODP)

      setClienti(cList)
      setOrdiniClienti(ordList)
      setOdpList(odpLocali)
      setArticoli(parseSicuro('machinaflow_articoli', SEED_ARTICOLI))

      // Carica e sincronizza in parallelo OdP e DDT Clienti da Supabase Cloud per dati freschi e coerenti
      Promise.all([
        syncService.getDdtClienti(),
        syncService.getOrdiniProduzione()
      ]).then(async ([ddtCliCloud, odpCloud]) => {
        // Allinea DDT Clienti Cloud
        const idCloud = new Set((ddtCliCloud || []).map((d) => d.id))
        const ddtDaCaricare = ddtCliReali.filter((d) => !idCloud.has(d.id))
        if (ddtDaCaricare.length > 0) {
          for (const ddt of ddtDaCaricare) {
            await syncService.salvaDdtCliente(ddt)
          }
        }

        const mappaDdtCli = new Map<string, DocumentoTrasportoCliente>()
        ddtCliReali.forEach((d) => mappaDdtCli.set(d.id, d))
        ;(ddtCliCloud || []).forEach((d) => mappaDdtCli.set(d.id, d))
        const listaDdtAggiornata = Array.from(mappaDdtCli.values())
        setListaDdtClienti(listaDdtAggiornata)

        // Allinea OdP Cloud
        let listaOdpAggiornata = odpLocali
        if (odpCloud && odpCloud.length > 0) {
          const mappaOdp = new Map<string, OrdineProduzione & { fasi?: FaseOdP[] }>()
          odpLocali.forEach((o) => mappaOdp.set(o.id, o))
          odpCloud.forEach((o) => mappaOdp.set(o.id, o))
          listaOdpAggiornata = Array.from(mappaOdp.values())
          setOdpList(listaOdpAggiornata)
        }

        // Controllo se nella query string è specificato un clienteId (es. arrivo da /ordini)
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const paramClienteId = params.get('clienteId')
          if (paramClienteId) {
            handleApriModaleDdtCliente(paramClienteId, listaOdpAggiornata, cList, ordList, listaDdtAggiornata)
          }
        }
      })

      // 4. Anagrafica Fornitori Terzisti
      const salvatiTerzisti = parseSicuro<FornitoreTerzista[]>('machinaflow_fornitori_terzisti', SEED_FORNITORI_TERZISTI)
      const mappaT = new Map<string, FornitoreTerzista>()
      SEED_FORNITORI_TERZISTI.forEach((t) => mappaT.set(t.id, t))
      salvatiTerzisti.forEach((t) => mappaT.set(t.id, t))
      setTerzisti(Array.from(mappaT.values()))

      syncService.getFornitoriTerzisti().then((terzCloud) => {
        if (terzCloud && terzCloud.length > 0) {
          const mappa = new Map<string, FornitoreTerzista>()
          SEED_FORNITORI_TERZISTI.forEach((t) => mappa.set(t.id, t))
          terzCloud.forEach((t) => mappa.set(t.id, t))
          setTerzisti(Array.from(mappa.values()))
        }
      })
    } catch {
      setListaDdt(SEED_DDT_ESTERNI)
      setListaDdtClienti(SEED_DDT_CLIENTI)
      setTerzisti(SEED_FORNITORI_TERZISTI)
    }
  }, [])

  // Gestione Salvataggio Nuovo o Modificato Terzista
  const handleSalvaTerzista = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTerzista.ragione_sociale.trim()) return

    let aggiornati: FornitoreTerzista[]
    if (terzistaInModifica) {
      const terzAggiornato = { ...terzistaInModifica, ...formTerzista, ragione_sociale: formTerzista.ragione_sociale.trim() }
      aggiornati = terzisti.map((t) =>
        t.id === terzistaInModifica.id ? terzAggiornato : t
      )
      syncService.salvaFornitoreTerzista(terzAggiornato)
      setNotifica(`✓ Fornitore "${formTerzista.ragione_sociale}" aggiornato con successo!`)
    } else {
      const nuovo: FornitoreTerzista = {
        id: `forn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...formTerzista,
        ragione_sociale: formTerzista.ragione_sociale.trim()
      }
      aggiornati = [nuovo, ...terzisti]
      syncService.salvaFornitoreTerzista(nuovo)
      setNotifica(`✓ Nuovo fornitore terzista "${nuovo.ragione_sociale}" registrato in anagrafica!`)
    }

    setTerzisti(aggiornati)
    localStorage.setItem('machinaflow_fornitori_terzisti', JSON.stringify(aggiornati))
    setModaleTerzistaAperta(false)
    setTerzistaInModifica(null)
    setTimeout(() => setNotifica(null), 4000)
  }

  // Apertura modale inserimento
  const handleApriNuovoTerzista = () => {
    setTerzistaInModifica(null)
    setFormTerzista({
      ragione_sociale: '',
      partita_iva: '',
      codice_fiscale: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      telefono: '',
      email: '',
      specialita: ''
    })
    setModaleTerzistaAperta(true)
  }

  // Apertura modale modifica
  const handleApriModificaTerzista = (t: FornitoreTerzista) => {
    setTerzistaInModifica(t)
    setFormTerzista({
      ragione_sociale: t.ragione_sociale,
      partita_iva: t.partita_iva || '',
      codice_fiscale: t.codice_fiscale || '',
      indirizzo: t.indirizzo || '',
      citta: t.citta || '',
      cap: t.cap || '',
      provincia: t.provincia || '',
      telefono: t.telefono || '',
      email: t.email || '',
      specialita: t.specialita || ''
    })
    setModaleTerzistaAperta(true)
  }

  // Eliminazione Terzista
  const handleEliminaTerzista = (id: string, ragioneSociale: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${ragioneSociale}" dall'anagrafica?`)) return
    const filtrati = terzisti.filter((t) => t.id !== id)
    setTerzisti(filtrati)
    localStorage.setItem('machinaflow_fornitori_terzisti', JSON.stringify(filtrati))
    setNotifica(`Fornitore "${ragioneSociale}" rimosso dall'anagrafica.`)
    setTimeout(() => setNotifica(null), 3000)
  }

  // Filtro Terzisti
  const terzistiFiltrati = useMemo(() => {
    if (!ricercaTerzisti.trim()) return terzisti
    const q = ricercaTerzisti.toLowerCase()
    return terzisti.filter(
      (t) =>
        t.ragione_sociale.toLowerCase().includes(q) ||
        (t.specialita && t.specialita.toLowerCase().includes(q)) ||
        (t.citta && t.citta.toLowerCase().includes(q)) ||
        (t.partita_iva && t.partita_iva.toLowerCase().includes(q))
    )
  }, [terzisti, ricercaTerzisti])

  // Filtro ricerca e stato
  const ddtFiltrati = useMemo(() => {
    return listaDdt.filter((doc) => {
      const matchStato = filtroStato === 'tutti' || doc.stato === filtroStato
      const matchTesto =
        !ricerca.trim() ||
        doc.numero_ddt.toLowerCase().includes(ricerca.toLowerCase()) ||
        doc.fornitore_nome.toLowerCase().includes(ricerca.toLowerCase()) ||
        doc.righe.some(
          (r) =>
            r.codice_odp.toLowerCase().includes(ricerca.toLowerCase()) ||
            r.articolo_codice.toLowerCase().includes(ricerca.toLowerCase()) ||
            r.nome_fase.toLowerCase().includes(ricerca.toLowerCase())
        )
      return matchStato && matchTesto
    })
  }, [listaDdt, ricerca, filtroStato])

  // Calcolo pezzi pronti a magazzino per cliente (per emissione DDT consegna)
  const handleSelezionaClientePerDDT = (clienteId: string, currentOdpList?: (OrdineProduzione & { fasi?: FaseOdP[] })[], currentClienti?: Cliente[], currentOrdini?: typeof ordiniClienti, currentDdtClienti?: DocumentoTrasportoCliente[]) => {
    const elencoClienti = currentClienti || clienti
    const elencoOdp = currentOdpList || odpList
    const elencoOrdini = currentOrdini || ordiniClienti
    const elencoDdtCli = currentDdtClienti || listaDdtClienti

    const clienteTrovato = elencoClienti.find((c) => c.id === clienteId)
    if (!clienteTrovato) return

    // Trova tutti gli ordini attivi di questo cliente
    const ordiniDelCliente = elencoOrdini.filter((o) => o.cliente_id === clienteId)

    // Per ciascun ordine e riga, trova l'OdP corrispondente e le quantità già spedite
    const righeCandidati: typeof formDdtCliente.righeSelezionate = []

    ordiniDelCliente.forEach((ord) => {
      ;(ord.righe || []).forEach((riga) => {
        const art = articoli.find((a) => a.id === riga.articolo_id)
        const giacenzaStock = art?.giacenza_attuale || 0

        // Calcola quanto già spedito in precedenti DDT clienti per questa riga
        let qtaGiaSpedita = 0
        elencoDdtCli.forEach((doc) => {
          doc.righe.forEach((r) => {
            if (r.riga_ordine_cliente_id === riga.id || (r.ordine_cliente_id === ord.id && r.articolo_id === riga.articolo_id)) {
              qtaGiaSpedita += r.quantita_spedita
            }
          })
        })

        const qtaOrdinata = riga.quantita || 0
        const residuoDaSpedire = Math.max(0, qtaOrdinata - qtaGiaSpedita)
        if (residuoDaSpedire <= 0) return

        // Trova l'OdP originario della riga commessa
        const odpMadre = elencoOdp.find((o) => o.riga_ordine_cliente_id === riga.id)
        const radiceCodiceOdp = odpMadre ? odpMadre.codice_odp.split('/')[0] : null

        // Trova TUTTI gli OdP associati ESCLUSIVAMENTE a questa commessa cliente:
        const odpCandidati = elencoOdp.filter((o) => {
          if (o.articolo_id !== riga.articolo_id) return false

          const matchRigaEsatta = o.riga_ordine_cliente_id === riga.id
          const matchRadiceMadre = radiceCodiceOdp && o.codice_odp.startsWith(radiceCodiceOdp)
          const matchNoteCommessa = o.note && (o.note.includes(ord.numero_ordine) || o.note.includes(ord.id))

          return matchRigaEsatta || matchRadiceMadre || matchNoteCommessa
        })

        // Rileva se per questo articolo/commessa esiste un rimpiazzo di scarto
        const lottiRimpiazzo = odpCandidati.filter((o) => o.codice_odp.endsWith('/R') || o.odp_origine_scarto_id)

        // Se ci sono OdP finiti o parziali, considerali
        let trovatiOdpValidi = false

        odpCandidati.forEach((odp) => {
          // Escludi OdP scartati o già interamente spediti
          if (odp.stato === 'scartato' || odp.stato === 'spedito') return

          // Escludi OdP che sono già stati interamente inclusi in un DDT cliente emesso
          let qtaSpeditaQuestoOdp = 0
          elencoDdtCli.forEach((doc) => {
            doc.righe.forEach((r) => {
              if (r.odp_id === odp.id || (r.codice_odp === odp.codice_odp && r.articolo_id === odp.articolo_id)) {
                qtaSpeditaQuestoOdp += r.quantita_spedita
              }
            })
          })
          if (qtaSpeditaQuestoOdp >= odp.quantita_da_produrre) return

          const eLottoRimpiazzatoDaScarto = lottiRimpiazzo.length > 0 && 
            odp.codice_odp.endsWith('/B') && 
            lottiRimpiazzo.some((r) => r.codice_odp.replace(/\/R$/, '') === odp.codice_odp.replace(/\/B$/, ''))

          if (eLottoRimpiazzatoDaScarto) return

          const tutteFasiCompletate = odp.fasi && odp.fasi.length > 0 && odp.fasi.every((f) => f.stato === 'completata')
          const isCompletato = odp.stato === 'completato' || tutteFasiCompletate
          // Pezzi pronti considerati SOLO se l'OdP è interamente completato
          const qtaFisicaFinita = isCompletato ? Math.max(0, odp.quantita_da_produrre - qtaSpeditaQuestoOdp) : 0

          // Proponiamo la riga se l'OdP ha pezzi finiti OPPURE se c'è giacenza a magazzino
          if (qtaFisicaFinita > 0 || giacenzaStock > 0) {
            const giaInserito = righeCandidati.some((rc) => rc.odp_id === odp.id)
            if (!giaInserito) {
              trovatiOdpValidi = true
              // Default proposto: se ci sono pezzi da OdP usa quelli, altrimenti proponi il residuo copribile da magazzino
              const qtaDaSpedireDefault = qtaFisicaFinita > 0
                ? Math.min(residuoDaSpedire, qtaFisicaFinita)
                : Math.min(residuoDaSpedire, giacenzaStock)

              // Selezionato per default SOLO se ci sono pezzi effettivamente pronti da OdP (qtaFisicaFinita > 0)
              const haPezziProntiOdp = qtaFisicaFinita > 0

              righeCandidati.push({
                riga_ordine_id: riga.id,
                ordine_id: ord.id,
                codice_ordine: ord.numero_ordine,
                odp_id: odp.id,
                codice_odp: odp.codice_odp,
                articolo_id: riga.articolo_id,
                articolo_codice: art?.codice_articolo || 'N/D',
                articolo_descrizione: art?.descrizione || 'Particolare Meccanico',
                quantita_ordinata: qtaOrdinata,
                quantita_pronta: qtaFisicaFinita,
                giacenza_magazzino: giacenzaStock,
                quantita_gia_spedita: qtaGiaSpedita,
                quantita_da_spedire: qtaDaSpedireDefault,
                unita_misura: art?.unita_misura || 'pz',
                peso_unitario: art?.peso_kg_unitario || 1.5,
                selezionato: haPezziProntiOdp
              })
            }
          }
        })

        // Se non ci sono OdP ma c'è giacenza a magazzino, consenti la spedizione diretta da stock (NON preselezionata, decide l'operatore)
        if (!trovatiOdpValidi && giacenzaStock > 0) {
          const qtaDaSpedireDefault = Math.min(residuoDaSpedire, giacenzaStock)
          righeCandidati.push({
            riga_ordine_id: riga.id,
            ordine_id: ord.id,
            codice_ordine: ord.numero_ordine,
            odp_id: '',
            codice_odp: 'DA MAGAZZINO (STOCK)',
            articolo_id: riga.articolo_id,
            articolo_codice: art?.codice_articolo || 'N/D',
            articolo_descrizione: art?.descrizione || 'Particolare Meccanico',
            quantita_ordinata: qtaOrdinata,
            quantita_pronta: 0,
            giacenza_magazzino: giacenzaStock,
            quantita_gia_spedita: qtaGiaSpedita,
            quantita_da_spedire: qtaDaSpedireDefault,
            unita_misura: art?.unita_misura || 'pz',
            peso_unitario: art?.peso_kg_unitario || 1.5,
            selezionato: false
          })
        }
      })
    })

    const pesoIniziale = righeCandidati
      .filter((r) => r.selezionato)
      .reduce((acc, curr) => acc + curr.quantita_da_spedire * curr.peso_unitario, 0)

    setFormDdtCliente({
      cliente_id: clienteId,
      destinazione_diversa: clienteTrovato.indirizzo || '',
      causale_trasporto: 'Vendita Beni di Produzione',
      porto: 'Franco',
      aspetto_beni: 'Scatole su Europallet reggettato',
      numero_colli: 1,
      peso_totale_kg: Number(pesoIniziale.toFixed(1)),
      vettore_nome: 'Mittente (Mezzo Proprio)',
      note_trasporto: 'Consegna con collaudo a disegno.',
      righeSelezionate: righeCandidati
    })
  }

  // Apertura Modale DDT Cliente da zero
  const handleApriModaleDdtCliente = (clientePreselezionatoId?: string, listaOdpAttuale?: (OrdineProduzione & { fasi?: FaseOdP[] })[], listaClientiAttuale?: Cliente[], listaOrdiniAttuale?: typeof ordiniClienti, listaDdtAttuale?: DocumentoTrasportoCliente[]) => {
    const elencoClienti = listaClientiAttuale || clienti
    const targetClienteId = clientePreselezionatoId || elencoClienti[0]?.id || ''
    handleSelezionaClientePerDDT(targetClienteId, listaOdpAttuale, elencoClienti, listaOrdiniAttuale, listaDdtAttuale)
    setModaleDdtClienteAperta(true)
  }

  // Conferma ed Emissione DDT Cliente
  const handleConfermaEmissioneDdtCliente = (e: React.FormEvent) => {
    e.preventDefault()
    const clienteTrovato = clienti.find((c) => c.id === formDdtCliente.cliente_id)
    if (!clienteTrovato) return

    const righeDaSpedire = formDdtCliente.righeSelezionate.filter(
      (r) => r.selezionato && r.quantita_da_spedire > 0
    )

    if (righeDaSpedire.length === 0) {
      alert('Seleziona almeno un articolo da includere nel DDT con quantità maggiore di zero.')
      return
    }

    const annoCorrente = new Date().getFullYear()
    const progressivo = String(listaDdtClienti.length + 1).padStart(3, '0')
    const numeroDdtGenerato = `DDT-${annoCorrente}/${progressivo}`

    const nuovoDdt: DocumentoTrasportoCliente = {
      id: `ddt-cli-${Date.now()}`,
      numero_ddt: numeroDdtGenerato,
      data_emissione: new Date().toISOString(),
      cliente_id: clienteTrovato.id,
      cliente_nome: clienteTrovato.ragione_sociale,
      cliente_indirizzo: clienteTrovato.indirizzo,
      cliente_piva: clienteTrovato.partita_iva,
      destinazione_diversa: formDdtCliente.destinazione_diversa || clienteTrovato.indirizzo,
      causale_trasporto: formDdtCliente.causale_trasporto,
      porto: formDdtCliente.porto,
      aspetto_beni: formDdtCliente.aspetto_beni,
      numero_colli: formDdtCliente.numero_colli,
      peso_totale_kg: formDdtCliente.peso_totale_kg,
      vettore_nome: formDdtCliente.vettore_nome,
      note_trasporto: formDdtCliente.note_trasporto,
      creato_il: new Date().toISOString(),
      righe: righeDaSpedire.map((r, idx) => ({
        id: `riga-ddt-cli-${Date.now()}-${idx}`,
        ordine_cliente_id: r.ordine_id,
        riga_ordine_cliente_id: r.riga_ordine_id,
        codice_ordine_cliente: r.codice_ordine,
        odp_id: r.odp_id,
        codice_odp: r.codice_odp,
        articolo_id: r.articolo_id,
        articolo_codice: r.articolo_codice,
        articolo_descrizione: r.articolo_descrizione,
        quantita_ordinata: r.quantita_ordinata,
        quantita_spedita: r.quantita_da_spedire,
        unita_misura: r.unita_misura,
        peso_kg_riga: Number((r.quantita_da_spedire * r.peso_unitario).toFixed(1)),
        note_riga: r.quantita_da_spedire < (r.quantita_ordinata - r.quantita_gia_spedita)
          ? `Spedizione parziale (${r.quantita_da_spedire} su ${r.quantita_ordinata} tot.)`
          : 'Saldo fornitura'
      }))
    }

    const aggiornatiDdtCli = [nuovoDdt, ...listaDdtClienti]
    setListaDdtClienti(aggiornatiDdtCli)
    localStorage.setItem('machinaflow_ddt_clienti', JSON.stringify(aggiornatiDdtCli))

    // Salva DDT Cliente su Supabase Cloud (condivisione istantanea tra dispositivi)
    syncService.salvaDdtCliente(nuovoDdt)

    // Aggiorna giacenza a magazzino per la quota eventualmente spedita da stock
    let articoliModificati = false
    const articoliAggiornati = articoli.map((art) => {
      // Calcola quanti pezzi sono stati prelevati da stock per questo articolo
      const righeArticolo = righeDaSpedire.filter((r) => r.articolo_id === art.id)
      if (righeArticolo.length === 0) return art

      let prelievoDaStock = 0
      righeArticolo.forEach((r) => {
        // Se la quantità spedita supera i pezzi pronti da OdP (o non c'è OdP), la differenza scala il magazzino stock
        const daStock = Math.max(0, r.quantita_da_spedire - r.quantita_pronta)
        prelievoDaStock += daStock
      })

      if (prelievoDaStock > 0) {
        articoliModificati = true
        const nuovaGiacenza = Math.max(0, art.giacenza_attuale - prelievoDaStock)
        const artAggiornato = { ...art, giacenza_attuale: nuovaGiacenza }
        syncService.salvaArticolo(artAggiornato)
        return artAggiornato
      }
      return art
    })

    if (articoliModificati) {
      setArticoli(articoliAggiornati)
      localStorage.setItem('machinaflow_articoli', JSON.stringify(articoliAggiornati))
    }

    // Aggiorna stato degli Ordini Clienti coinvolti
    const ordiniCoinvolti = new Set(righeDaSpedire.map((r) => r.ordine_id))
    const ordiniAggiornati = ordiniClienti.map((ord) => {
      if (!ordiniCoinvolti.has(ord.id)) return ord

      // Calcola avanzamento globale dell'ordine
      const totaleOrdinato = (ord.righe || []).reduce((acc, r) => acc + (r.quantita || 0), 0)
      let totaleSpedito = 0

      aggiornatiDdtCli.forEach((doc) => {
        doc.righe.forEach((r) => {
          if (r.ordine_cliente_id === ord.id) {
            totaleSpedito += r.quantita_spedita
          }
        })
      })

      const nuovoStato = totaleSpedito >= totaleOrdinato
        ? ('evaso' as const)
        : totaleSpedito > 0
        ? ('parzialmente_evaso' as const)
        : ord.stato

      return {
        ...ord,
        stato: nuovoStato
      }
    })

    setOrdiniClienti(ordiniAggiornati)
    localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(ordiniAggiornati))

    // Aggiorna stato degli OdP coinvolti a 'spedito' se interamente consegnati
    const odpIdsCoinvolti = new Set(righeDaSpedire.map((r) => r.odp_id).filter(Boolean))
    if (odpIdsCoinvolti.size > 0) {
      const odpAggiornati = odpList.map((odp) => {
        if (odpIdsCoinvolti.has(odp.id)) {
          syncService.aggiornaStatoOdP(odp.id, 'spedito', odp.quantita_da_produrre)
          return {
            ...odp,
            stato: 'spedito' as const
          }
        }
        return odp
      })
      setOdpList(odpAggiornati)
      localStorage.setItem('machinaflow_odp', JSON.stringify(odpAggiornati))
    }

    // Chiudi modale e apri anteprima di stampa A4 immediata
    setModaleDdtClienteAperta(false)
    setDdtClientePerStampa(nuovoDdt)
    setNotifica(`✓ Documento di Trasporto ${numeroDdtGenerato} emesso con successo! Pronto per la stampa.`)
    setTimeout(() => setNotifica(null), 5000)
  }

  // Filtro ricerca DDT Clienti
  const ddtClientiFiltrati = useMemo(() => {
    if (!ricercaDdtClienti.trim()) return listaDdtClienti
    const q = ricercaDdtClienti.toLowerCase()
    return listaDdtClienti.filter(
      (doc) =>
        doc.numero_ddt.toLowerCase().includes(q) ||
        doc.cliente_nome.toLowerCase().includes(q) ||
        (doc.destinazione_diversa && doc.destinazione_diversa.toLowerCase().includes(q)) ||
        doc.righe.some(
          (r) =>
            r.articolo_codice.toLowerCase().includes(q) ||
            r.articolo_descrizione.toLowerCase().includes(q) ||
            (r.codice_ordine_cliente && r.codice_ordine_cliente.toLowerCase().includes(q)) ||
            (r.codice_odp && r.codice_odp.toLowerCase().includes(q))
        )
    )
  }, [listaDdtClienti, ricercaDdtClienti])

  // Esportazione CSV DDT Clienti
  const handleEsportaTuttiCsvClienti = () => {
    const separatore = ';'
    const intestazioni = [
      'DataDDT',
      'NumeroDDT',
      'Cliente',
      'PartitaIVA',
      'Destinazione',
      'RifOrdine',
      'RifOdP',
      'CodiceArticolo',
      'DescrizioneArticolo',
      'QuantitaSpedita',
      'UnitaMisura',
      'PesoKg',
      'Causale',
      'Vettore',
      'Colli'
    ]

    const righeCsv = ddtClientiFiltrati.flatMap((doc) =>
      doc.righe.map((r) => [
        new Date(doc.data_emissione).toLocaleDateString('it-IT'),
        `"${doc.numero_ddt}"`,
        `"${doc.cliente_nome}"`,
        `"${doc.cliente_piva || ''}"`,
        `"${doc.destinazione_diversa || doc.cliente_indirizzo || ''}"`,
        `"${r.codice_ordine_cliente || ''}"`,
        `"${r.codice_odp || ''}"`,
        `"${r.articolo_codice}"`,
        `"${r.articolo_descrizione.replace(/"/g, '""')}"`,
        r.quantita_spedita,
        r.unita_misura,
        r.peso_kg_riga || '',
        `"${doc.causale_trasporto}"`,
        `"${doc.vettore_nome}"`,
        doc.numero_colli
      ])
    )

    const contenuto = [intestazioni.join(separatore), ...righeCsv.map((r) => r.join(separatore))].join('\r\n')
    const blob = new Blob(['\uFEFF' + contenuto], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `DDT_Clienti_MachinaFlow_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setNotifica('✓ File DDT Clienti esportato con successo per la fatturazione!')
    setTimeout(() => setNotifica(null), 4000)
  }
  const handleEsportaTuttiCsv = () => {
    const separatore = ';'
    const intestazioni = [
      'DataDDT',
      'NumeroDDT',
      'DestinatarioFornitore',
      'PartitaIVA',
      'CodiceOdP',
      'CodiceArticolo',
      'DescrizioneArticolo',
      'LavorazioneRichiesta',
      'Quantita',
      'UnitaMisura',
      'PesoKg',
      'CausaleTrasporto',
      'Vettore',
      'NumeroColli',
      'StatoMerce'
    ]

    const righeCsv = ddtFiltrati.flatMap((doc) =>
      doc.righe.map((r) => [
        new Date(doc.data_emissione).toLocaleDateString('it-IT'),
        `"${doc.numero_ddt}"`,
        `"${doc.fornitore_nome}"`,
        `"${doc.fornitore_piva || ''}"`,
        `"${r.codice_odp}"`,
        `"${r.articolo_codice}"`,
        `"${r.articolo_descrizione.replace(/"/g, '""')}"`,
        `"${r.nome_fase.replace(/"/g, '""')}"`,
        r.quantita_spedita,
        r.unita_misura,
        r.peso_kg_riga || '',
        `"${doc.causale_trasporto}"`,
        `"${doc.vettore_nome}"`,
        doc.numero_colli,
        `"${doc.stato === 'rientrato_totale' ? 'Rientrato' : 'Fuori Sede'}"`
      ])
    )

    const contenuto = [intestazioni.join(separatore), ...righeCsv.map((r) => r.join(separatore))].join('\r\n')
    const blob = new Blob(['\uFEFF' + contenuto], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `DDT_Esterni_MachinaFlow_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setNotifica('✓ File esportato con successo! Pronto per l\'importazione nel gestionale contabile.')
    setTimeout(() => setNotifica(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Intestazione Sezione Ufficio */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-emerald-400" />
            Spedizioni & Documenti di Trasporto (DDT)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Emetti e gestisci i DDT di consegna per i clienti (vendite complete e parziali) e i DDT verso terzisti (trattamenti termici, zincatura, verniciatura).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleApriModaleDdtCliente()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Nuovo DDT di Consegna Cliente</span>
          </button>

          {tabAttivo === 'clienti' ? (
            <button
              type="button"
              onClick={handleEsportaTuttiCsvClienti}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
              title="Esporta DDT clienti per la contabilità / fatturazione"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Esporta Clienti (CSV)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEsportaTuttiCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
              title="Esporta tutte le righe terzisti in formato CSV/Excel per il software contabile"
            >
              <FileSpreadsheet className="w-4 h-4 text-pink-400" />
              <span>Esporta Terzisti (CSV)</span>
            </button>
          )}

          <Link
            href="/officina"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4 text-pink-400" />
            <span>Terminale EXT</span>
          </Link>
        </div>
      </div>

      {/* Notifica Flash */}
      {notifica && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-200">
          <span className="font-semibold">{notifica}</span>
          <button onClick={() => setNotifica(null)} className="text-emerald-400 font-bold hover:text-white">✕</button>
        </div>
      )}

      {/* Barra di Navigazione Tab Coordinata */}
      <div className="no-print flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setTabAttivo('clienti')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabAttivo === 'clienti'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>DDT Vendite & Consegne Clienti ({listaDdtClienti.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAttivo('ddt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabAttivo === 'ddt'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>DDT Conto Terzi & Fuori Sede ({listaDdt.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAttivo('terzisti')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabAttivo === 'terzisti'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Anagrafica Terzisti & Fornitori ({terzisti.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DDT VENDITE & CONSEGNE CLIENTI                                      */}
      {/* ========================================================================= */}
      {tabAttivo === 'clienti' && (
        <>
          {/* KPI Cards Riepilogo Spedizioni Clienti */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">DDT Consegna Emessi</div>
                <div className="text-2xl font-black text-white mt-1 font-mono">{listaDdtClienti.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Spedizioni ai clienti finali</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 text-emerald-400">
                <PackageCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Pezzi Totali Spediti</div>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  {listaDdtClienti.reduce((acc, d) => acc + d.righe.reduce((rAcc, r) => rAcc + r.quantita_spedita, 0), 0)}
                </div>
                <div className="text-[11px] text-emerald-200/60 mt-0.5">Particolari meccanici consegnati</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-900/40 text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-300 font-bold uppercase tracking-wider">Clienti Serviti</div>
                <div className="text-2xl font-black text-blue-400 mt-1 font-mono">
                  {new Set(listaDdtClienti.map((d) => d.cliente_id)).size}
                </div>
                <div className="text-[11px] text-blue-200/60 mt-0.5">Destinatari unici con consegne</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-900/40 text-blue-300">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Barra Ricerca e Filtri DDT Clienti */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ricercaDdtClienti}
                onChange={(e) => setRicercaDdtClienti(e.target.value)}
                placeholder="Cerca per numero DDT, cliente, commessa o particolare..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => handleApriModaleDdtCliente()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo DDT Consegna</span>
            </button>
          </div>

          {/* Tabella DDT Consegne Clienti */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">DDT / Emissione</th>
                    <th className="py-3 px-3.5">Cliente Destinatario</th>
                    <th className="py-3 px-3.5">Rif. Ordine / Commessa</th>
                    <th className="py-3 px-3.5">Particolari & Quantità</th>
                    <th className="py-3 px-3.5">Trasporto & Vettore</th>
                    <th className="py-3 px-3.5 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ddtClientiFiltrati.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nessun DDT di vendita trovato con i filtri attuali.
                      </td>
                    </tr>
                  ) : (
                    ddtClientiFiltrati.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-mono font-black text-emerald-400 block text-sm">
                            {doc.numero_ddt}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(doc.data_emissione).toLocaleDateString('it-IT')}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <strong className="text-white block text-sm font-semibold">{doc.cliente_nome}</strong>
                          <span className="text-[11px] text-slate-400 block">
                            {doc.destinazione_diversa || doc.cliente_indirizzo || 'Sede legale'}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="space-y-1">
                            {Array.from(new Set(doc.righe.map((r) => r.codice_ordine_cliente).filter(Boolean))).map((c) => (
                              <span key={c} className="inline-block px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-emerald-300 mr-1">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="space-y-1.5 max-w-md">
                            {doc.righe.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-bold text-slate-100 shrink-0">
                                    {r.articolo_codice}
                                  </span>
                                  <span className="text-slate-400 text-[11px] truncate" title={r.articolo_descrizione}>
                                    {r.articolo_descrizione}
                                  </span>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {r.codice_odp && (
                                    <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
                                      {r.codice_odp}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold font-mono text-[11px] border border-emerald-800/60">
                                    {r.quantita_spedita} {r.unita_misura}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-xs text-slate-400">
                          <div><strong className="text-slate-200">{doc.vettore_nome}</strong></div>
                          <div>{doc.numero_colli} colli &bull; {doc.peso_totale_kg ? `${doc.peso_totale_kg} kg` : 'A vista'}</div>
                        </td>

                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDdtClientePerStampa(doc)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            title="Visualizza e Stampa A4 del DDT"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Stampa A4</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DDT CONTO TERZI & FUORI SEDE                                        */}
      {/* ========================================================================= */}
      {tabAttivo === 'ddt' && (
        <>
          {/* KPI Cards Riepilogo Spedizioni */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Totale DDT Emessi</div>
                <div className="text-2xl font-black text-white mt-1 font-mono">{listaDdt.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Spedizioni registrate a sistema</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 text-pink-400">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-pink-300 font-bold uppercase tracking-wider">Attualmente Fuori Sede</div>
                <div className="text-2xl font-black text-pink-400 mt-1 font-mono">
                  {listaDdt.filter((d) => d.stato === 'spedito').length}
                </div>
                <div className="text-[11px] text-pink-200/60 mt-0.5">In attesa di rientro dai terzisti</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-900/40 text-pink-300">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Lavorazioni Rientrate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  {listaDdt.filter((d) => d.stato === 'rientrato_totale').length}
                </div>
                <div className="text-[11px] text-emerald-200/60 mt-0.5">Ciclo completato e verificato</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-900/40 text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Barra Ricerca e Filtri */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                placeholder="Cerca DDT, fornitore, OdP o particolare..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs text-slate-400 font-semibold mr-1">Filtro Stato:</span>
              <button
                type="button"
                onClick={() => setFiltroStato('tutti')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroStato === 'tutti' ? 'bg-pink-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Tutti ({listaDdt.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStato('spedito')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroStato === 'spedito' ? 'bg-pink-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Fuori Sede ({listaDdt.filter((d) => d.stato === 'spedito').length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStato('rientrato_totale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroStato === 'rientrato_totale' ? 'bg-pink-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Rientrati ({listaDdt.filter((d) => d.stato === 'rientrato_totale').length})
              </button>
            </div>
          </div>

          {/* Tabella DDT Emessi per l'Ufficio */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">DDT / Emissione</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Fornitore Terzista</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Dettaglio Merci & OdP</th>
                    <th className="py-3 px-2.5 text-center whitespace-nowrap">Colli & Peso</th>
                    <th className="py-3 px-2.5 text-center whitespace-nowrap">Vettore</th>
                    <th className="py-3 px-2.5 text-center whitespace-nowrap">Stato Merce</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap sticky right-0 bg-slate-950/95">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {ddtFiltrati.map((doc) => {
                    const isFuoriSede = doc.stato === 'spedito'

                    return (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* DDT e Data */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-mono font-black text-pink-400 text-sm">{doc.numero_ddt}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(doc.data_emissione).toLocaleDateString('it-IT')}
                          </div>
                        </td>

                        {/* Fornitore */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white text-xs">{doc.fornitore_nome}</div>
                          <div className="text-slate-400 text-[11px] truncate max-w-[200px]" title={doc.fornitore_indirizzo}>
                            {doc.fornitore_indirizzo || 'Sede fornitore'}
                          </div>
                        </td>

                        {/* Merci Spedite */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-1.5 max-w-md">
                            {doc.righe.map((r, i) => (
                              <div
                                key={r.id || i}
                                className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-mono font-bold text-orange-400 shrink-0">
                                      {r.codice_odp}
                                    </span>
                                    <span className="text-slate-200 font-semibold truncate">
                                      {r.articolo_codice}
                                    </span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded bg-pink-950/80 text-pink-300 font-bold font-mono text-[11px] border border-pink-800/60 shrink-0">
                                    {r.quantita_spedita} {r.unita_misura}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium truncate">
                                  {r.articolo_descrizione}
                                </div>
                                <div className="text-[10px] text-pink-300 font-mono flex items-center gap-1">
                                  <span>↳</span>
                                  <span className="font-bold">{r.nome_fase}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Colli e Peso */}
                        <td className="py-3 px-2.5 text-center whitespace-nowrap">
                          <div className="font-bold text-slate-100">{doc.numero_colli} cassa/e</div>
                          <div className="text-slate-400 font-mono text-[11px]">
                            {doc.peso_totale_kg ? `${doc.peso_totale_kg.toFixed(1)} kg` : 'N/D'}
                          </div>
                        </td>

                        {/* Vettore */}
                        <td className="py-3 px-2.5 text-center whitespace-nowrap text-[11px] text-slate-300">
                          {doc.vettore_nome}
                        </td>

                        {/* Stato Merce */}
                        <td className="py-3 px-2.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${
                              isFuoriSede
                                ? 'bg-pink-950 text-pink-300 border border-pink-700 animate-pulse'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isFuoriSede ? '🚚 FUORI SEDE' : '✓ RIENTRATO'}
                          </span>
                        </td>

                        {/* Azioni: Stampa A4 e Dettaglio */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap sticky right-0 bg-slate-900/95 shadow-l">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDdtSelezionatoPerStampa(doc)}
                              className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-600/30 transition-all active:scale-95"
                              title="Visualizza e Stampa Documento di Trasporto A4"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Stampa A4</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {ddtFiltrati.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nessun Documento di Trasporto trovato per i criteri selezionati.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANAGRAFICA FORNITORI TERZISTI & PARTNER ESTERNI                    */}
      {/* ========================================================================= */}
      {tabAttivo === 'terzisti' && (
        <div className="no-print space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca terzista per ragione sociale, città, specialità o P.IVA..."
                value={ricercaTerzisti}
                onChange={(e) => setRicercaTerzisti(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <button
              type="button"
              onClick={handleApriNuovoTerzista}
              className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-pink-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Terzista Esterno</span>
            </button>
          </div>

          {/* Griglia Schede Terzisti */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terzistiFiltrati.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 transition-all shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white leading-tight">
                          {t.ragione_sociale}
                        </h3>
                        {t.partita_iva && (
                          <span className="font-mono text-[10px] text-slate-400 block">
                            P.IVA: {t.partita_iva}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {t.specialita && (
                    <div className="mt-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-950 text-pink-300 border border-pink-800">
                        {t.specialita}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                    {t.indirizzo && (
                      <div className="flex items-start gap-2 text-[11px] text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{t.indirizzo}{t.citta ? `, ${t.cap || ''} ${t.citta} (${t.provincia || ''})` : ''}</span>
                      </div>
                    )}
                    {t.telefono && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{t.telefono}</span>
                      </div>
                    )}
                    {t.email && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{t.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleApriModificaTerzista(t)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Modifica dati anagrafici"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifica</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminaTerzista(t.id, t.ragione_sociale)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs cursor-pointer transition-colors"
                    title="Elimina dall'anagrafica"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {terzistiFiltrati.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                Nessun fornitore terzista trovato con i criteri di ricerca.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALE INSERIMENTO / MODIFICA TERZISTA */}
      {modaleTerzistaAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border-2 border-pink-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-pink-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {terzistaInModifica ? 'Modifica Fornitore Terzista' : 'Nuovo Fornitore Terzista'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Anagrafica partner per lavorazioni conto terzi esterne
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModaleTerzistaAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaTerzista} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ragione Sociale Fornitore *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Zincatura Veneta Srl"
                  value={formTerzista.ragione_sociale}
                  onChange={(e) => setFormTerzista({ ...formTerzista, ragione_sociale: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Specialità di Lavorazione (Trattamenti)
                </label>
                <input
                  type="text"
                  placeholder="es: Zincatura Bianca, Tempra Induzione, Anodizzazione Dura, Verniciatura Polvere..."
                  value={formTerzista.specialita}
                  onChange={(e) => setFormTerzista({ ...formTerzista, specialita: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    placeholder="IT01234567890"
                    value={formTerzista.partita_iva}
                    onChange={(e) => setFormTerzista({ ...formTerzista, partita_iva: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    placeholder="Opzionale se uguale a P.IVA"
                    value={formTerzista.codice_fiscale}
                    onChange={(e) => setFormTerzista({ ...formTerzista, codice_fiscale: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Indirizzo Sede Operativa
                </label>
                <input
                  type="text"
                  placeholder="Via, Piazza, Numero civico"
                  value={formTerzista.indirizzo}
                  onChange={(e) => setFormTerzista({ ...formTerzista, indirizzo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-300 mb-1">
                    CAP
                  </label>
                  <input
                    type="text"
                    placeholder="36100"
                    value={formTerzista.cap}
                    onChange={(e) => setFormTerzista({ ...formTerzista, cap: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Città
                  </label>
                  <input
                    type="text"
                    placeholder="Vicenza"
                    value={formTerzista.citta}
                    onChange={(e) => setFormTerzista({ ...formTerzista, citta: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    placeholder="VI"
                    maxLength={2}
                    value={formTerzista.provincia}
                    onChange={(e) => setFormTerzista({ ...formTerzista, provincia: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono uppercase focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Telefono / Centralino
                  </label>
                  <input
                    type="text"
                    placeholder="+39 0444 ..."
                    value={formTerzista.telefono}
                    onChange={(e) => setFormTerzista({ ...formTerzista, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Email Logistica / Spedizioni
                  </label>
                  <input
                    type="email"
                    placeholder="logistica@fornitore.it"
                    value={formTerzista.email}
                    onChange={(e) => setFormTerzista({ ...formTerzista, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModaleTerzistaAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase shadow-md shadow-pink-600/30 transition-all cursor-pointer active:scale-95"
                >
                  {terzistaInModifica ? 'Salva Modifiche' : 'Registra Terzista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE EMISSIONE NUOVO DDT CONSEGNA CLIENTE */}
      {modaleDdtClienteAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Modale */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Emissione Documento di Trasporto (DDT Vendita / Consegna)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Seleziona gli articoli finiti e inserisci le quantità per consegna totale o parziale
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModaleDdtClienteAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Principale */}
            <form onSubmit={handleConfermaEmissioneDdtCliente} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Selezione Cliente e Destinazione */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cliente Intestatario Commessa *
                  </label>
                  <select
                    value={formDdtCliente.cliente_id}
                    onChange={(e) => handleSelezionaClientePerDDT(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {clienti.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ragione_sociale} {c.partita_iva ? `(P.IVA ${c.partita_iva})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Luogo di Destinazione Merci
                  </label>
                  <input
                    type="text"
                    value={formDdtCliente.destinazione_diversa}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, destinazione_diversa: e.target.value })}
                    placeholder="Indirizzo stabilimento o cantiere cliente..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dati Logistici Vettore e Colli */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Causale Trasporto
                  </label>
                  <input
                    type="text"
                    value={formDdtCliente.causale_trasporto}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, causale_trasporto: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Porto
                  </label>
                  <select
                    value={formDdtCliente.porto}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, porto: e.target.value as 'Franco' | 'Assegnato' })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Franco">Franco</option>
                    <option value="Assegnato">Assegnato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Numero Colli
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDdtCliente.numero_colli}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, numero_colli: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Peso Totale (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formDdtCliente.peso_totale_kg}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, peso_totale_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Vettore Incaricato
                  </label>
                  <input
                    type="text"
                    value={formDdtCliente.vettore_nome}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, vettore_nome: e.target.value })}
                    placeholder="Es: Mittente (Mezzo Proprio), BRT Corriere, Ritiro Cliente..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Aspetto Esteriore Beni
                  </label>
                  <input
                    type="text"
                    value={formDdtCliente.aspetto_beni}
                    onChange={(e) => setFormDdtCliente({ ...formDdtCliente, aspetto_beni: e.target.value })}
                    placeholder="Es: Scatole su Europallet, Casse in legno..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Elenco Articoli Pronti / Ordinati per la Spedizione */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Articoli Ordinati & Particolari da Spedire
                  </h3>
                  <span className="text-[11px] text-slate-400 italic">
                    Puoi modificare la quantità da spedire per effettuare consegne parziali
                  </span>
                </div>

                {formDdtCliente.righeSelezionate.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                    Nessuna commessa con pezzi in attesa di consegna per questo cliente.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10">Includi</th>
                          <th className="py-2.5 px-3">Commessa / OdP</th>
                          <th className="py-2.5 px-3">Codice Articolo</th>
                          <th className="py-2.5 px-3">Descrizione</th>
                          <th className="py-2.5 px-3 text-center">Ordinati</th>
                          <th className="py-2.5 px-3 text-center">Pronti OdP</th>
                          <th className="py-2.5 px-3 text-center">Disponibili Totali</th>
                          <th className="py-2.5 px-3 text-center">Già Spediti</th>
                          <th className="py-2.5 px-3 text-center w-36">Q.tà da Spedire Ora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                        {formDdtCliente.righeSelezionate.map((r, idx) => {
                          const residuoMassimo = r.quantita_ordinata - r.quantita_gia_spedita
                          const totaleFisicoDisponibile = r.quantita_pronta + r.giacenza_magazzino
                          const copribile = Math.min(residuoMassimo, totaleFisicoDisponibile)

                          return (
                            <tr
                              key={r.odp_id ? `${r.riga_ordine_id}-${r.odp_id}` : (r.riga_ordine_id ? `${r.riga_ordine_id}-${idx}` : `riga-${idx}`)}
                              className={`transition-colors ${r.selezionato ? 'bg-emerald-950/20' : 'opacity-60'}`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={r.selezionato}
                                  onChange={(e) => {
                                    const val = e.target.checked
                                    const aggiornate = [...formDdtCliente.righeSelezionate]
                                    aggiornate[idx].selezionato = val
                                    const nuovoPeso = aggiornate
                                      .filter((x) => x.selezionato)
                                      .reduce((acc, curr) => acc + curr.quantita_da_spedire * curr.peso_unitario, 0)
                                    setFormDdtCliente({
                                      ...formDdtCliente,
                                      righeSelezionate: aggiornate,
                                      peso_totale_kg: Number(nuovoPeso.toFixed(1))
                                    })
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>

                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                                {r.codice_ordine}
                                {r.codice_odp && (
                                  <span className={`block text-[10px] font-normal ${r.codice_odp.includes('STOCK') ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                                    {r.codice_odp}
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 font-mono font-bold text-white">
                                {r.articolo_codice}
                              </td>

                              <td className="py-2.5 px-3 text-slate-300 font-medium">
                                {r.articolo_descrizione}
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                                {r.quantita_ordinata} {r.unita_misura}
                              </td>

                              {/* Pezzi Pronti da OdP */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                                  r.quantita_pronta > 0 
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                                    : 'text-slate-500'
                                }`}>
                                  {r.quantita_pronta} {r.unita_misura}
                                </span>
                              </td>

                              {/* Giacenza Totale Disponibile (OdP + Magazzino) con dettaglio trasparente */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center">
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                                    totaleFisicoDisponibile > 0 
                                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 shadow-xs' 
                                      : 'text-slate-500'
                                  }`}>
                                    {totaleFisicoDisponibile} {r.unita_misura}
                                  </span>
                                  {r.giacenza_magazzino > 0 && r.quantita_pronta > 0 && (
                                    <span className="text-[10px] text-amber-300/80 mt-0.5 font-medium">
                                      ({r.quantita_pronta} OdP + {r.giacenza_magazzino} Stock)
                                    </span>
                                  )}
                                  {r.quantita_pronta === 0 && r.giacenza_magazzino > 0 && (
                                    <span className="text-[10px] text-amber-300/80 mt-0.5 font-medium">
                                      (tutti da Stock)
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                                {r.quantita_gia_spedita} {r.unita_misura}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max={residuoMassimo}
                                    disabled={!r.selezionato}
                                    value={r.quantita_da_spedire}
                                    onChange={(e) => {
                                      const nuovaQta = Math.max(1, parseInt(e.target.value) || 0)
                                      const aggiornate = [...formDdtCliente.righeSelezionate]
                                      aggiornate[idx].quantita_da_spedire = nuovaQta
                                      const nuovoPeso = aggiornate
                                        .filter((x) => x.selezionato)
                                        .reduce((acc, curr) => acc + curr.quantita_da_spedire * curr.peso_unitario, 0)
                                      setFormDdtCliente({
                                        ...formDdtCliente,
                                        righeSelezionate: aggiornate,
                                        peso_totale_kg: Number(nuovoPeso.toFixed(1))
                                      })
                                    }}
                                    className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-emerald-500"
                                  />

                                  {/* Pulsante rapido "Saldo da Stock" se c'è giacenza e l'OdP non copre tutto */}
                                  {totaleFisicoDisponibile > r.quantita_pronta && r.quantita_da_spedire < residuoMassimo && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const aggiornate = [...formDdtCliente.righeSelezionate]
                                        aggiornate[idx].quantita_da_spedire = copribile
                                        aggiornate[idx].selezionato = true
                                        const nuovoPeso = aggiornate
                                          .filter((x) => x.selezionato)
                                          .reduce((acc, curr) => acc + curr.quantita_da_spedire * curr.peso_unitario, 0)
                                        setFormDdtCliente({
                                          ...formDdtCliente,
                                          righeSelezionate: aggiornate,
                                          peso_totale_kg: Number(nuovoPeso.toFixed(1))
                                        })
                                      }}
                                      title={`Usa fino a ${copribile} pz combinando OdP e Magazzino Stock`}
                                      className="px-1.5 py-1 text-[10px] font-bold rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 cursor-pointer"
                                    >
                                      Max
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Note Trasporto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Note di Consegna / Istruzioni Speciali
                </label>
                <textarea
                  rows={2}
                  value={formDdtCliente.note_trasporto}
                  onChange={(e) => setFormDdtCliente({ ...formDdtCliente, note_trasporto: e.target.value })}
                  placeholder="Es: Ritiro al mattino; allegare certificati collaudo 3.1..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Footer Modale */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Totale righe selezionate:{' '}
                  <strong className="text-emerald-400">
                    {formDdtCliente.righeSelezionate.filter((r) => r.selezionato).length}
                  </strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModaleDdtClienteAperta(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Conferma ed Emetti DDT Cliente</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE ANTEPRIMA STAMPA DDT CLIENTE */}
      {ddtClientePerStampa && (
        <SchedaDDTStampabile
          ddt={ddtClientePerStampa}
          tipo="cliente"
          onChiudi={() => setDdtClientePerStampa(null)}
        />
      )}

      {/* MODALE ANTEPRIMA STAMPA DDT TERZISTA */}
      {ddtSelezionatoPerStampa && (
        <SchedaDDTStampabile
          ddt={ddtSelezionatoPerStampa}
          tipo="terzista"
          onChiudi={() => setDdtSelezionatoPerStampa(null)}
        />
      )}
    </div>
  )
}
