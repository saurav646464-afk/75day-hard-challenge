'use client'

import React, { useMemo } from 'react'
import { useApp } from '@/components/AppProvider'
import { aggregateStats, getDateForDay, getWeekDayRange } from '@/lib/challenge'
import { Flame, Target, Dumbbell, Moon, Trophy } from 'lucide-react'
import dynamic from 'next/dynamic'

const BattingBarChart = dynamic(() => import('@/components/ui/BattingBarChart'), {
  loading: () => <div className="skeleton h-40 rounded-xl" />,
  ssr: false,
})

export default function StatsScreen() {
  const { allLogs, attempt, today, todayDayNum } = useApp()

  const stats = useMemo(() => {
    if (!attempt) return null
    return aggregateStats(allLogs, attempt.start_date, today)
  }, [allLogs, attempt, today])

  const weeklyGymData = useMemo(() => {
    if (!attempt) return []
    const totalWeeks = Math.ceil(todayDayNum / 7)
    return Array.from({ length: Math.min(totalWeeks, 11) }, (_, weekIdx) => {
      const [startDay, endDay] = getWeekDayRange(weekIdx)
      const weekLogs = Array.from({ length: endDay - startDay + 1 }, (_, i) => {
        const date = getDateForDay(attempt.start_date, startDay + i)
        return allLogs.find(l => l.log_date === date)
      }).filter(Boolean) as typeof allLogs
      const gymCount = weekLogs.filter(l => l.gym).length
      return { week: weekIdx + 1, gym: gymCount, target: 3 }
    })
  }, [allLogs, attempt, todayDayNum])

  if (!stats) return <div className="p-6 text-zinc-400">Loading stats...</div>

  return (
    <div className="p-4 pb-8 space-y-6">
      <h2 className="text-xl font-black text-white">Stats & Analytics</h2>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="text-orange-500" size={20} />}
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          highlight
        />
        <StatCard
          icon={<Trophy className="text-orange-400" size={20} />}
          label="Best Streak"
          value={`${stats.bestStreak} days`}
        />
        <StatCard
          icon={<Target className="text-orange-500" size={20} />}
          label="Days Completed"
          value={`${stats.totalDaysCompleted}/75`}
        />
        <StatCard
          icon={<span className="text-xl">🏏</span>}
          label="Match Days"
          value={`${stats.totalMatchDays}`}
        />
        <StatCard
          icon={<Dumbbell className="text-orange-400" size={20} />}
          label="Gym Days"
          value={stats.totalGymDays.toString()}
        />
        <StatCard
          icon={<Moon className="text-orange-300" size={20} />}
          label="Avg Sleep"
          value={`${stats.avgSleepHours.toFixed(1)}h`}
        />
      </div>

      {/* Cricket stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-3">🏏 Cricket Volume</h3>
        <div className="space-y-2.5">
          <StatRow label="Batting Balls" value={stats.totalBattingBalls.toLocaleString()} color="text-orange-400" />
          <StatRow label="Keeping Balls" value={stats.totalKeepingBalls.toLocaleString()} color="text-white" />
          <StatRow label="Catching Balls" value={stats.totalCatchingBalls.toLocaleString()} color="text-white" />
          <StatRow label="Total Water" value={`${(stats.totalWaterML / 1000).toFixed(1)}L`} color="text-orange-400" />
        </div>
      </div>

      {/* Batting balls bar chart */}
      {allLogs.some(l => l.batting_balls > 0) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-3">Daily Batting Balls</h3>
          <BattingBarChart logs={allLogs} startDate={attempt?.start_date || ''} />
        </div>
      )}

      {/* Weekly gym summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-3">Weekly Gym Summary</h3>
        <div className="space-y-2">
          {weeklyGymData.map(({ week, gym }) => (
            <div key={week} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 w-16">Week {week}</span>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${gym >= 3 ? 'bg-orange-500' : gym > 0 ? 'bg-orange-800' : 'bg-zinc-700'}`}
                  style={{ width: `${(gym / 3) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-bold w-8 text-right ${gym >= 3 ? 'text-orange-400' : 'text-zinc-500'}`}>
                {gym}/3
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, highlight
}: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-orange-500/10 border-orange-500/40' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-semibold text-zinc-400">{label}</span></div>
      <div className="text-xl font-black text-white">{value}</div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-zinc-400">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}
