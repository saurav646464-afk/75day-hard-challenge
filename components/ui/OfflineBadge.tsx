'use client'

import { useApp } from '@/components/AppProvider'

export default function OfflineBadge() {
  const { isOnline } = useApp()
  if (isOnline) return null
  return (
    <div className="offline-badge">
      📵 Offline — will sync
    </div>
  )
}
