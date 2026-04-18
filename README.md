# BetMind AI ⚽

AI-powered football betting prediction agent. Generates analytical picks for 2, 3, 5, and 10 odds accumulators using OpenRouter LLM.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your OpenRouter API key:
```
OPENROUTER_API_KEY=sk-or-your-key-here
```

Get your key at: https://openrouter.ai/keys

### 3. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts, then:
vercel env add OPENROUTER_API_KEY
vercel --prod
```

### Option B — GitHub + Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. Add environment variable: `OPENROUTER_API_KEY` = your key
4. Click Deploy

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | Your OpenRouter API key |

---

## Stack
- **Framework**: Next.js 14 (App Router)
- **AI**: OpenRouter API → `google/gemini-2.0-flash-001`
- **Hosting**: Vercel
- **Fonts**: Syne + JetBrains Mono (Google Fonts)

## Changing the AI Model

Edit `app/api/predict/route.ts` and change the model:
```ts
model: 'google/gemini-2.0-flash-001',       // fast & cheap (default)
// model: 'deepseek/deepseek-r1',            // deeper reasoning
// model: 'anthropic/claude-sonnet-4-5',     // highest quality
```

## Upgrade: Add Real Match Data
To use real fixtures and odds, integrate:
- **API-Football** (api-football.com) — fixtures, form, H2H
- **The Odds API** (the-odds-api.com) — live bookmaker odds

Add these as env variables and pass the data into the AI prompt in `app/api/predict/route.ts`.
