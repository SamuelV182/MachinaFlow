'use client'

import {
  BookOpen,
  Cpu,
  Boxes,
  ShoppingCart,
  Layers,
  Factory,
  QrCode,
  LayoutDashboard,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export default function ManualePage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
            <span>MachinaFlow v1.0.0</span>
            <span>•</span>
            <span>Guida Ufficiale</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-orange-500" />
            Manuale Operativo di Gestione Produzione
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Istruzioni passo-passo per utilizzare ciascun modulo applicativo dall'ufficio tecnico al bordo macchina.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-orange-400" />
          Stampa Manuale
        </button>
      </div>

      {/* Indice Rapido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '1. Macchine & Processi', href: '#macchine', icon: Cpu },
          { label: '2. Articoli, BOM & Cicli', href: '#articoli', icon: Boxes },
          { label: '3. Ordini Clienti (Vendite)', href: '#ordini', icon: ShoppingCart },
          { label: '4. Fabbisogno MRP', href: '#mrp', icon: Layers },
          { label: '5. OdP & Scheda Lavoro A4', href: '#produzione', icon: Factory },
          { label: '6. Terminale Touch MES', href: '#officina', icon: QrCode },
          { label: '7. Dashboard & Carico', href: '#dashboard', icon: LayoutDashboard },
          { label: '8. Flusso Operativo', href: '#flusso', icon: ArrowRight }
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <a
              key={idx}
              href={item.href}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all text-xs font-semibold text-slate-300 flex items-center gap-2"
            >
              <Icon className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="truncate">{item.label}</span>
            </a>
          )
        })}
      </div>

      {/* 1. MACCHINE & PROCESSI */}
      <section id="macchine" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">1. Configurazione Macchine & Processi (/processi-macchine)</h2>
            <p className="text-xs text-slate-400">Definizione delle risorse produttive e del catalogo operazioni.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-orange-400">Centri di Lavoro / Macchine</h3>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Clicca su <strong>"+ Nuova Macchina / Risorsa"</strong> per registrare una postazione.</li>
                <li><strong>Capacità Giornaliera (ore):</strong> Imposta 8.00 per un turno, 16.00 per doppio turno. Questo valore determina la soglia di saturazione settimanale nella Dashboard.</li>
                <li><strong>Costo Orario (€/h):</strong> Utilizzato per la consuntivazione economica della fase.</li>
                <li><strong>Disattivazione rapida:</strong> Puoi disattivare una macchina in manutenzione cliccando sull'icona della spunta per escluderla dai carichi.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-blue-400">Tipi di Processo / Fasi</h3>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Clicca su <strong>"+ Nuovo Tipo di Processo"</strong> per aggiungere lavorazioni (es. *Taglio Laser, Fresatura CNC, Tornitura, Sbavatura, Piegatura, Trattamenti*).</li>
                <li>Assegna un <strong>Colore Badge</strong> per distinguere a colpo d'occhio l'operazione nelle schede officina.</li>
                <li>Collega opzionalmente la <strong>Macchina Predefinita</strong> per velocizzare la compilazione delle distinte cicli.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ARTICOLI, BOM & CICLI */}
      <section id="articoli" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">2. Articoli, Distinta Base (BOM) e Cicli di Lavoro (/articoli)</h2>
            <p className="text-xs text-slate-400">Anagrafica tecnica, fabbisogni unitari e sequenze operative.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Ogni articolo può essere di 3 tipi: <strong>Prodotto Finito</strong> (vendibile), <strong>Semilavorato</strong> (intermedio) o <strong>Materia Prima / Componente</strong> (a stock da acquistare).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-400" />
                Distinta Base (BOM - Bill of Materials)
              </h3>
              <p className="text-slate-400">
                Cliccando su <em>"Configura BOM & Ciclo"</em>, indica i componenti necessari per <strong>1 singola unità</strong> di prodotto finito (es. 0.12 metri per 120 mm di barra, oppure 4 viti).
              </p>
              <p className="text-amber-300 font-semibold pt-1">
                ⭐ Ricerca Istantanea (v1.2.0): Invece di scorrere una lunga lista, digita qualsiasi parola o misura (es: 120, inox, vite, 6082) per filtrare all'istante i materiali. Se non esiste, clicca su <em>"+ Non esiste? Crea al volo"</em> per codificarlo subito senza cambiare pagina!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                Ciclo di Lavorazione (Routing & Tempi)
              </h3>
              <p className="text-slate-400">
                Imposta la sequenza ordinata (10, 20, 30...), la macchina assegnata, il <strong>Tempo di Attrezzaggio (setup fisso lotto)</strong> e il <strong>Tempo Ciclo Pezzo (minuti per singola unità)</strong>. Il sistema calcola dinamicamente il tempo totale del lotto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ORDINI CLIENTI & VENDITE */}
      <section id="ordini" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">3. Ordini Clienti & Generazione OdP (/ordini)</h2>
            <p className="text-xs text-slate-400">Inserimento commesse e trasformazione in ordini di produzione.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <ol className="list-decimal pl-4 space-y-2 text-slate-400">
            <li>Clicca su <strong>"+ Nuovo Ordine Cliente"</strong> e inserisci Cliente, Data Consegna Concordata, Articolo e Quantità.</li>
            <li>Quando l'ordine è confermato, premi il pulsante arancione <strong>"Genera Ordine di Produzione (OdP)"</strong>.</li>
            <li>
              <strong>Automazione Intelligente:</strong> Il software clona il ciclo standard dell'articolo, calcola i tempi stimati di ciascuna fase moltiplicando il tempo pezzo per la quantità ordinata più il tempo setup, genera il codice univoco OdP e crea il relativo <strong>QR Code</strong> per la scheda da consegnare in officina.
            </li>
          </ol>
        </div>
      </section>

      {/* 4. FABBISOGNO MATERIALI MRP */}
      <section id="mrp" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">4. Fabbisogno Materiali MRP Semplificato (/mrp)</h2>
            <p className="text-xs text-slate-400">Controllo scorte e generazione liste acquisto per i fornitori.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Il modulo scansiona tutti gli OdP aperti e calcola in tempo reale il <strong>Fabbisogno Netto</strong> applicando la formula:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-center text-amber-300 border border-slate-800 text-xs">
            Fabbisogno Netto = max(0, Fabbisogno Lordo OdP + Scorta Minima - Giacenza Attuale)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300">
              <strong>🔴 ORDINA SUBITO:</strong> Materiale mancante per completare gli OdP in corso.
            </div>
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300">
              <strong>🟡 SOTTO SCORTA:</strong> Coperto per ora, ma scende sotto il livello di sicurezza.
            </div>
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
              <strong>🟢 DISPONIBILE:</strong> Giacenza a magazzino sufficiente.
            </div>
          </div>
        </div>
      </section>

      {/* 5. ODP & SCHEDA DI LAVORO A4 CON QR */}
      <section id="produzione" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">5. Ordini di Produzione & Scheda Lavoro A4 Print-Ready (/produzione)</h2>
            <p className="text-xs text-slate-400">Foglio di viaggio cartaceo per l'officina con QR Code identificativo.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Aprendo il dettaglio di qualsiasi OdP (`/produzione/[id]`), è possibile stampare il documento ufficiale di produzione premendo il pulsante <strong>"Stampa Scheda Lavoro (A4 Print-Ready)"</strong>.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li><strong>QR Code Alta Risoluzione:</strong> Stampato in alto a destra, permette la scansione diretta da fotocamera tablet.</li>
            <li><strong>Layout Ottimizzato per Stampa:</strong> Menu, intestazioni web e pulsanti vengono rimossi automaticamente per produrre un foglio A4 ad alto contrasto.</li>
            <li><strong>Campi a Penna per l'Operatore:</strong> Tabella con tempi previsti, caselle per "Data/Ora Inizio", "Data/Ora Fine", "Firma Operatore" e "Visto Collaudo/Qualità".</li>
          </ul>
        </div>
      </section>

      {/* 6. TERMINALE TOUCH MES */}
      <section id="officina" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">6. Terminale Touch di Bordo Macchina - MES (/officina)</h2>
            <p className="text-xs text-slate-400">Interfaccia operatore tablet touch-friendly per avanzamento fasi.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <ol className="list-decimal pl-4 space-y-2 text-slate-400">
            <li>L'operatore seleziona la propria postazione in alto (es. <em>"MC-01 - Mazak 5 Assi"</em>) per vedere solo i pezzi in coda per la sua macchina.</li>
            <li>All'inizio del lavoro, preme <strong>`▶ INIZIA LAVORAZIONE`</strong> (la scheda diventa blu pulsante e memorizza l'ora d'inizio).</li>
            <li>A pezzo o lotto ultimato, preme <strong>`✔ COMPLETA FASE`</strong>. La fase viene archiviata e il pezzo viene inoltrato alla fase successiva.</li>
            <li>Può premere <strong>`+ Aggiungi Nota Operatore`</strong> per registrare usura utensili, tolleranze o anomalie.</li>
          </ol>
        </div>
      </section>

      {/* 7. DASHBOARD & CARICO */}
      <section id="dashboard" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">7. Dashboard di Controllo Carico & KPI (/)</h2>
            <p className="text-xs text-slate-400">Monitoraggio sinottico e bilanciamento della capacità produttiva.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            La dashboard ricalcola in tempo reale il carico settimanale di ciascuna macchina sommando le ore residue delle fasi aperte assegnate a quel centro di lavoro.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li>🟢 <strong>Verde (&lt; 75%):</strong> Macchina disponibile per nuovi ordini.</li>
            <li>🟡 <strong>Giallo (75% - 90%):</strong> Carico elevato, capacità residua ridotta.</li>
            <li>🔴 <strong>Rosso (&gt; 90%):</strong> Sovraccarico; richiede straordinari, riallocazione o doppio turno.</li>
          </ul>
        </div>
      </section>

      {/* REGISTRO AGGIORNAMENTI */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h3 className="font-bold text-slate-200">Registro Aggiornamenti del Manuale (Changelog):</h3>
        <ul className="space-y-1">
          <li>
            <strong className="text-orange-400">v1.2.1:</strong> Supporto universale tastierino numerico per inserimento decimali (accetta indifferentemente punto o virgola senza reset a zero).
          </li>
          <li>
            <strong className="text-slate-300">v1.2.0:</strong> Motore di ricerca istantanea a digitazione libera per la selezione dei materiali in Distinta Base e chiarimento del consumo per singolo pezzo finito con supporto unità di misura dinamica.
          </li>
          <li>
            <strong className="text-slate-300">v1.1.0:</strong> Aggiunta creazione rapida <em>On-The-Fly</em> di componenti e materie prime direttamente all'interno della finestra di composizione della Distinta Base (BOM).
          </li>
          <li>
            <strong className="text-slate-300">v1.0.0:</strong> Rilascio iniziale con PCP, MRP, BOM, OdP con schede A4 QR Code e MES Touch Officina.
          </li>
        </ul>
      </div>
    </div>
  )
}
