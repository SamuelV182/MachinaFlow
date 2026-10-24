import { Suspense } from 'react'
import { SchedaLavoroClient } from './SchedaLavoroClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SchedaLavoroPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Generazione scheda di lavorazione con QR Code in corso...</p>
        </div>
      }
    >
      <SchedaLavoroWrapper params={params} />
    </Suspense>
  )
}

async function SchedaLavoroWrapper({ params }: PageProps) {
  const { id } = await params
  return <SchedaLavoroClient odpId={id} />
}
