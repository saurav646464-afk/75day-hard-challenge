'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '@/components/AppProvider'
import {
  getDailyQuote, getDayNumber, getWeekIndex, getWeekDayRange, getDateForDay,
  getGymStatus, getRunningStatus, getKeepingStatus, getCatchingStatus,
  getDaysRemainingInWeek, isSunday,
  isWaterDone, isSleepDone, isMealsDone, isTaskDone, getDayCompletionPercent, formatDisplayDate,
  CHALLENGE_DAYS, GYM_REQUIRED_PER_WEEK, RUNNING_REQUIRED_PER_WEEK,
  KEEPING_REQUIRED_PER_WEEK, CATCHING_REQUIRED_PER_WEEK, BATTING_TARGET_BALLS,
  isCheckinRequired, addDays, diffDays
} from '@/lib/challenge'
import { cn, haptic, celebrateCompletion, formatWater } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Check, Flame, Dumbbell, Droplets, Moon, BookOpen, AlertTriangle } from 'lucide-react'
import ProgressRing from '@/components/ui/ProgressRing'
import SaveIndicator from '@/components/ui/SaveIndicator'
import FailureSheet from '@/components/ui/FailureSheet'
import WeeklyCheckinCard from '@/components/ui/WeeklyCheckinCard'
import OfflineBadge from '@/components/ui/OfflineBadge'

