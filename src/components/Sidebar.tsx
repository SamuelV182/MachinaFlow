'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Eye
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
    name: 'Accedi ad Officina Pilota',
    href: '/',
    icon: Eye,
    badge: 'Supporto'
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
    const verificaRuolo = async () => {
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
          } else {
            setIsSuperAdmin(false)
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
          <Link href={isSuperAdmin ? '/super-admin' : '/'} className="flex items-center gap-3 group" onClick={() => setIsOpenMobile(false)}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${
              isSuperAdmin 
                ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 shadow-sky-500/20' 
                : 'bg-gradient-to-tr from-amber-600 to-orange-500 shadow-orange-500/20'
            }`}>
              {isSuperAdmin ? <ShieldCheck className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Machina<span className={isSuperAdmin ? 'text-sky-400' : 'text-orange-500'}>Flow</span>
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-400 block -mt-1">
                {isSuperAdmin ? 'Pannello Super Admin' : 'PCP & MES Industriale'}
              </span>
            </div>
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

        {/* Footer Info / Sistema */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200 block text-[11px]">Produzione Attiva</span>
              <p className="text-[10px] text-slate-500">MachinaFlow v1.0.0</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Ctrl+B
          </span>
        </div>
      </aside>
    </>
  )
}
