'use client'

import { Check, AlertCircle, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

export default function SaveIndicator({ status }: { status: Status }) {
  if (status === 'idle') return null

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
        'toast-enter transition-all',
        status === 'saving' && 'bg-zinc-800 text-zinc-300',
        status === 'saved' && 'bg-emerald-900/80 text-emerald-400',
        status === 'error' && 'bg-red-900/80 text-red-400',
        status === 'offline' && 'bg-amber-900/80 text-amber-400',
      )}
    >
      {status === 'saving' && (
        <><div className="w-3 h-3 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />Saving...</>
      )}
      {status === 'saved' && (<><Check size={12} />Saved</>)}
      {status === 'error' && (<><AlertCircle size={12} />Save failed</>)}
      {status === 'offline' && (<><Wifi size={12} />Offline - will sync</>)}
    </div>
  )
}
