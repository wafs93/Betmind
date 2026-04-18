import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// League IDs on api-football.com
const LEAGUE_IDS: Record<string, number> = {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || 'Premier League'
  const dayOffset = parseInt(searchParams.get('day') || '0') // 0=today, 1=tomorrow, 2=day after

  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })
  }

  const leagueId = LEAGUE_IDS[league]
  if (!leagueId) {
    return NextResponse.json({ error: `Unknown league: ${league}` }, { status: 400 })
  }

  const date = getDateString(dayOffset)
  const season = new Date().getFullYear()

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&date=${date}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `API-Football error: ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    const fixtures = (data.response || []).map((f: any) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      status: f.fixture.status.short,
      home: f.teams.home.name,
      away: f.teams.away.name,
      homeForm: null, // could be enriched later
      awayForm: null,
    }))

    return NextResponse.json({ date, league, fixtures })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
