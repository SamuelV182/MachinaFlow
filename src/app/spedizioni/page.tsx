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
  Sparkles
} from 'lucide-react'
import { DocumentoTrasportoEsterno, FornitoreTerzista } from '@/types/database'
import { SEED_FORNITORI_TERZISTI } from '@/lib/data-service'
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
  const [tabAttivo, setTabAttivo] = useState<'ddt' | 'terzisti'>('ddt')

  // Stato DDT
  const [listaDdt, setListaDdt] = useState<DocumentoTrasportoEsterno[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'spedito' | 'rientrato_totale'>('tutti')
  const [ddtSelezionatoPerStampa, setDdtSelezionatoPerStampa] = useState<DocumentoTrasportoEsterno | null>(null)
  const [notifica, setNotifica] = useState<string | null>(null)

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
      // 1. DDT Esterni
      const salvatiDdt = localStorage.getItem('machinaflow_ddt_esterni')
      if (salvatiDdt) {
        const parsed = JSON.parse(salvatiDdt)
        const mappa = new Map<string, DocumentoTrasportoEsterno>()
        SEED_DDT_ESTERNI.forEach((d) => mappa.set(d.id, d))
        parsed.forEach((d: DocumentoTrasportoEsterno) => mappa.set(d.id, d))
        setListaDdt(Array.from(mappa.values()))
      } else {
        setListaDdt(SEED_DDT_ESTERNI)
        localStorage.setItem('machinaflow_ddt_esterni', JSON.stringify(SEED_DDT_ESTERNI))
      }

      // 2. Anagrafica Fornitori Terzisti
      const salvatiTerzisti = localStorage.getItem('machinaflow_fornitori_terzisti')
      if (salvatiTerzisti) {
        const parsedT = JSON.parse(salvatiTerzisti)
        const mappaT = new Map<string, FornitoreTerzista>()
        SEED_FORNITORI_TERZISTI.forEach((t) => mappaT.set(t.id, t))
        parsedT.forEach((t: FornitoreTerzista) => mappaT.set(t.id, t))
        setTerzisti(Array.from(mappaT.values()))
      } else {
        setTerzisti(SEED_FORNITORI_TERZISTI)
        localStorage.setItem('machinaflow_fornitori_terzisti', JSON.stringify(SEED_FORNITORI_TERZISTI))
      }
    } catch {
      setListaDdt(SEED_DDT_ESTERNI)
      setTerzisti(SEED_FORNITORI_TERZISTI)
    }
  }, [])

  // Gestione Salvataggio Nuovo o Modificato Terzista
  const handleSalvaTerzista = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTerzista.ragione_sociale.trim()) return

    let aggiornati: FornitoreTerzista[]
    if (terzistaInModifica) {
      aggiornati = terzisti.map((t) =>
        t.id === terzistaInModifica.id
          ? { ...t, ...formTerzista, ragione_sociale: formTerzista.ragione_sociale.trim() }
          : t
      )
      setNotifica(`✓ Fornitore "${formTerzista.ragione_sociale}" aggiornato con successo!`)
    } else {
      const nuovo: FornitoreTerzista = {
        id: `forn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...formTerzista,
        ragione_sociale: formTerzista.ragione_sociale.trim()
      }
      aggiornati = [nuovo, ...terzisti]
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

  // Esportazione Massiva CSV / Excel compatibile con tutti i gestionali contabili
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
            <Truck className="w-8 h-8 text-pink-500" />
            Spedizioni & DDT Conto Terzi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestisci i Documenti di Trasporto verso terzisti (zincatura, verniciatura, trattamenti termici), ristampa i moduli A4 ed esporta i dati per il gestionale contabile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEsportaTuttiCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
            title="Esporta tutte le righe visibili in formato CSV/Excel per il software contabile"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Esporta per Gestionale (CSV/Excel)</span>
          </button>

          <Link
            href="/officina"
            className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>Terminale Officina EXT</span>
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

      {/* Barra di Navigazione Tab */}
      <div className="no-print flex items-center gap-2 border-b border-slate-800 pb-2">
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
          <span>DDT & Spedizioni Fuori Sede ({listaDdt.length})</span>
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

      {tabAttivo === 'ddt' ? (
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
                          <div className="space-y-1">
                            {doc.righe.map((r, i) => (
                              <div key={r.id || i} className="text-xs">
                                <span className="font-mono font-bold text-orange-400 mr-1.5">{r.codice_odp}</span>
                                <span className="text-slate-200 font-semibold">{r.articolo_codice}</span>
                                <span className="text-slate-400 text-[11px]"> ({r.quantita_spedita} {r.unita_misura})</span>
                                <span className="block text-[10px] text-pink-300/80 font-mono italic">
                                  &bull; {r.nome_fase}
                                </span>
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
      ) : (
        /* =========================================================================
           TAB 2: ANAGRAFICA FORNITORI TERZISTI & PARTNER ESTERNI
           ========================================================================= */
        <div className="space-y-4">
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

      {/* MODALE ANTEPRIMA STAMPA DDT */}
      {ddtSelezionatoPerStampa && (
        <SchedaDDTStampabile
          ddt={ddtSelezionatoPerStampa}
          onChiudi={() => setDdtSelezionatoPerStampa(null)}
        />
      )}
    </div>
  )
}
