'use client'

import { useState } from 'react'
import PickCard from '@/components/PickCard'
import { OddsTier, PredictionResult, TIER_CONFIGS, LEAGUES } from '@/lib/types'
import styles from './page.module.css'

const DAY_OPTIONS = [
  { label: 'Today', value: 0 },
  { label: 'Tomorrow', value: 1 },
  { label: 'Day After', value: 2 },
]

export default function Home() {
  const [tier, setTier] = useState<OddsTier>('2')
  const [league, setLeague] = useState('Premier League')
  const [dayOffset, setDayOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState('')
  const [fixturesUsed, setFixturesUsed] = useState<number | null>(null)

  const generate = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setFixturesUsed(null)

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, league, dayOffset }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate predictions')
      if (data.error) throw new Error(data.error)
      setFixturesUsed(data.fixturesUsed ?? null)
      setResult(data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      setError(message)
    }

    setLoading(false)
  }

  const avgConf = result && result.picks?.length
    ? Math.round(result.picks.reduce((s, p) => s + p.confidence, 0) / result.picks.length)
    : 0

  const isLiveData = result && (result as any).data_source === 'live-api'

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            BetMind AI
          </div>
          <div className={styles.subtitle}>// agentic football prediction engine</div>
        </div>

        {/* League + Day selector */}
        <div className={styles.controls}>
          <select
            className={styles.leagueSelect}
            value={league}
            onChange={e => setLeague(e.target.value)}
          >
            {LEAGUES.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <div className={styles.dayTabs}>
            {DAY_OPTIONS.map(d => (
              <button
                key={d.value}
                className={`${styles.dayBtn} ${dayOffset === d.value ? styles.dayBtnActive : ''}`}
                onClick={() => setDayOffset(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Odds Tier Tabs */}
        <div className={styles.tierTabs}>
          {(Object.entries(TIER_CONFIGS) as [OddsTier, typeof TIER_CONFIGS[OddsTier]][]).map(([key, cfg]) => (
            <button
              key={key}
              className={`${styles.tierBtn} ${tier === key ? styles.tierBtnActive : ''}`}
              style={tier === key ? { background: cfg.color, borderColor: cfg.color, color: '#fff' } : {}}
              onClick={() => setTier(key)}
            >
              {cfg.label} — {cfg.riskLabel}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          className={styles.generateBtn}
          style={{ background: TIER_CONFIGS[tier].color }}
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className={styles.spinner} />
              Fetching fixtures &amp; analyzing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/>
                <path d="M6 5l5 3-5 3V5z" fill="white"/>
              </svg>
              Generate {TIER_CONFIGS[tier].label} — {DAY_OPTIONS[dayOffset].label}
            </>
          )}
        </button>

        {error && <div className={styles.errorBox}>{error}</div>}

        {result && (
          <div className={styles.results}>
            {/* Data source badge */}
            <div className={styles.sourceBadge} style={{
              background: isLiveData ? 'var(--green-bg)' : 'var(--amber-bg)',
              color: isLiveData ? 'var(--green-dim)' : '#a06010',
            }}>
              {isLiveData
                ? `✓ ${fixturesUsed} real fixtures fetched from API`
                : '⚠ AI-estimated fixtures — add API_FOOTBALL_KEY for live data'}
            </div>

            {/* Summary */}
            <div className={styles.summaryStrip}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>combined odds</span>
                <span className={styles.statVal}>{result.combined_odds?.toFixed(2)}x</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>selections</span>
                <span className={styles.statVal}>{result.picks?.length}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>avg confidence</span>
                <span className={styles.statVal}>{avgConf}%</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>date</span>
                <span className={styles.statVal} style={{ fontSize: 14 }}>{result.date}</span>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxNote}`}>
                <span className={styles.statLabel}>agent note</span>
                <span className={styles.statNote}>{result.agent_note}</span>
              </div>
            </div>

            <div className={styles.picksGrid}>
              {result.picks?.map((pick, i) => (
                <PickCard key={i} pick={pick} tier={tier} index={i} />
              ))}
            </div>

            <p className={styles.disclaimer}>
              ⚠ AI predictions are for entertainment only. Bet responsibly. Never bet more than you can afford to lose.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
