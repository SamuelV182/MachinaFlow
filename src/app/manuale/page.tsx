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
  ExternalLink,
  ShieldCheck,
  Building2,
  Lock,
  AlertTriangle,
  Scissors,
  Truck,
  RotateCcw
} from 'lucide-react'
import Link from 'next/link'

export default function ManualePage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
            <span>MachinaFlow Enterprise v2.0</span>
            <span>•</span>
            <span>Guida Ufficiale di Fabbrica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-orange-500" />
            Manuale Operativo di Gestione Produzione
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Istruzioni passo-passo per utilizzare ciascun modulo applicativo dall&apos;ufficio acquisti e PCP fino al bordo macchina e Super Admin.
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
          { label: '4. Fabbisogno MRP & DDT', href: '#mrp', icon: Layers },
          { label: '5. OdP & Scheda Lavoro A4', href: '#produzione', icon: Factory },
          { label: '6. Terminale Touch & Scarti', href: '#officina', icon: QrCode },
          { label: '7. Dashboard & Carico', href: '#dashboard', icon: LayoutDashboard },
          { label: '8. Super Admin Multi-Tenant', href: '#superadmin', icon: ShieldCheck }
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
            <p className="text-xs text-slate-400">Definizione delle risorse produttive e del catalogo operazioni tecnologiche.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-orange-400">Centri di Lavoro / Macchine</h3>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Clicca su <strong>&quot;+ Nuova Macchina / Risorsa&quot;</strong> per registrare una postazione di lavoro.</li>
                <li><strong>Capacità Giornaliera (ore):</strong> Imposta 8.00 per singolo turno, 16.00 per doppio turno. Questo valore determina la soglia di saturazione settimanale nella Dashboard.</li>
                <li><strong>Costo Orario (€/h):</strong> Utilizzato per la consuntivazione economica della fase e della commessa.</li>
                <li><strong>Disattivazione rapida:</strong> Puoi disattivare una macchina in manutenzione per escluderla temporaneamente dai carichi.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-blue-400">Tipi di Processo / Fasi</h3>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Catalogo delle operazioni standard (es: Tornitura CNC, Fresatura 5 Assi, Taglio Sega, Trattamento Termico, Collaudo CMM).</li>
                <li>Assegna un <strong>Centro di Lavoro Predefinito</strong> per accelerare la compilazione automatica dei cicli di lavoro.</li>
                <li><strong>Colore Badge:</strong> Permette di distinguere visivamente la tipologia di lavorazione sui tablet in officina.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ARTICOLI, BOM & CICLI */}
      <section id="articoli" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">2. Articoli, Distinte Base (BOM) & Cicli Standard (/articoli)</h2>
            <p className="text-xs text-slate-400">Anagrafica tecnica dei prodotti finiti, semilavorati e materie prime.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <ul className="list-disc pl-4 space-y-2 text-slate-400">
            <li><strong>Classificazione Articolo:</strong> <em>Prodotto Finito</em> (vendibile), <em>Semilavorato</em> o <em>Materia Prima</em> (barre, lamiere, forgiati, viteria).</li>
            <li><strong>Giacenza & Scorta Minima:</strong> Monitoraggio costante delle scorte con soglia minima di sicurezza per l&apos;approvvigionamento.</li>
            <li><strong>Distinta Base (BOM):</strong> Associa le materie prime necessarie per produrre 1 pezzo finito, con supporto alla creazione rapida <em>On-The-Fly</em> di nuovi materiali e ricerca dinamica a digitazione libera.</li>
            <li><strong>Ciclo di Lavoro Standard:</strong> Sequenza ordinata delle fasi (#10 Taglio, #20 Sgrossatura, #30 Finitura, #40 Collaudo). Per ogni fase si impostano i tempi di attrezzaggio (setup) e tempo pezzo, oltre alle <strong>macchine alternative compatibili</strong> per il bilanciamento dinamico del carico in officina.</li>
          </ul>
        </div>
      </section>

      {/* 3. ORDINI CLIENTI */}
      <section id="ordini" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">3. Ordini Clienti & Generazione OdP (/ordini)</h2>
            <p className="text-xs text-slate-400">Gestione commesse commerciali e lancio ordini in produzione.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Permette di inserire gli ordini acquisiti dai clienti indicando data di consegna concordata e righe articolo.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li><strong>Lancio OdP con 1 Click:</strong> Cliccando su <em>&quot;Lancia OdP&quot;</em> su una riga d&apos;ordine, il sistema genera automaticamente l&apos;Ordine di Produzione ereditando il ciclo di lavoro standard e calcolando i tempi totali.</li>
            <li><strong>Lancia Tutti gli OdP:</strong> Genera in blocco tutti gli ordini di produzione dell&apos;ordine cliente e aggiorna automaticamente lo stato della commessa a <em>In Produzione</em>.</li>
          </ul>
        </div>
      </section>

      {/* 4. MRP & ANTI-DOPPIO ORDINE DDT */}
      <section id="mrp" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">4. Fabbisogno Materiali (MRP) & Tracciabilità DDT (/mrp)</h2>
            <p className="text-xs text-slate-400">Pianificazione acquisti con protezione da doppi ordini accidentali e bolle fornitore.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Il modulo scansiona tutti gli OdP aperti e calcola in tempo reale il <strong>Fabbisogno Netto</strong> considerando sia il magazzino che il materiale già ordinato al fornitore:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-center text-amber-300 border border-slate-800 text-xs">
            Fabbisogno Netto = max(0, Fabbisogno Lordo + Scorta Minima - Giacenza Magazzino - Quantità Già Ordinata da Fornitore)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 space-y-1">
              <strong className="block text-xs uppercase font-bold">🔴 ORDINA SUBITO</strong>
              <p className="text-[11px] text-slate-300">Materiale mancante per completare gli OdP in lavorazione.</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-300 space-y-1">
              <strong className="block text-xs uppercase font-bold">🔒 IN ARRIVO (ORDINATO)</strong>
              <p className="text-[11px] text-slate-300">Materiale già ordinato al fornitore. Il riordino è bloccato per evitare doppi acquisti.</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
              <strong className="block text-xs uppercase font-bold">🟢 OK DISPONIBILE</strong>
              <p className="text-[11px] text-slate-300">Giacenza a magazzino sufficiente a coprire l&apos;intera produzione.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-2">
            <h3 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> Ricezione Merce & Tracciabilità DDT Fornitore
            </h3>
            <p className="text-slate-400">
              Quando il camion del fornitore scarica il materiale in officina, cliccando su <strong>&quot;Arrivato DDT&quot;</strong> si apre la scheda di ricezione dove registrare:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Numero DDT / Bolla Fornitore:</strong> Riferimento ufficiale del documento di trasporto.</li>
              <li><strong>Quantità Effettiva Scaricata:</strong> Aggiorna istantaneamente la giacenza magazzino dell&apos;articolo.</li>
              <li><strong>Colata Acciaio / Certificato 3.1:</strong> Numero di colata e conformità EN 10204 3.1 archiviati nello storico.</li>
              <li><strong>Chiusura Automatica Ordine Fornitore:</strong> L&apos;ordine fornitore passa a <em>Ricevuto</em> e la riga MRP torna verde.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. ODP & SCHEDA DI LAVORO A4 */}
      <section id="produzione" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">5. Ordini di Produzione & Scheda Lavoro A4 Print-Ready (/produzione)</h2>
            <p className="text-xs text-slate-400">Foglio di viaggio cartaceo per l&apos;officina con QR Code identificativo ad alta risoluzione.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Aprendo il dettaglio di qualsiasi OdP (`/produzione/[id]`), è possibile stampare il documento ufficiale premendo il pulsante <strong>&quot;Stampa Scheda Lavoro (A4 Print-Ready)&quot;</strong>.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li><strong>QR Code Alta Risoluzione:</strong> Stampato in alto a destra, permette la scansione diretta da fotocamera tablet o lettore barcode.</li>
            <li><strong>Documento Blindato di Sola Lettura:</strong> La Scheda A4 è riservata alla consultazione e alla stampa; l&apos;avanzamento operativo delle fasi è confinato esclusivamente al Terminale Officina touch per garantire coerenza totale.</li>
            <li><strong>Chiusura Automatica OdP:</strong> Quando l&apos;operatore in officina completa l&apos;ultima lavorazione, l&apos;OdP passa automaticamente allo stato <em>Completato</em> sia in locale che su Supabase Cloud, e la quantità prodotta viene aggiornata al 100%.</li>
          </ul>
        </div>
      </section>

      {/* 6. TERMINALE TOUCH MES & GESTIONE SCARTI */}
      <section id="officina" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">6. Terminale Touch di Bordo Macchina - MES (/officina)</h2>
            <p className="text-xs text-slate-400">Interfaccia touch-friendly per operatori con anti-fermo macchina, ordini parziali e gestione scarti.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Modalità Kiosk & Blocco PIN
              </h3>
              <p className="text-slate-400">
                All&apos;avvio su tablet, l&apos;operatore seleziona la propria macchina o il Capo Officina seleziona <em>Supervisore</em>.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>I tablet a bordo macchina rimangono vincolati alla propria postazione a schermo intero senza barre del browser (PWA).</li>
                <li>Lo sblocco della postazione o il logout richiede il <strong>PIN Responsabile di Sicurezza (123456)</strong>.</li>
                <li>La consultazione della Scheda A4 si apre in modale popup interna touch con chiusura forzata, impedendo all&apos;operatore di uscire dal Kiosk.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Logica Anti-Fermo Macchina
              </h3>
              <p className="text-slate-400">
                Se la distinta base di un articolo rileva stock 0 del grezzo a magazzino:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Compare l&apos;avviso <strong>⚠️ Manca Grezzo</strong>.</li>
                <li>La macchina non si blocca: scavalca automaticamente l&apos;ordine fermo e assegna la <strong>Priorità N. 1</strong> al primo pezzo in coda con materiale disponibile al banco.</li>
              </ul>
            </div>
          </div>

          {/* AVANZAMENTO PARZIALE & SCARTI */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> Avanzamento Parziale (Split OdP) & Gestione Scarti (Opzione B)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
              <div className="space-y-1.5">
                <strong className="text-slate-200 block text-xs">🟡 Giacenza Parziale da Fornitore:</strong>
                <p>
                  Se servono 100 pezzi ma la barra a magazzino copre solo 40 pezzi, compare il pulsante <strong>&quot;Avvia Lotto Parziale (40 pz)&quot;</strong>. 
                  Il sistema sdoppia l&apos;ordine in <strong>Lotto A (40 pz avviati subito)</strong> e <strong>Lotto B (60 pz residui a saldo)</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <strong className="text-slate-200 block text-xs">🔴 Chiusura Lavorazione con Pezzi Buoni & Scarti:</strong>
                <p>
                  Premendo <em>&quot;Completa Fase&quot;</em>, l&apos;operatore indica i pezzi buoni e gli scarti. Se ci sono pezzi difettosi (es. 47 buoni e 3 scarti su 50), il sistema permette di generare istantaneamente con 1 click l&apos;ordine <strong>`OdP-xxx/R` (3 pz) URGENTE</strong> per rifare da zero i pezzi scartati e garantire la consegna al 100% al cliente.
                </p>
              </div>
            </div>
          </div>
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
            <p className="text-xs text-slate-400">Monitoraggio sinottico e bilanciamento della capacità produttiva settimanale.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            La dashboard ricalcola in tempo reale il carico settimanale di ciascuna macchina sommando le ore residue delle fasi aperte assegnate a quel centro di lavoro.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li>🟢 <strong>Verde (&lt; 75%):</strong> Macchina disponibile per nuovi ordini.</li>
            <li>🟡 <strong>Giallo (75% - 90%):</strong> Carico elevato, capacità residua ridotta.</li>
            <li>🔴 <strong>Rosso (&gt; 90%):</strong> Sovraccarico; richiede straordinari, riallocazione su macchina alternativa compatibile o doppio turno.</li>
          </ul>
        </div>
      </section>

      {/* 8. SUPER ADMIN MULTI-TENANT */}
      <section id="superadmin" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">8. Gestione Super Admin Multi-Tenant (/super-admin)</h2>
            <p className="text-xs text-slate-400">Piattaforma SaaS per la creazione e distribuzione di nuove officine indipendenti.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
          <p>
            Riservato al proprietario della piattaforma. Permette di gestire il software come servizio commerciale B2B:
          </p>
          <ul className="list-disc pl-4 space-y-2 text-slate-400">
            <li><strong>Creazione Nuova Officina:</strong> Cliccando su <em>&quot;+ Crea Nuova Officina&quot;</em>, viene generato un ambiente completamente vuoto e pulito (zero macchine, zero articoli, zero ordini), isolato tramite Row Level Security (RLS) su Supabase.</li>
            <li><strong>Condivisione WhatsApp con 1 Click:</strong> Il sistema genera un token di invito univoco con pulsante per inviare immediatamente il messaggio WhatsApp precompilato al titolare della nuova officina.</li>
            <li><strong>Attivazione Trasparente (/imposta-password):</strong> Quando il titolare apre il link, visualizza la propria email personale bloccata in sola lettura per impostare la password del suo account master in totale chiarezza.</li>
            <li><strong>Menu Adattivo:</strong> Quando si accede con ruolo <code>super_admin</code>, la barra laterale mostra solo i comandi di gestione SaaS, escludendo il disordine dei dati operativi di una specifica officina.</li>
          </ul>
        </div>
      </section>

      {/* REGISTRO AGGIORNAMENTI */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h3 className="font-bold text-slate-200">Registro Aggiornamenti del Software (Changelog Ufficiale):</h3>
        <ul className="space-y-1.5">
          <li>
            <strong className="text-orange-400">v2.0.0 (Enterprise Release):</strong> Architettura Super Admin Multi-Tenant con inviti WhatsApp, gestione scarti con ripristino urgente (/R), avanzamento parziale (Split OdP), ricezione merce tracciata con bolle DDT fornitore e certificati 3.1, e isolamento Kiosk touch con PIN.
          </li>
          <li>
            <strong className="text-slate-300">v1.3.0:</strong> Sistema anti-doppio ordine MRP con blocco acquisti, riallineamento automatico degli OdP completati al 100% e Scheda A4 blindata in sola lettura.
          </li>
          <li>
            <strong className="text-slate-300">v1.2.1:</strong> Supporto universale tastierino numerico per inserimento decimali (accetta sia punto che virgola senza azzeramento).
          </li>
          <li>
            <strong className="text-slate-300">v1.2.0:</strong> Motore di ricerca istantanea a digitazione libera per selezione materiali in Distinta Base con consumo per singolo pezzo.
          </li>
          <li>
            <strong className="text-slate-300">v1.1.0:</strong> Creazione rapida <em>On-The-Fly</em> di componenti e materie prime all&apos;interno della BOM.
          </li>
          <li>
            <strong className="text-slate-300">v1.0.0:</strong> Rilascio iniziale con PCP, MRP, BOM, OdP con schede A4 QR Code e MES Touch Officina.
          </li>
        </ul>
      </div>
    </div>
  )
}
