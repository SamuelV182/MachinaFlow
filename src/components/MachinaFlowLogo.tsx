import Image from 'next/image'

interface MachinaFlowLogoProps {
  className?: string
  dimensione?: number
  mostraSottotitolo?: boolean
  sottotitolo?: string
  variante?: 'default' | 'superadmin'
}

export function MachinaFlowLogo({
  className = '',
  dimensione = 36,
  mostraSottotitolo = true,
  sottotitolo = 'PCP & MES Industriale',
  variante = 'default'
}: MachinaFlowLogoProps) {
  const isSuper = variante === 'superadmin'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icona Ufficiale dell'App (icon.svg / PWA) pulita senza contornatura né sfondo */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: dimensione, height: dimensione }}
      >
        <Image
          src="/icon.svg"
          alt="MachinaFlow Logo"
          width={dimensione}
          height={dimensione}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Testo Brand Ufficiale */}
      <div className="flex flex-col text-left min-w-0">
        <span className="text-lg font-bold tracking-tight text-white flex items-center leading-none whitespace-nowrap">
          Machina<span className={isSuper ? 'text-sky-400' : 'text-orange-500'}>Flow</span>
        </span>
        {mostraSottotitolo && (
          <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-400 block mt-1 leading-none whitespace-nowrap">
            {sottotitolo}
          </span>
        )}
      </div>
    </div>
  )
}