export default function TodayScreen() {
  const {
    attempt, todayLog, allLogs, taskConfig, today, todayDayNum,
    updateTodayLog, updateLogForDate, setDayType, saveStatus, failureInfo,
    confirmFailureRestart, dismissFailure
  } = useApp()

  const [viewDate, setViewDate] = useState(today)
  const [justCompleted, setJustCompleted] = useState(false)
  const prevCompleted = useRef(false)
  const journalRef = useRef<HTMLTextAreaElement>(null)

  const viewLog = viewDate === today
    ? todayLog
    : allLogs.find(l => l.log_date === viewDate) || null

  const isToday = viewDate === today
  const isYesterday = diffDays(viewDate, today) === 1
  const canEdit = isToday || isYesterday
  const dayNum = attempt ? getDayNumber(attempt.start_date, viewDate) : todayDayNum

  const updateLog = (updates: Partial<import('@/types').DailyLog>) => {
    updateLogForDate(viewDate, updates)
  }

  const completionPct = viewLog
    ? getDayCompletionPercent(viewLog, taskConfig)
    : 0

  useEffect(() => {
    const isComplete = viewLog?.completed && isToday
    if (isComplete && !prevCompleted.current) {
      celebrateCompletion()
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 5000)
    }
    prevCompleted.current = !!isComplete
  }, [viewLog?.completed, isToday])

  const weekIdx = getWeekIndex(dayNum)
  const [weekStart, weekEnd] = getWeekDayRange(weekIdx)
  const weekLogs = attempt
    ? Array.from({ length: weekEnd - weekStart + 1 }, (_, i) => {
        const date = getDateForDay(attempt.start_date, weekStart + i)
        return allLogs.find(l => l.log_date === date) || null
      }).filter(Boolean) as typeof allLogs
    : []

  const daysRemaining = getDaysRemainingInWeek(dayNum)
  const gymStatus = getGymStatus(weekLogs, daysRemaining)
  const runningStatus = getRunningStatus(weekLogs, daysRemaining)
  const keepingStatus = getKeepingStatus(weekLogs, daysRemaining)
  const catchingStatus = getCatchingStatus(weekLogs, daysRemaining)

  const quote = getDailyQuote(todayDayNum)

  const currentStreak = (() => {
    let streak = 0
    let cursor = today
    const logMap = new Map(allLogs.map(l => [l.log_date, l]))
    while (true) {
      const dn = attempt ? getDayNumber(attempt.start_date, cursor) : 0
      if (dn < 1) break
      const log = logMap.get(cursor)
      if (!log?.completed) break
      streak++
      cursor = addDays(cursor, -1)
    }
    return streak
  })()

  const goBack = () => {
    const prev = addDays(viewDate, -1)
    if (attempt && getDayNumber(attempt.start_date, prev) >= 1) setViewDate(prev)
  }
  const goForward = () => {
    const next = addDays(viewDate, 1)
    if (attempt && getDayNumber(attempt.start_date, next) <= CHALLENGE_DAYS) setViewDate(next)
  }

  const toggleTask = (key: string) => {
    if (!canEdit || (!viewLog && !attempt)) return
    haptic(50)
    const current = viewLog?.tasks[key] || false
    updateLog({
      tasks: { ...(viewLog?.tasks || {}), [key]: !current }
    })
  }

  const isMatch = viewLog?.day_type === 'match'
  const isRest = viewLog?.day_type === 'rest'
  const isSundayDay = isSunday(viewDate)
  const checkinRequired = isCheckinRequired(viewDate, viewLog || undefined)

  if (!attempt) return <div className="p-6 text-zinc-400">Loading...</div>

  const log = viewLog || emptyLogLocal(attempt.id, viewDate)

  return (
    <div className="relative bg-zinc-950 text-white min-h-full">
      <OfflineBadge />
      <FailureSheet
        failureInfo={failureInfo}
        onConfirm={confirmFailureRestart}
        onDismiss={dismissFailure}
      />

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-white leading-none">
              Day {dayNum} <span className="text-zinc-500 font-normal text-lg">/ 75</span>
            </div>
            <div className="text-sm text-zinc-400 mt-0.5">{formatDisplayDate(viewDate)}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-white">{currentStreak}</span>
            </div>
            <ProgressRing percent={completionPct} size={52} />
          </div>
        </div>

        {/* Day nav & 3-way Day Type selector */}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={goBack} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 active:bg-zinc-800 flex-shrink-0" aria-label="Previous day">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => { haptic(50); setDayType(viewDate, 'normal') }}
              disabled={!canEdit}
              className={cn(
                'py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center truncate',
                !isMatch && !isRest
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
                !canEdit && 'opacity-50'
              )}
            >
              🏋️ Normal
            </button>
            <button
              onClick={() => { haptic(50); setDayType(viewDate, 'match') }}
              disabled={!canEdit}
              className={cn(
                'py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center truncate',
                isMatch
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
                !canEdit && 'opacity-50'
              )}
            >
              🏏 Match
            </button>
            <button
              onClick={() => { haptic(50); setDayType(viewDate, 'rest') }}
              disabled={!canEdit}
              className={cn(
                'py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center truncate',
                isRest
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
                !canEdit && 'opacity-50'
              )}
            >
              😴 Rest
            </button>
          </div>

          <button onClick={goForward} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 active:bg-zinc-800 flex-shrink-0" aria-label="Next day">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {!isToday && !isYesterday && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-sm text-zinc-400">
          Past day — view only
        </div>
      )}

      {isYesterday && (
        <div className="mx-4 mt-4 p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/40 text-center text-xs text-orange-300 font-bold">
          ✏️ Editing Yesterday (Day {dayNum})
        </div>
      )}

      {log.completed && isToday && (
        <div className="mx-4 mt-4 p-4 rounded-2xl text-center bg-orange-500/10 border border-orange-500/40">
          <div className="text-2xl mb-1">{justCompleted ? '🎉' : '✅'}</div>
          <div className="text-lg font-bold text-orange-400">
            Day {dayNum} Completed!
          </div>
          {justCompleted && (
            <div className="text-sm text-zinc-300 mt-1">Shabaash! Keep the streak going! 🔥</div>
          )}
        </div>
      )}

      {/* Warning alerts */}
      {gymStatus.isUrgent && isToday && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300 font-bold">
            Gym karna zaroori hai aaj! ({gymStatus.needed} sessions remaining)
          </span>
        </div>
      )}

      {runningStatus.isUrgent && isToday && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300 font-bold">
            Running karna zaroori hai aaj! ({runningStatus.needed} sessions remaining)
          </span>
        </div>
      )}

      {keepingStatus.isUrgent && isToday && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300 font-bold">
            Keeping karna zaroori hai aaj! ({keepingStatus.needed} sessions remaining)
          </span>
        </div>
      )}

      {catchingStatus.isUrgent && isToday && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300 font-bold">
            Catching karna zaroori hai aaj! ({catchingStatus.needed} sessions remaining)
          </span>
        </div>
      )}

      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Quote */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <p className="text-sm text-zinc-200 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </div>

        {/* Weekly summary cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Dumbbell size={15} className="text-orange-500" />
              <span className="text-xs font-semibold text-white">Gym</span>
            </div>
            <div className={cn(
              'font-black text-xs',
              gymStatus.completed >= GYM_REQUIRED_PER_WEEK ? 'text-orange-400' : 'text-white'
            )}>
              {gymStatus.completed}/{GYM_REQUIRED_PER_WEEK}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Flame size={15} className="text-orange-500" />
              <span className="text-xs font-semibold text-white">Running</span>
            </div>
            <div className={cn(
              'font-black text-xs',
              runningStatus.completed >= RUNNING_REQUIRED_PER_WEEK ? 'text-orange-400' : 'text-white'
            )}>
              {runningStatus.completed}/{RUNNING_REQUIRED_PER_WEEK}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🧤</span>
              <span className="text-xs font-semibold text-white">Keeping</span>
            </div>
            <div className={cn(
              'font-black text-xs',
              keepingStatus.completed >= KEEPING_REQUIRED_PER_WEEK ? 'text-orange-400' : 'text-white'
            )}>
              {keepingStatus.completed}/{KEEPING_REQUIRED_PER_WEEK}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">⚾</span>
              <span className="text-xs font-semibold text-white">Catching</span>
            </div>
            <div className={cn(
              'font-black text-xs',
              catchingStatus.completed >= CATCHING_REQUIRED_PER_WEEK ? 'text-orange-400' : 'text-white'
            )}>
              {catchingStatus.completed}/{CATCHING_REQUIRED_PER_WEEK}
            </div>
          </div>
        </div>

        {/* ── REST DAY SECTION ── */}
        {isRest && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/40 text-center">
              <div className="text-3xl mb-1.5">😴</div>
              <div className="text-base font-black text-orange-400">Rest & Active Recovery Day</div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Take rest, recharge your muscles! Rest days automatically count as complete for your 75 Hard streak. Agar gym ya thoda light practice kiya hai toh niche customize kar ke tick kar sakte ho.
              </p>
            </div>

            <TaskSection title="⚡ Optional Practice & Gym (Customizable)">
              <GymTask log={log} canEdit={canEdit} onUpdate={updateLog} />
              <SimpleTask key="rest-stretching" taskKey="stretching" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional />
              <SimpleTask key="rest-shadow" taskKey="shadow" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional />
              <SimpleTask key="rest-running" taskKey="running" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional badge="Light / Jog" />
              <SimpleTask key="rest-keeping" taskKey="keeping" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional badge="Light Keeping" />
              <SimpleTask key="rest-visualization" taskKey="visualization" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional />
              <SimpleTask key="rest-video_review" taskKey="video_review" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional />
            </TaskSection>
          </div>
        )}

        {/* ── CRICKET SECTION ── */}
        {!isMatch && !isRest && (
          <TaskSection title="🏏 Cricket Training">
            <BallCountTask
              label="Batting"
              value={log.batting_balls}
              target={BATTING_TARGET_BALLS}
              chips={[50, 100, 200]}
              onChange={v => updateLog({ batting_balls: v })}
              disabled={!canEdit}
            />
            <SimpleTask
              key="keeping"
              taskKey="keeping"
              log={log}
              taskConfig={taskConfig}
              canEdit={canEdit}
              onToggle={toggleTask}
              badge="3x/week"
            />
            <BallCountTask
              label="Fielding Catching"
              value={log.catching_balls}
              target={100}
              chips={[10, 25]}
              badge="4x/week"
              onChange={v => updateLog({ catching_balls: v })}
              disabled={!canEdit}
            />
            <SimpleTask key="running" taskKey="running" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} badge="3x/week" />
            <SimpleTask key="shadow" taskKey="shadow" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
            <SimpleTask key="stretching" taskKey="stretching" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
            <SimpleTask key="video_review" taskKey="video_review" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
            <SimpleTask key="visualization" taskKey="visualization" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
          </TaskSection>
        )}

        {/* ── MATCH DATA ── */}
        {isMatch && (
          <TaskSection title="🏏 Match Day">
            <MatchPlayedTask log={log} canEdit={canEdit} onToggle={toggleTask} />
            <MatchStatsInput log={log} canEdit={canEdit} onUpdate={updateLog} />
            <SimpleTask key="stretching" taskKey="stretching" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional />
            <SimpleTask key="visualization" taskKey="visualization" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} optional />
          </TaskSection>
        )}

        {/* ── MIND SECTION ── */}
        <TaskSection title="🧘 Mind & Focus">
          <SimpleTask key="meditation" taskKey="meditation" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
          <SimpleTask key="naam_jap" taskKey="naam_jap" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
          <JournalTask log={log} canEdit={canEdit} onUpdate={updateLog} journalRef={journalRef} />
        </TaskSection>

        {/* ── BODY & DISCIPLINE ── */}
        <TaskSection title="💪 Body & Discipline">
          <MealTask log={log} canEdit={canEdit} onUpdate={updateLog} />
          <WaterTask log={log} canEdit={canEdit} onUpdate={updateLog} />
          <SleepTask log={log} canEdit={canEdit} onUpdate={updateLog} />
          <SimpleTask key="no_junk_food" taskKey="no_junk_food" log={log} taskConfig={taskConfig} canEdit={canEdit} onToggle={toggleTask} />
          {!isRest && <GymTask log={log} canEdit={canEdit} onUpdate={updateLog} />}
        </TaskSection>

        {isSundayDay && attempt && (
          <WeeklyCheckinCard
            attemptId={attempt.id}
            date={viewDate}
            required={checkinRequired}
            readonly={!canEdit}
          />
        )}

        {isToday && (
          <p className="text-center text-xs text-zinc-500 italic px-4">
            Raat ko sone se pehle sab tick karna mat bhoolna 🌙
          </p>
        )}
      </div>

      <SaveIndicator status={saveStatus} />
    </div>
  )
}

function TaskSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-2 px-1">{title}</h3>
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
        {children}
      </div>
    </div>
  )
}

function SimpleTask({
  taskKey, log, taskConfig, canEdit, onToggle, optional, badge
}: {
  taskKey: string
  log: ReturnType<typeof emptyLogLocal>
  taskConfig: import('@/types').TaskConfig[]
  canEdit: boolean
  onToggle: (key: string) => void
  optional?: boolean
  badge?: string
}) {
  const cfg = taskConfig.find(t => t.key === taskKey)
  if (!cfg?.enabled) return null
  const done = isTaskDone(taskKey, log)
  return (
    <div
      className={cn('task-row flex items-center px-4 gap-3', !canEdit && 'cursor-default')}
      onClick={() => canEdit && onToggle(taskKey)}
    >
      <div className={cn(
        'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
        done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
      )}>
        {done && <Check size={14} strokeWidth={3} />}
      </div>
      <span className={cn(
        'flex-1 text-[16px] font-medium leading-snug py-4',
        done ? 'text-zinc-500 line-through' : 'text-white'
      )}>
        {badge ? cfg.label.replace(/\s*\(\d+x\/week\)/i, '') : cfg.label}
      </span>
      {badge && (
        <span className="text-[10px] text-orange-400 bg-orange-950/60 border border-orange-900 px-2 py-0.5 rounded-full font-bold">{badge}</span>
      )}
      {optional && (
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full font-bold">optional</span>
      )}
    </div>
  )
}

