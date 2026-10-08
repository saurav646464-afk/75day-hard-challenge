'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/components/AppProvider'
import { Camera, Scale } from 'lucide-react'
import dynamic from 'next/dynamic'
import { compressImage } from '@/lib/utils'

const WeightChart = dynamic(() => import('@/components/ui/WeightChart'), {
  loading: () => <div className="skeleton h-40 rounded-xl" />,
  ssr: false,
})

interface PhotoItem {
  id: string
  url: string
  date: string
  weight_kg: number | null
}

export default function ProgressScreen() {
  const { checkins, attempt } = useApp()
  const supabase = createClient()
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [compareMode, setCompareMode] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [checkins])

  async function loadPhotos() {
    const withPhotos = checkins.filter(c => c.photo_path)
    const loaded: PhotoItem[] = []
    for (const c of withPhotos) {
      const { data } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(c.photo_path!, 3600)
      if (data?.signedUrl) {
        loaded.push({
          id: c.id,
          url: data.signedUrl,
          date: c.checkin_date,
          weight_kg: c.weight_kg,
        })
      }
    }
    setPhotos(loaded)
  }

  const weightData = checkins
    .filter(c => c.weight_kg != null)
    .map(c => ({ date: c.checkin_date, weight: Number(c.weight_kg) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const firstPhoto = photos[0]
  const latestPhoto = photos[photos.length - 1]

  return (
    <div className="p-4 pb-8 space-y-6">
      <h2 className="text-xl font-bold text-white">Progress</h2>

      {/* Weight chart */}
      {weightData.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Weight Over Time</h3>
          </div>
          <WeightChart data={weightData} />
          <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
            <span>Start: {weightData[0]?.weight}kg</span>
            <span>Latest: {weightData[weightData.length - 1]?.weight}kg</span>
            {weightData.length > 1 && (
              <span className={
                weightData[weightData.length - 1].weight < weightData[0].weight
                  ? 'text-emerald-400' : 'text-red-400'
              }>
                {(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)}kg
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-2xl p-8 text-center">
          <Scale size={32} className="text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">No weight data yet. Complete a Sunday check-in to start tracking.</p>
        </div>
      )}

      {/* Side by side compare */}
      {photos.length >= 2 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">First vs Latest</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <img src={firstPhoto.url} alt="First check-in" className="w-full rounded-xl object-cover aspect-square" />
              <p className="text-xs text-zinc-500 text-center mt-1">{firstPhoto.date}</p>
            </div>
            <div>
              <img src={latestPhoto.url} alt="Latest check-in" className="w-full rounded-xl object-cover aspect-square" />
              <p className="text-xs text-zinc-500 text-center mt-1">{latestPhoto.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* Photo gallery */}
      {photos.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Progress Photos</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map(photo => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.url}
                  alt={`Check-in ${photo.date}`}
                  className="w-full rounded-xl object-cover aspect-square"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-xl p-1">
                  <p className="text-[9px] text-zinc-300 text-center leading-tight">{photo.date}</p>
                  {photo.weight_kg && (
                    <p className="text-[9px] text-emerald-400 text-center">{photo.weight_kg}kg</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-2xl p-8 text-center">
          <Camera size={32} className="text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Photos will appear here after weekly check-ins.</p>
        </div>
      )}
    </div>
  )
}
