'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Attempt, DailyLog, TaskConfig, Settings, WeeklyCheckin } from '@/types'
import { getTodayIST, checkForFailure, isDayComplete, getDayNumber, getDateForDay } from '@/lib/challenge'
import { enqueueOperation, getQueuedOperations, removeQueuedOperation } from '@/lib/offline-queue'

interface AppContextType {
  // State
  loading: boolean
  attempt: Attempt | null
  todayLog: DailyLog | null
  allLogs: DailyLog[]
  taskConfig: TaskConfig[]
  settings: Settings | null
  checkins: WeeklyCheckin[]
  today: string
  todayDayNum: number
  isOnline: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'offline'
  failureInfo: { failedOnDay: number; reason: string } | null
  
  // Actions
  updateTodayLog: (updates: Partial<DailyLog>) => Promise<void>
  setDayType: (date: string, type: 'normal' | 'match') => Promise<void>
  confirmFailureRestart: () => Promise<void>
  dismissFailure: () => void
  refetch: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

function emptyLog(attemptId: string, date: string, userId: string): DailyLog {
  return {
    id: '',
    user_id: userId,
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

export function AppProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const supabase = createClient()
  const today = getTodayIST()

  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [allLogs, setAllLogs] = useState<DailyLog[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [taskConfig, setTaskConfig] = useState<TaskConfig[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle')
  const [failureInfo, setFailureInfo] = useState<{ failedOnDay: number; reason: string } | null>(null)

  const pendingUpdate = useRef<Partial<DailyLog>>({})
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const todayDayNum = attempt ? getDayNumber(attempt.start_date, today) : 1

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushOfflineQueue()
    }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function flushOfflineQueue() {
    const queue = await getQueuedOperations()
    for (const item of queue) {
      try {
        await supabase.from(item.table).upsert(item.data)
        await removeQueuedOperation(item.id)
      } catch {}
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!settingsData) {
        // Create default settings
        const { data: newSettings } = await supabase
          .from('settings')
          .insert({ user_id: userId, start_date: '2026-10-09' })
          .select()
          .single()
        setSettings(newSettings)
      } else {
        setSettings(settingsData)
      }

      // 2. Task config
      const { data: tasksData } = await supabase
        .from('task_config')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order')

      if (tasksData && tasksData.length > 0) {
        setTaskConfig(tasksData)
      } else {
        // Seed defaults
        const defaultTasks = getDefaultTaskConfig(userId)
        const { data: insertedTasks } = await supabase.from('task_config').insert(defaultTasks).select()
        setTaskConfig(insertedTasks && insertedTasks.length > 0 ? (insertedTasks as TaskConfig[]) : (defaultTasks as TaskConfig[]))
      }

      // 3. Active attempt
      const { data: attemptData } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let activeAttempt = attemptData

      if (!activeAttempt) {
        // Create first attempt
        const startDate = settingsData?.start_date || '2026-10-09'
        const { data: newAttempt } = await supabase
          .from('attempts')
          .insert({ user_id: userId, start_date: startDate, status: 'active' })
          .select()
          .single()
        activeAttempt = newAttempt
      }

      setAttempt(activeAttempt)

      // 4. All logs for this attempt
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('attempt_id', activeAttempt.id)
        .order('log_date')

      const logs = logsData || []
      setAllLogs(logs)

      // 5. Today's log
      let todayLogData = logs.find(l => l.log_date === today) || null
      if (!todayLogData && activeAttempt) {
        const dayNum = getDayNumber(activeAttempt.start_date, today)
        if (dayNum >= 1 && dayNum <= 75) {
          todayLogData = emptyLog(activeAttempt.id, today, userId)
        }
      }
      setTodayLog(todayLogData)

      // 6. Weekly check-ins
      const { data: checkinsData } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('attempt_id', activeAttempt.id)
        .order('checkin_date')
      setCheckins(checkinsData || [])

      // 7. Check for failures
      if (activeAttempt && (tasksData || []).length > 0) {
        const currentTasks = (tasksData || []) as TaskConfig[]
        // Re-compute completion status before failure check
        const enrichedLogs = logs.map(log => ({
          ...log,
          completed: isDayComplete(log, currentTasks),
        }))
        const failResult = checkForFailure(activeAttempt, enrichedLogs, today)
        if (failResult.failed) {
          setFailureInfo({
            failedOnDay: failResult.failedOnDay!,
            reason: failResult.reason!,
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Debounced save to Supabase — use ref to avoid stale closure issues
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingLogRef = useRef<DailyLog | null>(null)

  function debouncedSave(logData: DailyLog) {
    pendingLogRef.current = logData
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void performSave(pendingLogRef.current!)
    }, 600)
  }

  async function performSave(logData: DailyLog) {
    if (!attempt) return
    setSaveStatus('saving')
    try {
      const { id, created_at, ...saveData } = logData
      const upsertData = {
        ...saveData,
        user_id: userId,
        attempt_id: attempt.id,
        log_date: logData.log_date,
        completed: isDayComplete(logData, taskConfig),
      }

      if (!navigator.onLine) {
        await enqueueOperation({ table: 'daily_logs', operation: 'upsert', data: upsertData })
        setSaveStatus('offline')
        return
      }

      let result
      if (id) {
        result = await supabase.from('daily_logs').update(upsertData).eq('id', id).select().single()
      } else {
        result = await supabase.from('daily_logs').upsert(upsertData, { onConflict: 'attempt_id,log_date' }).select().single()
      }

      if (result.error) throw result.error

      const savedLog = result.data as DailyLog
      setTodayLog(savedLog)
      setAllLogs(prev => {
        const idx = prev.findIndex(l => l.log_date === savedLog.log_date)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = savedLog
          return updated
        }
        return [...prev, savedLog]
      })

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  async function updateTodayLog(updates: Partial<DailyLog>) {
    if (!todayLog && !attempt) return
    const base = todayLog || emptyLog(attempt!.id, today, userId)
    const updated: DailyLog = { ...base, ...updates }
    // Optimistic UI update
    setTodayLog(updated)
    debouncedSave(updated)
  }

  async function setDayType(date: string, type: 'normal' | 'match') {
    // Only for today
    if (date !== today) return
    await updateTodayLog({ day_type: type })
  }

  async function confirmFailureRestart() {
    if (!attempt || !failureInfo) return
    // Mark current attempt as failed
    await supabase.from('attempts').update({
      status: 'failed',
      failed_on_day: failureInfo.failedOnDay,
      fail_reason: failureInfo.reason,
      ended_at: new Date().toISOString(),
    }).eq('id', attempt.id)

    // Create new attempt starting today
    const { data: newAttempt } = await supabase
      .from('attempts')
      .insert({ user_id: userId, start_date: today, status: 'active' })
      .select()
      .single()

    setAttempt(newAttempt)
    setAllLogs([])
    setTodayLog(emptyLog(newAttempt.id, today, userId))
    setFailureInfo(null)
  }

  function dismissFailure() {
    setFailureInfo(null)
  }

  return (
    <AppContext.Provider value={{
      loading,
      attempt,
      todayLog,
      allLogs,
      taskConfig,
      settings,
      checkins,
      today,
      todayDayNum,
      isOnline,
      saveStatus,
      failureInfo,
      updateTodayLog,
      setDayType,
      confirmFailureRestart,
      dismissFailure,
      refetch: fetchData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

function getDefaultTaskConfig(userId: string) {
  return [
    { user_id: userId, key: 'batting',       label: 'Batting - 500+ balls',               enabled: true, required_on_match: false, is_custom: false, sort_order: 1 },
    { user_id: userId, key: 'keeping',       label: 'Wicket Keeping - 200+ (5x/week)',    enabled: true, required_on_match: false, is_custom: false, sort_order: 2 },
    { user_id: userId, key: 'catching',      label: 'Fielding Catching - 100+ (5x/week)', enabled: true, required_on_match: false, is_custom: false, sort_order: 3 },
    { user_id: userId, key: 'shadow',        label: 'Shadow - 20 min',                    enabled: true, required_on_match: false, is_custom: false, sort_order: 4 },
    { user_id: userId, key: 'stretching',    label: 'Stretching / Mobility',              enabled: true, required_on_match: false, is_custom: false, sort_order: 5 },
    { user_id: userId, key: 'running',       label: 'Running / Sprints (3x/week)',        enabled: true, required_on_match: false, is_custom: false, sort_order: 6 },
    { user_id: userId, key: 'video_review',  label: 'Video Review',                       enabled: true, required_on_match: false, is_custom: false, sort_order: 7 },
    { user_id: userId, key: 'visualization', label: 'Visualization - 5 min',              enabled: true, required_on_match: false, is_custom: false, sort_order: 8 },
    { user_id: userId, key: 'meditation',    label: 'Meditation',                         enabled: true, required_on_match: true,  is_custom: false, sort_order: 9 },
    { user_id: userId, key: 'naam_jap',      label: 'Naam Jap',                           enabled: true, required_on_match: true,  is_custom: false, sort_order: 10 },
    { user_id: userId, key: 'journal',       label: 'Daily Journal - 3 lines',            enabled: true, required_on_match: true,  is_custom: false, sort_order: 11 },
    { user_id: userId, key: 'good_food',     label: 'Good Food - 5 times',                enabled: true, required_on_match: true,  is_custom: false, sort_order: 12 },
    { user_id: userId, key: 'water',         label: 'Water - 4 litres',                   enabled: true, required_on_match: true,  is_custom: false, sort_order: 13 },
    { user_id: userId, key: 'sleep',         label: 'Sleep - 7 to 8 hours',               enabled: true, required_on_match: true,  is_custom: false, sort_order: 14 },
    { user_id: userId, key: 'no_junk_food',  label: 'No Junk Food',                       enabled: true, required_on_match: true,  is_custom: false, sort_order: 15 },
    { user_id: userId, key: 'gym',           label: 'Gym (3x per week)',                  enabled: true, required_on_match: false, is_custom: false, sort_order: 16 },
  ]
}