function BallCountTask({
  label, value, target, chips, onChange, disabled, badge
}: {
  label: string; value: number; target?: number; chips: number[]
  onChange: (v: number) => void; disabled: boolean; badge?: string
}) {
  const done = target ? value >= target : value > 0
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : (value > 0 ? 100 : 0)

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
            done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
          )}>
            {done && <Check size={12} strokeWidth={3} />}
          </div>
          <span className={cn('text-[16px] font-semibold', done ? 'text-zinc-500 line-through' : 'text-white')}>
            {label}
          </span>
          {badge && (
            <span className="text-[10px] text-orange-400 bg-orange-950/60 border border-orange-900 px-2 py-0.5 rounded-full font-bold">{badge}</span>
          )}
        </div>
        <span className={cn('text-sm font-bold', done ? 'text-orange-400' : 'text-zinc-400')}>
          {target ? `${value}/${target}` : `${value} balls`}
        </span>
      </div>
      {target && (
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }} />
        </div>
      )}
      {!disabled && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { haptic(30); onChange(Math.max(0, value - (chips[0] || 10))) }}
            className="stepper-btn"
          >−</button>
          <input
            type="number"
            inputMode="numeric"
            value={value === 0 ? '' : value}
            placeholder="0"
            onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="flex-1 bg-zinc-800 rounded-xl text-center text-white h-12 text-lg font-black border border-zinc-700 focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={() => { haptic(30); onChange(value + (chips[0] || 10)) }}
            className="stepper-btn"
          >+</button>
        </div>
      )}
      {!disabled && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {chips.map(c => (
            <button
              key={c}
              onClick={() => { haptic(30); onChange(value + c) }}
              className="chip"
            >
              +{c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MealTask({ log, canEdit, onUpdate }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onUpdate: (u: Partial<import('@/types').DailyLog>) => void
}) {
  const done = isMealsDone(log.meals_count)
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
          )}>
            {done && <Check size={12} strokeWidth={3} />}
          </div>
          <span className={cn('text-[16px] font-semibold', done ? 'text-zinc-500 line-through' : 'text-white')}>
            Good Food — 5 meals
          </span>
        </div>
        <span className="text-xs font-bold text-orange-400">{log.meals_count}/5</span>
      </div>
      <div className="flex gap-3 justify-center">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            disabled={!canEdit}
            onClick={() => {
              haptic(40)
              const newCount = log.meals_count === n ? n - 1 : n
              onUpdate({ meals_count: newCount })
            }}
            className={cn(
              'meal-circle text-xl',
              n <= log.meals_count ? 'filled' : ''
            )}
          >
            {n <= log.meals_count ? '🍽️' : '○'}
          </button>
        ))}
      </div>
    </div>
  )
}

