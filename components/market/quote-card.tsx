'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Quote, StockQuote } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuoteCardProps {
  quote: Quote | StockQuote
  showVolume?: boolean
  compact?: boolean
}

export function QuoteCard({ quote, showVolume = true, compact = false }: QuoteCardProps) {
  const isPositive = quote.change >= 0
  
  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{quote.ticker}</span>
          <span className="font-mono">${quote.price.toFixed(2)}</span>
        </div>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isPositive ? 'text-bullish' : 'text-bearish'
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{quote.ticker}</CardTitle>
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium',
            isPositive ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono">${quote.price.toFixed(2)}</span>
          <span className={cn(
            'text-sm',
            isPositive ? 'text-bullish' : 'text-bearish'
          )}>
            {isPositive ? '+' : ''}{quote.change.toFixed(2)}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Open</span>
            <span className="font-mono">${quote.open.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prev Close</span>
            <span className="font-mono">${quote.previousClose.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">High</span>
            <span className="font-mono text-bullish">${quote.high.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Low</span>
            <span className="font-mono text-bearish">${quote.low.toFixed(2)}</span>
          </div>
        </div>

        {showVolume && (
          <div className="flex justify-between border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-mono">
              {(quote.volume / 1000000).toFixed(2)}M
              {quote.avgVolume > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({((quote.volume / quote.avgVolume) * 100).toFixed(0)}% avg)
                </span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
