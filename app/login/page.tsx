'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError(authError.message)
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-5xl mb-4">
            🏏
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            75 Day Hard Challenge
          </h1>
          <p className="text-orange-500 font-bold text-sm mt-1 uppercase tracking-wider">Cricketer Edition</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-14 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 text-white text-base font-medium focus:border-orange-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-14 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 text-white text-base font-medium focus:border-orange-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-red-400 text-sm font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-orange-500 text-white font-black text-lg active:bg-orange-600 transition-colors disabled:opacity-60 mt-2 shadow-lg shadow-orange-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs font-medium mt-6">
          Personal app — private authentication
        </p>
      </div>
    </div>
  )
}
