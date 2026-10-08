// types/index.ts
// Central type definitions for the 75 Day Hard Challenge Tracker

export interface Attempt {
  id: string
  user_id: string
  start_date: string // YYYY-MM-DD
  status: 'active' | 'failed' | 'completed'
  failed_on_day: number | null
  fail_reason: string | null
  ended_at: string | null
  created_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  attempt_id: string
  log_date: string // YYYY-MM-DD
  day_type: 'normal' | 'match'
  tasks: Record<string, boolean>
  batting_balls: number
  keeping_balls: number
  catching_balls: number
  meals_count: number
  water_ml: number
  sleep_hours: number
  journal: string
  gym: boolean
  match_data: {
    runs?: number
    balls_faced?: number
    catches?: number
    notes?: string
  }
  completed: boolean
  created_at: string
}

export interface WeeklyCheckin {
  id: string
  user_id: string
  attempt_id: string
  checkin_date: string // YYYY-MM-DD
  weight_kg: number | null
  photo_path: string | null
  created_at: string
}

export interface TaskConfig {
  id: string
  user_id: string
  key: string
  label: string
  enabled: boolean
  required_on_match: boolean
  is_custom: boolean
  sort_order: number
  created_at: string
}

export interface Settings {
  id: string
  user_id: string
  start_date: string
  timezone: string
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DayStatus {
  dayNumber: number
  date: string
  status: 'completed' | 'match_completed' | 'failed' | 'upcoming' | 'today' | 'locked'
  log?: DailyLog
}

export interface GymWeekStatus {
  completed: number
  needed: number
  isUrgent: boolean
  failed: boolean
  daysRemaining: number
}

export type TabName = 'today' | 'calendar' | 'stats' | 'progress' | 'settings'

export interface QueuedSave {
  id: string
  table: string
  operation: 'upsert' | 'update' | 'insert'
  data: Record<string, unknown>
  timestamp: number
  retries: number
}
