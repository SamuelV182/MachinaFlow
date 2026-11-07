import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MachinaFlow • Il Software MES & Pianificazione per Officine Meccaniche',
  description:
    'Sostituisci fogli Excel, lavagne e ritardi. Pianifica la produzione meccanica, porta tablet touch a bordo macchina e gestisci MRP, scarti e terzisti con un tocco.',
  keywords: [
    'MES officina meccanica',
    'pianificazione produzione CNC',
    'gestionale lavorazioni meccaniche',
    'MRP officina',
    'conto terzi meccanica',
    'bordo macchina touch'
  ]
}

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-orange-500 selection:text-slate-950">
      {children}
    </div>
  )
}
