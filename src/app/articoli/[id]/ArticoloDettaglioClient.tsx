'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Boxes,
  Layers,
  Clock,
  ArrowLeft,
  Plus,
  Trash2,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Search,
  X
} from 'lucide-react'
import {
  Articolo,
  ComponenteDistintaBase,
  FaseCicloStandard,
  CentroLavoro,
  TipoProcesso,
  TipoArticolo
} from '@/types/database'
import {
  SEED_ARTICOLI,
  SEED_DISTINTA_BASE,
  SEED_FASI_CICLO,
  SEED_CENTRI_LAVORO,
  SEED_TIPI_PROCESSO
} from '@/lib/data-service'

export function ArticoloDettaglioClient({ articoloId }: { articoloId: string }) {
  const [articolo, setArticolo] = useState<Articolo | null>(null)
  const [tuttiArticoli, setTuttiArticoli] = useState<Articolo[]>([])
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [tipiProcesso, setTipiProcesso] = useState<TipoProcesso[]>([])

  const [distinta, setDistinta] = useState<ComponenteDistintaBase[]>([])
  const [fasiCiclo, setFasiCiclo] = useState<FaseCicloStandard[]>([])

  // Stato Modale Aggiungi Componente BOM
  const [modaleBomAperta, setModaleBomAperta] = useState(false)
  const [creazioneRapidaAttiva, setCreazioneRapidaAttiva] = useState(false)
  const [filtroTestoComponente, setFiltroTestoComponente] = useState('')
  const [mostraDropdownRisultati, setMostraDropdownRisultati] = useState(false)
  const [formBom, setFormBom] = useState({
    articolo_componente_id: '',
    quantita_necessaria: '1',
    note: ''
  })

  // Stato per Nuovo Componente On-The-Fly
  const [formNuovoArticolo, setFormNuovoArticolo] = useState({
    codice_articolo: '',
    descrizione: '',
    tipo: 'materia_prima' as TipoArticolo,
    unita_misura: 'pz',
    giacenza_attuale: 0,
    scorta_minima: 0,
    prezzo_riferimento: 0
  })

  const [notificaSuccesso, setNotificaSuccesso] = useState<string | null>(null)

  // Stato Modale Aggiungi Fase Ciclo
  const [modaleCicloAperta, setModaleCicloAperta] = useState(false)
  const [filtroProcessoTesto, setFiltroProcessoTesto] = useState('')
  const [mostraDropdownProcessi, setMostraDropdownProcessi] = useState(false)
  const [filtroMacchinaTesto, setFiltroMacchinaTesto] = useState('')
  const [mostraDropdownMacchine, setMostraDropdownMacchine] = useState(false)

  const [formCiclo, setFormCiclo] = useState({
    sequenza: 10,
    nome_fase: '',
    tipo_processo_id: '',
    centro_lavoro_id: '',
    centri_lavoro_alternativi_ids: [] as string[],
    tempo_attrezzaggio_min: '15',
    tempo_ciclo_pezzo_min: '5',
    note_operative: ''
  })

  // Funzione con calcolo automatico sequenza (10 -> 20 -> 30...)
  const apriModaleNuovaFase = () => {
    const maxSeq = fasiCiclo.length > 0 ? Math.max(...fasiCiclo.map((f) => f.sequenza)) : 0
    const proxSeq = maxSeq > 0 ? maxSeq + 10 : 10

    setFormCiclo({
      sequenza: proxSeq,
      nome_fase: '',
      tipo_processo_id: '',
      centro_lavoro_id: '',
      centri_lavoro_alternativi_ids: [],
      tempo_attrezzaggio_min: '15',
      tempo_ciclo_pezzo_min: '5',
      note_operative: ''
    })
    setFiltroProcessoTesto('')
    setFiltroMacchinaTesto('')
    setModaleCicloAperta(true)
  }

  useEffect(() => {
    // Funzione helper sicura per il parsing da localStorage
    const parseSicuro = <T,>(chiave: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(chiave)
        if (!item || item === 'undefined' || item === 'null') return fallback
        return JSON.parse(item) as T
      } catch {
        return fallback
      }
    }

    // 1. Carica Articoli
    const articoliList = parseSicuro('machinaflow_articoli', SEED_ARTICOLI)
    setTuttiArticoli(articoliList)
    const trovato = articoliList.find((a) => a.id === articoloId)
    setArticolo(trovato || null)

    // 2. Carica Centri Lavoro & Processi
    setCentriLavoro(parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO))
    setTipiProcesso(parseSicuro('machinaflow_tipi_processo', SEED_TIPI_PROCESSO))

    // 3. Carica Distinte Base
    const distinteList = parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE)
    setDistinta(distinteList.filter((d) => d.articolo_padre_id === articoloId))

    // 4. Carica Fasi Ciclo
    const cicliList = parseSicuro('machinaflow_cicli', SEED_FASI_CICLO)
    const delQuesto = cicliList
      .filter((c) => c.articolo_id === articoloId)
      .sort((a, b) => a.sequenza - b.sequenza)
    setFasiCiclo(delQuesto)
  }, [articoloId])

  // Aggiungi Componente alla Distinta Base (con supporto creazione On-The-Fly)
  const handleAggiungiComponente = (e: React.FormEvent) => {
    e.preventDefault()

    // Conversione flessibile da virgola a punto decimale
    const qtaString = String(formBom.quantita_necessaria).replace(',', '.').trim()
    const qtaValida = parseFloat(qtaString)

    if (isNaN(qtaValida) || qtaValida <= 0) return

    let finalComponenteId = formBom.articolo_componente_id

    // Se l'utente sta creando un nuovo componente al volo
    if (creazioneRapidaAttiva) {
      if (!formNuovoArticolo.codice_articolo.trim() || !formNuovoArticolo.descrizione.trim()) return

      const nuovoArt: Articolo = {
        id: 'art-' + Date.now(),
        codice_articolo: formNuovoArticolo.codice_articolo.trim().toUpperCase(),
        descrizione: formNuovoArticolo.descrizione.trim(),
        tipo: formNuovoArticolo.tipo,
        unita_misura: formNuovoArticolo.unita_misura || 'pz',
        giacenza_attuale: Number(formNuovoArticolo.giacenza_attuale) || 0,
        scorta_minima: Number(formNuovoArticolo.scorta_minima) || 0,
        prezzo_riferimento: Number(formNuovoArticolo.prezzo_riferimento) || 0,
        creato_il: new Date().toISOString()
      }

      // Salva nell'anagrafica globale
      const tuttiAggiornati = [nuovoArt, ...tuttiArticoli]
      setTuttiArticoli(tuttiAggiornati)
      localStorage.setItem('machinaflow_articoli', JSON.stringify(tuttiAggiornati))

      finalComponenteId = nuovoArt.id
      setNotificaSuccesso(`Articolo ${nuovoArt.codice_articolo} registrato in anagrafica e aggiunto alla distinta!`)
      setTimeout(() => setNotificaSuccesso(null), 4000)
    }

    if (!finalComponenteId) return

    const nuovoComp: ComponenteDistintaBase = {
      id: 'bom-' + Date.now(),
      articolo_padre_id: articoloId,
      articolo_componente_id: finalComponenteId,
      quantita_necessaria: qtaValida,
      note: formBom.note
    }

    const aggiornata = [...distinta, nuovoComp]
    setDistinta(aggiornata)

    const salvateDistinte = localStorage.getItem('machinaflow_distinte')
    const distinteList: ComponenteDistintaBase[] = salvateDistinte ? JSON.parse(salvateDistinte) : SEED_DISTINTA_BASE
    const filtrateGlobali = distinteList.filter((d) => d.articolo_padre_id !== articoloId)
    localStorage.setItem('machinaflow_distinte', JSON.stringify([...filtrateGlobali, ...aggiornata]))

    setModaleBomAperta(false)
    setCreazioneRapidaAttiva(false)
    setFormBom({ articolo_componente_id: '', quantita_necessaria: '1', note: '' })
    setFormNuovoArticolo({
      codice_articolo: '',
      descrizione: '',
      tipo: 'materia_prima',
      unita_misura: 'pz',
      giacenza_attuale: 0,
      scorta_minima: 0,
      prezzo_riferimento: 0
    })
  }

  const handleRimuoviComponente = (id: string) => {
    const aggiornata = distinta.filter((d) => d.id !== id)
    setDistinta(aggiornata)

    const salvateDistinte = localStorage.getItem('machinaflow_distinte')
    const distinteList: ComponenteDistintaBase[] = salvateDistinte ? JSON.parse(salvateDistinte) : SEED_DISTINTA_BASE
    const filtrateGlobali = distinteList.filter((d) => d.id !== id)
    localStorage.setItem('machinaflow_distinte', JSON.stringify(filtrateGlobali))
  }

  // Aggiungi Fase al Ciclo di Lavorazione
  const handleAggiungiFase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCiclo.nome_fase.trim() || !formCiclo.centro_lavoro_id) return

    const setupMin = parseFloat(String(formCiclo.tempo_attrezzaggio_min).replace(',', '.').trim()) || 0
    const cicloPzMin = parseFloat(String(formCiclo.tempo_ciclo_pezzo_min).replace(',', '.').trim()) || 0

    const nuovaFase: FaseCicloStandard = {
      id: 'ciclo-' + Date.now(),
      articolo_id: articoloId,
      sequenza: Number(formCiclo.sequenza),
      nome_fase: formCiclo.nome_fase.trim(),
      tipo_processo_id: formCiclo.tipo_processo_id || undefined,
      centro_lavoro_id: formCiclo.centro_lavoro_id,
      centri_lavoro_alternativi_ids: formCiclo.centri_lavoro_alternativi_ids || [],
      tempo_attrezzaggio_min: setupMin,
      tempo_ciclo_pezzo_min: cicloPzMin,
      note_operative: formCiclo.note_operative
    }

    const aggiornato = [...fasiCiclo, nuovaFase].sort((a, b) => a.sequenza - b.sequenza)
    setFasiCiclo(aggiornato)

    const salvatiCicli = localStorage.getItem('machinaflow_cicli')
    const cicliList: FaseCicloStandard[] = salvatiCicli ? JSON.parse(salvatiCicli) : SEED_FASI_CICLO
    const filtratiGlobali = cicliList.filter((c) => c.articolo_id !== articoloId)
    localStorage.setItem('machinaflow_cicli', JSON.stringify([...filtratiGlobali, ...aggiornato]))

    setModaleCicloAperta(false)
    setFiltroProcessoTesto('')
    setFiltroMacchinaTesto('')
    const prossimaSeq = aggiornato.length > 0 ? aggiornato[aggiornato.length - 1].sequenza + 10 : 10
    setFormCiclo({
      sequenza: prossimaSeq,
      nome_fase: '',
      tipo_processo_id: '',
      centro_lavoro_id: '',
      centri_lavoro_alternativi_ids: [],
      tempo_attrezzaggio_min: '15',
      tempo_ciclo_pezzo_min: '5',
      note_operative: ''
    })
  }

  const handleRimuoviFase = (id: string) => {
    const aggiornato = fasiCiclo.filter((f) => f.id !== id)
    setFasiCiclo(aggiornato)

    const salvatiCicli = localStorage.getItem('machinaflow_cicli')
    const cicliList: FaseCicloStandard[] = salvatiCicli ? JSON.parse(salvatiCicli) : SEED_FASI_CICLO
    const filtratiGlobali = cicliList.filter((c) => c.id !== id)
    localStorage.setItem('machinaflow_cicli', JSON.stringify(filtratiGlobali))
  }

  // Calcolo tempo totale per un lotto indicativo da 10 pezzi
  const tempoTotale10PzMinuti = fasiCiclo.reduce(
    (acc, f) => acc + (f.tempo_attrezzaggio_min + f.tempo_ciclo_pezzo_min * 10),
    0
  )

  if (!articolo) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Articolo non trovato</h2>
        <Link
          href="/articoli"
          className="inline-flex items-center gap-2 mt-4 text-orange-400 hover:text-orange-300 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Torna all'elenco articoli
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Intestazione */}
      <div>
        <Link
          href="/articoli"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna all'Anagrafica Articoli
        </Link>

        {notificaSuccesso && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificaSuccesso}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950 px-2.5 py-0.5 rounded border border-orange-500/20">
                {articolo.codice_articolo}
              </span>
              <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded capitalize">
                {articolo.tipo.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-2">{articolo.descrizione}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Giacenza: <strong className="text-slate-200">{articolo.giacenza_attuale} {articolo.unita_misura}</strong> • Scorta minima: {articolo.scorta_minima} {articolo.unita_misura}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Tempo Ciclo Lotto 10 pz</span>
              <span className="text-lg font-bold text-orange-400">
                {(tempoTotale10PzMinuti / 60).toFixed(1)} ore ({tempoTotale10PzMinuti} min)
              </span>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* SEZIONE 1: DISTINTA BASE (BOM) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              Distinta Base (BOM - Bill of Materials)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Materie prime e componenti necessari per la fabbricazione di 1 singola unità di questo articolo.
            </p>
          </div>

          <button
            onClick={() => setModaleBomAperta(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Componente / Materia Prima
          </button>
        </div>

        {distinta.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Codice Componente</th>
                  <th className="p-3">Descrizione</th>
                  <th className="p-3">Q.tà Unitaria Richiesta</th>
                  <th className="p-3">Giacenza Disponibile</th>
                  <th className="p-3">Note Tecniche</th>
                  <th className="p-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {distinta.map((comp) => {
                  const articoloComp = tuttiArticoli.find((a) => a.id === comp.articolo_componente_id)
                  const sottoScorta = articoloComp ? articoloComp.giacenza_attuale < comp.quantita_necessaria : false

                  return (
                    <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-400">
                        {articoloComp ? articoloComp.codice_articolo : 'N/D'}
                      </td>
                      <td className="p-3 font-medium text-white">
                        {articoloComp ? articoloComp.descrizione : 'Componente non trovato'}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {comp.quantita_necessaria} {articoloComp ? articoloComp.unita_misura : ''}
                      </td>
                      <td className="p-3">
                        <span className={sottoScorta ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {articoloComp ? `${articoloComp.giacenza_attuale} ${articoloComp.unita_misura}` : '-'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 italic">
                        {comp.note || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRimuoviComponente(comp.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Rimuovi componente dalla distinta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold text-sm">Nessun componente in distinta base</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggiungi le materie prime necessarie al calcolo automatico del fabbisogno MRP.
            </p>
          </div>
        )}
      </div>

      {/* SEZIONE 2: CICLO DI LAVORAZIONE (ROUTING) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Ciclo di Lavorazione (Routing & Tempi)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sequenza ordinata delle operazioni di officina, macchine coinvolte e tempi di attrezzaggio/ciclo.
            </p>
          </div>

          <button
            onClick={apriModaleNuovaFase}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Fase di Lavorazione
          </button>
        </div>

        {fasiCiclo.length > 0 ? (
          <div className="space-y-3">
            {fasiCiclo.map((fase) => {
              const centro = centriLavoro.find((c) => c.id === fase.centro_lavoro_id)
              const processo = tipiProcesso.find((p) => p.id === fase.tipo_processo_id)

              return (
                <div
                  key={fase.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 font-bold flex items-center justify-center shrink-0">
                      {fase.sequenza}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{fase.nome_fase}</h3>
                        {processo && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: processo.colore_badge || '#3b82f6' }}
                          >
                            {processo.nome}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        Centro Principale: <strong className="text-slate-300">{centro ? centro.nome : 'N/D'}</strong>
                      </p>
                      {fase.centri_lavoro_alternativi_ids && fase.centri_lavoro_alternativi_ids.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                          <span className="text-blue-400 font-semibold">Macchine Alternative:</span>
                          {fase.centri_lavoro_alternativi_ids.map((altId) => {
                            const altC = centriLavoro.find((c) => c.id === altId)
                            return altC ? (
                              <span key={altId} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                {altC.codice} ({altC.nome})
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                      {fase.note_operative && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          "{fase.note_operative}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Tempo Attrezzaggio</div>
                      <div className="text-xs font-bold text-slate-200">{fase.tempo_attrezzaggio_min} min</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Tempo Pezzo</div>
                      <div className="text-xs font-bold text-orange-400">{fase.tempo_ciclo_pezzo_min} min/pz</div>
                    </div>

                    <button
                      onClick={() => handleRimuoviFase(fase.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Elimina fase dal ciclo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold text-sm">Nessuna fase definita per questo ciclo</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserisci le fasi operative (es. CAD/CAM, Taglio, Fresatura, Sbavatura) per calcolare i tempi e generare le schede di officina.
            </p>
          </div>
        )}
      </div>

      {/* MODALE AGGIUNGI COMPONENTE BOM */}
      {modaleBomAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Aggiungi Componente alla Distinta Base
              </h2>
              <button
                onClick={() => setModaleBomAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAggiungiComponente} className="p-5 space-y-4">
              {/* SWITCH: SELEZIONA ESISTENTE O CREA AL VOLO */}
              {!creazioneRapidaAttiva ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Cerca e Seleziona Componente o Materia Prima *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreazioneRapidaAttiva(true)}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Non esiste? Crea al volo
                    </button>
                  </div>

                  {/* SELETTORE INTELLIGENTE CON RICERCA FILTRATA */}
                  {formBom.articolo_componente_id ? (
                    // Componente già selezionato -> Badge con tasto Cambia
                    (() => {
                      const sel = tuttiArticoli.find((a) => a.id === formBom.articolo_componente_id)
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-orange-500/50 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-500/20">
                                {sel?.codice_articolo}
                              </span>
                              <span className="text-xs font-bold text-white">{sel?.descrizione}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Unità di Misura: <strong className="text-slate-200">{sel?.unita_misura}</strong> • Giacenza a magazzino: {sel?.giacenza_attuale} {sel?.unita_misura}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormBom({ ...formBom, articolo_componente_id: '' })
                              setFiltroTestoComponente('')
                              setMostraDropdownRisultati(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                            title="Cambia componente selezionato"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-[11px]">Cambia</span>
                          </button>
                        </div>
                      )
                    })()
                  ) : (
                    // Campo Input con Ricerca Istantanea e Dropdown Filtrato
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Digita per filtrare (es: 120, inox, barra, M6, 6082)..."
                          value={filtroTestoComponente}
                          onFocus={() => setMostraDropdownRisultati(true)}
                          onChange={(e) => {
                            setFiltroTestoComponente(e.target.value)
                            setMostraDropdownRisultati(true)
                          }}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Dropdown Lista Filtrata */}
                      {mostraDropdownRisultati && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl divide-y divide-slate-800">
                          {tuttiArticoli
                            .filter(
                              (a) =>
                                a.id !== articoloId &&
                                (a.codice_articolo.toLowerCase().includes(filtroTestoComponente.toLowerCase()) ||
                                  a.descrizione.toLowerCase().includes(filtroTestoComponente.toLowerCase()))
                            )
                            .map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  setFormBom({ ...formBom, articolo_componente_id: a.id })
                                  setMostraDropdownRisultati(false)
                                  setFiltroTestoComponente('')
                                }}
                                className="w-full text-left p-2.5 hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-orange-400 group-hover:underline">
                                      {a.codice_articolo}
                                    </span>
                                    <span className="text-xs font-semibold text-white">
                                      {a.descrizione}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 capitalize">
                                    {a.tipo.replace('_', ' ')} • Giacenza: {a.giacenza_attuale} {a.unita_misura}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/20">
                                  {a.unita_misura}
                                </span>
                              </button>
                            ))}

                          {tuttiArticoli.filter(
                            (a) =>
                              a.id !== articoloId &&
                              (a.codice_articolo.toLowerCase().includes(filtroTestoComponente.toLowerCase()) ||
                                a.descrizione.toLowerCase().includes(filtroTestoComponente.toLowerCase()))
                          ).length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">
                              Nessun materiale trovato per "{filtroTestoComponente}".
                              <button
                                type="button"
                                onClick={() => {
                                  setFormNuovoArticolo({
                                    ...formNuovoArticolo,
                                    descrizione: filtroTestoComponente
                                  })
                                  setCreazioneRapidaAttiva(true)
                                  setMostraDropdownRisultati(false)
                                }}
                                className="block mx-auto mt-2 text-xs font-bold text-orange-400 underline cursor-pointer"
                              >
                                + Crealo subito con questo nome
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* FORM COMPATTO CREAZIONE ON-THE-FLY */
                <div className="p-4 rounded-xl bg-slate-950 border border-orange-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Nuovo Materiale da Registrare in Anagrafica
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreazioneRapidaAttiva(false)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Torna alla lista esistenti
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Codice Articolo *
                      </label>
                      <input
                        type="text"
                        required={creazioneRapidaAttiva}
                        placeholder="es: BAR-INOX-40"
                        value={formNuovoArticolo.codice_articolo}
                        onChange={(e) =>
                          setFormNuovoArticolo({ ...formNuovoArticolo, codice_articolo: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Tipologia
                      </label>
                      <select
                        value={formNuovoArticolo.tipo}
                        onChange={(e) =>
                          setFormNuovoArticolo({
                            ...formNuovoArticolo,
                            tipo: e.target.value as 'materia_prima' | 'semilavorato'
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                      >
                        <option value="materia_prima">Materia Prima / Componente</option>
                        <option value="semilavorato">Semilavorato</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Descrizione Materiale *
                    </label>
                    <input
                      type="text"
                      required={creazioneRapidaAttiva}
                      placeholder="es: Barra Tonda Inox AISI 316 Diametro 40mm"
                      value={formNuovoArticolo.descrizione}
                      onChange={(e) =>
                        setFormNuovoArticolo({ ...formNuovoArticolo, descrizione: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Unità Misura
                      </label>
                      <input
                        type="text"
                        required={creazioneRapidaAttiva}
                        placeholder="pz, kg, m..."
                        value={formNuovoArticolo.unita_misura}
                        onChange={(e) =>
                          setFormNuovoArticolo({ ...formNuovoArticolo, unita_misura: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Giacenza Mag.
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formNuovoArticolo.giacenza_attuale}
                        onChange={(e) =>
                          setFormNuovoArticolo({
                            ...formNuovoArticolo,
                            giacenza_attuale: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Scorta Min.
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formNuovoArticolo.scorta_minima}
                        onChange={(e) =>
                          setFormNuovoArticolo({
                            ...formNuovoArticolo,
                            scorta_minima: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                {(() => {
                  const artSel = tuttiArticoli.find((a) => a.id === formBom.articolo_componente_id)
                  const um = creazioneRapidaAttiva ? formNuovoArticolo.unita_misura : artSel?.unita_misura || 'unità'
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Quantità necessaria per fabbricare 1 pezzo ({um}) *
                        </label>
                        <span className="text-[11px] text-orange-400 font-medium">
                          {um === 'm' ? 'es: 0.12 per 120 mm' : um === 'pz' ? 'es: 4 per 4 pezzi' : `in ${um}`}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          placeholder="es: 1.5 o 0.12"
                          value={formBom.quantita_necessaria}
                          onChange={(e) =>
                            setFormBom({
                              ...formBom,
                              quantita_necessaria: e.target.value.replace(/[^0-9.,]/g, '')
                            })
                          }
                          className="w-full px-3 py-2 pr-14 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {um}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Consumo unitario per 1 pezzo finito. Il sistema moltiplicherà questo valore per la quantità di ciascun ordine cliente.
                      </p>
                    </>
                  )
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note di Prelievo / Istruzioni Componente
                </label>
                <input
                  type="text"
                  placeholder="es: Spezzone barra lungo 150mm"
                  value={formBom.note}
                  onChange={(e) => setFormBom({ ...formBom, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleBomAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  Aggiungi alla Distinta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE AGGIUNGI FASE CICLO */}
      {modaleCicloAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Aggiungi Fase al Ciclo di Lavorazione
              </h2>
              <button
                onClick={() => setModaleCicloAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAggiungiFase} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sequenza (10, 20, 30...) *
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={formCiclo.sequenza}
                    onChange={(e) => setFormCiclo({ ...formCiclo, sequenza: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* RICERCA LIVE TIPO DI PROCESSO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cerca Tipo di Processo / Operazione
                  </label>
                  {formCiclo.tipo_processo_id ? (
                    // Processo Selezionato
                    (() => {
                      const proc = tipiProcesso.find((p) => p.id === formCiclo.tipo_processo_id)
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-orange-500/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: proc?.colore_badge || '#3b82f6' }}
                            >
                              {proc?.codice}
                            </span>
                            <span className="text-xs font-bold text-white">{proc?.nome}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormCiclo({ ...formCiclo, tipo_processo_id: '' })
                              setFiltroProcessoTesto('')
                              setMostraDropdownProcessi(true)
                            }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                            title="Cambia operazione"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })()
                  ) : (
                    // Input Ricerca Live Processo
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Digita per filtrare (es: fres, laser, cam, sbav)..."
                          value={filtroProcessoTesto}
                          onFocus={() => setMostraDropdownProcessi(true)}
                          onChange={(e) => {
                            setFiltroProcessoTesto(e.target.value)
                            setMostraDropdownProcessi(true)
                          }}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {mostraDropdownProcessi && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl divide-y divide-slate-800">
                          {tipiProcesso
                            .filter(
                              (p) =>
                                p.nome.toLowerCase().includes(filtroProcessoTesto.toLowerCase()) ||
                                p.codice.toLowerCase().includes(filtroProcessoTesto.toLowerCase())
                            )
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setFormCiclo({
                                    ...formCiclo,
                                    tipo_processo_id: p.id,
                                    centro_lavoro_id: p.centro_lavoro_predefinito_id || formCiclo.centro_lavoro_id,
                                    nome_fase: p.nome // Autocompila sempre con il nome del processo selezionato
                                  })
                                  setMostraDropdownProcessi(false)
                                  setFiltroProcessoTesto('')
                                }}
                                className="w-full text-left p-2.5 hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs font-mono font-bold px-1.5 py-0.5 rounded text-white text-[10px]"
                                    style={{ backgroundColor: p.colore_badge || '#3b82f6' }}
                                  >
                                    {p.codice}
                                  </span>
                                  <span className="text-xs font-semibold text-white group-hover:underline">
                                    {p.nome}
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Fase Esecutiva *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Fresatura 5 Assi & Filettatura"
                  value={formCiclo.nome_fase}
                  onChange={(e) => setFormCiclo({ ...formCiclo, nome_fase: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* RICERCA LIVE CENTRO DI LAVORO / MACCHINA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cerca e Assegna Macchina / Centro di Lavoro *
                </label>
                {formCiclo.centro_lavoro_id ? (
                  // Macchina Selezionata
                  (() => {
                    const centro = centriLavoro.find((c) => c.id === formCiclo.centro_lavoro_id)
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-orange-500/50 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-500/20">
                              {centro?.codice}
                            </span>
                            <span className="text-xs font-bold text-white">{centro?.nome}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Reparto: <strong className="text-slate-200">{centro?.reparto}</strong> • Capacità: {centro?.capacita_giornaliera_ore}h/giorno
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormCiclo({ ...formCiclo, centro_lavoro_id: '' })
                            setFiltroMacchinaTesto('')
                            setMostraDropdownMacchine(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                          title="Cambia centro di lavoro"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-[11px]">Cambia</span>
                        </button>
                      </div>
                    )
                  })()
                ) : (
                  // Input Ricerca Live Macchina
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Digita per filtrare macchina (es: Mazak, Tornio, Laser, MC-01)..."
                        value={filtroMacchinaTesto}
                        onFocus={() => setMostraDropdownMacchine(true)}
                        onChange={(e) => {
                          setFiltroMacchinaTesto(e.target.value)
                          setMostraDropdownMacchine(true)
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {mostraDropdownMacchine && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl divide-y divide-slate-800">
                        {centriLavoro
                          .filter(
                            (c) =>
                              c.nome.toLowerCase().includes(filtroMacchinaTesto.toLowerCase()) ||
                              c.codice.toLowerCase().includes(filtroMacchinaTesto.toLowerCase()) ||
                              c.reparto.toLowerCase().includes(filtroMacchinaTesto.toLowerCase())
                          )
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFormCiclo({ ...formCiclo, centro_lavoro_id: c.id })
                                setMostraDropdownMacchine(false)
                                setFiltroMacchinaTesto('')
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-orange-400 group-hover:underline">
                                    {c.codice}
                                  </span>
                                  <span className="text-xs font-semibold text-white">
                                    {c.nome}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  Reparto: {c.reparto} • {c.capacita_giornaliera_ore} ore/giorno
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MACCHINE ALTERNATIVE COMPATIBILI (BILANCIAMENTO CARICO) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Macchine Alternative Compatibili (Bilanciamento Carico)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formCiclo.centri_lavoro_alternativi_ids?.length || 0} selezionate
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Seleziona le altre macchine dell'officina in grado di eseguire questa fase, in modo che il sistema possa deviare il pezzo in caso di sovraccarico della macchina principale:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {centriLavoro
                    .filter((c) => c.id !== formCiclo.centro_lavoro_id)
                    .map((c) => {
                      const isSelezionata = formCiclo.centri_lavoro_alternativi_ids?.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const attuali = formCiclo.centri_lavoro_alternativi_ids || []
                            const aggiornati = isSelezionata
                              ? attuali.filter((id) => id !== c.id)
                              : [...attuali, c.id]
                            setFormCiclo({ ...formCiclo, centri_lavoro_alternativi_ids: aggiornati })
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelezionata
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isSelezionata && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{c.codice}</span>
                          <span className="text-[10px] opacity-80">({c.nome})</span>
                        </button>
                      )
                    })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tempo Attrezzaggio (Minuti Setup)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="es: 15 o 20"
                    value={formCiclo.tempo_attrezzaggio_min}
                    onChange={(e) =>
                      setFormCiclo({
                        ...formCiclo,
                        tempo_attrezzaggio_min: e.target.value.replace(/[^0-9.,]/g, '')
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tempo Ciclo Pezzo (Minuti/pz)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="es: 5 o 1.5"
                    value={formCiclo.tempo_ciclo_pezzo_min}
                    onChange={(e) =>
                      setFormCiclo({
                        ...formCiclo,
                        tempo_ciclo_pezzo_min: e.target.value.replace(/[^0-9.,]/g, '')
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Operative per l'Operatore in Officina
                </label>
                <textarea
                  rows={2}
                  placeholder="Istruzioni specifiche per il piazzamento, utensili o controlli da effettuare..."
                  value={formCiclo.note_operative}
                  onChange={(e) => setFormCiclo({ ...formCiclo, note_operative: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleCicloAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  Salva Fase Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
