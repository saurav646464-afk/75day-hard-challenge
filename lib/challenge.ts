// lib/challenge.ts
// Pure, unit-testable functions for all challenge business logic
// All timezone-aware operations use Asia/Kolkata (IST)

import type { DailyLog, Attempt, TaskConfig } from '@/types'

export const CHALLENGE_DAYS = 75
export const DEFAULT_START_DATE = '2026-10-09'
export const TIMEZONE = 'Asia/Kolkata'
export const GYM_REQUIRED_PER_WEEK = 3
export const RUNNING_REQUIRED_PER_WEEK = 3

// ─── Date utilities ──────────────────────────────────────────

/** Returns today's date in YYYY-MM-DD format in IST timezone */
export function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/** Parse YYYY-MM-DD to a local Date object at midnight */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Format a Date object to YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

/** Add N days to a YYYY-MM-DD string */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

/** Difference in calendar days: dateB - dateA (can be negative) */
export function diffDays(dateA: string, dateB: string): number {
  const a = parseDate(dateA).getTime()
  const b = parseDate(dateB).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Returns 1-based day number for a given date (1 = start_date). Clamped to at least 1. */
export function getDayNumber(startDate: string, forDate: string): number {
  const raw = diffDays(startDate, forDate) + 1
  return Math.max(1, raw)
}

/** Returns the YYYY-MM-DD for day N of the challenge */
export function getDateForDay(startDate: string, day: number): string {
  return addDays(startDate, day - 1)
}

/** Is a date string a Sunday? */
export function isSunday(dateStr: string): boolean {
  return parseDate(dateStr).getDay() === 0
}

/** Format date for display: "Thu, 8 Oct" */
export function formatDisplayDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ─── Week utilities ──────────────────────────────────────────

/** Returns 0-indexed week number (0 = days 1-7, 1 = days 8-14, ...) based on challenge start date */
export function getWeekIndex(dayNumber: number): number {
  const safeDay = Math.max(1, dayNumber)
  return Math.floor((safeDay - 1) / 7)
}

/** Returns [startDay, endDay] (inclusive, 1-based) for a given 0-indexed week */
export function getWeekDayRange(weekIndex: number): [number, number] {
  const start = weekIndex * 7 + 1
  const end = Math.min(start + 6, CHALLENGE_DAYS)
  return [start, end]
}

/** How many days remain in the current week (including today) */
export function getDaysRemainingInWeek(dayNumber: number): number {
  const weekIdx = getWeekIndex(dayNumber)
  const [, endDay] = getWeekDayRange(weekIdx)
  return endDay - Math.max(1, dayNumber) + 1
}

// ─── Task completion checks ──────────────────────────────────

export const isBattingDone  = (balls: number) => balls >= 1000
export const isKeepingDone  = (balls: number) => balls >= 200
export const isCatchingDone = (balls: number) => balls >= 100
export const isWaterDone    = (ml: number)    => ml >= 4000
export const isSleepDone    = (hours: number) => hours >= 7
export const isMealsDone    = (count: number) => count >= 5

/** Journal done when >= 3 non-empty lines */
export function isJournalDone(journal: string): boolean {
  return journal.split('\n').filter(l => l.trim().length > 0).length >= 3
}

/** Returns whether a single named task is complete given log data */
export function isTaskDone(key: string, log: DailyLog): boolean {
  switch (key) {
    case 'batting':    return isBattingDone(log.batting_balls)
    case 'keeping':    return isKeepingDone(log.keeping_balls)
    case 'catching':   return isCatchingDone(log.catching_balls)
    case 'water':      return isWaterDone(log.water_ml)
    case 'sleep':      return isSleepDone(log.sleep_hours)
    case 'good_food':  return isMealsDone(log.meals_count)
    case 'journal':    return isJournalDone(log.journal)
    case 'gym':        return log.gym
    default:           return !!log.tasks[key]
  }
}

// ─── Day completion ──────────────────────────────────────────

/**
 * Whether all required enabled tasks are done for a day.
 * Gym and Running are NOT included in per-day completion (both follow 3x/week rule).
 */
export function isDayComplete(log: DailyLog, taskConfig: TaskConfig[]): boolean {
  const isMatch = log.day_type === 'match'
  const required = taskConfig.filter(t => {
    if (!t.enabled) return false
    if (t.key === 'gym' || t.key === 'running') return false // weekly rules
    if (isMatch) return t.required_on_match
    return true
  })

  for (const task of required) {
    if (!isTaskDone(task.key, log)) return false
  }

  if (isMatch && !log.tasks['match_played']) return false

  return true
}

/** Returns 0–100 completion percentage for a day */
export function getDayCompletionPercent(log: DailyLog, taskConfig: TaskConfig[]): number {
  const isMatch = log.day_type === 'match'
  const required = taskConfig.filter(t => {
    if (!t.enabled) return false
    if (t.key === 'gym' || t.key === 'running') return false
    if (isMatch) return t.required_on_match
    return true
  })

  const totalTasks = required.length + (isMatch ? 1 : 0)
  if (totalTasks === 0) return 100

  let done = required.filter(t => isTaskDone(t.key, log)).length
  if (isMatch && log.tasks['match_played']) done++

  return Math.round((done / totalTasks) * 100)
}

// ─── Weekly tracking (Gym & Running) ─────────────────────────

export interface WeeklyTaskStatus {
  completed: number
  needed: number
  isUrgent: boolean
  failed: boolean
}

export function getGymStatus(weekLogs: DailyLog[], daysRemainingInWeek: number): WeeklyTaskStatus {
  const completed = weekLogs.filter(l => l.gym).length
  const needed = Math.max(0, GYM_REQUIRED_PER_WEEK - completed)
  const failed = needed > daysRemainingInWeek
  const isUrgent = needed > 0 && needed >= daysRemainingInWeek && !failed
  return { completed, needed, isUrgent, failed }
}

export function getRunningStatus(weekLogs: DailyLog[], daysRemainingInWeek: number): WeeklyTaskStatus {
  const completed = weekLogs.filter(l => l.tasks['running']).length
  const needed = Math.max(0, RUNNING_REQUIRED_PER_WEEK - completed)
  const failed = needed > daysRemainingInWeek
  const isUrgent = needed > 0 && needed >= daysRemainingInWeek && !failed
  return { completed, needed, isUrgent, failed }
}

// ─── Streak calculation ──────────────────────────────────────

export function calculateCurrentStreak(
  logs: DailyLog[],
  startDate: string,
  today: string
): number {
  const logMap = new Map(logs.map(l => [l.log_date, l]))
  let streak = 0
  let cursor = today

  while (true) {
    const dayNum = getDayNumber(startDate, cursor)
    if (dayNum < 1 || dayNum > CHALLENGE_DAYS) break
    const log = logMap.get(cursor)
    if (!log?.completed) break
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function calculateBestStreak(logs: DailyLog[]): number {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date))
  let best = 0, current = 0
  for (const log of sorted) {
    if (log.completed) { current++; best = Math.max(best, current) }
    else current = 0
  }
  return best
}

// ─── Failure detection ───────────────────────────────────────

export interface FailResult {
  failed: boolean
  failedOnDay?: number
  reason?: string
}

export function checkForFailure(
  attempt: Attempt,
  logs: DailyLog[],
  today: string
): FailResult {
  const logMap = new Map(logs.map(l => [l.log_date, l]))
  const startDate = attempt.start_date
  const todayDayNum = getDayNumber(startDate, today)

  const daysToCheck = Math.min(todayDayNum - 1, CHALLENGE_DAYS)

  for (let day = 1; day <= daysToCheck; day++) {
    const date = getDateForDay(startDate, day)
    const log = logMap.get(date)
    if (!log?.completed) {
      return { failed: true, failedOnDay: day, reason: `Day ${day} was not completed` }
    }
  }

  const completedWeeks = Math.floor((todayDayNum - 1) / 7)
  for (let weekIdx = 0; weekIdx < completedWeeks; weekIdx++) {
    const [startDay, endDay] = getWeekDayRange(weekIdx)
    const weekLogs: DailyLog[] = []
    for (let day = startDay; day <= endDay; day++) {
      const log = logMap.get(getDateForDay(startDate, day))
      if (log) weekLogs.push(log)
    }

    // Check 3x Gym rule
    const gymCount = weekLogs.filter(l => l.gym).length
    if (gymCount < GYM_REQUIRED_PER_WEEK) {
      return {
        failed: true,
        failedOnDay: endDay,
        reason: `Week ${weekIdx + 1} had only ${gymCount}/${GYM_REQUIRED_PER_WEEK} gym days`,
      }
    }

    // Check 3x Running rule
    const runningCount = weekLogs.filter(l => l.tasks['running']).length
    if (runningCount < RUNNING_REQUIRED_PER_WEEK) {
      return {
        failed: true,
        failedOnDay: endDay,
        reason: `Week ${weekIdx + 1} had only ${runningCount}/${RUNNING_REQUIRED_PER_WEEK} running days`,
      }
    }
  }

  return { failed: false }
}

// ─── Sunday check-in ─────────────────────────────────────────

export function isCheckinRequired(dateStr: string, log: DailyLog | undefined): boolean {
  if (!isSunday(dateStr)) return false
  return log?.day_type !== 'match'
}

// ─── Motivational quotes ─────────────────────────────────────

export const MOTIVATIONAL_QUOTES = [
  "Champions train, losers complain.",
  "One ball at a time. One day at a time.",
  "The net run rate of discipline is always positive.",
  "You don't rise to the occasion — you fall to your level of preparation.",
  "Hit it hard in training so matches feel easy.",
  "Every session in the nets is a deposit in your confidence bank.",
  "The pitch doesn't care about your excuses.",
  "Consistency is the highest form of skill.",
  "Sachin didn't become Sachin in a day.",
  "Your body hears everything your mind says.",
  "Discipline is the bridge between goals and achievement.",
  "Great players are made in the offseason.",
  "Train as if every ball is the last ball of the World Cup final.",
  "Sweat more in practice, bleed less in battle.",
  "The harder you work, the luckier you get.",
  "Focus on the process, not the scorecard.",
  "A cricketer's greatest opponent is themselves.",
  "No shortcut reaches the crease before you.",
  "Pressure is a privilege — only the prepared feel it.",
  "1000 balls a day separates the good from the great.",
  "Your worst training day beats your best excuse.",
  "Mental fitness wins the match when the physical is equal.",
  "Every drop of water, every ball faced — it compounds.",
  "The grind is the glory.",
  "Play every day like your spot in the team depends on it.",
  "Nutrition is part of your batting average.",
  "Sleep is the cheapest performance enhancer.",
  "Videsh mein bhi, wahi 1000 balls.",
  "Jab dil kare rest karne ka, tab aur karo.",
  "75 din ka dard, lifetime ki pehchaan.",
] as const

export function getDailyQuote(dayNumber: number): string {
  const safeDay = Math.max(1, Math.abs(dayNumber || 1))
  const idx = (safeDay - 1) % MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[idx] || MOTIVATIONAL_QUOTES[0]
}

// ─── Stats aggregation ───────────────────────────────────────

export interface ChallengeStats {
  currentStreak: number
  bestStreak: number
  totalDaysCompleted: number
  totalMatchDays: number
  totalBattingBalls: number
  totalKeepingBalls: number
  totalCatchingBalls: number
  totalWaterML: number
  avgSleepHours: number
  totalGymDays: number
  totalRunningDays: number
}

export function aggregateStats(
  logs: DailyLog[],
  startDate: string,
  today: string
): ChallengeStats {
  const sleepLogs = logs.filter(l => l.sleep_hours > 0)
  return {
    currentStreak: calculateCurrentStreak(logs, startDate, today),
    bestStreak: calculateBestStreak(logs),
    totalDaysCompleted: logs.filter(l => l.completed).length,
    totalMatchDays: logs.filter(l => l.day_type === 'match' && l.completed).length,
    totalBattingBalls: logs.reduce((s, l) => s + l.batting_balls, 0),
    totalKeepingBalls: logs.reduce((s, l) => s + l.keeping_balls, 0),
    totalCatchingBalls: logs.reduce((s, l) => s + l.catching_balls, 0),
    totalWaterML: logs.reduce((s, l) => s + l.water_ml, 0),
    avgSleepHours: sleepLogs.length > 0
      ? sleepLogs.reduce((s, l) => s + Number(l.sleep_hours), 0) / sleepLogs.length
      : 0,
    totalGymDays: logs.filter(l => l.gym).length,
    totalRunningDays: logs.filter(l => l.tasks['running']).length,
  }
}

export function canEditYesterday(today: string): boolean {
  const now = new Date()
  const istHour = parseInt(
    now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TIMEZONE })
  )
  const istMinute = parseInt(
    now.toLocaleString('en-US', { minute: 'numeric', timeZone: TIMEZONE })
  )
  return istHour < 11 || (istHour === 11 && istMinute < 59)
}

export function isDateEditable(dateStr: string, today: string): boolean {
  const diff = diffDays(dateStr, today)
  if (diff === 0) return true
  if (diff === 1) return canEditYesterday(today)
  return false
}
