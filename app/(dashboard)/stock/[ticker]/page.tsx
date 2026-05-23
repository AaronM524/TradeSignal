"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, ArrowDown, Plus, TrendingUp, Activity, Zap, Target, AlertTriangle } from "lucide-react"
import { QuoteCard } from "@/components/market/quote-card"
import { IndicatorsCard } from "@/components/market/indicators-card"
import { SignalCard } from "@/components/signals/signal-card"
import type { StockQuote, TechnicalIndicators, TradeSignal } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function StockDetailPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const upperTicker = ticker?.toUpperCase() ?? ""
  
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [addingToWatchlist, setAddingToWatchlist] = useState(false)
  
  const { data: quote, isLoading: quoteLoading } = useSWR<StockQuote>(
    upperTicker ? `/api/market/quote?ticker=${upperTicker}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  const { data: indicators, isLoading: indicatorsLoading } = useSWR<TechnicalIndicators>(
    upperTicker ? `/api/market/indicators?ticker=${upperTicker}` : null,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  const { data: signals } = useSWR<TradeSignal[]>(
    upperTicker ? `/api/signals/scan?ticker=${upperTicker}` : null,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  // Check if in watchlist
  useEffect(() => {
    if (!upperTicker) return
    fetch("/api/watchlist")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIsInWatchlist(data.some(item => item.ticker === upperTicker))
        }
      })
      .catch(() => {})
  }, [upperTicker])
  
  const toggleWatchlist = async () => {
    setAddingToWatchlist(true)
    try {
      if (isInWatchlist) {
        await fetch(`/api/watchlist?ticker=${upperTicker}`, { method: "DELETE" })
        setIsInWatchlist(false)
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: upperTicker })
        })
        setIsInWatchlist(true)
      }
    } catch (error) {
      console.error("Failed to update watchlist:", error)
    }
    setAddingToWatchlist(false)
  }
  
  const latestSignal = signals?.[0]
  
  if (!upperTicker) {
    return <div className="flex flex-1 items-center justify-center">Invalid ticker</div>
  }
  
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{upperTicker}</h1>
            {quote && (
              <Badge variant={quote.change >= 0 ? "default" : "destructive"} className="text-sm">
                {quote.change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {quote.changePercent?.toFixed(2) ?? "0.00"}%
              </Badge>
            )}
          </div>
          {quote && (
            <p className="text-muted-foreground mt-1">{quote.name || upperTicker}</p>
          )}
        </div>
        <Button 
          variant={isInWatchlist ? "outline" : "default"}
          onClick={toggleWatchlist}
          disabled={addingToWatchlist}
        >
          {isInWatchlist ? "In Watchlist" : <><Plus className="h-4 w-4 mr-2" /> Add to Watchlist</>}
        </Button>
      </div>
      
      {/* Price Display */}
      {quote && (
        <div className="flex items-baseline gap-4">
          <span className="text-5xl font-bold">${quote.price?.toFixed(2) ?? "0.00"}</span>
          <span className={`text-xl ${quote.change >= 0 ? "text-bullish" : "text-bearish"}`}>
            {quote.change >= 0 ? "+" : ""}{quote.change?.toFixed(2) ?? "0.00"} ({quote.changePercent?.toFixed(2) ?? "0.00"}%)
          </span>
        </div>
      )}
      
      {/* Signal Alert */}
      {latestSignal && latestSignal.score >= 60 && (
        <Card className={`border-2 ${latestSignal.signalType === "bullish_entry" ? "border-bullish bg-bullish/5" : "border-bearish bg-bearish/5"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${latestSignal.signalType === "bullish_entry" ? "bg-bullish/20" : "bg-bearish/20"}`}>
                <Zap className={`h-5 w-5 ${latestSignal.signalType === "bullish_entry" ? "text-bullish" : "text-bearish"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {latestSignal.signalType === "bullish_entry" ? "Bullish" : "Bearish"} Signal Detected
                  </span>
                  <Badge variant="secondary">Score: {latestSignal.score}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {latestSignal.triggers.map(t => t.type.replace(/_/g, " ")).join(" • ")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  Entry: <span className="font-mono">${latestSignal.entry?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  R:R {latestSignal.riskReward?.toFixed(1) ?? "0.0"}:1
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technicals">Technical Analysis</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Trading Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-mono">{((quote.volume ?? 0) / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day High</span>
                      <span className="font-mono">${quote.dayHigh?.toFixed(2) ?? "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day Low</span>
                      <span className="font-mono">${quote.dayLow?.toFixed(2) ?? "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W High</span>
                      <span className="font-mono">${quote.fiftyTwoWeekHigh?.toFixed(2) ?? "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W Low</span>
                      <span className="font-mono">${quote.fiftyTwoWeekLow?.toFixed(2) ?? "0.00"}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Position Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Position Sizing
                </CardTitle>
                <CardDescription>Based on 2% risk rule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote && latestSignal && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="font-mono">${latestSignal.entry?.toFixed(2) ?? "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop Loss</span>
                      <span className="font-mono text-bearish">${latestSignal.stopLoss?.toFixed(2) ?? "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-mono text-bullish">${latestSignal.target?.toFixed(2) ?? "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk/Reward</span>
                      <span className="font-mono">{latestSignal.riskReward?.toFixed(1) ?? "0.0"}:1</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">$10k Account (2% risk)</span>
                        <span className="font-mono">
                          {latestSignal.entry && latestSignal.stopLoss && latestSignal.entry !== latestSignal.stopLoss
                            ? Math.floor(200 / Math.abs(latestSignal.entry - latestSignal.stopLoss))
                            : 0} shares
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {(!latestSignal) && (
                  <p className="text-sm text-muted-foreground">No active signal detected. Position sizing will appear when a trade setup is found.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Risk Warning */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Risk Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is not financial advice. All signals are for educational purposes only. 
                  Always do your own research and consider your risk tolerance before trading. 
                  Past performance does not guarantee future results.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="technicals" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {indicators && <IndicatorsCard indicators={indicators} />}
            {quote && <QuoteCard quote={quote} />}
          </div>
        </TabsContent>
        
        <TabsContent value="signals" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {signals && signals.length > 0 ? (
              signals.map((signal, index) => (
                <SignalCard key={index} signal={signal} />
              ))
            ) : (
              <Card className="col-span-2">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Active Signals</h3>
                  <p className="text-sm text-muted-foreground">
                    No trade signals detected for {upperTicker} at this time. 
                    Check back later or add it to your watchlist for automatic monitoring.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
