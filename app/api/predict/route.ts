import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// football-data.org competition IDs (free tier)
const COMPETITION_IDS: Record<string, string> = {
  'Premier League': 'PL',
  'La Liga': 'PD',
  'Serie A': 'SA',
  'Bundesliga': 'BL1',
  'Champions League': 'CL',
  'Ligue 1': 'FL1',
  'Eredivisie': 'DED',
  'Liga Portugal': 'PPL',
}

// api-football.com league IDs (backup)
const API_FOOTBALL_IDS: Record<string, number> = {
  'Premier League': 39,
  'La Liga': 140,
  'Serie A': 135,
  'Bundesliga': 78,
  'Champions League': 2,
  'Ligue 1': 61,
  'Eredivisie': 88,
  'Liga Portugal': 94,
  'NPFL': 332,
}

function getDateString(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

// Source 1: football-data.org (free, needs FOOTBALL_DATA_KEY)
async function fetchFromFootballData(league: string, dayOffset: number, apiKey: string) {
  const compId = COMPETITION_IDS[league]
  if (!compId) return []

  const dateFrom = getDateString(dayOffset)
  const dateTo = getDateString(dayOffset)

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${compId}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=SCHEDULED,TIMED`,
    { headers: { 'X-Auth-Token': apiKey } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.matches || []).map((m: any) => ({
    home: m.homeTeam.name,
    away: m.awayTeam.name,
    date: m.utcDate,
    source: 'football-data.org',
  }))
}

// Source 2: api-football.com (backup, needs API_FOOTBALL_KEY)
async function fetchFromApiFootball(league: string, dayOffset: number, apiKey: string) {
  const leagueId = API_FOOTBALL_IDS[league]
  if (!leagueId) return []

  const date = getDateString(dayOffset)
  const season = new Date().getFullYear()

  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&date=${date}`,
    {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      },
    }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.response || [])
    .filter((f: any) => ['NS', 'TBD'].includes(f.fixture.status.short))
    .map((f: any) => ({
      home: f.teams.home.name,
      away: f.teams.away.name,
      date: f.fixture.date,
      source: 'api-football.com',
    }))
}

const TIER_CONFIG: Record<string, { desc: string; picks: string }> = {
  '2': { desc: '2.0-2.5 combined odds (safe accumulator)', picks: '2' },
  '3': { desc: '2.8-3.5 combined odds (medium risk)', picks: '3' },
  '5': { desc: '4.5-5.5 combined odds (higher risk)', picks: '4' },
  '10': { desc: '8.0-12.0 combined odds (longshot accumulator)', picks: '5' },
}

export async function POST(req: NextRequest) {
  try {
    const { tier, league, dayOffset = 0 } = await req.json()

    const openRouterKey = process.env.OPENROUTER_API_KEY
    if (!openRouterKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
    }

    const footballDataKey = process.env.FOOTBALL_DATA_KEY
    const apiFootballKey = process.env.API_FOOTBALL_KEY

    const tierConf = TIER_CONFIG[tier] || TIER_CONFIG['2']
    const dateLabels = ['Today', 'Tomorrow', 'Day after tomorrow']
    const dateLabel = dateLabels[dayOffset] || 'Today'
    const dateStr = getDateString(dayOffset)

    // Try sources in priority order
    let fixtures: any[] = []
    let dataSource = 'ai-estimated'

    if (footballDataKey && COMPETITION_IDS[league]) {
      fixtures = await fetchFromFootballData(league, dayOffset, footballDataKey)
      if (fixtures.length > 0) dataSource = 'football-data.org'
    }

    if (fixtures.length === 0 && apiFootballKey) {
      fixtures = await fetchFromApiFootball(league, dayOffset, apiFootballKey)
      if (fixtures.length > 0) dataSource = 'api-football.com'
    }

    const hasRealFixtures = fixtures.length > 0

    const systemPrompt = `You are BetMind, an expert football betting analyst with deep knowledge of all major leagues.

${hasRealFixtures
  ? `You have been given VERIFIED real fixtures for ${league} on ${dateLabel} (${dateStr}).
YOU MUST ONLY pick from these exact matches. Do NOT invent or add any other games.

CONFIRMED FIXTURES FOR ${dateStr}:
${fixtures.map((f, i) => `${i + 1}. ${f.home} vs ${f.away}`).join('\n')}

Total: ${fixtures.length} matches available to pick from.`
  : `IMPORTANT: No live fixture data API is connected.
You must use your knowledge of the ${league} ${new Date().getFullYear()} season schedule to suggest the most likely real fixtures for ${dateLabel} (${dateStr}).
Only suggest matches you are highly confident are actually scheduled.
Set data_source to "ai-estimated" and warn in agent_note.`
}

Use your knowledge of current season form, h2h, home/away records, and league standings to analyze each fixture.

Return ONLY this exact JSON (no markdown, no extra text):
{
  "tier": "${tier} Odds",
  "date": "${dateLabel} — ${dateStr}",
  "combined_odds": <number>,
  "data_source": "${dataSource}",
  "picks": [
    {
      "match": "<Home Team> vs <Away Team>",
      "league": "${league}",
      "selection": "<BTTS / Over 2.5 Goals / Home Win / Away Win / Draw / Double Chance / Under 2.5 Goals>",
      "individual_odds": <realistic decimal odds>,
      "confidence": <integer 50-95>,
      "reasoning": "<2-3 sentences citing specific form, h2h record, and stats>"
    }
  ],
  "agent_note": "<concise 1-2 sentence summary>",
  "error": null
}`

    const userPrompt = `Build a ${tierConf.desc} accumulator with ${tierConf.picks} picks from the confirmed fixtures above. Return only valid JSON.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://betmind-two.vercel.app',
        'X-Title': 'BetMind Football Predictor',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 2000,
        temperature: 0.15,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: response.status })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({
      ...parsed,
      fixturesUsed: fixtures.length,
      dataSource,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
