'use client'

import { useState, useEffect } from 'react'
import {
  Cpu,
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  Building2,
  AlertCircle,
  Sparkles,
  Search,
  RotateCcw
} from 'lucide-react'
import { CentroLavoro, TipoProcesso } from '@/types/database'
import { SEED_CENTRI_LAVORO, SEED_TIPI_PROCESSO, SEED_ARTICOLI, SEED_DISTINTA_BASE, SEED_FASI_CICLO, SEED_CLIENTI, SEED_ORDINI_CLIENTI } from '@/lib/data-service'

export default function ProcessiMacchinePage() {
  const [tabAttivo, setTabAttivo] = useState<'macchine' | 'processi'>('macchine')
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [tipiProcesso, setTipiProcesso] = useState<TipoProcesso[]>([])
  const [termineRicerca, setTermineRicerca] = useState('')

  // Modale Macchina
  const [modaleMacchinaAperta, setModaleMacchinaAperta] = useState(false)
  const [modificaMacchinaId, setModificaMacchinaId] = useState<string | null>(null)
  const [formMacchina, setFormMacchina] = useState({
    codice: '',
    nome: '',
    reparto: 'Officina',
    capacita_giornaliera_ore: 8,
    costo_orario: 50,
    attivo: true
  })

  // Modale Processo
  const [modaleProcessoAperta, setModaleProcessoAperta] = useState(false)
  const [modificaProcessoId, setModificaProcessoId] = useState<string | null>(null)
  const [formProcesso, setFormProcesso] = useState({
    codice: '',
    nome: '',
    descrizione: '',
    centro_lavoro_predefinito_id: '',
    colore_badge: '#3b82f6',
    attivo: true
  })

  // Funzione di Azzeramento e Caricamento Parco Macchine Reale + Articoli Lucca + Distinte BOM + Cicli di Lavorazione + Clienti & Ordini
  const handleResetTotaleDatabase = () => {
    if (confirm('Vuoi inizializzare il sistema con il nuovo parco macchine reale (10 Centri/Postazioni, 6 Processi), i 30 particolari finiti, tutte le distinte base (BOM), i cicli di lavorazione (fase 10 CAD/CAM) e gli ordini clienti per i prossimi 6 mesi?')) {
      localStorage.setItem('machinaflow_centri_lavoro', JSON.stringify(SEED_CENTRI_LAVORO))
      localStorage.setItem('machinaflow_tipi_processo', JSON.stringify(SEED_TIPI_PROCESSO))
      localStorage.setItem('machinaflow_articoli', JSON.stringify(SEED_ARTICOLI))
      localStorage.setItem('machinaflow_distinte', JSON.stringify(SEED_DISTINTA_BASE))
      localStorage.setItem('machinaflow_fasi_ciclo', JSON.stringify(SEED_FASI_CICLO))
      localStorage.setItem('machinaflow_clienti', JSON.stringify(SEED_CLIENTI))
      localStorage.setItem('machinaflow_ordini_clienti', JSON.stringify(SEED_ORDINI_CLIENTI))
      localStorage.removeItem('machinaflow_odp')
      localStorage.removeItem('machinaflow_postazione_corrente_id')

      setCentriLavoro(SEED_CENTRI_LAVORO)
      setTipiProcesso(SEED_TIPI_PROCESSO)
      alert('Parco macchine, processi, 58 articoli, distinte BOM, cicli e 10 ordini clienti (6 mesi) caricati con successo!')
      window.location.reload()
    }
  }

  // Caricamento dati iniziale (con persistenza locale in localStorage)
  useEffect(() => {
    const salvatiMacchine = localStorage.getItem('machinaflow_centri_lavoro')
    const salvatiProcessi = localStorage.getItem('machinaflow_tipi_processo')

    if (salvatiMacchine) {
      try {
        setCentriLavoro(JSON.parse(salvatiMacchine))
      } catch {
        setCentriLavoro(SEED_CENTRI_LAVORO)
      }
    } else {
      setCentriLavoro(SEED_CENTRI_LAVORO)
      localStorage.setItem('machinaflow_centri_lavoro', JSON.stringify(SEED_CENTRI_LAVORO))
    }

    if (salvatiProcessi) {
      try {
        setTipiProcesso(JSON.parse(salvatiProcessi))
      } catch {
        setTipiProcesso(SEED_TIPI_PROCESSO)
      }
    } else {
      setTipiProcesso(SEED_TIPI_PROCESSO)
      localStorage.setItem('machinaflow_tipi_processo', JSON.stringify(SEED_TIPI_PROCESSO))
    }
  }, [])

  // Salvataggio Macchina
  const handleSalvaMacchina = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMacchina.codice.trim() || !formMacchina.nome.trim()) return

    let aggiornati: CentroLavoro[]
    if (modificaMacchinaId) {
      aggiornati = centriLavoro.map((m) =>
        m.id === modificaMacchinaId
          ? {
              ...m,
              codice: formMacchina.codice.toUpperCase(),
              nome: formMacchina.nome,
              reparto: formMacchina.reparto,
              capacita_giornaliera_ore: Number(formMacchina.capacita_giornaliera_ore),
              costo_orario: Number(formMacchina.costo_orario),
              attivo: formMacchina.attivo
            }
          : m
      )
    } else {
      const nuovaMacchina: CentroLavoro = {
        id: 'c_' + Date.now(),
        codice: formMacchina.codice.toUpperCase(),
        nome: formMacchina.nome,
        reparto: formMacchina.reparto,
        capacita_giornaliera_ore: Number(formMacchina.capacita_giornaliera_ore),
        costo_orario: Number(formMacchina.costo_orario),
        attivo: formMacchina.attivo,
        creato_il: new Date().toISOString()
      }
      aggiornati = [nuovaMacchina, ...centriLavoro]
    }

    setCentriLavoro(aggiornati)
    localStorage.setItem('machinaflow_centri_lavoro', JSON.stringify(aggiornati))
    chiudiModaleMacchina()
  }

  const apriModificaMacchina = (m: CentroLavoro) => {
    setModificaMacchinaId(m.id)
    setFormMacchina({
      codice: m.codice,
      nome: m.nome,
      reparto: m.reparto,
      capacita_giornaliera_ore: m.capacita_giornaliera_ore,
      costo_orario: m.costo_orario,
      attivo: m.attivo
    })
    setModaleMacchinaAperta(true)
  }

  const chiudiModaleMacchina = () => {
    setModaleMacchinaAperta(false)
    setModificaMacchinaId(null)
    setFormMacchina({
      codice: '',
      nome: '',
      reparto: 'Officina',
      capacita_giornaliera_ore: 8,
      costo_orario: 50,
      attivo: true
    })
  }

  // Salvataggio Processo
  const handleSalvaProcesso = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formProcesso.codice.trim() || !formProcesso.nome.trim()) return

    let aggiornati: TipoProcesso[]
    if (modificaProcessoId) {
      aggiornati = tipiProcesso.map((p) =>
        p.id === modificaProcessoId
          ? {
              ...p,
              codice: formProcesso.codice.toUpperCase(),
              nome: formProcesso.nome,
              descrizione: formProcesso.descrizione,
              centro_lavoro_predefinito_id: formProcesso.centro_lavoro_predefinito_id || undefined,
              colore_badge: formProcesso.colore_badge,
              attivo: formProcesso.attivo
            }
          : p
      )
    } else {
      const nuovoProcesso: TipoProcesso = {
        id: 'p_' + Date.now(),
        codice: formProcesso.codice.toUpperCase(),
        nome: formProcesso.nome,
        descrizione: formProcesso.descrizione,
        centro_lavoro_predefinito_id: formProcesso.centro_lavoro_predefinito_id || undefined,
        colore_badge: formProcesso.colore_badge,
        attivo: formProcesso.attivo,
        creato_il: new Date().toISOString()
      }
      aggiornati = [nuovoProcesso, ...tipiProcesso]
    }

    setTipiProcesso(aggiornati)
    localStorage.setItem('machinaflow_tipi_processo', JSON.stringify(aggiornati))
    chiudiModaleProcesso()
  }

  const apriModificaProcesso = (p: TipoProcesso) => {
    setModificaProcessoId(p.id)
    setFormProcesso({
      codice: p.codice,
      nome: p.nome,
      descrizione: p.descrizione || '',
      centro_lavoro_predefinito_id: p.centro_lavoro_predefinito_id || '',
      colore_badge: p.colore_badge || '#3b82f6',
      attivo: p.attivo
    })
    setModaleProcessoAperta(true)
  }

  const chiudiModaleProcesso = () => {
    setModaleProcessoAperta(false)
    setModificaProcessoId(null)
    setFormProcesso({
      codice: '',
      nome: '',
      descrizione: '',
      centro_lavoro_predefinito_id: '',
      colore_badge: '#3b82f6',
      attivo: true
    })
  }

  const toggleStatoMacchina = (id: string) => {
    const aggiornati = centriLavoro.map((m) =>
      m.id === id ? { ...m, attivo: !m.attivo } : m
    )
    setCentriLavoro(aggiornati)
    localStorage.setItem('machinaflow_centri_lavoro', JSON.stringify(aggiornati))
  }

  const toggleStatoProcesso = (id: string) => {
    const aggiornati = tipiProcesso.map((p) =>
      p.id === id ? { ...p, attivo: !p.attivo } : p
    )
    setTipiProcesso(aggiornati)
    localStorage.setItem('machinaflow_tipi_processo', JSON.stringify(aggiornati))
  }

  // Filtro
  const macchineFiltrate = centriLavoro.filter(
    (m) =>
      m.nome.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      m.codice.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      m.reparto.toLowerCase().includes(termineRicerca.toLowerCase())
  )

  const processiFiltrati = tipiProcesso.filter(
    (p) =>
      p.nome.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      p.codice.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      (p.descrizione && p.descrizione.toLowerCase().includes(termineRicerca.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-orange-500" />
            Configurazione Macchine & Processi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Definisci le risorse produttive (centri di lavoro CNC, banchi manuali) e il catalogo delle operazioni industriali.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetTotaleDatabase}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-xs font-bold transition-all cursor-pointer"
            title="Svuota tutti i dati fittizi per iniziare una simulazione da zero"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Azzera Dati Demo</span>
          </button>

          {tabAttivo === 'macchine' ? (
            <button
              onClick={() => {
                chiudiModaleMacchina()
                setModaleMacchinaAperta(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuova Macchina / Risorsa
            </button>
          ) : (
            <button
              onClick={() => {
                chiudiModaleProcesso()
                setModaleProcessoAperta(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuovo Tipo di Processo
            </button>
          )}
        </div>
      </div>

      {/* Barra Tabs & Ricerca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabAttivo('macchine')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              tabAttivo === 'macchine'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Centri di Lavoro & Macchine ({centriLavoro.length})
          </button>
          <button
            onClick={() => setTabAttivo('processi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              tabAttivo === 'processi'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tipi di Processo / Fasi ({tipiProcesso.length})
          </button>
        </div>

        {/* Input Ricerca */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={termineRicerca}
            onChange={(e) => setTermineRicerca(e.target.value)}
            placeholder="Cerca per codice o nome..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* CONTENUTO TAB 1: MACCHINE */}
      {tabAttivo === 'macchine' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {macchineFiltrate.map((macchina) => (
            <div
              key={macchina.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                macchina.attivo
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/20">
                      {macchina.codice}
                    </span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {macchina.reparto}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleStatoMacchina(macchina.id)}
                    title={macchina.attivo ? 'Disattiva risorsa' : 'Attiva risorsa'}
                    className={`cursor-pointer ${
                      macchina.attivo ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {macchina.attivo ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </button>
                </div>

                <h3 className="font-bold text-base text-white mt-3 leading-snug">{macchina.nome}</h3>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Capacità Giornaliera:
                  </span>
                  <span className="font-semibold text-slate-200">{macchina.capacita_giornaliera_ore} ore/giorno</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Euro className="w-3.5 h-3.5 text-slate-500" />
                    Costo Orario Standard:
                  </span>
                  <span className="font-semibold text-slate-200">€ {macchina.costo_orario.toFixed(2)}/h</span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => apriModificaMacchina(macchina)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-orange-400" />
                    Modifica
                  </button>
                </div>
              </div>
            </div>
          ))}

          {macchineFiltrate.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">Nessun centro di lavoro o macchina trovato</p>
              <p className="text-xs text-slate-500 mt-1">
                Prova a modificare il termine di ricerca o inserisci una nuova risorsa.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTENUTO TAB 2: PROCESSI */}
      {tabAttivo === 'processi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processiFiltrati.map((processo) => {
            const centroPredefinito = centriLavoro.find(
              (c) => c.id === processo.centro_lavoro_predefinito_id
            )

            return (
              <div
                key={processo.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  processo.attivo
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md text-white font-mono shadow-xs"
                      style={{ backgroundColor: processo.colore_badge || '#3b82f6' }}
                    >
                      {processo.codice}
                    </span>

                    <button
                      onClick={() => toggleStatoProcesso(processo.id)}
                      title={processo.attivo ? 'Disattiva processo' : 'Attiva processo'}
                      className={`cursor-pointer ${
                        processo.attivo
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {processo.attivo ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mt-3">{processo.nome}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {processo.descrizione || 'Nessuna descrizione specificata.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" />
                      Macchina Predefinita:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {centroPredefinito ? centroPredefinito.nome : 'Non specificata'}
                    </span>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => apriModificaProcesso(processo)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-orange-400" />
                      Modifica
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {processiFiltrati.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">Nessun tipo di processo trovato</p>
              <p className="text-xs text-slate-500 mt-1">
                Aggiungi una nuova operazione (es: Taglio, Fresatura, Sbavatura).
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODALE INSERISCI / MODIFICA MACCHINA */}
      {modaleMacchinaAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                {modificaMacchinaId ? 'Modifica Centro di Lavoro / Macchina' : 'Nuovo Centro di Lavoro / Macchina'}
              </h2>
              <button
                onClick={chiudiModaleMacchina}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaMacchina} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Codice Univoco *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es: MC-05"
                    value={formMacchina.codice}
                    onChange={(e) => setFormMacchina({ ...formMacchina, codice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reparto Operativo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es: Fresatura, Taglio"
                    value={formMacchina.reparto}
                    onChange={(e) => setFormMacchina({ ...formMacchina, reparto: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo Macchina o Centro di Lavoro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Centro di Lavoro 5 Assi Mazak Variaxis"
                  value={formMacchina.nome}
                  onChange={(e) => setFormMacchina({ ...formMacchina, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capacità Giornaliera (Ore/Giorno)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    required
                    value={formMacchina.capacita_giornaliera_ore}
                    onChange={(e) =>
                      setFormMacchina({ ...formMacchina, capacita_giornaliera_ore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Costo Orario Standard (€/h)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formMacchina.costo_orario}
                    onChange={(e) =>
                      setFormMacchina({ ...formMacchina, costo_orario: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="macchina_attiva"
                  checked={formMacchina.attivo}
                  onChange={(e) => setFormMacchina({ ...formMacchina, attivo: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="macchina_attiva" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Macchina Attiva e Disponibile alla Pianificazione
                </label>
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={chiudiModaleMacchina}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  {modificaMacchinaId ? 'Salva Modifiche' : 'Registra Macchina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE INSERISCI / MODIFICA PROCESSO */}
      {modaleProcessoAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                {modificaProcessoId ? 'Modifica Tipo Processo' : 'Nuovo Tipo di Processo / Lavorazione'}
              </h2>
              <button
                onClick={chiudiModaleProcesso}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaProcesso} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Codice Operazione *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es: PROC-PIEGATURA"
                    value={formProcesso.codice}
                    onChange={(e) => setFormProcesso({ ...formProcesso, codice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Colore Badge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formProcesso.colore_badge}
                      onChange={(e) => setFormProcesso({ ...formProcesso, colore_badge: e.target.value })}
                      className="w-10 h-9 p-0.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{formProcesso.colore_badge}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Operazione / Fase *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Piegatura Lamiera CNC"
                  value={formProcesso.nome}
                  onChange={(e) => setFormProcesso({ ...formProcesso, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Macchina o Centro di Lavoro Predefinito
                </label>
                <select
                  value={formProcesso.centro_lavoro_predefinito_id}
                  onChange={(e) =>
                    setFormProcesso({ ...formProcesso, centro_lavoro_predefinito_id: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Nessuna (selezionabile liberamente in distinta) --</option>
                  {centriLavoro.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codice} - {c.nome} ({c.reparto})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrizione o Istruzioni Standard
                </label>
                <textarea
                  rows={3}
                  placeholder="Dettagli sulle prescrizioni operative della lavorazione..."
                  value={formProcesso.descrizione}
                  onChange={(e) => setFormProcesso({ ...formProcesso, descrizione: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="processo_attivo"
                  checked={formProcesso.attivo}
                  onChange={(e) => setFormProcesso({ ...formProcesso, attivo: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="processo_attivo" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Processo Attivo e Utilizzabile nei Cicli di Lavorazione
                </label>
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={chiudiModaleProcesso}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  {modificaProcessoId ? 'Salva Modifiche' : 'Crea Processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
