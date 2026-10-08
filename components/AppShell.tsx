'use client'

import React, { useState } from 'react'
import { Home, Calendar, BarChart2, Camera, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabName } from '@/types'
import TodayScreen from './screens/TodayScreen'
import CalendarScreen from './screens/CalendarScreen'
import StatsScreen from './screens/StatsScreen'
import ProgressScreen from './screens/ProgressScreen'
import SettingsScreen from './screens/SettingsScreen'

const TABS: { id: TabName; label: string; icon: React.ElementType }[] = [
  { id: 'today',    label: 'Today',    icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'stats',    label: 'Stats',    icon: BarChart2 },
  { id: 'progress', label: 'Progress', icon: Camera },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('today')

  return (
    <div className="app-shell">
      {/* Main content */}
      <main className="main-content">
        {activeTab === 'today'    && <TodayScreen />}
        {activeTab === 'calendar' && <CalendarScreen onDayTap={() => {}} />}
        {activeTab === 'stats'    && <StatsScreen />}
        {activeTab === 'progress' && <ProgressScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Bottom tab bar */}
      <nav className="bottom-tab-bar">
        <div className="flex items-stretch">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px]',
                  'transition-colors duration-150',
                  active ? 'text-orange-500' : 'text-zinc-500'
                )}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  size={24}
                  className={cn(
                    'transition-all duration-150',
                    active && 'scale-110 text-orange-500'
                  )}
                />
                <span className={cn(
                  'text-[11px] font-bold leading-none',
                  active ? 'text-orange-500' : 'text-zinc-500'
                )}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
