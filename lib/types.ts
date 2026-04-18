export interface Pick {
  match: string
  league: string
  selection: string
  individual_odds: number
  confidence: number
  reasoning: string
}

export interface PredictionResult {
  tier: string
  date: string
  combined_odds: number
  picks: Pick[]
  agent_note: string
  data_source: 'live-api' | 'ai-estimated'
}

export type OddsTier = '2' | '3' | '5' | '10'

export interface TierConfig {
  label: string
  desc: string
  color: string
  textColor: string
  bgColor: string
  riskLabel: string
}

export const TIER_CONFIGS: Record<OddsTier, TierConfig> = {
  '2': { label: '2 Odds', desc: 'Safe picks', color: '#1a9e5c', textColor: '#0f6e3e', bgColor: 'var(--green-bg)', riskLabel: 'Safe' },
  '3': { label: '3 Odds', desc: 'Medium risk', color: '#e8a020', textColor: '#a06010', bgColor: 'var(--amber-bg)', riskLabel: 'Medium' },
  '5': { label: '5 Odds', desc: 'Higher risk', color: '#7c5cbf', textColor: '#5a3e99', bgColor: 'var(--purple-bg)', riskLabel: 'Risky' },
  '10': { label: '10 Odds', desc: 'Longshot', color: '#d84040', textColor: '#a32d2d', bgColor: 'var(--red-bg)', riskLabel: 'Longshot' },
}

export const LEAGUES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Champions League',
  'Ligue 1',
  'Eredivisie',
  'Liga Portugal',
  'NPFL',
]