function WaterTask({ log, canEdit, onUpdate }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onUpdate: (u: Partial<import('@/types').DailyLog>) => void
}) {
  const done = isWaterDone(log.water_ml)
  const pct = Math.min(100, Math.round((log.water_ml / 4000) * 100))

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
          )}>
            {done ? <Check size={12} strokeWidth={3} /> : <Droplets size={12} className="text-orange-400" />}
          </div>
          <span className={cn('text-[16px] font-semibold', done ? 'text-zinc-500 line-through' : 'text-white')}>
            Water — 4 litres
          </span>
        </div>
        <span className={cn('text-sm font-bold', done ? 'text-orange-400' : 'text-zinc-400')}>
          {formatWater(log.water_ml)}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      {canEdit && (
        <div className="flex gap-2 flex-wrap">
          {[250, 500, 1000].map(ml => (
            <button
              key={ml}
              onClick={() => { haptic(30); onUpdate({ water_ml: log.water_ml + ml }) }}
              className="chip"
            >
              +{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}
            </button>
          ))}
          {log.water_ml > 0 && (
            <button
              onClick={() => { haptic(30); onUpdate({ water_ml: Math.max(0, log.water_ml - 250) }) }}
              className="chip text-zinc-500 border-zinc-800"
            >
              −250ml
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SleepTask({ log, canEdit, onUpdate }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onUpdate: (u: Partial<import('@/types').DailyLog>) => void
}) {
  const done = isSleepDone(log.sleep_hours)
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
          )}>
            {done ? <Check size={12} strokeWidth={3} /> : <Moon size={12} className="text-orange-400" />}
          </div>
          <span className={cn('text-[16px] font-semibold', done ? 'text-zinc-500 line-through' : 'text-white')}>
            Sleep — 7 to 8 hours
          </span>
        </div>
        <span className={cn('text-sm font-bold', done ? 'text-orange-400' : 'text-zinc-400')}>
          {log.sleep_hours > 0 ? `${log.sleep_hours}h` : '—'}
        </span>
      </div>
      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => { haptic(30); onUpdate({ sleep_hours: Math.max(0, Number(log.sleep_hours) - 0.5) }) }}
            className="stepper-btn"
          >−</button>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            max="24"
            value={log.sleep_hours === 0 ? '' : log.sleep_hours}
            placeholder="0"
            onChange={e => onUpdate({ sleep_hours: parseFloat(e.target.value) || 0 })}
            className="flex-1 bg-zinc-800 rounded-xl text-center text-white h-12 text-lg font-black border border-zinc-700 focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={() => { haptic(30); onUpdate({ sleep_hours: Math.min(24, Number(log.sleep_hours) + 0.5) }) }}
            className="stepper-btn"
          >+</button>
        </div>
      )}
    </div>
  )
}

