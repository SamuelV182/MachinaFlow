'use client'

import { useState, useMemo } from 'react'
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
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  PackageCheck,
  Smartphone,
  Flame,
  Check,
  Copy,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface SezioneManuale {
  id: string
  numero: string
  titolo: string
  sottotitolo: string
  icona: any
  colore: string
  badge: string
  descrizioneBreve: string
  flussoZero: string
  funzionalitaChiave: { titolo: string; descrizione: string; passaggi?: string[] }[]
  bottoniEComandi: { nome: string; iconaDesc?: string; effetto: string }[]
  faq: { domanda: string; risposta: string }[]
}

const SEZIONI_MANUALE: SezioneManuale[] = [
  {
    id: 'onboarding-zero',
    numero: '00',
    titolo: 'Guida di Avvio Rapido: Da Zero a Fabbrica Operativa',
    sottotitolo: 'I 7 passi consecutivi per configurare MachinaFlow dal primo accesso',
    icona: Sparkles,
    colore: 'from-amber-500/20 to-orange-500/10 border-orange-500/40 text-orange-400',
    badge: 'Onboarding 0-100',
    descrizioneBreve:
      'Quando un nuovo cliente riceve l\'accesso a MachinaFlow, il gestionale necessita di essere popolato secondo una sequenza logica ben precisa. Seguire questo ordine elimina errori di pianificazione e garantisce il funzionamento automatico del motore MRP e dei tablet in officina.',
    flussoZero:
      'Sequenza obbligata: 1. Centri di Lavoro e Processi → 2. Articoli (Materie Prime, Semilavorati, Finiti) → 3. Distinte Base (BOM) e Cicli di Lavorazione → 4. Fornitori e Clienti → 5. Ordini Clienti → 6. Fabbisogno MRP e OdP → 7. Esecuzione Bordo Macchina.',
    funzionalitaChiave: [
      {
        titolo: 'Passo 1: Definire il Parco Macchine e i Processi Tecnologici',
        descrizione:
          'Prima di inserire qualsiasi articolo, MachinaFlow deve sapere quali macchine possiedi in officina, la loro capacità oraria giornaliera e il loro costo/ora per il calcolo dei preventivi.',
        passaggi: [
          'Vai nel menu "Processi & Macchine" (icona CPU).',
          'Clicca su "+ Nuova Macchina": inserisci codice univoco (es. TORN-01), nome, capacità giornaliera (default 8 ore), costo orario e giorni lavorativi (incluso sabato se a ciclo continuo).',
          'Passa al tab "Tipi di Processo" e crea le lavorazioni standard (Tornitura, Fresatura 5 Assi, Elettroerosione, Trattamento Termico Esterno, ecc.). Associa a ciascun processo la macchina predefinita.'
        ]
      },
      {
        titolo: 'Passo 2: Anagrafica Articoli & Giacenze Iniziali di Magazzino',
        descrizione:
          'Crea l\'elenco dei prodotti che vendi, dei componenti intermedi e delle materie prime (barre, lamiere, grezzi).',
        passaggi: [
          'Vai in "Articoli, BOM e Cicli" (icona Scatole).',
          'Crea prima le Materie Prime (tipo "Materia Prima"): inserisci codice, descrizione, scorta minima di sicurezza, prezzo al metro/kg e giorni di consegna del fornitore (Lead Time).',
          'Crea poi i Semilavorati e i Prodotti Finiti (tipo "Prodotto Finito"): specifica il prezzo di vendita o riferimento.',
          'Se hai già del materiale a terra, clicca su "Rettifica / Inventario" sull\'articolo per inserire la giacenza iniziale reale.'
        ]
      },
      {
        titolo: 'Passo 3: Composizione Distinte Base (BOM) e Routing Cicli Standard',
        descrizione:
          'Per ogni Prodotto Finito o Semilavorato, devi indicare di quale materiale ha bisogno e quali fasi di lavoro deve attraversare.',
        passaggi: [
          'Dalla lista articoli, clicca sul nome dell\'articolo per aprire la scheda di dettaglio.',
          'Sezione "Distinta Base (BOM)": clicca "+ Aggiungi Componente", seleziona la materia prima/componente e la quantità necessaria per 1 pezzo finito (es. 0.45 metri di barra trafilata).',
          'Sezione "Ciclo di Lavorazione": clicca "+ Aggiungi Fase Ciclo", imposta la sequenza (10, 20, 30...), il nome della fase, il centro di lavoro e i tempi stimati di attrezzaggio (setup) e ciclo pezzo.'
        ]
      },
      {
        titolo: 'Passo 4: Clienti e Fornitori Terzisti',
        descrizione:
          'Inserisci le anagrafiche commerciali dei clienti a cui fatturi e dei terzisti a cui affidi trattamenti superficiali o lavorazioni esterne (zincatura, tempra, anodizzazione).',
        passaggi: [
          'Vai in "Ordini Clienti" → Tab "Clienti" → "+ Nuovo Cliente".',
          'Vai in "Spedizioni & DDT Esterni" → Tab "Fornitori Terzisti" → "+ Nuovo Fornitore / Terzista" (specificando se applica zincatura, verniciatura, trattamenti termici, ecc.).'
        ]
      },
      {
        titolo: 'Passo 5: Dal Preventivo/Ordine Cliente alla Produzione Effettiva',
        descrizione:
          'Una volta registrato l\'ordine cliente, il motore CTP (Capable-To-Promise) calcola la data di consegna promessa e l\'MRP calcola i materiali mancanti e crea gli OdP con un clic.'
      }
    ],
    bottoniEComandi: [],
    faq: [
      {
        domanda: 'Posso importare gli articoli da un file Excel?',
        risposta:
          'Attualmente è possibile inserire gli articoli da interfaccia grafica o sincronizzarli direttamente nel database cloud Supabase. Presto sarà disponibile il modulo di importazione massiva CSV/Excel.'
      },
      {
        domanda: 'Cosa succede se un prodotto finito non ha la distinta base?',
        risposta:
          'L\'MRP lo segnalerà con un badge arancione "BOM Mancante" e non potrà calcolare l\'impegno delle materie prime, consentendo comunque la produzione manuale se necessario.'
      }
    ]
  },
  {
    id: 'macchine',
    numero: '01',
    titolo: 'Modulo Processi & Centri di Lavoro (Setup Officina)',
    sottotitolo: 'Mappatura delle risorse fisiche, orari di lavoro, turni e costi orari',
    icona: Cpu,
    colore: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400',
    badge: 'Configurazione',
    descrizioneBreve:
      'Questa sezione costituisce la spina dorsale della pianificazione: stabilisce quante ore ogni macchina può lavorare al giorno, quanto costa all\'ora e quali lavorazioni tecnologiche può eseguire.',
    flussoZero:
      'Accessibile dal menu laterale "Processi & Macchine". Diviso in due tab: "Centri di Lavoro" e "Tipi di Processo".',
    funzionalitaChiave: [
      {
        titolo: 'Gestione Centri di Lavoro (Torni, Centri di Lavoro, Taglio, Banchi)',
        descrizione:
          'Ogni riga rappresenta un macchinario reale o una stazione manuale (es. banco sbavatura o collaudo).',
        passaggi: [
          'Codice Univoco: sigla identificativa usata anche nei display e report (es. CNC-01, TORN-DOOSAN, SEGH-AUTO).',
          'Capacità Giornaliera (Ore): definisce le ore nette di lavoro su cui l\'algoritmo calcola la saturazione e la coda (es. 8 ore per turno singolo, 16 per doppio turno, 24 per ciclo continuo).',
          'Costo Orario (€/h): utilizzato nei consuntivi economici di commessa per quantificare il costo reale di lavorazione.',
          'Lavora Sabato / Lavora Domenica: spunta attivabile per macchine automatizzate o isole robotizzate non presidiate.'
        ]
      },
      {
        titolo: 'Tipi di Processo Tecnologici',
        descrizione:
          'Definiscono le famiglie di lavorazione (Tornitura da Barra, Fresatura 5 Assi, Rettifica Tonda, Marcatura Laser, Trattamento Esterno). Ogni processo può avere un centro di lavoro predefinito e un colore identificativo per le viste grafiche.'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Nuova Macchina',
        effetto: 'Apre il form modale per censire un nuovo macchinario con turni e tariffe orarie.'
      },
      {
        nome: 'Pulsante Modifica (Matita)',
        effetto: 'Permette di aggiornare capacità ore, reparti o disattivare temporaneamente un macchinario fermo per manutenzione.'
      },
      {
        nome: 'Toggle Attivo / Inattivo',
        effetto: 'Se disattivato, la macchina viene esclusa dalle nuove pianificazioni OdP senza cancellare lo storico.'
      }
    ],
    faq: [
      {
        domanda: 'Se una macchina fa straordinari o lavora il sabato, come lo gestisco?',
        risposta:
          'Puoi modificare la capacità giornaliera a 10 ore o spuntare "Lavora Sabato" nella scheda macchina; l\'algoritmo di pianificazione riallocherà subito il carico.'
      }
    ]
  },
  {
    id: 'articoli',
    numero: '02',
    titolo: 'Modulo Articoli, Distinte Base (BOM) e Cicli di Lavorazione',
    sottotitolo: 'Catalogo tecnico, scorte minime, esplosione materiali e tempi di fase',
    icona: Boxes,
    colore: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400',
    badge: 'Ingegneria di Prodotto',
    descrizioneBreve:
      'Il cuore dell\'ufficio tecnico. Gestisce l\'anagrafica di tutti gli articoli, con calcolo automatico della disponibilità, tracciamento inventario e composizione tecnica (cosa serve per produrlo e come si produce).',
    flussoZero:
      'Menu "Articoli, BOM e Cicli". Offre vista a Griglia di Card o Tabella compatta, con filtri per tipologia (Finiti, Semilavorati, Materie Prime) e ricerca istantanea per codice o descrizione.',
    funzionalitaChiave: [
      {
        titolo: 'Tipologie Articolo e Gestione Giacenze',
        descrizione: 'Gli articoli sono categorizzati rigorosamente in tre classi:',
        passaggi: [
          'Materia Prima (MP): grezzi da acquistare all\'esterno (barre tonde, piatti, profilati, lamiere, viteria speciale). Hanno prezzo di acquisto e Lead Time fornitore espresso in giorni.',
          'Semilavorato (SL): componenti che subiscono una prima lavorazione interna e vengono poi assemblati o inviati a terzisti prima del montaggio finale.',
          'Prodotto Finito (PF): articolo pronto per essere imballato e spedito al cliente finale con il proprio prezzo di vendita.'
        ]
      },
      {
        titolo: 'Rettifica e Conteggio Fisico Inventario',
        descrizione:
          'Il pulsante "Rettifica / Inventario" permette di allineare la giacenza registrata con il conteggio reale fatto a scaffale, registrando causale e note per la tracciabilità di magazzino.'
      },
      {
        titolo: 'Composizione Distinta Base (BOM) ad Albero',
        descrizione:
          'All\'interno della scheda dettaglio di ogni articolo finito o semilavorato, puoi aggiungere i componenti necessari e il fattore di impiego (es. 1.2 kg o 0.35 m per pezzo finito).'
      },
      {
        titolo: 'Ciclo di Lavorazione Standard (Routing Fasi)',
        descrizione:
          'Stabilisce la roadmap che il pezzo deve seguire in officina. Per ogni fase si specifica: Sequenza (10, 20, 30...), Nome Operazione, Macchina/Centro di Lavoro, Tempo di Attrezzaggio (Setup in minuti) e Tempo Ciclo per singolo pezzo.'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Nuovo Articolo',
        effetto: 'Crea un nuovo codice a catalogo con scorta minima di riordino e lead time fornitore.'
      },
      {
        nome: 'Rettifica Giacenza (Icona Bilancia)',
        effetto: 'Apre la modale di variazione inventariale per aggiornare le quantità a magazzino.'
      },
      {
        nome: 'Filtro Rapido Tipo (Tutti / Finiti / Semilavorati / Materie Prime)',
        effetto: 'Filtra istantaneamente la lista per lavorare solo sui prodotti di interesse.'
      }
    ],
    faq: [
      {
        domanda: 'Cosa indica il badge rosso "SOTTO SCORTA"?',
        risposta:
          'Indica che la giacenza attuale a magazzino è inferiore al livello di sicurezza impostato. L\'MRP includerà automaticamente il pezzo tra gli ordini consigliati.'
      }
    ]
  },
  {
    id: 'ordini',
    numero: '03',
    titolo: 'Modulo Ordini Clienti & Simulatore Data Promessa (CTP)',
    sottotitolo: 'Portafoglio commesse, righe d\'ordine, anagrafica clienti e calcolo tempi',
    icona: ShoppingCart,
    colore: 'from-sky-500/20 to-indigo-500/10 border-sky-500/40 text-sky-400',
    badge: 'Commerciale & Vendite',
    descrizioneBreve:
      'Permette all\'ufficio vendite di caricare le commesse clienti e di rispondere con certezza alla domanda fondamentale: "Per che giorno possiamo consegnare questo lotto?".',
    flussoZero:
      'Menu "Ordini Clienti". Contiene sia l\'elenco ordini con il loro stato di evasione, sia la gestione anagrafica dei Clienti con partita IVA, contatti e sedi.',
    funzionalitaChiave: [
      {
        titolo: 'Creazione Ordine Cliente Multi-Riga',
        descrizione:
          'Un ordine può contenere più codici articolo diversi, ciascuno con la propria quantità richiesta e prezzo pattuito.',
        passaggi: [
          'Clicca "+ Nuovo Ordine Cliente".',
          'Seleziona il Cliente dalla lista a tendina (o crealo al volo dal tab Clienti).',
          'Imposta il Numero Ordine (es. OC-2026-088) e la Data Consegna Richiesta dal committente.',
          'Aggiungi uno o più articoli digitando nel selettore di ricerca interattivo.'
        ]
      },
      {
        titolo: 'Simulatore CTP (Capable-To-Promise) Intelligente',
        descrizione:
          'Prima di confermare l\'ordine, il simulatore CTP analizza in tempo reale le giacenze delle materie prime, i tempi di approvvigionamento fornitore, le ore di lavorazione necessarie e la coda attuale sulle macchine interessate, suggerendo la data di consegna minima realistica con buffer di sicurezza.'
      },
      {
        titolo: 'Tracciamento Stati Commerciali',
        descrizione:
          'L\'ordine attraversa automaticamente gli stati: Bozza → Confermato → In Produzione → Pronto Spedizione → Parzialmente Evaso → Evaso (tramite emissione DDT di vendita).'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Nuovo Ordine Cliente',
        effetto: 'Apre il form guidato con calcolatore date e selezione rapida articoli.'
      },
      {
        nome: 'Tab "Anagrafica Clienti"',
        effetto: 'Permette di gestire contatti, numeri telefonici, P.IVA e indirizzi di spedizione di ogni committente.'
      },
      {
        nome: 'Icona Camion DDT',
        effetto: 'Rimanda direttamente alla preparazione del documento di trasporto di spedizione per le quantità pronte.'
      }
    ],
    faq: [
      {
        domanda: 'Posso modificare un ordine dopo averlo confermato?',
        risposta:
          'Sì, puoi modificare quantità o data concordata finché non è stato completamente evaso con DDT.'
      }
    ]
  },
  {
    id: 'mrp',
    numero: '04',
    titolo: 'Modulo Fabbisogno Materiali (MRP) & Acquisti Anti-Doppio Ordine',
    sottotitolo: 'Esplosione fabbisogni, ordini fornitori guidati e ricezione merce a magazzino',
    icona: Layers,
    colore: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-400',
    badge: 'Ufficio Acquisti & Supply Chain',
    descrizioneBreve:
      'Il cervello logistico di MachinaFlow. Incrocia gli ordini clienti e di produzione con le giacenze attuali e le scorte minime, calcolando con precisione millimetrica cosa ordinare, a chi, per quale data limite e con quale valore economico stimato.',
    flussoZero:
      'Menu "Fabbisogno Materiali (MRP)". La tabella mostra ogni materiale con indicazione visiva dello stato: Critico (rosso), In Arrivo (blu), Attenzione o Sufficiente (verde).',
    funzionalitaChiave: [
      {
        titolo: 'Calcolo Fabbisogno Netto & Mancante Produzione',
        descrizione:
          'Distingue chiaramente tra il fabbisogno strettamente indispensabile per completare gli OdP in officina e il fabbisogno per reintegrare anche la scorta minima di sicurezza aziendale.'
      },
      {
        titolo: 'Sistema Anti-Doppio Ordine',
        descrizione:
          'Quando un responsabile acquisti clicca su "+ Ordina al Fornitore", la quantità ordinata passa subito nello stato "In Arrivo". Il sistema impedisce a un altro collega di riordinare lo stesso materiale per errore, mostrando il nome del fornitore già contattato e la data prevista di arrivo.'
      },
      {
        titolo: 'Data Limite Produzione ("Per Quando")',
        descrizione:
          'Indica esattamente il giorno in cui la prima macchina dell\'officina deve iniziare a tagliare quel lotto. Se la merce non arriva prima di quel giorno, la riga lampeggia in rosso per allertare gli acquisti a sollecitare la spedizione.'
      },
      {
        titolo: 'Ricezione Merce Rapida a Magazzino',
        descrizione:
          'Quando il corriere recapita le barre o i grezzi, il magazziniere clicca su "Ricevi Merce / Carica a Magazzino": la giacenza viene accreditata istantaneamente e l\'ordine fornitore viene archiviato come evaso.'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Ordina al Fornitore',
        effetto: 'Apre la modale di generazione ordine acquisto con quantità consigliata, fornitore abituale e date.'
      },
      {
        nome: 'Pulsante Sollecita / Modifica Ordine Fornitore',
        effetto: 'Permette di annotare un ritardo comunicato dal fornitore e aggiornare la data promessa di arrivo.'
      },
      {
        nome: 'Ricevi Merce (Icona Spunta / Camion)',
        effetto: 'Conferma l\'arrivo del materiale fisico a terra, incrementando la giacenza reale.'
      }
    ],
    faq: [
      {
        domanda: 'Cosa succede se il fornitore consegna meno materiale del previsto?',
        risposta:
          'Nella modale di ricezione puoi digitare l\'esatta quantità consegnata dal DDT fornitore: la rimanenza rimarrà aperta come fabbisogno residuo.'
      }
    ]
  },
  {
    id: 'produzione',
    numero: '05',
    titolo: 'Modulo Ordini di Produzione (OdP) & Scheda Lavoro A4',
    sottotitolo: 'Pianificazione esecutiva, priorità di lancio, lotti e scheda tecnica con QR Code',
    icona: Factory,
    colore: 'from-orange-500/20 to-red-500/10 border-orange-500/40 text-orange-400',
    badge: 'PCP & Avanzamento',
    descrizioneBreve:
      'Qui vengono gestiti i lotti di fabbricazione ufficiali (OdP). È il ponte tra la pianificazione d\'ufficio e le mani degli operatori sulle macchine utensili.',
    flussoZero:
      'Menu "Ordini di Produzione". Mostra l\'elenco degli ordini attivi, con barra di avanzamento percentuale delle fasi, date pianificate e priorità da 1 (Bassa) a 5 (Massima Urgenza).',
    funzionalitaChiave: [
      {
        titolo: 'Generazione OdP e Ciclo Esecutivo',
        descrizione:
          'Quando un OdP viene generato (manualmente o dall\'ordine cliente), MachinaFlow clona il ciclo standard dell\'articolo creando le singole fasi esecutive con tempi stimati personalizzabili per quel lotto.'
      },
      {
        titolo: 'Scheda Lavoro d\'Officina A4 con QR Code',
        descrizione:
          'Il documento cartaceo ufficiale da stampare e allegare al contenitore dei pezzi semilavorati lungo tutta la produzione.',
        passaggi: [
          'Contiene l\'intestazione con Codice OdP, Articolo, Quantità da produrre e Date.',
          'QR Code Univoco stampato in alto a destra: può essere scansionato con qualsiasi pistola barcode o fotocamera tablet per aprire istantaneamente l\'ordine sul terminale.',
          'Tabella fasi con caselle per firma operatore, data inizio/fine e note sui controlli dimensionali.'
        ]
      },
      {
        titolo: 'Tracciamento OdP Spediti',
        descrizione:
          'Non appena un ordine viene inserito in un DDT di vendita cliente, l\'OdP assume lo stato definitivo "Spedito", archiviandosi e lasciando libera la vista sui soli carichi aperti.'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Nuovo Ordine di Produzione',
        effetto: 'Crea un OdP manuale o di riassortimento scorta indicando articolo e quantità lotto.'
      },
      {
        nome: 'Stampa Scheda Lavoro A4 (Icona Stampante)',
        effetto: 'Apre l\'anteprima e la stampa diretta della scheda di viaggio ufficiale per l\'officina.'
      },
      {
        nome: 'Filtro Stato (Tutti / Pianificato / In Lavorazione / Completato / Spedito)',
        effetto: 'Isola gli ordini in base al loro grado di avanzamento produttivo.'
      }
    ],
    faq: [
      {
        domanda: 'Posso ristampare una scheda A4 se viene smarrita o sporcata d\'olio in officina?',
        risposta:
          'Certamente, puoi cliccare sull\'icona stampante in qualsiasi momento per produrre una nuova copia identica con lo stesso QR Code.'
      }
    ]
  },
  {
    id: 'officina',
    numero: '06',
    titolo: 'Modulo Terminale Officina Kiosk Touch & Gestione Scarti',
    sottotitolo: 'Interfaccia bordo macchina per operatori, login con PIN, scarti e rientro terzisti',
    icona: QrCode,
    colore: 'from-pink-500/20 to-rose-500/10 border-pink-500/40 text-pink-400',
    badge: 'Bordo Macchina',
    descrizioneBreve:
      'Schermata specificamente disegnata per tablet industriali o monitor touch montati a bordo macchina. I pulsanti sono sovradimensionati per l\'uso con guanti da lavoro e l\'interfaccia è priva di distrazioni contabili.',
    flussoZero:
      'Menu "Terminale Officina". All\'avvio presenta la schermata Kiosk per selezionare la specifica macchina su cui è fissato il tablet, protetta da codice PIN.',
    funzionalitaChiave: [
      {
        titolo: 'Associazione Tablet alla Macchina (Modalità Kiosk)',
        descrizione:
          'Ogni tablet si associa alla propria postazione (es. Tornio CNC 1, Fresa 5 Assi) oppure alla "Modalità Supervisore Capo Officina" che mostra la panoramica di tutte le macchine simultaneamente.',
        passaggi: [
          'Tocca la postazione desiderata e digita il PIN autorizzato (default di test: 123456).',
          'Il tablet rimane bloccato su quella postazione anche se la pagina viene ricaricata.',
          'Per cambiare macchina o disconnettere il terminale, tocca "Cambia Macchina (PIN)" in alto a destra.'
        ]
      },
      {
        titolo: 'Avanzamento Fasi di Lavoro (Start / Pausa / Stop)',
        descrizione:
          'L\'operatore tocca "Avvia Lavorazione" quando monta il pezzo in macchina (il timer comincia a calcolare i minuti effettivi) e "Completa Fase" a fine lotto. Se deve interrompere per cambio utensile o fine turno, tocca "Sospendi".'
      },
      {
        titolo: 'Registrazione Scarti & Autogenerazione OdP di Recupero',
        descrizione:
          'Se durante la lavorazione uno o più pezzi risultano non conformi o danneggiati:',
        passaggi: [
          'Tocca il pulsante rosso "Registra Scarto" sulla fase interessata.',
          'Indica il numero di pezzi scartati e la motivazione (es. rottura utensile, errore quota, difetto materiale).',
          'Scegli se creare automaticamente un nuovo OdP di recupero per compensare il pezzo mancante e non lasciare l\'ordine cliente incompleto.'
        ]
      },
      {
        titolo: 'Rientro Diretto Lavorazioni Conto Terzi',
        descrizione:
          'Se una fase è affidata a un terzista esterno (zincatura, verniciatura, tempra), l\'officina vede il pulsante rosa "Conferma Rientro Terzista": inserendo il numero di DDT di consegna del fornitore, la fase esterna viene chiusa e il lotto può passare alla fase interna successiva.'
      }
    ],
    bottoniEComandi: [
      {
        nome: 'Avvia Lavorazione (Pulsante Verde Play)',
        effetto: 'Porta la fase nello stato "in corso" e avvia il conteggio del tempo reale.'
      },
      {
        nome: 'Sospendi (Pulsante Giallo Pausa)',
        effetto: 'Mette in pausa la fase senza completarla (es. per pausa pranzo o attesa attrezzature).'
      },
      {
        nome: 'Completa Fase (Pulsante Verde Check)',
        effetto: 'Conclude definitivamente l\'operazione e rende il lotto pronto per la macchina successiva.'
      },
      {
        nome: 'Registra Scarto (Pulsante Rosso Fiamma/Forbice)',
        effetto: 'Apre la modale di non conformità con decurtazione pezzi e rilavorazione guidata.'
      },
      {
        nome: 'Vedi Scheda A4 Blindata (Icona Occhio)',
        effetto: 'Mostra il disegno e le quote della scheda lavoro senza mai uscire dall\'officina.'
      }
    ],
    faq: [
      {
        domanda: 'Qual è il PIN di default per sbloccare la postazione?',
        risposta:
          'Il codice predefinito di fabbrica è 123456. È modificabile dal responsabile nelle impostazioni.'
      },
      {
        domanda: 'Cosa accade se un operatore non tocca Completa Fase a fine lavoro?',
        risposta:
          'Il Capo Officina dalla modalità Supervisore può forzare la chiusura o la rettifica dei tempi della fase.'
      }
    ]
  },
  {
    id: 'spedizioni',
    numero: '07',
    titolo: 'Modulo Spedizioni & Documenti di Trasporto (DDT)',
    sottotitolo: 'DDT Clienti (vendita), DDT Esterni (conto terzi) e layout di stampa A4 conforme',
    icona: Truck,
    colore: 'from-violet-500/20 to-purple-500/10 border-violet-500/40 text-violet-400',
    badge: 'Logistica & Magazzino',
    descrizioneBreve:
      'Gestisce tutta la documentazione di accompagnamento merci in uscita dall\'officina: sia verso i clienti finali (evasione ordini), sia verso i partner esterni di trattamento galvanico o termico.',
    flussoZero:
      'Menu "Spedizioni & DDT Esterni". Comprende tre tab: "DDT Clienti", "DDT Conto Terzi" e "Fornitori Terzisti".',
    funzionalitaChiave: [
      {
        titolo: 'Emissione DDT Cliente Finale (Vendita/Evasione)',
        descrizione:
          'Permette di prelevare gli articoli prodotti e pronti a magazzino, associarli all\'ordine cliente e generare il documento fiscale di trasporto con colli, peso e vettore.',
        passaggi: [
          'Clicca "+ Emetti DDT Cliente".',
          'Seleziona il Cliente e l\'Ordine di riferimento.',
          'Seleziona gli OdP completati che fanno parte della spedizione.',
          'Compila causale (Vendita, Conto Visione, Sostituzione), vettore, numero colli e peso complessivo.'
        ]
      },
      {
        titolo: 'Emissione DDT Conto Terzi (Lavorazioni Esterne)',
        descrizione:
          'Quando un pezzo deve uscire per trattamenti (zincatura, brunitura, anodizzazione, tempra ad induzione):',
        passaggi: [
          'Seleziona il fornitore terzista specializzato.',
          'Il sistema precompila automaticamente le righe con il codice OdP, la quantità di semilavorati e le note tecniche di trattamento.',
          'Stampa la bolla in duplice copia da consegnare al trasportatore.'
        ]
      },
      {
        titolo: 'Layout di Stampa Ufficiale A4',
        descrizione:
          'Documento formale completo con logo aziendale, dati anagrafici, partita IVA, indicazione porto franco/assegnato, firme conducente e destinatario, conforme a tutte le normative di trasporto merci su strada.'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Nuovo DDT Cliente / + Nuovo DDT Conto Terzi',
        effetto: 'Apre il form di compilazione con calcolo automatico pesi e collegamenti OdP.'
      },
      {
        nome: 'Stampa Documento A4 (Icona Stampante)',
        effetto: 'Genera il layout tipografico pronto per la stampa laser o il salvataggio in PDF.'
      },
      {
        nome: 'Tab "Fornitori Terzisti"',
        effetto: 'Gestisce l\'anagrafica dei fornitori esterni con le relative specialità tecniche.'
      }
    ],
    faq: [
      {
        domanda: 'L\'emissione di un DDT cliente evade in automatico l\'ordine di vendita?',
        risposta:
          'Sì: se le quantità spedite coprono il totale dell\'ordine, questo passa a "Evaso"; se la spedizione è parziale, assume lo stato "Parzialmente Evaso".'
      }
    ]
  },
  {
    id: 'dashboard',
    numero: '08',
    titolo: 'Dashboard Generale & Matrice Carico Macchine',
    sottotitolo: 'KPI direzionali, OEE stimato, rispetto consegne e mappa dei buchi macchina',
    icona: LayoutDashboard,
    colore: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400',
    badge: 'Direzione & KPI',
    descrizioneBreve:
      'Il cruscotto centrale per titolari e responsabili di stabilimento. Riassume la salute operativa dell\'officina in tempo reale, evidenziando colli di bottiglia e macchine scariche su cui caricare nuovi lavori.',
    flussoZero:
      'Menu "Dashboard" (la schermata iniziale di MachinaFlow). Permette di navigare su orizzonti temporali flessibili: Oggi, Settimana Corrente, Mese, Trimestre o Semestre.',
    funzionalitaChiave: [
      {
        titolo: 'I 4 Indicatori Chiave di Prestazione (KPI)',
        descrizione: 'Monitorati costantemente dal motore di calcolo:',
        passaggi: [
          'Ordini Attivi in Produzione: totale OdP aperti e percentuale di avanzamento globale.',
          'Indice Puntualità Consegne (OTD): percentuale di ordini clienti con data concordata rispettata.',
          'Tasso Saturazione Macchine: rapporto percentuale tra ore pianificate e capacità teorica disponibile.',
          'Efficienza Globale Stimata (OEE): scostamento tra tempi preventivati e tempi effettivi registrati a bordo macchina.'
        ]
      },
      {
        titolo: 'Matrice "Buchi Macchina" & Calendario Carico Settimanale',
        descrizione:
          'Una griglia interattiva giorno per giorno (da Lunedì a Domenica) che colora ogni macchina in base al carico: verde (libera per nuovi ordini), giallo (carico ottimale), rosso (sovraccarica o collo di bottiglia).'
      }
    ],
    bottoniEComandi: [
      {
        nome: 'Selettore Orizzonte Temporale (Oggi / Settimana / Mese / Trimestre / Semestre)',
        effetto: 'Ricalcola all\'istante tutti i grafici e le percentuali di carico sul periodo selezionato.'
      },
      {
        nome: 'Frecce Navigazione Settimane (< / >)',
        effetto: 'Consente di viaggiare nel tempo per vedere come sarà caricata l\'officina tra 2, 4 o 8 settimane.'
      }
    ],
    faq: [
      {
        domanda: 'Cosa devo fare se una macchina è costantemente in rosso (>100% carico)?',
        risposta:
          'Significa che quella stazione è il collo di bottiglia dell\'officina: puoi aumentare la capacità oraria (es. straordinario/secondo turno) o dirottare le fasi verso un terzista esterno.'
      }
    ]
  },
  {
    id: 'superadmin',
    numero: '09',
    titolo: 'Modulo Super Admin & Gestione Multi-Tenant Officine',
    sottotitolo: 'Creazione clienti SaaS, inviti WhatsApp, modalità supporto e sospensione',
    icona: ShieldCheck,
    colore: 'from-amber-500/20 to-red-500/10 border-red-500/40 text-red-400',
    badge: 'Amministrazione SaaS',
    descrizioneBreve:
      'Riservato esclusivamente a te come proprietario di MachinaFlow. Da questa sezione puoi attivare nuovi clienti, generare i link di onboarding rapido e assistere le officine in tempo reale.',
    flussoZero:
      'Menu "Gestione Officine & Clienti" (accessibile solo da utenti con ruolo super_admin).',
    funzionalitaChiave: [
      {
        titolo: 'Creazione Nuova Officina Cliente & Invito WhatsApp Istantaneo',
        descrizione:
          'Quando chiudi un contratto con una nuova azienda meccanica:',
        passaggi: [
          'Clicca su "+ Nuova Officina / Cliente".',
          'Inserisci Ragione Sociale, Email del titolare, Telefono, P.IVA e Città.',
          'Il sistema genera automaticamente un ID univoco tenant (es. az-meccanica-abc) e un Token crittografato.',
          'Clicca su "Invia Invito su WhatsApp": si aprirà direttamente WhatsApp Web o Desktop con un messaggio di benvenuto precompilato contenente il link segreto per l\'impostazione della password iniziale.'
        ]
      },
      {
        titolo: 'Modalità Assistenza & Supporto Tecnico Remoto',
        descrizione:
          'Il pulsante con icona Cuffie / Assistenza permette al Super Admin di "impersonare" temporaneamente l\'officina cliente: l\'app mostrerà un banner arancione in alto e ti permetterà di vedere esattamente la schermata e i dati del cliente per aiutarlo a configurare macchine o sbloccare anomalie, senza chiedergli la sua password personale.'
      },
      {
        titolo: 'Sospensione e Disattivazione Account',
        descrizione:
          'Permette di congelare temporaneamente l\'accesso di un\'officina in caso di canone scaduto o di revocare l\'accesso mantenendo integri tutti i dati storici nel database.'
      }
    ],
    bottoniEComandi: [
      {
        nome: '+ Nuova Officina / Cliente',
        effetto: 'Crea un nuovo spazio aziendale isolato nel database multi-tenant.'
      },
      {
        nome: 'Invia Invito su WhatsApp (Icona Verde Messaggio)',
        effetto: 'Condivide il link di attivazione primo accesso al numero di cellulare del titolare.'
      },
      {
        nome: 'Accedi in Supporto (Icona Cuffie)',
        effetto: 'Entra nel gestionale con la vista del cliente selezionato per offrire supporto immediato.'
      },
      {
        nome: 'Sospendi / Riattiva (Icona Power)',
        effetto: 'Modifica lo stato dell\'azienda tra attiva e sospesa.'
      }
    ],
    faq: [
      {
        domanda: 'Se elimino un\'azienda dal Super Admin cosa succede ai suoi dati?',
        risposta:
          'La modale richiede conferma esplicita ed elimina l\'azienda, gli inviti e gli utenti associati proteggendo l\'integrità del database.'
      }
    ]
  }
]

