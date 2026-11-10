'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Factory,
  Calendar,
  Clock,
  Printer,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Search,
  AlertTriangle,
  Hourglass,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Truck,
  FileText,
  Pause,
  Play,
  Ban,
  RotateCcw
} from 'lucide-react'
import { OrdineProduzione, FaseOdP, Articolo, DocumentoTrasportoCliente, OrdineCliente } from '@/types/database'
import { SEED_ODP, SEED_ARTICOLI, SEED_ORDINI_CLIENTI } from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'
import SchedaDDTStampabile from '@/components/SchedaDDTStampabile'

type OdPConFasi = OrdineProduzione & {
  fasi: FaseOdP[]
  articolo?: Articolo
}

export default function ProduzionePage() {
  const [odpList, setOdpList] = useState<OdPConFasi[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [ddtClientiList, setDdtClientiList] = useState<DocumentoTrasportoCliente[]>([])
  const [ordiniClienti, setOrdiniClienti] = useState<OrdineCliente[]>([])
  const [ddtDaStampare, setDdtDaStampare] = useState<DocumentoTrasportoCliente | null>(null)
  const [termineRicerca, setTermineRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [modalitaVista, setModalitaVista] = useState<'cards' | 'tabella'>('cards')
  const [paginaCorrente, setPaginaCorrente] = useState<number>(1)
  const ELEMENTI_PER_PAGINA = 20
  const [notifica, setNotifica] = useState<string | null>(null)

  // Gestione Standby / Ripresa Lavorazione OdP
  const handleToggleStandbyOdP = async (odp: OdPConFasi) => {
    const isAttualmenteSospeso = odp.stato === 'sospeso'
    const nuovoStato = isAttualmenteSospeso ? 'in_lavorazione' : 'sospeso'
    const messaggioAzione = isAttualmenteSospeso ? 'riattivato e rimesso in coda di lavorazione' : 'messo in STANDBY / SOSPESO'

    // Aggiorna stato locale
    const aggiornati = odpList.map((o) => (o.id === odp.id ? { ...o, stato: nuovoStato as any } : o))
    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    // Sincronizza su Supabase Cloud
    await syncService.aggiornaStatoOdP(odp.id, nuovoStato)
    syncService.inviaSegnaleAvanzamento()

    setNotifica(`✓ OdP ${odp.codice_odp} ${messaggioAzione}! Sincronizzato con l'officina.`)
    setTimeout(() => setNotifica(null), 4000)
  }

  // Gestione Annullamento OdP
  const handleAnnullaOdP = async (odp: OdPConFasi) => {
    const conferma = window.confirm(
      `Sei sicuro di voler ANNULLARE definitivamente l'OdP ${odp.codice_odp}?\n\nQuesta azione:\n- Segnerà l'OdP come SCARTATO / ANNULLATO\n- Lo rimuoverà dalla coda dei terminali a bordo macchina\n- Sincronizzerà lo stato su Supabase Cloud.`
    )
    if (!conferma) return

    // Chiedi se restituire la materia prima a magazzino (se era stata prelevata)
    if (odp.materia_prima_scaricata) {
      const restituisciMp = window.confirm(
        `Per questo OdP era già stata scaricata la materia prima dal magazzino.\n\nVuoi ripristinare la materia prima a stock (es. barra intatta non tagliata)?`
      )
      if (restituisciMp) {
        try {
          const distinteSalvate = localStorage.getItem('machinaflow_distinte')
          const distinte = distinteSalvate ? JSON.parse(distinteSalvate) : []
          const componentiBom = distinte.filter((d: any) => d.articolo_padre_id === odp.articolo_id)
          const articoliSalvati = localStorage.getItem('machinaflow_articoli')
          const articoli = articoliSalvati ? JSON.parse(articoliSalvati) : []

          for (const comp of componentiBom) {
            const mat = articoli.find((a: any) => a.id === comp.articolo_componente_id)
            if (mat) {
              const consumo = comp.quantita_necessaria * (odp.quantita_da_produrre || 1)
              const nuovaGiacenza = Number((mat.giacenza_attuale + consumo).toFixed(3))
              const matAgg = { ...mat, giacenza_attuale: nuovaGiacenza }
              await syncService.salvaArticolo(matAgg)
              await syncService.registraMovimentoMagazzino({
                articolo_id: mat.id,
                tipo_movimento: 'rettifica_inventario',
                quantita: Number(consumo),
                giacenza_precedente: mat.giacenza_attuale,
                giacenza_risultante: nuovaGiacenza,
                unita_misura: mat.unita_misura,
                codice_odp: odp.codice_odp,
                riferimento_documento: `Storno OdP ${odp.codice_odp}`,
                note: `Restituzione materia prima per annullamento OdP ${odp.codice_odp}`
              })
            }
          }
        } catch (e) {
          console.warn('Errore ripristino materia prima:', e)
        }
      }
    }

    // Aggiorna stato locale OdP a 'scartato'
    const aggiornati = odpList.map((o) => (o.id === odp.id ? { ...o, stato: 'scartato' as const } : o))
    setOdpList(aggiornati)
    localStorage.setItem('machinaflow_odp', JSON.stringify(aggiornati))

    // Sincronizza su Supabase Cloud
    await syncService.aggiornaStatoOdP(odp.id, 'scartato')
    syncService.inviaSegnaleAvanzamento()

    setNotifica(`✓ OdP ${odp.codice_odp} annullato con successo.`)
    setTimeout(() => setNotifica(null), 4000)
  }

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

      const articoliList = parseSicuro('machinaflow_articoli', SEED_ARTICOLI)
      setArticoli(articoliList)

      const ordiniList = parseSicuro('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI)
      setOrdiniClienti(ordiniList)

      // Carica ordini sincronizzati da Supabase Cloud
      const odpCaricati = await syncService.getOrdiniProduzione()

      // Allinea la cache locale con gli ordini ufficiali di Supabase Cloud
      localStorage.setItem('machinaflow_odp', JSON.stringify(odpCaricati))

      // Carica i DDT Clienti per identificare con precisione assoluta gli OdP già spediti (sia cloud che locale)
      const ddtClientiCloud = await syncService.getDdtClienti()
      const ddtClientiLocali = parseSicuro<import('@/types/database').DocumentoTrasportoCliente[]>('machinaflow_ddt_clienti', [])
      const ddtMappa = new Map<string, import('@/types/database').DocumentoTrasportoCliente>()
      ddtClientiLocali.forEach((d) => ddtMappa.set(d.id, d))
      ddtClientiCloud.forEach((d) => ddtMappa.set(d.id, d))
      const ddtClienti = Array.from(ddtMappa.values())
      setDdtClientiList(ddtClienti)
      const odpSpeditiSet = new Set<string>()
      ddtClienti.forEach((ddt) => {
        ddt.righe?.forEach((r) => {
          if (r.odp_id) odpSpeditiSet.add(r.odp_id)
        })
      })

      const arricchiti: OdPConFasi[] = odpCaricati.map((odp) => {
        // Se l'OdP è presente in un DDT cliente o ha stato 'spedito', è archiviato come 'spedito'
        if (odp.stato === 'spedito' || odpSpeditiSet.has(odp.id)) {
          if (odp.stato !== 'spedito') {
            syncService.aggiornaStatoOdP(odp.id, 'spedito', odp.quantita_da_produrre)
          }
          return {
            ...odp,
            stato: 'spedito' as const,
            quantita_prodotta: odp.quantita_da_produrre,
            articolo: articoliList.find((a) => a.id === odp.articolo_id)
          }
        }

        // Se l'OdP è stato sospeso (standby) o annullato (scartato), preserva rigorosamente lo stato
        if (odp.stato === 'sospeso' || odp.stato === 'scartato') {
          return {
            ...odp,
            articolo: articoliList.find((a) => a.id === odp.articolo_id)
          }
        }

        // Controllo automatico di coerenza: se tutte le fasi risultano completate, l'OdP è completato
        const tutteCompletate = odp.fasi && odp.fasi.length > 0 && odp.fasi.every((f) => f.stato === 'completata')
        const almenoUnaInCorso = odp.fasi && odp.fasi.some((f) => f.stato === 'in_corso')
        const statoReale = tutteCompletate ? 'completato' : almenoUnaInCorso ? 'in_lavorazione' : odp.stato

        // Se lo stato calcolato differisce da quello salvato nel DB, allinealo
        if (statoReale !== odp.stato) {
          syncService.aggiornaStatoOdP(odp.id, statoReale, tutteCompletate ? odp.quantita_da_produrre : odp.quantita_prodotta)
        }

        return {
          ...odp,
          stato: statoReale,
          quantita_prodotta: tutteCompletate ? odp.quantita_da_produrre : odp.quantita_prodotta,
          articolo: articoliList.find((a) => a.id === odp.articolo_id)
        }
      })

      setOdpList(arricchiti)
    }

    caricaDati()

    // Sottoscrizione Real-Time nativa Supabase (ad eventi, zero traffico a riposo):
    // Riceve notifiche istantanee SOLO quando cambia qualcosa su OdP, DDT o Ordini
    const disiscrivi = syncService.sottoscriviAvanzamentoProduzione(() => {
      caricaDati()
    })

    // Sincronizzazione immediata al cambio scheda nello stesso browser
    const onStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('machinaflow_')) {
        caricaDati()
      }
    }
    window.addEventListener('storage', onStorageChange)

    return () => {
      if (disiscrivi && typeof disiscrivi === 'function') disiscrivi()
      window.removeEventListener('storage', onStorageChange)
    }
  }, [])

  // Reset pagina al cambio filtro o ricerca
  useEffect(() => {
    setPaginaCorrente(1)
  }, [filtroStato, termineRicerca])

  const odpFiltrati = odpList.filter((o) => {
    const combaciaStato = filtroStato === 'tutti' || o.stato === filtroStato
    const combaciaTesto =
      o.codice_odp.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      (o.articolo && o.articolo.descrizione.toLowerCase().includes(termineRicerca.toLowerCase())) ||
      (o.articolo && o.articolo.codice_articolo.toLowerCase().includes(termineRicerca.toLowerCase()))
    return combaciaStato && combaciaTesto
  })

  // Calcolo Paginazione a 20 OdP per pagina
  const totaleElementi = odpFiltrati.length
  const totalePagine = Math.ceil(totaleElementi / ELEMENTI_PER_PAGINA) || 1
  const inizioPaginazione = (paginaCorrente - 1) * ELEMENTI_PER_PAGINA
  const odpPaginati = odpFiltrati.slice(inizioPaginazione, inizioPaginazione + ELEMENTI_PER_PAGINA)

  const calcolaProgresso = (fasi: FaseOdP[]) => {
    if (!fasi || fasi.length === 0) return 0
    const completate = fasi.filter((f) => f.stato === 'completata').length
    return Math.round((completate / fasi.length) * 100)
  }

  const getPrioritaBadge = (p: number) => {
    switch (p) {
      case 4:
        return { label: 'URGENTE', color: 'bg-rose-950 text-rose-300 border-rose-800' }
      case 3:
        return { label: 'ALTA', color: 'bg-amber-950 text-amber-300 border-amber-800' }
      case 2:
        return { label: 'MEDIA', color: 'bg-blue-950 text-blue-300 border-blue-800' }
      default:
        return { label: 'BASSA', color: 'bg-slate-800 text-slate-400 border-slate-700' }
    }
  }

  // Calcolo Puntualità per Capo Officina
  const calcolaPuntualitaOdP = (odp: OdPConFasi) => {
    if (odp.stato === 'completato') {
      return {
        label: 'COMPLETATO',
        color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        diffGiorni: 0,
        isRitardo: false
      }
    }

    if (!odp.data_fine_pianificata) return null

    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const scadenza = new Date(odp.data_fine_pianificata)
    scadenza.setHours(0, 0, 0, 0)

    const diffMs = scadenza.getTime() - oggi.getTime()
    const diffGiorni = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffGiorni < 0) {
      return {
        label: `RITARDO (${Math.abs(diffGiorni)} gg)`,
        color: 'bg-rose-950 text-rose-300 border-rose-800 font-black animate-pulse',
        diffGiorni,
        isRitardo: true
      }
    } else if (diffGiorni === 0) {
      return {
        label: 'SCADE OGGI',
        color: 'bg-amber-950 text-amber-300 border-amber-800 font-bold',
        diffGiorni: 0,
        isRitardo: false
      }
    } else if (diffGiorni <= 2) {
      return {
        label: `IN SCADENZA (${diffGiorni} gg)`,
        color: 'bg-amber-950 text-amber-300 border-amber-800',
        diffGiorni,
        isRitardo: false
      }
    }

    return {
      label: `NEI TEMPI (${diffGiorni} gg)`,
      color: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      diffGiorni,
      isRitardo: false
    }
  }

  // Se un DDT è aperto per la visualizzazione/stampa, smontiamo l'intera pagina degli OdP
  // In questo modo il rendering è immediato (< 0.2s) senza caricare e ricalcolare centinaia di card sotto
  if (ddtDaStampare) {
    return (
      <SchedaDDTStampabile
        ddt={ddtDaStampare}
        tipo="cliente"
        ordiniClienti={ordiniClienti}
        onChiudi={() => setDdtDaStampare(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Factory className="w-8 h-8 text-orange-500" />
            Ordini di Produzione (OdP / Commesse)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitora l'avanzamento delle fasi nei reparti e stampa la Scheda di Lavorazione con QR Code per l'officina.
          </p>
        </div>

        <Link
          href="/ordini"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all"
        >
          Vai agli Ordini Clienti
        </Link>
      </div>

      {/* Filtri e Ricerca */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'tutti', label: 'Tutti gli OdP' },
            { id: 'pianificato', label: 'Pianificati' },
            { id: 'in_lavorazione', label: 'In Lavorazione' },
            { id: 'completato', label: 'Pronti a Terra' },
            { id: 'spedito', label: 'Spediti / Storico' }
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                modalitaVista === 'cards'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista a Schede"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schede</span>
            </button>
            <button
              type="button"
              onClick={() => setModalitaVista('tabella')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                modalitaVista === 'tabella'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista a Tabella / Lista"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termineRicerca}
              onChange={(e) => setTermineRicerca(e.target.value)}
              placeholder="Cerca per codice OdP o articolo..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* VISTA A SCHEDE (CARDS) */}
      {modalitaVista === 'cards' && (
        <div className="space-y-4">
          {odpPaginati.map((odp) => {
            const progresso = calcolaProgresso(odp.fasi)
            const priorita = getPrioritaBadge(odp.priorita)
            const puntualita = calcolaPuntualitaOdP(odp)
            const tempoTotaleMin = odp.fasi.reduce((a, b) => a + b.tempo_stimato_totale_min, 0)

            return (
              <div
                key={odp.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  puntualita?.isRitardo
                    ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-mono font-bold text-orange-400 bg-orange-950/80 px-2.5 py-1 rounded-lg border border-orange-500/20">
                      {odp.codice_odp}
                    </span>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priorita.color}`}>
                      Priorità: {priorita.label}
                    </span>

                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        odp.stato === 'spedito'
                          ? 'bg-purple-950 text-purple-300 border border-purple-700'
                          : odp.stato === 'completato'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : odp.stato === 'in_lavorazione'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {odp.stato === 'spedito' ? '✓ Spedito con DDT' : odp.stato.replace('_', ' ')}
                    </span>

                    {puntualita && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${puntualita.color}`}>
                        {puntualita.isRitardo ? <AlertTriangle className="w-3 h-3 text-rose-300" /> : <Clock className="w-3 h-3 text-current" />}
                        {puntualita.label}
                      </span>
                    )}

                    {odp.data_fine_pianificata && (
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Consegna: <strong className="text-slate-200">{odp.data_fine_pianificata}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white">
                      {odp.articolo?.codice_articolo} — {odp.articolo?.descrizione}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Quantità da produrre: <strong className="text-orange-400 font-bold">{odp.quantita_da_produrre} {odp.articolo?.unita_misura}</strong> • Tempo Totale Stimato: {Math.round(tempoTotaleMin / 60)}h {tempoTotaleMin % 60}m
                    </p>
                  </div>

                  {/* Barra Avanzamento */}
                  <div className="max-w-md space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">
                        Avanzamento Fasi: {odp.fasi.filter((f) => f.stato === 'completata').length} / {odp.fasi.length}
                      </span>
                      <span className={progresso === 100 ? 'text-emerald-400' : 'text-orange-400'}>
                        {progresso}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progresso === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Se l'OdP è spedito, mostra primario il pulsante Stampa DDT */}
                  {(() => {
                    const ddtTrovato = ddtClientiList.find((d) =>
                      d.righe?.some((r) => r.odp_id === odp.id || r.codice_odp === odp.codice_odp)
                    )

                    if (odp.stato === 'spedito' && ddtTrovato) {
                      return (
                        <button
                          type="button"
                          onClick={() => setDdtDaStampare(ddtTrovato)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer group"
                          title={`Visualizza e Stampa Documento di Trasporto ${ddtTrovato.numero_ddt}`}
                        >
                          <Truck className="w-4 h-4 text-emerald-100" />
                          <span>Stampa DDT ({ddtTrovato.numero_ddt})</span>
                          <Printer className="w-3.5 h-3.5 opacity-80" />
                        </button>
                      )
                    }
                    return null
                  })()}

                  {/* Pulsante Standby / Riprendi (attivo se non spedito e non annullato) */}
                  {odp.stato !== 'spedito' && odp.stato !== 'scartato' && odp.stato !== 'completato' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStandbyOdP(odp)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        odp.stato === 'sospeso'
                          ? 'bg-amber-500/20 hover:bg-amber-500 border-amber-500/40 text-amber-300 hover:text-white'
                          : 'bg-slate-800 hover:bg-amber-600/30 border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/50'
                      }`}
                      title={odp.stato === 'sospeso' ? 'Riprendi produzione OdP' : 'Metti in Standby temporaneo'}
                    >
                      {odp.stato === 'sospeso' ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Riprendi</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Standby</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Pulsante Annulla OdP (se non completato o spedito) */}
                  {odp.stato !== 'spedito' && odp.stato !== 'scartato' && odp.stato !== 'completato' && (
                    <button
                      type="button"
                      onClick={() => handleAnnullaOdP(odp)}
                      className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                      title="Annulla OdP definitivamente (sblocca commessa cliente)"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <Link
                    href={`/produzione/${odp.id}`}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                      odp.stato === 'spedito'
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Scheda Lavoro (QR)</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )
          })}

          {odpFiltrati.length === 0 && (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Factory className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">Nessun ordine di produzione trovato</p>
              <p className="text-xs text-slate-500 mt-1">
                Vai nella sezione "Ordini Clienti" e clicca su "Genera Ordine di Produzione (OdP)".
              </p>
            </div>
          )}
        </div>
      )}

      {/* VISTA A LISTA (TABELLA COMPATTA ADATTIVA SENZA SCROLL) */}
      {modalitaVista === 'tabella' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Codice OdP</th>
                  <th className="py-2.5 px-2.5">Articolo & Particolare</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Quantità</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Priorità</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Stato</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Scadenza</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Avanzamento Fasi</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Tempo St.</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {odpPaginati.map((odp) => {
                  const progresso = calcolaProgresso(odp.fasi)
                  const priorita = getPrioritaBadge(odp.priorita)
                  const puntualita = calcolaPuntualitaOdP(odp)
                  const tempoTotaleMin = odp.fasi.reduce((a, b) => a + b.tempo_stimato_totale_min, 0)
                  const fasiCompletate = odp.fasi.filter((f) => f.stato === 'completata').length

                  return (
                    <tr
                      key={odp.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        puntualita?.isRitardo ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      {/* Codice OdP */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap font-mono font-bold text-orange-400 text-xs">
                        {odp.codice_odp}
                      </td>

                      {/* Articolo */}
                      <td className="py-2.5 px-2.5 min-w-0">
                        <div className="font-semibold text-white truncate max-w-[160px] xl:max-w-xs" title={odp.articolo?.codice_articolo}>
                          {odp.articolo?.codice_articolo}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px] xl:max-w-xs" title={odp.articolo?.descrizione}>
                          {odp.articolo?.descrizione}
                        </div>
                      </td>

                      {/* Quantità */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="font-bold text-white">{odp.quantita_da_produrre}</span>{' '}
                        <span className="text-[9px] text-slate-400">{odp.articolo?.unita_misura}</span>
                      </td>

                      {/* Priorità */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${priorita.color}`}>
                          {priorita.label}
                        </span>
                      </td>

                      {/* Stato */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            odp.stato === 'spedito'
                              ? 'bg-purple-950 text-purple-300 border border-purple-700'
                              : odp.stato === 'completato'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : odp.stato === 'sospeso'
                              ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold animate-pulse'
                              : odp.stato === 'scartato'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 line-through'
                              : odp.stato === 'in_lavorazione'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {odp.stato === 'sospeso' ? '⏸ Standby' : odp.stato === 'scartato' ? '✕ Annullato' : odp.stato === 'spedito' ? 'Spedito' : odp.stato.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Scadenza & Puntualità */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {puntualita ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${puntualita.color}`}>
                            {puntualita.isRitardo ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {puntualita.label}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Avanzamento Fasi */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">{fasiCompletate}/{odp.fasi.length}</span>
                            <span className={`font-bold ${progresso === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {progresso}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progresso === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tempo Stimato */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-[10px] text-slate-300">
                        {Math.round(tempoTotaleMin / 60)}h {tempoTotaleMin % 60}m
                      </td>

                      {/* Azione Stampa Scheda & Stampa DDT */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {(() => {
                            const ddtTrovato = ddtClientiList.find((d) =>
                              d.righe?.some((r) => r.odp_id === odp.id || r.codice_odp === odp.codice_odp)
                            )
                            if (odp.stato === 'spedito' && ddtTrovato) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setDdtDaStampare(ddtTrovato)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-all cursor-pointer border border-emerald-500/40 shadow-sm"
                                  title={`Stampa DDT ${ddtTrovato.numero_ddt}`}
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                </button>
                              )
                            }
                            return null
                          })()}

                          {odp.stato !== 'scartato' && odp.stato !== 'spedito' && odp.stato !== 'completato' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStandbyOdP(odp)}
                                className={`inline-flex items-center justify-center p-1.5 rounded-lg border shadow-sm transition-all cursor-pointer ${
                                  odp.stato === 'sospeso'
                                    ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border-amber-500/50'
                                    : 'bg-slate-800 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 border-slate-700/80 hover:border-amber-500/50'
                                }`}
                                title={odp.stato === 'sospeso' ? "Ripristina da Standby (torna in Lavorazione)" : "Metti in Standby (sospendi temporaneamente)"}
                              >
                                {odp.stato === 'sospeso' ? (
                                  <Play className="w-3.5 h-3.5" />
                                ) : (
                                  <Pause className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAnnullaOdP(odp)}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-all cursor-pointer border border-slate-700/80 hover:border-rose-500/50 shadow-sm"
                                title="Annulla OdP (Revoca commessa e opzione scarico/reso materia prima)"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <Link
                            href={`/produzione/${odp.id}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/80 hover:border-orange-500 shadow-sm"
                            title="Apri e Stampa Scheda Lavoro A4 (QR Code)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {odpFiltrati.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nessun ordine di produzione trovato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginazione a 20 OdP per Pagina (Visibile sia in Schede che in Lista se più di 1 pagina) */}
      {totalePagine > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-xs text-slate-400 font-semibold">
            Mostrati da <span className="text-white font-bold">{Math.min(inizioPaginazione + 1, totaleElementi)}</span> a{' '}
            <span className="text-white font-bold">{Math.min(inizioPaginazione + ELEMENTI_PER_PAGINA, totaleElementi)}</span> di{' '}
            <span className="text-orange-400 font-bold">{totaleElementi}</span> ordini di produzione
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaginaCorrente((prev) => Math.max(prev - 1, 1))}
              disabled={paginaCorrente === 1}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Precedenti</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-orange-400">
              Pagina {paginaCorrente} / {totalePagine}
            </div>

            <button
              type="button"
              onClick={() => setPaginaCorrente((prev) => Math.min(prev + 1, totalePagine))}
              disabled={paginaCorrente === totalePagine}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-600/30"
            >
              <span>Successivi 20</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modale Anteprima Stampa A4 del DDT Cliente per OdP Spediti rimossa dal fondo perché gestita all'inizio con unmount */}
    </div>
  )
}
