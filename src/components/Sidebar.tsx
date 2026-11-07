'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MachinaFlowLogo } from './MachinaFlowLogo'
import {
  LayoutDashboard,
  Factory,
  ShoppingCart,
  Boxes,
  Cpu,
  Layers,
  Wrench,
  QrCode,
  CheckCircle2,
  Menu,
  X,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Building2,
  ShieldCheck,
  Eye,
  Truck
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Voci di navigazione per le Officine Meccaniche Clienti
const menuOfficinaItems = [
  {
    name: 'Dashboard Carico & KPI',
    href: '/',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Ordini di Produzione',
    href: '/produzione',
    icon: Factory,
    badge: 'OdP'
  },
  {
    name: 'Ordini Clienti',
    href: '/ordini',
    icon: ShoppingCart,
    badge: null
  },
  {
    name: 'Fabbisogno Materiali (MRP)',
    href: '/mrp',
    icon: Layers,
    badge: null
  },
  {
    name: 'Articoli, BOM e Cicli',
    href: '/articoli',
    icon: Boxes,
    badge: null
  },
  {
    name: 'Processi & Macchine',
    href: '/processi-macchine',
    icon: Cpu,
    badge: 'Setup'
  },
  {
    name: 'Terminale Officina',
    href: '/officina',
    icon: QrCode,
    badge: 'Touch'
  },
  {
    name: 'Spedizioni & DDT Esterni',
    href: '/spedizioni',
    icon: Truck,
    badge: 'DDT'
  },
  {
    name: 'Manuale Utente',
    href: '/manuale',
    icon: FileText,
    badge: 'Guida'
  }
]

// Voci di navigazione riservate ESCLUSIVAMENTE al Super Admin
const menuSuperAdminItems = [
  {
    name: 'Gestione Officine & Clienti',
    href: '/super-admin',
    icon: Building2,
    badge: 'SaaS'
  },
  {
    name: 'Manuale Utente',
    href: '/manuale',
    icon: FileText,
    badge: 'Guida'
  }
]

interface SidebarProps {
  isCollassata?: boolean
  onToggleCollassata?: () => void
}

export function Sidebar({ isCollassata = false, onToggleCollassata }: SidebarProps) {
  const pathname = usePathname()
  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 1. Carica subito dalla cache per rendere il menu istantaneo
    try {
      const cachedRuolo = localStorage.getItem('machinaflow_session_ruolo')
      if (cachedRuolo === 'super_admin') {
        setIsSuperAdmin(true)
      } else if (cachedRuolo) {
        setIsSuperAdmin(false)
      }
    } catch {}

    const verificaRuolo = async () => {
      // Se è attiva la modalità supporto impersonando un'officina cliente, mostra il menu completo dell'officina
      try {
        const modalitaSupporto = localStorage.getItem('machinaflow_supporto_azienda_id')
        if (modalitaSupporto) {
          setIsSuperAdmin(false)
          return
        }
      } catch {}

      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (user) {
          // Controlla il ruolo sul profilo
          const { data: profilo } = await supabase
            .from('profili_utenti')
            .select('ruolo')
            .eq('id', user.id)
            .single()

          if (profilo?.ruolo === 'super_admin' || user.email?.includes('admin')) {
            setIsSuperAdmin(true)
            try {
              localStorage.setItem('machinaflow_session_ruolo', 'super_admin')
            } catch {}
          } else {
            setIsSuperAdmin(false)
            try {
              localStorage.setItem('machinaflow_session_ruolo', profilo?.ruolo || 'operatore')
            } catch {}
          }
        }
      } catch {
        setIsSuperAdmin(false)
      }
    }

    verificaRuolo()
  }, [supabase])

  // Seleziona il menu appropriato
  const items = isSuperAdmin ? menuSuperAdminItems : menuOfficinaItems

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 shadow-md hover:bg-slate-800 focus:outline-none cursor-pointer"
          aria-label="Apri menu di navigazione"
        >
          {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay Mobile */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out w-72 ${
          isOpenMobile
            ? 'translate-x-0'
            : isCollassata
            ? '-translate-x-full'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href={isSuperAdmin ? '/super-admin' : '/'} className="group" onClick={() => setIsOpenMobile(false)}>
            <MachinaFlowLogo
              dimensione={36}
              variante={isSuperAdmin ? 'superadmin' : 'default'}
              sottotitolo={isSuperAdmin ? 'Pannello Super Admin' : 'PCP & MES Industriale'}
            />
          </Link>

          {/* Bottone Collasso per Desktop */}
          {onToggleCollassata && (
            <button
              onClick={onToggleCollassata}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Nascondi menu laterale (libera spazio)"
              aria-label="Nascondi menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Kiosk Access Banner (Visibile solo per le Officine) */}
        {!isSuperAdmin && (
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/officina"
              onClick={() => setIsOpenMobile(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-orange-600/20 to-amber-600/10 border border-orange-500/30 hover:border-orange-500/60 transition-all text-orange-400 group"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-orange-300 leading-tight">Modo Touch Officina</div>
                  <div className="text-[10px] text-slate-400">Scansione QR / Avanzamento</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-slate-950">
                MES
              </span>
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpenMobile(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                  isActive
                    ? isSuperAdmin
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                      : 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? isSuperAdmin
                          ? 'bg-sky-700/80 text-sky-100'
                          : 'bg-orange-700/80 text-orange-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Info / Sistema & Autore */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-200 block text-[11px]">Produzione Attiva</span>
                <p className="text-[10px] text-slate-500">MachinaFlow v2.5</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              Ctrl+B
            </span>
          </div>

          <div className="pt-1 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Powered by</span>
            <a
              href="https://vsdigitalcreations.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400/80 hover:text-orange-300 font-semibold transition-colors"
            >
              VS Digital Creations
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