export default function ManualePage() {
  const [ricerca, setRicerca] = useState('')
  const [sezioneApertaId, setSezioneApertaId] = useState<string | null>('onboarding-zero')

  // Filtro sezioni in base alla barra di ricerca
  const sezioniFiltrate = useMemo(() => {
    if (!ricerca.trim()) return SEZIONI_MANUALE
    const termine = ricerca.toLowerCase()
    return SEZIONI_MANUALE.filter(
      (s) =>
        s.titolo.toLowerCase().includes(termine) ||
        s.sottotitolo.toLowerCase().includes(termine) ||
        s.descrizioneBreve.toLowerCase().includes(termine) ||
        s.funzionalitaChiave.some(
          (f) =>
            f.titolo.toLowerCase().includes(termine) ||
            f.descrizione.toLowerCase().includes(termine)
        ) ||
        s.faq.some(
          (faq) =>
            faq.domanda.toLowerCase().includes(termine) ||
            faq.risposta.toLowerCase().includes(termine)
        )
    )
  }, [ricerca])

  const toggleSezione = (id: string) => {
    setSezioneApertaId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header Formale con Stampa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>MachinaFlow Enterprise v2.5</span>
            <span>•</span>
            <span>Manuale Operativo Ufficiale di Stabilimento</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-1 flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-orange-500" />
            Guida e Istruzioni Operative
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Documentazione tecnica completa per ciascun modulo: onboarding da zero, calcolo dei fabbisogni MRP, avanzamento bordo macchina touch, gestione scarti e documenti di trasporto (DDT).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all shadow-sm cursor-pointer hover:border-orange-500/40"
            title="Stampa o Salva PDF di tutto il manuale"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>Stampa / PDF Completo</span>
          </button>
        </div>
      </div>

      {/* Barra di Ricerca e Azioni Rapide */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            placeholder="Cerca argomento (es. scarto, PIN, BOM, terzista, MRP, CTP, DDT, WhatsApp)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all"
          />
          {ricerca && (
            <button
              onClick={() => setRicerca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              Azzera
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <span>Sezioni trovate: <strong className="text-white">{sezioniFiltrate.length}</strong></span>
          <span>•</span>
          <button
            onClick={() => setSezioneApertaId(sezioneApertaId === 'tutto' ? null : 'tutto')}
            className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-4 cursor-pointer"
          >
            {sezioneApertaId === 'tutto' ? 'Comprimi Tutte' : 'Espandi Tutte'}
          </button>
        </div>
      </div>

      {/* Griglia / Indice Rapido ad Icone */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {SEZIONI_MANUALE.map((sez) => {
          const Icona = sez.icona
          const isAttiva = sezioneApertaId === sez.id || sezioneApertaId === 'tutto'
          return (
            <button
              key={sez.id}
              onClick={() => {
                setSezioneApertaId(sez.id)
                const el = document.getElementById(sez.id)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                isAttiva
                  ? 'bg-slate-800 border-orange-500/60 shadow-lg shadow-orange-500/10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono font-bold text-slate-500">#{sez.numero}</span>
                <Icona className="w-4 h-4 text-orange-400 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-bold text-white line-clamp-1">{sez.titolo.replace(/Modulo |Guida di /g, '')}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sez.badge}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Sezioni del Manuale Espandibili */}
      <div className="space-y-6">
        {sezioniFiltrate.map((sez) => {
          const Icona = sez.icona
          const isAperta = sezioneApertaId === sez.id || sezioneApertaId === 'tutto'

          return (
            <div
              key={sez.id}
              id={sez.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isAperta
                  ? 'bg-slate-900/90 border-slate-700 shadow-xl'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Header Sezione Cliccabile */}
              <button
                onClick={() => toggleSezione(sez.id)}
                className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`p-3 rounded-xl border bg-gradient-to-br ${sez.colore} shrink-0`}>
                    <Icona className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-orange-400">SEZIONE {sez.numero}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {sez.badge}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">{sez.titolo}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">{sez.sottotitolo}</p>
                  </div>
                </div>

                <div className="shrink-0 p-2 text-slate-400 hover:text-white">
                  {isAperta ? <ChevronDown className="w-5 h-5 text-orange-400" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {/* Corpo Sezione */}
              {isAperta && (
                <div className="px-5 sm:px-6 pb-6 pt-2 space-y-6 border-t border-slate-800/80 text-sm">
                  {/* Descrizione Breve e Flusso Zero */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <p className="text-slate-300 leading-relaxed">{sez.descrizioneBreve}</p>
                    <div className="pt-2 border-t border-slate-800/60 flex items-start gap-2 text-xs text-orange-300">
                      <Info className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
                      <div>
                        <strong>Regola di Flusso:</strong> {sez.flussoZero}
                      </div>
                    </div>
                  </div>

                  {/* Funzionalità Chiave & Passaggi Operativi */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Funzionalità e Istruzioni Passo-Passo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sez.funzionalitaChiave.map((f, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2"
                        >
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-orange-400 text-xs flex items-center justify-center font-mono">
                              {fIdx + 1}
                            </span>
                            {f.titolo}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{f.descrizione}</p>
                          {f.passaggi && f.passaggi.length > 0 && (
                            <ul className="space-y-1.5 pt-2 text-xs text-slate-300">
                              {f.passaggi.map((p, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2">
                                  <span className="text-orange-400 font-bold shrink-0">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottoni, Icone e Comandi dell'Interfaccia */}
                  {sez.bottoniEComandi && sez.bottoniEComandi.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        Comandi e Pulsanti Disponibili nella Schermata
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {sez.bottoniEComandi.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="font-bold text-orange-300 font-mono">{b.nome}</div>
                            <div className="text-slate-400 text-[11px] leading-relaxed">{b.effetto}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQ & Risoluzione Problemi Comuni */}
                  {sez.faq && sez.faq.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-sky-400" />
                        Domande Frequenti & Risoluzione Problemi ("Cosa fare se...")
                      </h3>
                      <div className="space-y-2.5">
                        {sez.faq.map((item, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1"
                          >
                            <div className="font-semibold text-white text-xs flex items-center gap-2">
                              <span className="text-sky-400 font-bold">D:</span>
                              {item.domanda}
                            </div>
                            <div className="text-xs text-slate-400 pl-4 leading-relaxed">
                              <span className="text-emerald-400 font-bold mr-1">R:</span>
                              {item.risposta}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {sezioniFiltrate.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">Nessun argomento trovato</h3>
            <p className="text-xs text-slate-400 mt-1">
              Prova a cercare con un altro termine (es. &quot;MRP&quot;, &quot;scarto&quot;, &quot;macchina&quot;, &quot;PIN&quot;).
            </p>
          </div>
        )}
      </div>

      {/* Footer Guida e Note di Rilascio */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-slate-900 to-slate-900 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-bold text-white text-sm">MachinaFlow Supporto Tecnico Continuo</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Documento generato per il rilascio pilota alle prime officine clienti. Per chiarimenti o personalizzazioni sul flusso produttivo, contatta il Super Admin.
          </p>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer"
        >
          Torna all&apos;Inizio ↑
        </button>
      </div>
    </div>
  )
}
