'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, Check, Boxes, ChevronDown } from 'lucide-react'
import { Articolo } from '@/types/database'

interface SelettoreArticoloRicercaProps {
  articoli: Articolo[]
  articoloIdSelezionato: string
  onSeleziona: (articolo: Articolo | null) => void
  placeholder?: string
}

export default function SelettoreArticoloRicerca({
  articoli,
  articoloIdSelezionato,
  onSeleziona,
  placeholder = 'Cerca per codice o descrizione...'
}: SelettoreArticoloRicercaProps) {
  const [aperto, setAperto] = useState(false)
  const [termineRicerca, setTermineRicerca] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Articolo attualmente selezionato
  const articoloSelezionato = useMemo(
    () => articoli.find((a) => a.id === articoloIdSelezionato) || null,
    [articoli, articoloIdSelezionato]
  )

  // Filtra solo articoli finiti o semilavorati (esclude materie prime pure per gli ordini vendita)
  const articoliDisponibili = useMemo(() => {
    return articoli.filter((a) => a.tipo !== 'materia_prima')
  }, [articoli])

  // Risultati filtrati in base al testo digitato
  const risultati = useMemo(() => {
    const q = termineRicerca.trim().toLowerCase()
    if (!q) return articoliDisponibili
    return articoliDisponibili.filter(
      (a) =>
        a.codice_articolo.toLowerCase().includes(q) ||
        a.descrizione.toLowerCase().includes(q)
    )
  }, [articoliDisponibili, termineRicerca])

  // Chiudi quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Box Principale di Selezione / Ricerca */}
      {articoloSelezionato && !aperto ? (
        <div
          onClick={() => {
            setAperto(true)
            setTermineRicerca('')
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-orange-500 text-xs text-slate-100 flex items-center justify-between gap-2 cursor-pointer transition-all shadow-xs group"
          title="Clicca per cambiare articolo"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono font-bold text-orange-400 bg-orange-950/70 px-1.5 py-0.5 rounded border border-orange-500/30 text-[11px] shrink-0">
              {articoloSelezionato.codice_articolo}
            </span>
            <span className="truncate text-slate-200 text-[11px]">
              {articoloSelezionato.descrizione}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              Giac: {articoloSelezionato.giacenza_attuale ?? 0}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSeleziona(null)
                setTermineRicerca('')
                setAperto(true)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
              title="Rimuovi selezione"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            required={!articoloIdSelezionato}
            placeholder={placeholder}
            value={termineRicerca}
            onFocus={() => setAperto(true)}
            onChange={(e) => {
              setTermineRicerca(e.target.value)
              if (!aperto) setAperto(true)
            }}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
          />
          {termineRicerca ? (
            <button
              type="button"
              onClick={() => {
                setTermineRicerca('')
                inputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          )}
        </div>
      )}

      {/* Menu a Tendina Fluttuante con Risultati Filtrati */}
      {aperto && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800/80 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-1.5 bg-slate-950/80 sticky top-0 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
            <span>{risultati.length} articoli trovati</span>
            <span className="text-[9px] lowercase opacity-60">invio / click per selezionare</span>
          </div>

          {risultati.map((art) => {
            const isSel = art.id === articoloIdSelezionato
            return (
              <div
                key={art.id}
                onClick={() => {
                  onSeleziona(art)
                  setAperto(false)
                  setTermineRicerca('')
                }}
                className={`p-2.5 hover:bg-slate-800/90 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  isSel ? 'bg-orange-950/30 border-l-2 border-orange-500' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/20">
                      {art.codice_articolo}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 capitalize">
                      {art.tipo.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 truncate font-medium">
                    {art.descrizione}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {art.prezzo_riferimento !== undefined && art.prezzo_riferimento > 0 && (
                    <span className="block text-xs font-bold font-mono text-emerald-400">
                      € {Number(art.prezzo_riferimento).toFixed(2)}
                    </span>
                  )}
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                    Stock: <strong className="text-white">{art.giacenza_attuale ?? 0}</strong> {art.unita_misura || 'pz'}
                  </span>
                </div>
              </div>
            )
          })}

          {risultati.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              <Boxes className="w-5 h-5 mx-auto mb-1 text-slate-600" />
              Nessun articolo finito trovato con &quot;{termineRicerca}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
