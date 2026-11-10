'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check, Building2, X } from 'lucide-react'
import { Cliente } from '@/types/database'
import { preparaCriterioRicerca, calcolaRilevanzaRicerca } from '@/lib/search-helper'

interface SelettoreClienteRicercaProps {
  clienti: Cliente[]
  clienteIdSelezionato: string
  onSeleziona: (cliente: Cliente | null) => void
  placeholder?: string
}

export default function SelettoreClienteRicerca({
  clienti,
  clienteIdSelezionato,
  onSeleziona,
  placeholder = 'Cerca cliente per ragione sociale, P.IVA o città...'
}: SelettoreClienteRicercaProps) {
  const [aperto, setAperto] = useState(false)
  const [testoRicerca, setTestoRicerca] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const clienteSelezionato = useMemo(
    () => clienti.find((c) => c.id === clienteIdSelezionato) || null,
    [clienti, clienteIdSelezionato]
  )

  // Chiudi dropdown al click fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtra e ordina con search-helper
  const clientiFiltrati = useMemo(() => {
    const criterio = preparaCriterioRicerca(testoRicerca)

    if (!criterio.queryOriginale) {
      return clienti
    }

    const conScore = clienti
      .map((c) => {
        const score = calcolaRilevanzaRicerca(
          c.ragione_sociale,
          [c.partita_iva, c.indirizzo, c.email, c.telefono],
          criterio
        )
        if (score < 0) return null
        return { cliente: c, score }
      })
      .filter((elem): elem is { cliente: Cliente; score: number } => elem !== null)

    conScore.sort((a, b) => b.score - a.score)
    return conScore.map((x) => x.cliente)
  }, [clienti, testoRicerca])

  const handleApri = () => {
    setAperto(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleScegli = (c: Cliente) => {
    onSeleziona(c)
    setAperto(false)
    setTestoRicerca('')
  }

  const handleRimuovi = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSeleziona(null)
    setTestoRicerca('')
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Visualizzazione Box Selezionato */}
      <div
        onClick={handleApri}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-950 border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
          aperto ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {clienteSelezionato ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-orange-950/80 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white truncate text-xs">
                {clienteSelezionato.ragione_sociale}
              </div>
              {clienteSelezionato.partita_iva && (
                <div className="text-[10px] text-slate-400 font-mono">
                  P.IVA: {clienteSelezionato.partita_iva}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRimuovi}
              className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
              title="Deseleziona cliente"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-slate-500 italic select-none">
            {placeholder}
          </span>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${aperto ? 'rotate-180 text-orange-400' : ''}`} />
      </div>

      {/* Dropdown Menu Ricerca */}
      {aperto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 sticky top-0 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={testoRicerca}
              onChange={(e) => setTestoRicerca(e.target.value)}
              placeholder="Cerca per nome, P.IVA... (usa virgolette per match esatto)"
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {testoRicerca && (
              <button
                type="button"
                onClick={() => setTestoRicerca('')}
                className="text-slate-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {clientiFiltrati.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Nessun cliente trovato con &quot;{testoRicerca}&quot;
              </div>
            ) : (
              clientiFiltrati.map((c) => {
                const isSelected = c.id === clienteIdSelezionato
                return (
                  <div
                    key={c.id}
                    onClick={() => handleScegli(c)}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-orange-600/20 text-white font-bold'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">
                        {c.ragione_sociale}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                        {c.partita_iva && <span>P.IVA: {c.partita_iva}</span>}
                        {c.indirizzo && <span className="truncate max-w-[200px] text-slate-500">{c.indirizzo}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-400 shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
