'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { TechnicalIndicators } from '@/lib/types'
import { cn } from '@/lib/utils'

interface IndicatorsCardProps {
  indicators: TechnicalIndicators
  currentPrice: number
}

export function IndicatorsCard({ indicators, currentPrice }: IndicatorsCardProps) {
  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-bearish'
    if (rsi <= 30) return 'text-bullish'
    return 'text-neutral'
  }

  const getRSILabel = (rsi: number) => {
    if (rsi >= 70) return 'Overbought'
    if (rsi <= 30) return 'Oversold'
    return 'Neutral'
  }

  const TrendIcon = indicators.rsiTrend === 'rising' ? TrendingUp : 
                    indicators.rsiTrend === 'falling' ? TrendingDown : Minus

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Technical Indicators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RSI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">RSI (14)</span>
            <div className="flex items-center gap-2">
              <span className={cn('font-mono font-medium', getRSIColor(indicators.rsi))}>
                {indicators.rsi.toFixed(1)}
              </span>
              <TrendIcon className={cn(
                'h-3 w-3',
                indicators.rsiTrend === 'rising' ? 'text-bullish' : 
                indicators.rsiTrend === 'falling' ? 'text-bearish' : 'text-muted-foreground'
              )} />
            </div>
          </div>
          <div className="relative">
            <Progress value={indicators.rsi} className="h-2" />
            <div className="absolute left-[30%] top-0 h-2 w-px bg-muted-foreground/50" />
            <div className="absolute left-[70%] top-0 h-2 w-px bg-muted-foreground/50" />
          </div>
          <Badge variant="outline" className={cn('text-xs', getRSIColor(indicators.rsi))}>
            {getRSILabel(indicators.rsi)}
          </Badge>
        </div>

        {/* MACD */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">MACD</span>
            {indicators.macdCrossover !== 'none' && (
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  indicators.macdCrossover === 'bullish' ? 'text-bullish border-bullish/30' : 'text-bearish border-bearish/30'
                )}
              >
                {indicators.macdCrossover === 'bullish' ? 'Bullish Cross' : 'Bearish Cross'}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">MACD</p>
              <p className={cn(
                'font-mono',
                indicators.macd > 0 ? 'text-bullish' : 'text-bearish'
              )}>
                {indicators.macd.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="font-mono">{indicators.macdSignal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Histogram</p>
              <p className={cn(
                'font-mono',
                indicators.macdHistogram > 0 ? 'text-bullish' : 'text-bearish'
              )}>
                {indicators.macdHistogram.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* VWAP */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">VWAP</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">${indicators.vwap.toFixed(2)}</span>
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                indicators.priceVsVwap === 'above' ? 'text-bullish border-bullish/30' : 
                indicators.priceVsVwap === 'below' ? 'text-bearish border-bearish/30' : ''
              )}
            >
              {indicators.priceVsVwap === 'above' ? 'Above' : indicators.priceVsVwap === 'below' ? 'Below' : 'At'}
            </Badge>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Moving Averages</span>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">9 EMA</span>
              <span className={cn(
                'font-mono',
                currentPrice > indicators.ema9 ? 'text-bullish' : 'text-bearish'
              )}>
                ${indicators.ema9.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">21 EMA</span>
              <span className={cn(
                'font-mono',
                currentPrice > indicators.ema21 ? 'text-bullish' : 'text-bearish'
              )}>
                ${indicators.ema21.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">50 SMA</span>
              <span className={cn(
                'font-mono',
                currentPrice > indicators.sma50 ? 'text-bullish' : 'text-bearish'
              )}>
                ${indicators.sma50.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">200 SMA</span>
              <span className={cn(
                'font-mono',
                currentPrice > indicators.sma200 ? 'text-bullish' : 'text-bearish'
              )}>
                ${indicators.sma200.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Relative Volume</span>
          <span className={cn(
            'font-mono font-medium',
            indicators.relativeVolume > 1.5 ? 'text-bullish' : 
            indicators.relativeVolume < 0.5 ? 'text-bearish' : 'text-foreground'
          )}>
            {indicators.relativeVolume.toFixed(2)}x
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
