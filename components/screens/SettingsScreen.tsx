'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '@/components/AppProvider'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Download, Plus, Trash2, ToggleLeft, ToggleRight, Calendar, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskConfig } from '@/types'

export default function SettingsScreen() {
  const { settings, taskConfig, attempt, allLogs, checkins, refetch } = useApp()
  const supabase = createClient()

  const [startDate, setStartDate] = useState(settings?.start_date || '2026-10-09')
  const [tasks, setTasks] = useState<TaskConfig[]>(taskConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newTaskLabel, setNewTaskLabel] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [previousAttempts, setPreviousAttempts] = useState<import('@/types').Attempt[]>([])

  useEffect(() => {
    setTasks(taskConfig)
  }, [taskConfig])

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'active')
      .order('created_at', { ascending: false })
    setPreviousAttempts(data || [])
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('settings').upsert({
        user_id: user.id,
        start_date: startDate,
      }, { onConflict: 'user_id' })
      await refetch()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(key: string) {
    const task = tasks.find(t => t.key === key)
    if (!task) return
    const updated = { ...task, enabled: !task.enabled }
    setTasks(prev => prev.map(t => t.key === key ? updated : t))
    await supabase.from('task_config').update({ enabled: updated.enabled }).eq('id', task.id)
  }

  async function deleteTask(key: string) {
    const task = tasks.find(t => t.key === key)
    if (!task || !task.is_custom) return
    setTasks(prev => prev.filter(t => t.key !== key))
    await supabase.from('task_config').delete().eq('id', task.id)
  }

  async function addCustomTask() {
    if (!newTaskLabel.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const key = `custom_${Date.now()}`
    const newTask = {
      user_id: user.id,
      key,
      label: newTaskLabel.trim(),
      enabled: true,
      required_on_match: false,
      is_custom: true,
      sort_order: tasks.length + 1,
    }
    const { data } = await supabase.from('task_config').insert(newTask).select().single()
    if (data) setTasks(prev => [...prev, data as TaskConfig])
    setNewTaskLabel('')
    setShowAddTask(false)
  }

  async function exportData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      attempt,
      logs: allLogs,
      taskConfig: tasks,
      checkins,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `75-day-challenge-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="p-4 pb-8 space-y-6">
      <h2 className="text-xl font-black text-white">Settings</h2>

      {/* Start Date */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-orange-500" />
          <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider">Start Date</h3>
        </div>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full bg-zinc-800 rounded-xl px-4 h-12 text-white text-base font-bold border border-zinc-700 focus:border-orange-500 focus:outline-none mb-3"
        />
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold text-base active:bg-orange-600 transition-colors"
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Date'}
        </button>
      </div>

      {/* Task Config */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider">Task Configuration</h3>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="flex items-center gap-1 text-orange-400 text-xs font-bold bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-xl active:bg-zinc-700"
          >
            <Plus size={14} />{showAddTask ? 'Cancel' : 'Add Task'}
          </button>
        </div>

        {showAddTask && (
          <div className="flex gap-2 mb-3">
            <input
              value={newTaskLabel}
              onChange={e => setNewTaskLabel(e.target.value)}
              placeholder="New task name..."
              onKeyDown={e => e.key === 'Enter' && addCustomTask()}
              className="flex-1 bg-zinc-800 rounded-xl px-3 h-11 text-white text-base border border-zinc-700 focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={addCustomTask}
              className="px-4 h-11 rounded-xl bg-orange-500 text-white font-bold active:bg-orange-600"
            >
              Add
            </button>
          </div>
        )}

        <div className="space-y-1 divide-y divide-zinc-800">
          {tasks.map(task => (
            <div key={task.key} className="flex items-center gap-3 py-3">
              <span className={cn(
                'flex-1 text-base font-medium',
                task.enabled ? 'text-white' : 'text-zinc-600 line-through'
              )}>
                {task.label}
                {task.is_custom && (
                  <span className="ml-2 text-xs text-orange-400 bg-orange-950/60 border border-orange-900/60 px-2 py-0.5 rounded-full font-bold">custom</span>
                )}
              </span>
              <button
                onClick={() => toggleTask(task.key)}
                className="p-1"
                aria-label={`Toggle ${task.label}`}
              >
                {task.enabled
                  ? <ToggleRight size={30} className="text-orange-500" />
                  : <ToggleLeft size={30} className="text-zinc-700" />
                }
              </button>
              {task.is_custom && (
                <button
                  onClick={() => deleteTask(task.key)}
                  className="p-1 text-red-400 active:text-red-300"
                  aria-label={`Delete ${task.label}`}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Previous Attempts */}
      {previousAttempts.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <History size={18} className="text-orange-500" />
              <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider">Previous Attempts</h3>
            </div>
            <span className="text-zinc-400 text-xs font-bold">{showHistory ? '▲ Hide' : '▼ View'} ({previousAttempts.length})</span>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {previousAttempts.map(att => (
                <div key={att.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-bold">
                      Started: {att.start_date}
                    </span>
                    <span className={cn(
                      'text-xs px-2.5 py-0.5 rounded-full font-bold uppercase',
                      att.status === 'completed' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-red-950 text-red-400 border border-red-900'
                    )}>
                      {att.status}
                    </span>
                  </div>
                  {att.fail_reason && (
                    <p className="text-xs text-zinc-400 mt-1">{att.fail_reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backup & Logout */}
      <div className="space-y-3 pt-2">
        <button
          onClick={exportData}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 text-white font-bold text-base border border-zinc-700 active:bg-zinc-800 transition-colors"
        >
          <Download size={18} className="text-orange-500" />
          Export Backup Data (JSON)
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-950/40 text-red-400 font-bold text-base border border-red-900/40 active:bg-red-900/60 transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  )
}
