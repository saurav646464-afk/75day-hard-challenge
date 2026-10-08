'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/AppProvider'
import {
  getDayNumber, getDateForDay, CHALLENGE_DAYS, formatDisplayDate, diffDays, parseDate
} from '@/lib/challenge'
import { cn } from '@/lib/utils'

export default function CalendarScreen({ onDayTap }: { onDayTap: (day: number) => void }) {
  const { attempt, allLogs, today } = useApp()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  if (!attempt) return <div className="p-6 text-zinc-400">No active attempt</div>

  const logMap = new Map(allLogs.map(l => [l.log_date, l]))

  // Calculate day of week offset for the start date (Mo=0, Tu=1, ..., Fr=4, Sa=5, Su=6)
  const startJsDay = parseDate(attempt.start_date).getDay()
  const startOffset = (startJsDay + 6) % 7

  const getDayStatus = (day: number) => {
    const date = getDateForDay(attempt.start_date, day)
    const log = logMap.get(date)
    const diff = diffDays(today, date)

    if (diff > 0) return 'upcoming'
    if (date === today) return 'today'
    if (log?.completed && log.day_type === 'match') return 'match'
    if (log?.completed) return 'completed'
    if (diff < 0) return 'failed'
    return 'upcoming'
  }

  const selectedLog = selectedDay
    ? logMap.get(getDateForDay(attempt.start_date, selectedDay))
    : null

  return (
    <div className="p-4 pb-8 space-y-4">
      <h2 className="text-xl font-black text-white">Challenge Calendar</h2>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
        {[
          { color: 'bg-orange-500', label: 'Done' },
          { color: 'bg-amber-500', label: 'Match' },
          { color: 'bg-red-800', label: 'Missed' },
          { color: 'bg-zinc-800', label: 'Upcoming' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs font-semibold text-zinc-300">{label}</span>
          </div>
        ))}
      </div>

      {/* Weekday column headers (Mo to Su) */}
      <div className="grid grid-cols-7 gap-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-xs text-orange-500 font-bold py-1">{d}</div>
        ))}
      </div>

      {/* 75 day grid aligned to actual calendar weekdays */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Empty padding slots to align Day 1 under its actual weekday */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="cal-day opacity-0 pointer-events-none" />
        ))}

        {/* Day 1 to 75 */}
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
                'cal-day relative border transition-all',
                status === 'completed' && 'bg-orange-500/20 border-orange-500/40 text-orange-400 font-bold',
                status === 'match' && 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold',
                status === 'failed' && 'bg-red-950/40 border-red-900/40 text-red-400',
                status === 'upcoming' && 'bg-zinc-900 border-zinc-800 text-zinc-600',
                status === 'today' && 'bg-zinc-800 border-zinc-700 text-white',
                isToday && 'ring-2 ring-orange-500 ring-offset-1 ring-offset-zinc-950',
                isSelected && 'ring-2 ring-white',
              )}
              aria-label={`Day ${day}: ${formatDisplayDate(date)}`}
            >
              <span>{day}</span>
              {status === 'completed' && (
                <span className="absolute bottom-0.5 right-1 text-[9px] text-orange-400 font-black">✓</span>
              )}
              {status === 'match' && (
                <span className="absolute bottom-0.5 right-1 text-[9px]">🏏</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day details card */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white text-lg">Day {selectedDay}</span>
            <span className="text-sm font-semibold text-orange-400">
              {formatDisplayDate(getDateForDay(attempt.start_date, selectedDay))}
            </span>
          </div>
          {selectedLog ? (
            <div className="space-y-1">
              <div className={cn(
                'text-sm font-bold',
                selectedLog.completed
                  ? 'text-orange-400'
                  : 'text-red-400'
              )}>
                {selectedLog.completed
                  ? selectedLog.day_type === 'match' ? '🏏 Match Day — Completed' : '✅ Completed'
                  : '❌ Not Completed'}
              </div>
              {selectedLog.batting_balls > 0 && (
                <p className="text-xs text-zinc-400">Batting: {selectedLog.batting_balls} balls</p>
              )}
              {selectedLog.water_ml > 0 && (
                <p className="text-xs text-zinc-400">Water: {selectedLog.water_ml}ml</p>
              )}
              {selectedLog.sleep_hours > 0 && (
                <p className="text-xs text-zinc-400">Sleep: {selectedLog.sleep_hours}h</p>
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
