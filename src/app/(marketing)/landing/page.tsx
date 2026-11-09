'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Factory,
  Cpu,
  Boxes,
  ShoppingCart,
  Layers,
  QrCode,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  MessageCircle,
  Play,
  Flame,
  AlertTriangle,
  RotateCcw,
  Zap,
  BarChart3,
  Check,
  ChevronRight,
  ChevronDown,
  Headphones,
  Lock,
  Printer,
  Calculator,
  HelpCircle,
  FileSpreadsheet,
  MonitorCheck,
  UserCheck
} from 'lucide-react'
import { MockupTabletOfficina } from '@/components/landing/MockupTabletOfficina'
import { SimulatoreFlussoCompleto } from '@/components/landing/SimulatoreFlussoCompleto'
import { MockupMrpDashboard } from '@/components/landing/MockupMrpDashboard'
import { MockupMatriceCarico } from '@/components/landing/MockupMatriceCarico'
import { MockupDdtWorkflow } from '@/components/landing/MockupDdtWorkflow'
import { CalcolatoreRoi } from '@/components/landing/CalcolatoreRoi'
import { ModaleRichiestaDemo } from '@/components/landing/ModaleRichiestaDemo'
import { MachinaFlowLogo } from '@/components/MachinaFlowLogo'

export default function LandingPage() {
  const [modaleDemoAperta, setModaleDemoAperta] = useState(false)
  const [faqApertaIdx, setFaqApertaIdx] = useState<number | null>(0)

  // Numero di telefono WhatsApp per le richieste dirette (modificabile facilmente)
  const TELEFONO_WHATSAPP = '393330000000'

  const apriWhatsApp = () => {
    const testo = encodeURIComponent(
      'Buongiorno! Vorrei richiedere una dimostrazione pilota di MachinaFlow per la mia officina meccanica.'
    )
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${testo}`, '_blank')
  }

  const faqs = [
    {
      domanda: 'Devo cambiare il mio attuale gestionale di contabilità o fatturazione?',
      risposta:
        'Assolutamente no! Questo è uno dei vantaggi principali di MachinaFlow: il nostro software è un MES specializzato che gestisce esclusivamente la produzione, le macchine, i cicli, i materiali e i terzisti. Il tuo commercialista o ufficio contabile continua a usare il gestionale aziendale attuale (Zucchetti, TeamSystem, Danea, SAP, ecc.). A fine produzione MachinaFlow genera i DDT di spedizione e ti permette di esportare il file Excel con tutti i dati già pronti per la fatturazione, azzerando i tempi di migrazione.'
    },
    {
      domanda: 'È obbligatorio installare i tablet touch su ogni macchina?',
      risposta:
        'No, non è un obbligo: è una tua scelta graduale. Molte officine partono con l\'uso di MachinaFlow solo in ufficio dal Capo Officina o Responsabile di Produzione per pianificare le priorità, calcolare l\'MRP e stampare le Schede A4 con QR Code. Successivamente, quando vorrai rendere gli operai più autonomi sulla coda di lavorazione, potrai aggiungere i tablet touch sulle postazioni senza costi aggiuntivi di licenza software.'
    },
    {
      domanda: 'I dati dei disegni tecnici e delle commesse dei nostri clienti sono al sicuro?',
      risposta:
        'Sì, ogni officina opera su un database crittografato e impermeabile (Multi-Tenant Row-Level Security). Nessun\'altra azienda può visualizzare né accedere ai tuoi codici articolo, commesse o prezzi di lavorazione.'
    },
    {
      domanda: 'Come gestisce MachinaFlow le lavorazioni inviate a terzisti esterni?',
      risposta:
        'Con la massima semplicità: quando un lotto deve uscire per trattamenti termici o galvanici (zincatura, tempra, anodizzazione), MachinaFlow crea la bolla di trasporto conto lavorazione. Quando il materiale rientra con il DDT del fornitore, basta un clic per registrare il rientro e sbloccare immediatamente la fase interna successiva.'
    }
  ]

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-100">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. NAVBAR MARKETING                                                   */}
      {/* ---------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-6">
          <Link href="/landing" className="group shrink-0">
            <MachinaFlowLogo
              dimensione={38}
              sottotitolo="PCP & MES Industriale"
            />
          </Link>

          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8 text-xs font-semibold text-slate-300">
            <a href="#come-funziona" className="hover:text-orange-400 transition-colors whitespace-nowrap text-orange-400 flex items-center gap-1">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Come Funziona (Demo)</span>
            </a>
            <a href="#perche" className="hover:text-orange-400 transition-colors whitespace-nowrap">Perché MachinaFlow</a>
            <a href="#adozione-flessibile" className="hover:text-orange-400 transition-colors whitespace-nowrap">Tablet o Ufficio</a>
            <a href="#mrp-section" className="hover:text-orange-400 transition-colors whitespace-nowrap">MRP Anti-Doppio Ordine</a>
            <a href="#ddt-workflow" className="hover:text-orange-400 transition-colors whitespace-nowrap">Conto Terzi &amp; ERP</a>
            <a href="#calcolatore" className="hover:text-orange-400 transition-colors text-emerald-400 flex items-center gap-1 whitespace-nowrap">
              <Calculator className="w-3.5 h-3.5" />
              <span>Calcola Risparmio</span>
            </a>
            <a href="#pilota" className="hover:text-orange-400 transition-colors text-amber-400 flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Programma Pilota</span>
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors hidden sm:inline whitespace-nowrap"
            >
              Accedi al Gestionale
            </Link>

            <button
              onClick={() => setModaleDemoAperta(true)}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              Richiedi Demo
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                                        */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 px-4 sm:px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold shadow-lg shadow-orange-500/5">
            <Sparkles className="w-4 h-4" />
            <span>Nato sul campo per Officine Meccaniche di Precisione e Conto Terzi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Il MES d&apos;officina che si integra con il tuo gestionale attuale.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 mt-2">
              Senza traumi né cambi di software contabile.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Gestisci al 100% la fabbrica: pianificazione priorità, MRP anti-doppio ordine, terzisti e scarti. A fine produzione esporti in Excel o stampi il DDT per il tuo gestionale di fatturazione esistente.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setModaleDemoAperta(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              <span>Richiedi Demo Pilota Gratuita</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={apriWhatsApp}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-emerald-500/40"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Parla con noi su WhatsApp</span>
            </button>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Nessun cambio dell&apos;attuale gestionale contabile</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tablet opzionali: parti dall&apos;ufficio e cresci quando vuoi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dati isolati e protetti al 100%</span>
            </div>
          </div>
        </div>

        {/* 1° Mockup: Tablet Bordo Macchina */}
        <div className="mt-14 sm:mt-20 max-w-4xl mx-auto relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
              • Prova a cliccare i bottoni sul tablet touch dell&apos;operatore •
            </span>
          </div>
          <MockupTabletOfficina />
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 2.5 SIMULATORE FLUSSO COMPLETO (VIDEO-LIKE INTERACTIVE DEMO)           */}
      {/* ---------------------------------------------------------------------- */}
      <section id="come-funziona" className="py-16 sm:py-24 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <SimulatoreFlussoCompleto />
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. APPROCCIO PROGRESSIVO: TABLET O UFFICIO                            */}
      {/* ---------------------------------------------------------------------- */}
      <section id="adozione-flessibile" className="py-20 bg-slate-900/60 border-y border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest font-mono">
              Flessibilità Totale di Adozione
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              I terminali a bordo macchina sono un&apos;opportunità, non un obbligo
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Decidi tu come e quando digitalizzare la tua officina. MachinaFlow si adatta al tuo modo di lavorare in due modalità complementari:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modalità 1: Gestione Centrale Ufficio */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <MonitorCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase font-bold text-blue-400">Fase 1: Subito Operativo</span>
                <h3 className="text-xl font-bold text-white">Gestione Centralizzata Ufficio / Capo Officina</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Il responsabile di produzione o il titolare gestisce dal proprio PC tutte le priorità, calcola l&apos;MRP e stampa la <strong>Scheda Lavoro A4 con QR Code</strong> da consegnare agli operai.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Zero spese hardware iniziali: usi i PC che già possiedi.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Nessun impatto o formazione complessa per gli operai a bordo macchina.</span>
                </li>
              </ul>
            </div>

            {/* Modalità 2: Autonomia Bordo Macchina */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-orange-500/40 space-y-4 shadow-xl shadow-orange-500/5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase font-bold text-orange-400">Fase 2: Massima Efficienza</span>
                <h3 className="text-xl font-bold text-white">Tablet a Bordo Macchina &amp; Coda Obbligata</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quando vuoi rendere gli operai autonomi: il tablet montato sul centro di lavoro mostra <strong>solo la coda programmata in tempo reale</strong>. L&apos;operatore non deve più chiedere &quot;cosa faccio adesso?&quot; e registra scarti e tempi effettivi con 1 tocco.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>L&apos;operaio segue per forza la sequenza delle priorità stabilite.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Puoi usare qualsiasi tablet economico (Android o iPad).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. MOCKUP MRP ACQUISTI                                                 */}
      {/* ---------------------------------------------------------------------- */}
      <section id="mrp-section" className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
              Fabbisogno Materiali &amp; Acquisti
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Stop ai ritardi per mancanza di materia prima
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Incrocia in automatico ordini clienti, scorte minime e lotti in officina con blocco acquisti doppi.
            </p>
          </div>

          <MockupMrpDashboard />
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. NUOVO MOCKUP: CONTO TERZI & RACCORDO CON IL TUO ERP                 */}
      {/* ---------------------------------------------------------------------- */}
      <section id="ddt-workflow" className="py-20 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest font-mono">
              Logistica Documentale &amp; Integrazione Gestionale
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Conto Terzi fluido e DDT pronti per la tua contabilità
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Guarda come MachinaFlow gestisce l&apos;invio e il rientro dalle zincature e genera il DDT di spedizione con esportazione Excel per il tuo gestionale contabile esistente.
            </p>
          </div>

          {/* Mockup Interattivo DDT */}
          <MockupDdtWorkflow />

          <div className="text-center pt-4">
            <button
              onClick={() => setModaleDemoAperta(true)}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Vuoi vedere come esportare i tuoi DDT? Richiedi Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 6. MATRICE CARICO MACCHINE & BUCHI LIBERI                             */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest font-mono">
              Pianificazione &amp; Schedulazione
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Mappa Buchi Macchina: individua i colli di bottiglia all&apos;istante
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Visualizza giorno per giorno quali macchine sono cariche al 100% e dove puoi incastrare nuovi ordini urgenti.
            </p>
          </div>

          <MockupMatriceCarico />
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 7. CALCOLATORE ROI RISPARMIO                                           */}
      {/* ---------------------------------------------------------------------- */}
      <section id="calcolatore" className="py-20 px-4 sm:px-6 bg-slate-900/30 border-t border-slate-800">
        <CalcolatoreRoi onRichiediDemo={() => setModaleDemoAperta(true)} />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 8. SCHEDA A4 CARTACEA CON QR CODE                                      */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest font-mono">
              Fogli di Lavoro Intelligenti
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Dalla carta al digitale senza cambiare le abitudini dei tuoi operai
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              MachinaFlow genera la <strong>Scheda Lavoro d&apos;Officina A4</strong> pronta per la stampa, con sopra il <strong>QR Code univoco</strong>: basta inquadrarlo con il tablet per aprire la lavorazione.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setModaleDemoAperta(true)}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Richiedi un Esempio di Scheda A4 e Demo</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="bg-slate-100 text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl border-4 border-slate-300/40 space-y-4 font-sans text-xs select-none">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <div className="font-black text-sm uppercase tracking-wide">SCHEDA LAVORO D&apos;OFFICINA</div>
                  <div className="text-[11px] font-mono text-slate-600">ODP-2026-088 • Priorità 1</div>
                  <div className="font-bold text-slate-900 text-xs mt-1">Albero Trasmissione C45</div>
                </div>
                <div className="p-2 bg-white rounded-lg border-2 border-slate-900">
                  <QrCode className="w-12 h-12 text-slate-950" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-200 p-2.5 rounded">
                <div>Quantità Lotto: <strong>50 pz</strong></div>
                <div>Data Consegna: <strong>28 Nov 2026</strong></div>
                <div>Grezzo: <strong>Barra Ø40 C45 (22.5 m)</strong></div>
                <div>Cliente: <strong>Brevetti Meccanici Srl</strong></div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="font-bold text-[10px] uppercase text-slate-600">Fasi Esecutive:</div>
                <div className="p-2 rounded bg-white border border-slate-300 flex justify-between items-center text-[11px]">
                  <span>10. Taglio Spezzoni (Segatrice)</span>
                  <span className="font-mono text-emerald-700 font-bold">✓ FATTO</span>
                </div>
                <div className="p-2 rounded bg-amber-100 border border-amber-300 flex justify-between items-center text-[11px] font-bold">
                  <span>20. Tornitura &amp; Filettatura (Tornio 1)</span>
                  <span className="text-amber-800 animate-pulse">IN CORSO</span>
                </div>
                <div className="p-2 rounded bg-white border border-slate-300 flex justify-between items-center text-[11px] text-slate-500">
                  <span>30. Zincatura Bianca (Terzista)</span>
                  <span>DA FARE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 9. FAQ INTERATTIVE                                                     */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-slate-900/30 border-t border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest font-mono">
              Domande Frequenti
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tutto quello che i titolari di officina ci chiedono
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const aperta = faqApertaIdx === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setFaqApertaIdx(aperta ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white cursor-pointer select-none"
                  >
                    <span>{faq.domanda}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-orange-400 shrink-0 transition-transform ${
                        aperta ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {aperta && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.risposta}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 10. PROGRAMMA PILOTA & CTA FINALE                                      */}
      {/* ---------------------------------------------------------------------- */}
      <section id="pilota" className="py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-900 border border-orange-500/40 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
            <Sparkles className="w-4 h-4" />
            <span>Offerta Pilota Gratuita</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Partecipa al Programma Pilota per la tua Officina
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stiamo selezionando un numero ristretto di officine a cui offriamo la <strong>configurazione iniziale completa</strong> del parco macchine e l&apos;assistenza dedicata senza alcun vincolo contrattuale né cambio di gestionale contabile.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setModaleDemoAperta(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Candidati al Programma Pilota</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={apriWhatsApp}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contattaci su WhatsApp</span>
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 11. FOOTER MARKETING                                                   */}
      {/* ---------------------------------------------------------------------- */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/landing" className="group">
            <MachinaFlowLogo
              dimensione={34}
              sottotitolo="PCP & MES Industriale"
            />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/manuale" className="hover:text-orange-400 transition-colors">
              Manuale Utente
            </Link>
            <Link href="/login" className="hover:text-orange-400 transition-colors">
              Area Riservata Clienti
            </Link>
            <button onClick={apriWhatsApp} className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Badge Autore & P.IVA */}
          <div className="text-center md:text-right space-y-1">
            <div className="text-slate-400">
              Progettato &amp; Sviluppato da{' '}
              <a
                href="https://vsdigitalcreations.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-4"
              >
                VS Digital Creations
              </a>
            </div>
            <div className="text-[11px] text-slate-500">
              © 2026 MachinaFlow • Made with precision in Italy
            </div>
          </div>
        </div>
      </footer>

      {/* Modale Richiesta Demo Integrata */}
      <ModaleRichiestaDemo
        aperta={modaleDemoAperta}
        onChiudi={() => setModaleDemoAperta(false)}
        numeroTelefonoWhatsApp={TELEFONO_WHATSAPP}
      />
    </div>
  )
}
