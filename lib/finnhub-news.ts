/**
 * lib/finnhub-news.ts
 * Fetches recent news for a ticker from Finnhub (free tier).
 * Uses Groq AI to accurately score sentiment for signal boosting.
 */

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

function getFinnhubKey() {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error('Missing FINNHUB_API_KEY')
  return key
}

function getGroqKey() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Missing GROQ_API_KEY')
  return key
}

type FinnhubNewsItem = {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export type NewsItem = {
  headline: string
  source: string
  url: string
  datetime: number
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number // -1 to +1
}

// Use Groq AI to analyze sentiment of multiple headlines at once
async function analyzeHeadlinesSentiment(
  ticker: string,
  headlines: string[]
): Promise<Array<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number }>> {
  if (headlines.length === 0) return []

  try {
    const prompt = `You are a financial news sentiment analyzer. Analyze each headline below for ${ticker} stock and rate its sentiment.

For each headline, respond with ONLY a JSON array in this exact format (no other text):
[{"sentiment":"positive","score":0.8},{"sentiment":"negative","score":-0.6},...]

Sentiment must be exactly: "positive", "negative", or "neutral"
Score must be a number from -1.0 (very negative) to 1.0 (very positive)

Headlines to analyze:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getGroqKey()}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      console.warn(`Groq sentiment error: ${response.status} — falling back to keyword scoring`)
      return headlines.map(h => keywordScore(h))
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim()

    if (!text) return headlines.map(h => keywordScore(h))

    // Parse the JSON array response
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!Array.isArray(parsed)) return headlines.map(h => keywordScore(h))

    return parsed.map((item: any) => ({
      sentiment: (['positive', 'negative', 'neutral'].includes(item.sentiment)
        ? item.sentiment
        : 'neutral') as 'positive' | 'negative' | 'neutral',
      score: typeof item.score === 'number' ? Math.max(-1, Math.min(1, item.score)) : 0,
    }))
  } catch (error) {
    console.warn(`Groq sentiment failed, using keyword fallback:`, error)
    return headlines.map(h => keywordScore(h))
  }
}

// Keyword fallback in case Groq is unavailable
const POSITIVE_WORDS = [
  'beat', 'beats', 'surge', 'surges', 'rally', 'gain', 'rises', 'jumps',
  'soars', 'record', 'upgrade', 'buy', 'bullish', 'growth', 'profit',
  'strong', 'outperform', 'raised', 'exceeds', 'breakout', 'approval',
  'partnership', 'deal', 'expands', 'launch'
]
const NEGATIVE_WORDS = [
  'miss', 'misses', 'fall', 'falls', 'drop', 'decline', 'plunge', 'crash',
  'downgrade', 'sell', 'bearish', 'loss', 'weak', 'underperform', 'cut',
  'concern', 'warning', 'lawsuit', 'investigation', 'fraud', 'layoffs',
  'bankrupt', 'debt', 'fine', 'penalty'
]

function keywordScore(headline: string): { sentiment: 'positive' | 'negative' | 'neutral'; score: number } {
  const lower = headline.toLowerCase()
  let score = 0
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 1
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 1
  const normalized = Math.max(-1, Math.min(1, score / 3))
  return {
    sentiment: normalized > 0.2 ? 'positive' : normalized < -0.2 ? 'negative' : 'neutral',
    score: normalized,
  }
}

export async function fetchTickerNews(ticker: string, daysBack = 3): Promise<NewsItem[]> {
  try {
    const key = getFinnhubKey()
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - daysBack)

    const toStr = to.toISOString().split('T')[0]
    const fromStr = from.toISOString().split('T')[0]

    const response = await fetch(
      `${FINNHUB_BASE_URL}/company-news?symbol=${ticker.toUpperCase()}&from=${fromStr}&to=${toStr}&token=${key}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      console.warn(`Finnhub news error for ${ticker}: ${response.status}`)
      return []
    }

    const data: FinnhubNewsItem[] = await response.json()
    if (!Array.isArray(data) || data.length === 0) return []

    // Take 3 most recent articles
    const recent = data.slice(0, 3)
    const headlines = recent.map(item => item.headline)

    // Score all headlines in one Groq call
    const sentiments = await analyzeHeadlinesSentiment(ticker, headlines)

    return recent.map((item, i) => ({
      headline: item.headline,
      source: item.source,
      url: item.url,
      datetime: item.datetime,
      sentiment: sentiments[i]?.sentiment ?? 'neutral',
      sentimentScore: sentiments[i]?.score ?? 0,
    }))
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error)
    return []
  }
}

export function calculateNewsBoost(news: NewsItem[]): number {
  if (news.length === 0) return 0

  const avgSentiment = news.reduce((sum, n) => sum + n.sentimentScore, 0) / news.length

  if (avgSentiment > 0.5) return 15
  if (avgSentiment > 0.2) return 8
  if (avgSentiment < -0.5) return -15
  if (avgSentiment < -0.2) return -8
  return 0
}