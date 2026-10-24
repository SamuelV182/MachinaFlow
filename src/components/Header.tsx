'use client'

import { Bell, Calendar, UserCheck, PanelLeft, PanelLeftClose, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  isSidebarCollassata?: boolean
  onToggleSidebar?: () => void
}

export function Header({ isSidebarCollassata = false, onToggleSidebar }: HeaderProps) {
  const router = useRouter()
  const [dataCorrente, setDataCorrente] = useState('')
  const [utenteEmail, setUtenteEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUtenteEmail(user.email)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    const formattaData = () => {
      const oggi = new Date()
      setDataCorrente(
        oggi.toLocaleDateString('it-IT', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      )
    }
    formattaData()
  }, [])

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Sinistra: Spacer mobile o Bottone Collasso Sidebar su Desktop */}
      <div className="flex items-center gap-3">
        {/* Spacer for mobile hamburger */}
        <div className="w-10 lg:hidden" />

        {/* Pulsante Apri / Chiudi Menu Laterale per Desktop */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer group"
            title={isSidebarCollassata ? 'Espandi menu laterale (Ctrl+B)' : 'Nascondi menu laterale (Ctrl+B)'}
          >
            {isSidebarCollassata ? (
              <>
                <PanelLeft className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Mostra Menu</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">Compatto</span>
              </>
            )}
          </button>
        )}

        {/* Titolo di contesto stabilimento */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-orange-400 border border-slate-700 hidden sm:inline-block">
            Stabilimento Principale (Lucca)
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {dataCorrente && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="capitalize">{dataCorrente}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200">
              {utenteEmail ? utenteEmail.split('@')[0] : 'Capo Officina'}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
              {utenteEmail || 'Pianificazione & MES'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Disconnetti (Logout)"
            className="ml-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
