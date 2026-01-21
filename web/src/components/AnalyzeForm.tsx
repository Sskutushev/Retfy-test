'use client'

import { useState } from 'react'

export default function AnalyzeForm() {
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Please enter a username.')
      setStatus('error');
      return
    }

    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.replace('@', '') }),
      })

      const data = await response.json();

      if (!response.ok) {
        // Provide more specific error messages based on status codes
        if (response.status === 404) {
          throw new Error(data.error || 'User not found in the database. The user must have sent at least one message in a tracked chat.');
        } else if (response.status === 400) {
          throw new Error(data.error || 'Not enough data for analysis. The user must have sent at least 10 messages.');
        } else if (response.status === 500) {
          throw new Error('Internal server error. Please try again later.');
        } else {
          throw new Error(data.error || 'Failed to analyze user.')
        }
      }

      setResult(data.analysis);
      setStatus('success');
    } catch (err: any) {
      // Handle network errors specifically
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message);
      }
      setStatus('error');
    }
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl z-10">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
              Telegram Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              aria-label="Telegram Username for analysis"
              disabled={status === 'loading'}
            />
            <p className="mt-2 text-xs text-white/60">
              The user must have sent at least 10 messages in a tracked chat
            </p>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {status === 'loading' ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        <div className="mt-6 min-h-[150px]">
          {status === 'error' && (
              <div className="p-4 rounded-lg bg-red-500/20 text-red-300 animate-show-up">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
              </div>
          )}
          {status === 'loading' && <SkeletonLoader />}
          {status === 'success' && result && (
              <div className="p-4 rounded-lg bg-black/20 animate-show-up">
                  <h3 className="font-bold mb-3 text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Analysis Result:</h3>
                  <p className="whitespace-pre-wrap text-white/90">{result}</p>
              </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700/50 rounded"></div>
        <div className="h-4 bg-slate-700/50 rounded"></div>
        <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
    </div>
)
