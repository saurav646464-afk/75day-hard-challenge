'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/utils'
import { Camera, Check, Loader } from 'lucide-react'

interface WeeklyCheckinCardProps {
  attemptId: string
  date: string
  required: boolean
  readonly?: boolean
}

export default function WeeklyCheckinCard({ attemptId, date, required, readonly }: WeeklyCheckinCardProps) {
  const supabase = createClient()
  const [weight, setWeight] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadCheckin()
  }, [date, attemptId])

  async function loadCheckin() {
    const { data } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('checkin_date', date)
      .maybeSingle()
    if (data) {
      setWeight(data.weight_kg?.toString() || '')
      if (data.photo_path) {
        const { data: signed } = await supabase.storage
          .from('progress-photos')
          .createSignedUrl(data.photo_path, 3600)
        setPhotoUrl(signed?.signedUrl || null)
      }
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('weekly_checkins').upsert({
        user_id: user.id,
        attempt_id: attemptId,
        checkin_date: date,
        weight_kg: weight ? parseFloat(weight) : null,
      }, { onConflict: 'attempt_id,checkin_date' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const blob = await compressImage(file, 1000)
      const path = `${user.id}/${date}-checkin.jpg`
      const { error } = await supabase.storage
        .from('progress-photos')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (!error) {
        await supabase.from('weekly_checkins').upsert({
          user_id: user.id,
          attempt_id: attemptId,
          checkin_date: date,
          weight_kg: weight ? parseFloat(weight) : null,
          photo_path: path,
        }, { onConflict: 'attempt_id,checkin_date' })
        await loadCheckin()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-orange-500 uppercase tracking-wider">📅 Weekly Sunday Check-in</h3>
        {required && <span className="text-xs font-bold text-red-400 bg-red-950/60 border border-red-900/60 px-2.5 py-0.5 rounded-full">Required</span>}
      </div>

      {photoUrl && (
        <img src={photoUrl} alt="Progress photo" className="w-full rounded-xl mb-4 object-cover max-h-48 border border-zinc-800" />
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-400 mb-1 block">Body Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            disabled={readonly}
            placeholder="e.g. 72.5"
            className="w-full bg-zinc-800 rounded-xl px-4 h-12 text-white text-lg font-bold border border-zinc-700 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {!readonly && (
          <>
            <label className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-300 text-sm font-bold cursor-pointer active:border-orange-500 transition-colors bg-zinc-800/50">
              {loading ? <Loader size={16} className="animate-spin text-orange-400" /> : <Camera size={16} className="text-orange-400" />}
              <span>{loading ? 'Uploading photo...' : 'Take / Upload Photo'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold active:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
              {saved ? 'Saved!' : 'Save Check-in'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
