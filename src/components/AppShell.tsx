'use client'

import { Suspense, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Headphones, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isModalitaOperatoreKiosk, setIsModalitaOperatoreKiosk] = useState(false)
  const [isSidebarCollassata, setIsSidebarCollassata] = useState(false)
  const [supportoAziendaNome, setSupportoAziendaNome] = useState<string | null>(null)

  // Inizializza lo stato della sidebar da localStorage
  useEffect(() => {
    try {
      const salvata = localStorage.getItem('machinaflow_sidebar_collassata')
      if (salvata === 'true') {
        setIsSidebarCollassata(true)
      }
    } catch {
      // Ignora errori di parsing
    }
  }, [])

  // Toggle collasso con persistenza in localStorage
  const handleToggleSidebar = () => {
    setIsSidebarCollassata((prev) => {
      const nuovoStato = !prev
      try {
        localStorage.setItem('machinaflow_sidebar_collassata', String(nuovoStato))
      } catch {
        // Ignora errori
      }
      return nuovoStato
    })
  }

  // Scorciatoia da tastiera Ctrl+B per nascondere/mostrare la sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        handleToggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const verificaModalitaKiosk = () => {
      // Verifica se siamo in modalità supporto impersonando un'officina cliente
      try {
        const azNome = localStorage.getItem('machinaflow_supporto_azienda_nome')
        const azId = localStorage.getItem('machinaflow_supporto_azienda_id')
        if (azId) {
          setSupportoAziendaNome(azNome || 'Officina Cliente')
        } else {
          setSupportoAziendaNome(null)
        }
      } catch {
        setSupportoAziendaNome(null)
      }

      // Se non siamo nella pagina officina, mostra sempre il menu completo da Capo Officina
      if (pathname !== '/officina') {
        setIsModalitaOperatoreKiosk(false)
        return
      }

      // Nella pagina officina: controlla se il tablet è associato a una specifica macchina (non supervisore)
      // oppure se si trova nella schermata iniziale di login postazione
      try {
        const postazione = localStorage.getItem('machinaflow_postazione_corrente_id')
        if (postazione === 'supervisore') {
          // Il Capo Officina ha pieno accesso al menu laterale
          setIsModalitaOperatoreKiosk(false)
        } else {
          // L'operatore su macchina (o tablet da configurare) è a tutto schermo senza menu
          setIsModalitaOperatoreKiosk(true)
        }
      } catch {
        setIsModalitaOperatoreKiosk(false)
      }
    }

    verificaModalitaKiosk()

    // Ascolta cambi nello storage locale (es. login o logout macchina)
    const handleStorageChange = () => verificaModalitaKiosk()
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(verificaModalitaKiosk, 800)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [pathname])

  // Se siamo nella pagina di login o imposta-password, mostra solo la pagina senza menu né header
  if (pathname === '/login' || pathname === '/imposta-password') {
    return <>{children}</>
  }

  // Se siamo in modalità Operatore a Bordo Macchina: layout pulito a tutto schermo (Full Kiosk)
  if (isModalitaOperatoreKiosk) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    )
  }

  // Layout Standard Gestionale / Capo Officina (con Sidebar laterale e Header)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased print:bg-white print:text-black print:min-h-0">
      {/* Sidebar Laterale */}
      <Sidebar
        isCollassata={isSidebarCollassata}
        onToggleCollassata={handleToggleSidebar}
      />

      {/* Area Contenuto Destra (con transizione fluida del padding sinistro) */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out print:pl-0 print:min-h-0 ${
          isSidebarCollassata ? 'lg:pl-0' : 'lg:pl-72'
        }`}
      >
        {/* Banner Sticky Super Admin Modalità Supporto */}
        {supportoAziendaNome && (
          <aside aria-label="Banner modalità supporto" className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-lg border-b border-amber-600/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="p-1.5 bg-slate-950/15 rounded-lg flex items-center justify-center">
                <Headphones className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </span>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 flex-wrap">
                <span>MODALITÀ SUPPORTO ATTIVA:</span>
                <span className="font-extrabold underline decoration-slate-950/40">
                  {supportoAziendaNome}
                </span>
                <span className="hidden md:inline font-normal text-slate-900 text-xs">
                  (Visualizzazione identica all&apos;ambiente cliente)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                try {
                  localStorage.removeItem('machinaflow_supporto_azienda_id')
                  localStorage.removeItem('machinaflow_supporto_azienda_nome')
                } catch {}
                setSupportoAziendaNome(null)
                router.push('/super-admin')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Torna al Super Admin</span>
            </button>
          </aside>
        )}

        <Header
          isSidebarCollassata={isSidebarCollassata}
          onToggleSidebar={handleToggleSidebar}
        />
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto transition-all print:p-0 print:m-0 print:max-w-full ${
            isSidebarCollassata ? 'max-w-[1550px]' : 'max-w-7xl'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
        <main className="flex-1 p-4 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    }>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  )
}
