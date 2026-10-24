'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Package,
  Layers,
  Clock,
  ArrowRight,
  Pencil,
  Trash2,
  CheckCircle,
  TrendingDown,
  LayoutGrid,
  List
} from 'lucide-react'
import { Articolo, TipoArticolo, ComponenteDistintaBase, FaseCicloStandard } from '@/types/database'
import { SEED_ARTICOLI, SEED_DISTINTA_BASE, SEED_FASI_CICLO } from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

export default function ArticoliPage() {
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [distinte, setDistinte] = useState<ComponenteDistintaBase[]>([])
  const [cicli, setCicli] = useState<FaseCicloStandard[]>([])
  
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti')
  const [modalitaVista, setModalitaVista] = useState<'cards' | 'tabella'>('cards')
  const [termineRicerca, setTermineRicerca] = useState('')

  // Modale Nuovo Articolo
  const [modaleAperta, setModaleAperta] = useState(false)
  const [modificaId, setModificaId] = useState<string | null>(null)
  const [formArticolo, setFormArticolo] = useState({
    codice_articolo: '',
    descrizione: '',
    tipo: 'prodotto_finito' as TipoArticolo,
    unita_misura: 'pz',
    giacenza_attuale: 0,
    scorta_minima: 0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 0
  })

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

    setArticoli(parseSicuro('machinaflow_articoli', SEED_ARTICOLI))
    setDistinte(parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE))
    setCicli(parseSicuro('machinaflow_cicli', SEED_FASI_CICLO))
  }, [])

  const handleSalvaArticolo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formArticolo.codice_articolo.trim() || !formArticolo.descrizione.trim()) return

    let aggiornati: Articolo[]
    if (modificaId) {
      aggiornati = articoli.map((a) =>
        a.id === modificaId
          ? {
              ...a,
              codice_articolo: formArticolo.codice_articolo.toUpperCase().trim(),
              descrizione: formArticolo.descrizione.trim(),
              tipo: formArticolo.tipo,
              unita_misura: formArticolo.unita_misura,
              giacenza_attuale: Number(formArticolo.giacenza_attuale),
              scorta_minima: Number(formArticolo.scorta_minima),
              lead_time_giorni_fornitore: formArticolo.tipo !== 'prodotto_finito' ? Number(formArticolo.lead_time_giorni_fornitore) : undefined,
              prezzo_riferimento: Number(formArticolo.prezzo_riferimento)
            }
          : a
      )
    } else {
      const nuovo: Articolo = {
        id: 'art-' + Date.now(),
        codice_articolo: formArticolo.codice_articolo.toUpperCase().trim(),
        descrizione: formArticolo.descrizione.trim(),
        tipo: formArticolo.tipo,
        unita_misura: formArticolo.unita_misura,
        giacenza_attuale: Number(formArticolo.giacenza_attuale),
        scorta_minima: Number(formArticolo.scorta_minima),
        lead_time_giorni_fornitore: formArticolo.tipo !== 'prodotto_finito' ? Number(formArticolo.lead_time_giorni_fornitore) : undefined,
        prezzo_riferimento: Number(formArticolo.prezzo_riferimento),
        creato_il: new Date().toISOString()
      }
      aggiornati = [nuovo, ...articoli]
    }

    setArticoli(aggiornati)
    localStorage.setItem('machinaflow_articoli', JSON.stringify(aggiornati))

    // Sincronizza su Supabase Cloud
    const salvato = aggiornati.find((a) => a.id === (modificaId || aggiornati[0].id))
    if (salvato) {
      syncService.salvaArticolo(salvato)
    }

    chiudiModale()
  }

  const apriModifica = (a: Articolo) => {
    setModificaId(a.id)
    setFormArticolo({
      codice_articolo: a.codice_articolo,
      descrizione: a.descrizione,
      tipo: a.tipo,
      unita_misura: a.unita_misura,
      giacenza_attuale: a.giacenza_attuale,
      scorta_minima: a.scorta_minima,
      lead_time_giorni_fornitore: a.lead_time_giorni_fornitore !== undefined ? a.lead_time_giorni_fornitore : 3,
      prezzo_riferimento: a.prezzo_riferimento || 0
    })
    setModaleAperta(true)
  }

  const chiudiModale = () => {
    setModaleAperta(false)
    setModificaId(null)
    setFormArticolo({
      codice_articolo: '',
      descrizione: '',
      tipo: 'prodotto_finito',
      unita_misura: 'pz',
      giacenza_attuale: 0,
      scorta_minima: 0,
      lead_time_giorni_fornitore: 3,
      prezzo_riferimento: 0
    })
  }

  // Filtro
  const articoliFiltrati = articoli.filter((a) => {
    const combaciaTipo = filtroTipo === 'tutti' || a.tipo === filtroTipo
    const combaciaTesto =
      a.codice_articolo.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      a.descrizione.toLowerCase().includes(termineRicerca.toLowerCase())
    return combaciaTipo && combaciaTesto
  })

  const getTipoEtichetta = (tipo: TipoArticolo) => {
    switch (tipo) {
      case 'prodotto_finito':
        return { label: 'Prodotto Finito', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' }
      case 'semilavorato':
        return { label: 'Semilavorato', color: 'bg-blue-950 text-blue-300 border-blue-800' }
      case 'materia_prima':
        return { label: 'Materia Prima / Componente', color: 'bg-amber-950 text-amber-300 border-amber-800' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Pagina */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Boxes className="w-8 h-8 text-orange-500" />
            Anagrafica Articoli, Distinta Base (BOM) & Cicli
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestisci codici prodotto, materie prime, distinta dei componenti e sequenze operative di lavorazione.
          </p>
        </div>

        <button
          onClick={() => {
            chiudiModale()
            setModaleAperta(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuovo Articolo
        </button>
      </div>

      {/* Barra Filtri, Switch Vista e Ricerca */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'tutti', label: 'Tutti gli Articoli' },
            { id: 'prodotto_finito', label: 'Prodotti Finiti' },
            { id: 'semilavorato', label: 'Semilavorati' },
            { id: 'materia_prima', label: 'Materie Prime / Componenti' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filtroTipo === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Switch Vista Schede / Tabella */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setModalitaVista('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modalitaVista === 'cards'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schede</span>
            </button>
            <button
              type="button"
              onClick={() => setModalitaVista('tabella')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modalitaVista === 'tabella'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termineRicerca}
              onChange={(e) => setTermineRicerca(e.target.value)}
              placeholder="Cerca codice o descrizione..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* VISTA A SCHEDE (CARDS) */}
      {modalitaVista === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articoliFiltrati.map((art) => {
            const tipoInfo = getTipoEtichetta(art.tipo)
            const numComponentiBOM = distinte.filter((d) => d.articolo_padre_id === art.id).length
            const numFasiCiclo = cicli.filter((c) => c.articolo_id === art.id).length
            const isSottoScorta = art.giacenza_attuale < art.scorta_minima

            return (
              <div
                key={art.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSottoScorta
                    ? 'bg-slate-900/90 border-rose-900/60 hover:border-rose-700/80'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/20">
                      {art.codice_articolo}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tipoInfo.color}`}>
                      {tipoInfo.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-white mt-3 leading-snug">
                    {art.descrizione}
                  </h3>

                  {/* Badge Sotto Scorta Alert */}
                  {isSottoScorta && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Sotto Scorta Minima! Richiede riordino.</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  {/* Giacenza vs Scorta */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Giacenza Magazzino:</span>
                    <span className={`font-semibold ${isSottoScorta ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                      {art.giacenza_attuale} {art.unita_misura} (min. {art.scorta_minima})
                    </span>
                  </div>

                  {/* Prezzo Riferimento */}
                  {art.prezzo_riferimento ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Prezzo Riferimento:</span>
                      <span className="font-semibold text-slate-200">€ {art.prezzo_riferimento.toFixed(2)}</span>
                    </div>
                  ) : null}

                  {/* Dettagli Distinta & Ciclo per Prodotti Finiti o Semilavorati */}
                  {art.tipo !== 'materia_prima' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-center">
                        <div className="text-[10px] text-slate-400">Distinta (BOM)</div>
                        <div className="text-xs font-bold text-orange-400 flex items-center justify-center gap-1 mt-0.5">
                          <Layers className="w-3.5 h-3.5" />
                          {numComponentiBOM} {numComponentiBOM === 1 ? 'componente' : 'componenti'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-center">
                        <div className="text-[10px] text-slate-400">Ciclo Lavorazione</div>
                        <div className="text-xs font-bold text-blue-400 flex items-center justify-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {numFasiCiclo} {numFasiCiclo === 1 ? 'fase' : 'fasi'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Azioni */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => apriModifica(art)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-orange-400" />
                      Modifica
                    </button>

                    <Link
                      href={`/articoli/${art.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold border border-orange-500/30 transition-all group"
                    >
                      <span>Configura BOM & Ciclo</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {articoliFiltrati.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">Nessun articolo trovato</p>
              <p className="text-xs text-slate-500 mt-1">
                Prova a cambiare il filtro o inserisci un nuovo articolo da anagrafica.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VISTA A LISTA DETTAGLIATA (TABELLA COMPATTA) */}
      {modalitaVista === 'tabella' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Codice</th>
                  <th className="py-3.5 px-4">Descrizione Articolo</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tipo</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Lead Time</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Giacenza</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Scorta Min.</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Prezzo Rif.</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Distinta (BOM)</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Ciclo (Fasi)</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {articoliFiltrati.map((art) => {
                  const tipoInfo = getTipoEtichetta(art.tipo)
                  const numComponentiBOM = distinte.filter((d) => d.articolo_padre_id === art.id).length
                  const numFasiCiclo = cicli.filter((c) => c.articolo_id === art.id).length
                  const isSottoScorta = art.giacenza_attuale < art.scorta_minima

                  return (
                    <tr
                      key={art.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSottoScorta ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Codice Articolo */}
                      <td className="py-3 px-4 font-mono font-bold text-orange-400 whitespace-nowrap">
                        {art.codice_articolo}
                      </td>

                      {/* Descrizione */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">
                          {art.descrizione}
                        </span>
                        {isSottoScorta && (
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> Sotto scorta
                          </span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                      </td>

                      {/* Lead Time */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {art.tipo !== 'prodotto_finito' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {art.lead_time_giorni_fornitore !== undefined ? `${art.lead_time_giorni_fornitore} gg` : '3 gg'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Produzione interna</span>
                        )}
                      </td>

                      {/* Giacenza */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`font-bold ${isSottoScorta ? 'text-rose-400' : 'text-slate-100'}`}>
                          {art.giacenza_attuale} {art.unita_misura}
                        </span>
                      </td>

                      {/* Scorta Minima */}
                      <td className="py-3 px-4 text-center text-slate-400 whitespace-nowrap font-mono">
                        {art.scorta_minima} {art.unita_misura}
                      </td>

                      {/* Prezzo */}
                      <td className="py-3 px-4 text-right font-mono text-slate-200 whitespace-nowrap">
                        {art.prezzo_riferimento ? `€ ${art.prezzo_riferimento.toFixed(2)}` : '-'}
                      </td>

                      {/* Distinta BOM */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {art.tipo !== 'materia_prima' ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            numComponentiBOM > 0
                              ? 'bg-orange-950/60 text-orange-400 border border-orange-800/40'
                              : 'bg-slate-800/60 text-slate-500'
                          }`}>
                            <Layers className="w-3 h-3" />
                            {numComponentiBOM}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Ciclo Fasi */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {art.tipo !== 'materia_prima' ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            numFasiCiclo > 0
                              ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                              : 'bg-slate-800/60 text-slate-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {numFasiCiclo}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Azioni Identiche per tutti gli articoli */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => apriModifica(art)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
                            title="Modifica Anagrafica"
                          >
                            <Pencil className="w-3.5 h-3.5 text-orange-400" />
                          </button>

                          <Link
                            href={`/articoli/${art.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold border border-orange-500/30 transition-all shrink-0 whitespace-nowrap"
                            title="Configura BOM & Ciclo di Lavorazione"
                          >
                            <span>BOM & Cicli</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {articoliFiltrati.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Nessun articolo trovato con i filtri attuali.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE INSERISCI / MODIFICA ARTICOLO */}
      {modaleAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-orange-500" />
                {modificaId ? 'Modifica Articolo' : 'Nuovo Articolo in Anagrafica'}
              </h2>
              <button
                onClick={chiudiModale}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvaArticolo} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Codice Articolo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es: FLG-6082-B"
                    value={formArticolo.codice_articolo}
                    onChange={(e) => setFormArticolo({ ...formArticolo, codice_articolo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipologia Prodotto *
                  </label>
                  <select
                    value={formArticolo.tipo}
                    onChange={(e) => setFormArticolo({ ...formArticolo, tipo: e.target.value as TipoArticolo })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="prodotto_finito">Prodotto Finito (Vendibile)</option>
                    <option value="semilavorato">Semilavorato (Intermedio)</option>
                    <option value="materia_prima">Materia Prima / Componente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrizione Articolo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Flangia in alluminio diametro 60mm per braccio robot"
                  value={formArticolo.descrizione}
                  onChange={(e) => setFormArticolo({ ...formArticolo, descrizione: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unità di Misura
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pz, kg, m..."
                    value={formArticolo.unita_misura}
                    onChange={(e) => setFormArticolo({ ...formArticolo, unita_misura: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giacenza Attuale
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formArticolo.giacenza_attuale}
                    onChange={(e) => setFormArticolo({ ...formArticolo, giacenza_attuale: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scorta Minima
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formArticolo.scorta_minima}
                    onChange={(e) => setFormArticolo({ ...formArticolo, scorta_minima: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prezzo di Riferimento (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formArticolo.prezzo_riferimento}
                    onChange={(e) => setFormArticolo({ ...formArticolo, prezzo_riferimento: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {formArticolo.tipo !== 'prodotto_finito' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Lead Time Fornitore (gg lavorativi)</span>
                      <span className="text-[10px] text-orange-400 font-mono font-normal">Approvvigionamento JIT</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="es: 5"
                      value={formArticolo.lead_time_giorni_fornitore}
                      onChange={(e) => setFormArticolo({ ...formArticolo, lead_time_giorni_fornitore: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={chiudiModale}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  {modificaId ? 'Salva Modifiche' : 'Crea Articolo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