function JournalTask({ log, canEdit, onUpdate, journalRef }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onUpdate: (u: Partial<import('@/types').DailyLog>) => void
  journalRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const lineCount = log.journal.split('\n').filter(l => l.trim().length > 0).length
  const done = lineCount >= 3

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
          )}>
            {done ? <Check size={12} strokeWidth={3} /> : <BookOpen size={12} className="text-zinc-400" />}
          </div>
          <span className={cn('text-[16px] font-semibold', done ? 'text-zinc-500 line-through' : 'text-white')}>
            Daily Journal — 3 lines
          </span>
        </div>
        <span className="text-xs font-bold text-orange-400">{lineCount}/3 lines</span>
      </div>
      <textarea
        ref={journalRef}
        disabled={!canEdit}
        value={log.journal}
        onChange={e => onUpdate({ journal: e.target.value })}
        placeholder={"Line 1: What I learned today...\nLine 2: What I did well...\nLine 3: What I will improve tomorrow..."}
        rows={4}
        className="w-full bg-zinc-800 rounded-xl p-3 text-white text-base border border-zinc-700 focus:border-orange-500 focus:outline-none resize-none placeholder:text-zinc-600 leading-relaxed"
      />
    </div>
  )
}

function GymTask({ log, canEdit, onUpdate }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onUpdate: (u: Partial<import('@/types').DailyLog>) => void
}) {
  return (
    <div
      className={cn('task-row flex items-center px-4 gap-3', !canEdit && 'cursor-default')}
      onClick={() => {
        if (!canEdit) return
        haptic(50)
        onUpdate({ gym: !log.gym })
      }}
    >
      <div className={cn(
        'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
        log.gym ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
      )}>
        {log.gym ? <Check size={14} strokeWidth={3} /> : <Dumbbell size={14} className="text-zinc-500" />}
      </div>
      <span className={cn(
        'flex-1 text-[16px] font-medium leading-snug py-4',
        log.gym ? 'text-zinc-400' : 'text-white'
      )}>
        Gym Session
      </span>
      <span className="text-[10px] text-orange-400 bg-orange-950/60 border border-orange-900 px-2 py-0.5 rounded-full font-bold">3x/week</span>
    </div>
  )
}

function MatchPlayedTask({ log, canEdit, onToggle }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onToggle: (key: string) => void
}) {
  const done = !!log.tasks['match_played']
  return (
    <div
      className={cn('task-row flex items-center px-4 gap-3', !canEdit && 'cursor-default')}
      onClick={() => canEdit && onToggle('match_played')}
    >
      <div className={cn(
        'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
        done ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 bg-zinc-800'
      )}>
        {done && <Check size={14} strokeWidth={3} />}
      </div>
      <span className={cn('flex-1 text-[16px] py-4 font-bold', done ? 'text-zinc-500' : 'text-orange-400')}>
        Match Played ✅
      </span>
    </div>
  )
}

function MatchStatsInput({ log, canEdit, onUpdate }: {
  log: ReturnType<typeof emptyLogLocal>
  canEdit: boolean
  onUpdate: (u: Partial<import('@/types').DailyLog>) => void
}) {
  const md = log.match_data || {}
  const update = (key: string, val: number | string) =>
    onUpdate({ match_data: { ...md, [key]: val } })

  return (
    <div className="px-4 py-3 space-y-3">
      <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">Match Performance (optional)</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'runs', label: 'Runs', placeholder: '0' },
          { key: 'balls_faced', label: 'Balls', placeholder: '0' },
          { key: 'catches', label: 'Catches', placeholder: '0' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-zinc-400 block mb-1 font-semibold">{f.label}</label>
            <input
              type="number"
              inputMode="numeric"
              disabled={!canEdit}
              value={(md as Record<string, number>)[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={e => update(f.key, parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-800 rounded-xl text-center text-white h-11 text-base font-bold border border-zinc-700 focus:border-orange-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <textarea
        disabled={!canEdit}
        value={(md as Record<string, string>).notes || ''}
        onChange={e => update('notes', e.target.value)}
        placeholder="Match notes & key learnings..."
        rows={2}
        className="w-full bg-zinc-800 rounded-xl p-3 text-white text-base border border-zinc-700 focus:border-orange-500 focus:outline-none resize-none placeholder:text-zinc-600"
      />
    </div>
  )
}

function emptyLogLocal(attemptId: string, date: string): import('@/types').DailyLog {
  return {
    id: '',
    user_id: '',
    attempt_id: attemptId,
    log_date: date,
    day_type: 'normal',
    tasks: {},
    batting_balls: 0,
    keeping_balls: 0,
    catching_balls: 0,
    meals_count: 0,
    water_ml: 0,
    sleep_hours: 0,
    journal: '',
    gym: false,
    match_data: {},
    completed: false,
    created_at: new Date().toISOString(),
  }
}
