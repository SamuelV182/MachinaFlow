'use client'

import React, { useState, useEffect } from 'react'
import { Download, FileText, ShoppingCart, ExternalLink, X } from 'lucide-react'
import { OrdineFornitore, FornitoreTerzista, Azienda } from '@/types/database'
import { generaOdaPdf } from '@/lib/pdf-oda-service'
import { createClient } from '@/lib/supabase/client'

interface SchedaOdAStampabileProps {
  ordine: OrdineFornitore
  fornitore?: FornitoreTerzista | null
  onChiudi: () => void
}

export default function SchedaOdAStampabile({ ordine, fornitore, onChiudi }: SchedaOdAStampabileProps) {
  const supabase = createClient()

  // Inizializza SINCRONAMENTE l'azienda dalla cache per azzerare i render a catena
  const [azienda, setAzienda] = useState<Azienda | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const azCache = localStorage.getItem('machinaflow_session_azienda_dati')
      if (azCache) return JSON.parse(azCache)
    } catch {}
    return null
  })

  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [datiPronti, setDatiPronti] = useState<boolean>(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // Rileva smartphone/tablet (stesso criterio dei DDT)
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || ''
      const mobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768
      setIsMobile(mobileDevice)
    }
  }, [])

  // 1. Precarica logo in Base64
  useEffect(() => {
    let isMounted = true

    const caricaLogo = async () => {
      if (!azienda?.logo_url) {
        if (isMounted) {
          setLogoBase64(null)
          setDatiPronti(true)
        }
        return
      }

      try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(azienda.logo_url)}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const blob = await res.blob()
          const reader = new FileReader()
          reader.onloadend = () => {
            if (isMounted && typeof reader.result === 'string') {
              setLogoBase64(reader.result)
              setDatiPronti(true)
            }
          }
          reader.readAsDataURL(blob)
          return
        }
      } catch {}

      if (isMounted) setDatiPronti(true)
    }

    caricaLogo()

    return () => {
      isMounted = false
    }
  }, [azienda?.logo_url])

  // 2. Controllo azienda fallback
  useEffect(() => {
    if (azienda) return

    const caricaAziendaAsync = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setDatiPronti(true)
          return
        }

        let azId = ''
        try {
          const azSup = localStorage.getItem('machinaflow_supporto_azienda_id')
          const azSess = localStorage.getItem('machinaflow_session_azienda_id')
          azId = azSup || azSess || ''
        } catch {}

        if (!azId) {
          const { data: profilo } = await supabase
            .from('profili_utenti')
            .select('azienda_id')
            .eq('id', user.id)
            .single()
          azId = profilo?.azienda_id || 'az-pilota-01'
        }

        const { data: azData } = await supabase
          .from('aziende')
          .select('*')
          .eq('id', azId)
          .single()

        if (azData) {
          setAzienda(azData as Azienda)
          try {
            localStorage.setItem('machinaflow_session_azienda_dati', JSON.stringify(azData))
          } catch {}
        }
      } catch {
      } finally {
        setDatiPronti(true)
      }
    }

    caricaAziendaAsync()
  }, [supabase, azienda])

  // 3. Generazione PDF ESEGUITA UNA SOLA VOLTA quando dati e logo sono pronti (zero lampi)
  useEffect(() => {
    if (!datiPronti && azienda?.logo_url) return

    try {
      const doc = generaOdaPdf(ordine, fornitore, azienda, logoBase64)
      const blobUrl = doc.output('bloburl')
      setPdfUrl(String(blobUrl))

      return () => {
        if (blobUrl) URL.revokeObjectURL(String(blobUrl))
      }
    } catch (e) {
      console.error('Errore generazione PDF OdA:', e)
    }
  }, [ordine, fornitore, azienda, logoBase64, datiPronti])

  // Scarica direttamente il file PDF
  const handleScaricaPdf = () => {
    try {
      const doc = generaOdaPdf(ordine, fornitore, azienda, logoBase64)
      doc.save(`${ordine.numero_oda || 'Ordine_Fornitore'}.pdf`)
    } catch {
      window.print()
    }
  }

  // Apertura a schermo intero o in nuova scheda per smartphone
  const handleApriPdfEsterno = () => {
    try {
      const doc = generaOdaPdf(ordine, fornitore, azienda, logoBase64)
      const blob = doc.output('blob')
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
    } catch {
      handleScaricaPdf()
    }
  }

  return (
    <div className="scheda-a4-container fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:overflow-visible">
      <div className="max-w-4xl w-full my-auto space-y-4 print:max-w-full print:w-full print:m-0 print:p-0 print:space-y-0">
        {/* Barra Comandi (Non Stampata) */}
        <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Ordine d&apos;Acquisto Fornitore (O.d.A.)
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                  {ordine.numero_oda || ordine.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fornitore: <strong className="text-slate-200">{ordine.fornitore_nome}</strong> • Consegna:{' '}
                <strong className="text-orange-400">{ordine.data_arrivo_prevista?.split('-').reverse().join('/') || 'Da concordare'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleScaricaPdf}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              title="Scarica il file PDF A4 ad alta risoluzione"
            >
              <FileText className="w-4 h-4" />
              <span>Scarica PDF OdA</span>
            </button>

            <button
              type="button"
              onClick={onChiudi}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              ✕ Chiudi
            </button>
          </div>
        </div>

        {/* VISUALIZZAZIONE OTTIMIZZATA: SMARTPHONE VS DESKTOP (IDENTICA AI DDT) */}
        {isMobile ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Ordine d&apos;Acquisto A4 Pronto</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                OdA N° <strong className="text-slate-200">{ordine.numero_oda || ordine.id}</strong> per{' '}
                <strong className="text-cyan-400">{ordine.fornitore_nome}</strong>
              </p>
            </div>

            {/* Riepilogo Dati Rapido per Smartphone */}
            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Data Emissione:</span>
                <span className="font-semibold text-slate-200">
                  {ordine.data_ordine ? new Date(ordine.data_ordine).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Consegna Richiesta:</span>
                <span className="font-semibold text-orange-400">
                  {ordine.data_arrivo_prevista?.split('-').reverse().join('/') || 'Da concordare'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Righe Ordinate:</span>
                <span className="font-semibold text-slate-200">
                  {ordine.righe?.length || 1} riga/e ({ordine.quantita_ordinata} tot.)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Totale Imponibile:</span>
                <span className="font-semibold text-emerald-400">
                  {ordine.totale_imponibile ? `€ ${ordine.totale_imponibile.toFixed(2)}` : 'A consuntivo'}
                </span>
              </div>
            </div>

            {/* Pulsantoni Azione Mobile */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleScaricaPdf}
                className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Scarica e Stampa PDF A4</span>
              </button>

              <button
                type="button"
                onClick={handleApriPdfEsterno}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Visualizza a Schermo Intero</span>
              </button>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 shadow-2xl h-[78vh] w-full flex flex-col">
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              title={`Anteprima ${ordine.numero_oda || 'OdA'}`}
              className="w-full h-full rounded-xl bg-white border-0"
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Generazione documento OdA A4 in corso...</p>
          </div>
        )}
      </div>
    </div>
  )
}
