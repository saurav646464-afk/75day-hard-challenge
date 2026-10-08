'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/AppProvider'
import {
  getDayNumber, getDateForDay, CHALLENGE_DAYS, formatDisplayDate, diffDays
} from '@/lib/challenge'
import { cn } from '@/lib/utils'

export default function CalendarScreen({ onDayTap }: { onDayTap: (day: number) => void }) {
  const { attempt, allLogs, today, todayDayNum, taskConfig } = useApp()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  if (!attempt) return <div className="p-6 text-zinc-400">No active attempt</div>

  const logMap = new Map(allLogs.map(l => [l.log_date, l]))

  const getDayStatus = (day: number) => {
    const date = getDateForDay(attempt.start_date, day)
    const dayNum = getDayNumber(attempt.start_date, date)
    const log = logMap.get(date)
    const diff = diffDays(today, date)

    if (diff > 0) return 'upcoming'
    if (date === today) return 'today'
    if (log?.completed && log.day_type === 'match') return 'match'
    if (log?.completed) return 'completed'
    if (diff < 0) return 'failed' // past and not completed
    return 'upcoming'
  }

  const selectedLog = selectedDay
    ? logMap.get(getDateForDay(attempt.start_date, selectedDay))
    : null

  return (
    <div className="p-4 pb-8">
      <h2 className="text-xl font-bold text-white mb-4">Challenge Calendar</h2>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mb-4">
        {[
          { color: 'bg-emerald-500', label: 'Done' },
          { color: 'bg-orange-500', label: 'Match' },
          { color: 'bg-red-800', label: 'Missed' },
          { color: 'bg-zinc-700', label: 'Upcoming' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-xs text-zinc-600 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* 75 day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: CHALLENGE_DAYS }, (_, i) => {
          const day = i + 1
          const date = getDateForDay(attempt.start_date, day)
          const status = getDayStatus(day)
          const isSelected = selectedDay === day
          const isToday = date === today

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={cn(
                'cal-day relative',
                status === 'completed' && 'bg-emerald-900/60 text-emerald-300',
                status === 'match' && 'bg-orange-900/60 text-orange-300',
                status === 'failed' && 'bg-red-900/40 text-red-400',
                status === 'upcoming' && 'bg-zinc-900 text-zinc-600',
                status === 'today' && 'bg-zinc-800 text-white',
                isToday && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-950',
                isSelected && 'ring-2 ring-white',
              )}
              aria-label={`Day ${day}: ${formatDisplayDate(date)}`}
            >
              <span className="text-sm font-medium">{day}</span>
              {status === 'completed' && (
                <span className="absolute bottom-0.5 right-0.5 text-[8px]">✓</span>
              )}
              {status === 'match' && (
                <span className="absolute bottom-0.5 right-0.5 text-[8px]">🏏</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Day detail card */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white">Day {selectedDay}</span>
            <span className="text-sm text-zinc-400">
              {formatDisplayDate(getDateForDay(attempt.start_date, selectedDay))}
            </span>
          </div>
          {selectedLog ? (
            <div className="space-y-1">
              <div className={cn(
                'text-sm font-semibold',
                selectedLog.completed
                  ? selectedLog.day_type === 'match' ? 'text-orange-400' : 'text-emerald-400'
                  : 'text-red-400'
              )}>
                {selectedLog.completed
                  ? selectedLog.day_type === 'match' ? '🏏 Match Day — Completed' : '✅ Completed'
                  : '❌ Not Completed'}
              </div>
              {selectedLog.batting_balls > 0 && (
                <p className="text-xs text-zinc-500">Batting: {selectedLog.batting_balls} balls</p>
              )}
              {selectedLog.water_ml > 0 && (
                <p className="text-xs text-zinc-500">Water: {selectedLog.water_ml}ml</p>
              )}
              {selectedLog.sleep_hours > 0 && (
                <p className="text-xs text-zinc-500">Sleep: {selectedLog.sleep_hours}h</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              {diffDays(today, getDateForDay(attempt.start_date, selectedDay)) > 0
                ? 'Upcoming — not started yet'
                : 'No log recorded for this day'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
