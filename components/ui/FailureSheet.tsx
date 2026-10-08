'use client'

import { AlertTriangle } from 'lucide-react'

interface FailureSheetProps {
  failureInfo: { failedOnDay: number; reason: string } | null
  onConfirm: () => void
  onDismiss: () => void
}

export default function FailureSheet({ failureInfo, onConfirm, onDismiss }: FailureSheetProps) {
  if (!failureInfo) return null

  return (
    <div className="bottom-sheet-overlay" onClick={onDismiss}>
      <div className="bottom-sheet p-6 sheet-enter" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-center text-white mb-2">Challenge Failed</h2>
        <p className="text-zinc-400 text-center text-sm mb-1">
          Failed on Day {failureInfo.failedOnDay}
        </p>
        <p className="text-zinc-500 text-center text-xs mb-6 px-4">{failureInfo.reason}</p>
        <p className="text-zinc-300 text-center text-sm mb-6">
          Restart from Day 1 — starting <strong>today</strong>.
          Your old data is saved in History.
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg active:bg-emerald-600 transition-colors"
          >
            Restart Challenge 💪
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-2xl bg-zinc-800 text-zinc-400 font-medium active:bg-zinc-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
