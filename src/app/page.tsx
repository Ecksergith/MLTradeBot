'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Brain, Settings, Activity, Clock } from 'lucide-react'

interface Trade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: string
  profit: number
  mlConfidence: number
}

interface OpenTrade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  entry_price: number
  current_price: number
  quantity: number
  timestamp: string
  take_profit?: number
  stop_loss?: number
  ml_confidence: number
  unrealized_pnl: number
  status: 'open' | 'closed'
}

interface Asset {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: number
  mlPrediction: 'buy' | 'sell' | 'hold'
  confidence: number
}

interface Portfolio {
  totalValue: number
  dailyChange: number
  assets: {
    symbol: string
    amount: number
    value: number
    change: number
  }[]
}

export default function MLTradingBot() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio>({ totalValue: 0, dailyChange: 0, assets: [] })
  const [trades, setTrades] = useState<Trade[]>([])
  const [isBotActive, setIsBotActive] = useState(false)
  const [isAutoTradeEnabled, setIsAutoTradeEnabled] = useState(false)
  const [autoTradeSettings, setAutoTradeSettings] = useState({
    enabledAssets: ['BTC', 'ETH', 'SOL'],
    minConfidence: 75,
    maxDailyTrades: 10,
    tradeInterval: 30, // segundos
    riskMultiplier: 1.0
  })
  const [botSettings, setBotSettings] = useState({
    riskLevel: 'medium',
    maxTradeSize: 1000,
    stopLoss: 5,
    takeProfit: 10,
    mlModel: 'lstm'
  })
  const [selectedAsset, setSelectedAsset] = useState('')
  const [tradeAmount, setTradeAmount] = useState('')
  const [mlStatus, setMlStatus] = useState('Treinando modelos ML...')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dailyTradeCount, setDailyTradeCount] = useState(0)
  const [lastTradeReset, setLastTradeReset] = useState(new Date().toDateString())
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([])
  const [autoClosedTrades, setAutoClosedTrades] = useState<any[]>([])

  // Fetch market data from API
  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/trading/market')
      const data = await response.json()
      
      if (data.data) {
        const formattedAssets = data.data.map((asset: any) => ({
          symbol: asset.symbol,
          name: asset.name,
          price: asset.price,
          change24h: asset.change_percent_24h,
          volume: asset.volume_24h,
          mlPrediction: 'hold' as const, // Will be updated by predictions
          confidence: 0
        }))
        setAssets(formattedAssets)
        if (formattedAssets.length > 0 && !selectedAsset) {
          setSelectedAsset(formattedAssets[0].symbol)
        }
      }
    } catch (err) {
      console.error('Error fetching market data:', err)
      setError('Failed to fetch market data')
    }
  }

  // Fetch open trades and trade management data
  const fetchTradeManagementData = async () => {
    try {
      const response = await fetch('/api/trading/close')
      const data = await response.json()
      
      setOpenTrades(data.open_trades || [])
      setAutoClosedTrades(data.auto_closed_trades || [])
      
      // Show notifications for auto-closed trades
      if (data.auto_closed_trades && data.auto_closed_trades.length > 0) {
        data.auto_closed_trades.forEach((trade: any) => {
          console.log(`Trade ${trade.trade_id} auto-closed: ${trade.reason}`)
        })
      }
    } catch (err) {
      console.error('Error fetching trade management data:', err)
    }
  }

  // Fetch portfolio data from API
  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/trading/execute')
      const data = await response.json()
      
      if (data.portfolio) {
        const totalValue = Object.entries(data.portfolio).reduce((sum: number, [symbol, amount]: [string, any]) => {
          if (symbol === 'USD') return sum + amount
          const price = data.current_prices[symbol] || 0
          return sum + (amount * price)
        }, 0)
        
        setPortfolio({
          totalValue,
          dailyChange: portfolio.dailyChange, // Keep existing daily change
          assets: Object.entries(data.portfolio).map(([symbol, amount]: [string, any]) => ({
            symbol,
            amount,
            value: symbol === 'USD' ? amount : amount * (data.current_prices[symbol] || 0),
            change: 0 // Will be calculated based on price changes
          }))
        })
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err)
    }
  }

  // Get ML prediction for an asset
  const getPrediction = async (symbol: string) => {
    try {
      const response = await fetch('/api/trading/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      })
      const prediction = await response.json()
      
      // Update asset with prediction
      setAssets(prev => prev.map(asset => 
        asset.symbol === symbol 
          ? { 
              ...asset, 
              mlPrediction: prediction.prediction, 
              confidence: prediction.confidence 
            }
          : asset
      ))
      
      return prediction
    } catch (err) {
      console.error('Error getting prediction:', err)
      return null
    }
  }

  // Execute trade via API
  const executeTradeAPI = async (symbol: string, type: 'buy' | 'sell', amount: number, mlConfidence?: number, takeProfit?: number, stopLoss?: number) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          type,
          amount,
          ml_confidence: mlConfidence,
          take_profit: takeProfit,
          stop_loss: stopLoss
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update daily trade count
        const today = new Date().toDateString()
        if (today !== lastTradeReset) {
          setDailyTradeCount(1)
          setLastTradeReset(today)
        } else {
          setDailyTradeCount(prev => prev + 1)
        }
        
        // Add trade to history
        const newTrade: Trade = {
          id: result.trade_id,
          symbol: result.symbol,
          type: result.type,
          amount: result.amount,
          price: result.price,
          timestamp: result.timestamp,
          profit: result.estimated_profit || 0,
          mlConfidence: mlConfidence || 0
        }
        
        setTrades(prev => [newTrade, ...prev])
        
        // Update portfolio
        await fetchPortfolioData()
        
        // Update open trades
        await fetchTradeManagementData()
        
        return result
      } else {
        setError(result.message || 'Trade execution failed')
        return null
      }
    } catch (err) {
      console.error('Error executing trade:', err)
      setError('Failed to execute trade')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Initialize data and set up real-time updates
  useEffect(() => {
    const initializeData = async () => {
      // Fetch initial data from APIs
      await fetchMarketData()
      await fetchPortfolioData()
      await fetchTradeManagementData()
      
      // Get initial predictions for enabled assets
      const enabledAssets = autoTradeSettings.enabledAssets
      for (const symbol of enabledAssets) {
        await getPrediction(symbol)
      }
    }

    initializeData()

    // Simulate real-time price updates
    const priceInterval = setInterval(async () => {
      try {
        const symbols = assets.map(asset => asset.symbol)
        const response = await fetch('/api/trading/market', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        })
        const data = await response.json()
        
        if (data.updated_data) {
          setAssets(prev => prev.map(asset => {
            const updated = data.updated_data.find((u: any) => u.symbol === asset.symbol)
            return updated ? { ...asset, price: updated.price, change24h: updated.change_percent_24h } : asset
          }))
        }
      } catch (err) {
        console.error('Error updating prices:', err)
      }
    }, 3000)

    // Simulate ML status updates
    const mlInterval = setInterval(() => {
      const statuses = [
        'Analisando padrões de mercado...',
        'Processando dados históricos...',
        'Executando redes neurais...',
        'Gerando previsões...',
        'Otimizando estratégia de trading...'
      ]
      setMlStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 5000)

    // Auto trading logic
    const autoTradeInterval = setInterval(async () => {
      if (isBotActive && isAutoTradeEnabled) {
        await executeAutoTradeAPI()
      }
    }, autoTradeSettings.tradeInterval * 1000)

    // Trade management monitoring
    const tradeManagementInterval = setInterval(async () => {
      if (isBotActive) {
        await fetchTradeManagementData()
      }
    }, 10000) // Check every 10 seconds for auto-close conditions

    return () => {
      clearInterval(priceInterval)
      clearInterval(mlInterval)
      clearInterval(autoTradeInterval)
      clearInterval(tradeManagementInterval)
    }
  }, [isBotActive, isAutoTradeEnabled, autoTradeSettings.tradeInterval, assets.length])

  const executeTrade = async (type: 'buy' | 'sell') => {
    if (!selectedAsset || !tradeAmount) return

    const amount = parseFloat(tradeAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid trade amount')
      return
    }

    // Get the current prediction for the selected asset
    const asset = assets.find(a => a.symbol === selectedAsset)
    if (!asset) return

    await executeTradeAPI(selectedAsset, type, amount, asset.confidence)
    setTradeAmount('')
  }

  // Close trade via API
  const closeTradeAPI = async (tradeId: string, reason: 'take_profit' | 'stop_loss' | 'manual' | 'ml_signal') => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/trading/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_id: tradeId,
          reason
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update open trades
        await fetchTradeManagementData()
        
        // Update portfolio
        await fetchPortfolioData()
        
        return result
      } else {
        setError(result.message || 'Failed to close trade')
        return null
      }
    } catch (err) {
      console.error('Error closing trade:', err)
      setError('Failed to close trade')
      return null
    } finally {
      setLoading(false)
    }
  }

  const executeAutoTradeAPI = async () => {
    // Check daily trade limit
    if (dailyTradeCount >= autoTradeSettings.maxDailyTrades) {
      console.log('Daily trade limit reached')
      return
    }

    // Find assets that meet auto trade criteria
    const eligibleAssets = assets.filter(asset => 
      autoTradeSettings.enabledAssets.includes(asset.symbol) &&
      asset.confidence >= autoTradeSettings.minConfidence &&
      asset.mlPrediction !== 'hold'
    )

    if (eligibleAssets.length === 0) {
      console.log('No eligible assets for auto trading')
      return
    }

    // Select the asset with highest confidence
    const selectedAsset = eligibleAssets.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    )

    // Get fresh prediction for the selected asset
    const prediction = await getPrediction(selectedAsset.symbol)
    if (!prediction || prediction.confidence < autoTradeSettings.minConfidence) {
      console.log('Prediction confidence too low')
      return
    }

    // Calculate trade amount based on risk settings
    const baseAmount = botSettings.maxTradeSize * autoTradeSettings.riskMultiplier
    const riskMultiplier = botSettings.riskLevel === 'low' ? 0.5 : 
                          botSettings.riskLevel === 'medium' ? 1.0 : 1.5
    const tradeAmount = Math.min(baseAmount * riskMultiplier, portfolio.totalValue * 0.1) // Max 10% of portfolio

    // Calculate TP/SL based on bot settings
    const takeProfitPercent = botSettings.takeProfit / 100
    const stopLossPercent = botSettings.stopLoss / 100
    
    const takeProfit = prediction.prediction === 'buy' 
      ? selectedAsset.price * (1 + takeProfitPercent)
      : selectedAsset.price * (1 - takeProfitPercent)
    
    const stopLoss = prediction.prediction === 'buy'
      ? selectedAsset.price * (1 - stopLossPercent)
      : selectedAsset.price * (1 + stopLossPercent)

    // Execute the trade
    const result = await executeTradeAPI(
      selectedAsset.symbol, 
      prediction.prediction, 
      tradeAmount, 
      prediction.confidence,
      takeProfit,
      stopLoss
    )

    if (result) {
      console.log('Auto trade executed successfully:', result)
    }
  }

  const toggleBot = () => {
    setIsBotActive(!isBotActive)
  }

  const toggleAutoTrade = () => {
    setIsAutoTradeEnabled(!isAutoTradeEnabled)
  }

  const updateAutoTradeSetting = (key: string, value: any) => {
    setAutoTradeSettings(prev => ({ ...prev, [key]: value }))
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'buy': return 'text-green-400'
      case 'sell': return 'text-red-400'
      default: return 'text-yellow-400'
    }
  }

  const getPredictionBadge = (prediction: string) => {
    switch (prediction) {
      case 'buy': return <Badge className="bg-green-600">COMPRAR</Badge>
      case 'sell': return <Badge className="bg-red-600">VENDER</Badge>
      default: return <Badge className="bg-yellow-600">MANTER</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Brain className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Bot de Trading ML
              </h1>
              <p className="text-gray-400">Plataforma de Trading com Inteligência Artificial</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Status ML</div>
              <div className="text-sm text-blue-400">{mlStatus}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleAutoTrade}
                className={`${isAutoTradeEnabled ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                disabled={!isBotActive}
              >
                {isAutoTradeEnabled ? 'Auto Trade ON' : 'Auto Trade OFF'}
              </Button>
              <Button
                onClick={toggleBot}
                className={`${isBotActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isBotActive ? 'Parar Bot' : 'Iniciar Bot'}
              </Button>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span>Visão Geral do Portfólio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Valor Total</div>
                <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`flex items-center space-x-1 ${portfolio.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.dailyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm">${Math.abs(portfolio.dailyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (24h)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Trades Ativos</div>
                <div className="text-2xl font-bold">{trades.length}</div>
                <div className="text-sm text-gray-400">Últimas 24 horas</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Limite Diário</div>
                <div className="text-2xl font-bold">{dailyTradeCount}/{autoTradeSettings.maxDailyTrades}</div>
                <div className="text-sm text-gray-400">Trades automáticos</div>
                <Progress 
                  value={(dailyTradeCount / autoTradeSettings.maxDailyTrades) * 100} 
                  className="w-full h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Status do Bot</div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isBotActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={isBotActive ? 'text-green-400' : 'text-red-400'}>
                    {isBotActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">Modelo ML: {botSettings.mlModel.toUpperCase()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800">
            <TabsTrigger value="trading" className="data-[state=active]:bg-gray-700">Trading</TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-gray-700">Ativos</TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-gray-700">Previsões ML</TabsTrigger>
            <TabsTrigger value="opentrades" className="data-[state=active]:bg-gray-700">Trades Abertos</TabsTrigger>
            <TabsTrigger value="autotrade" className="data-[state=active]:bg-gray-700">Auto Trade</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Panel */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Trade Rápido</CardTitle>
                  <CardDescription>Execute trades instantaneamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Error Display */}
                  {error && (
                    <Alert className="border-red-600 bg-red-900/20">
                      <AlertDescription className="text-red-400">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="asset">Ativo</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione o ativo" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {assets.map(asset => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            {asset.symbol} - {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="Digite o valor"
                      className="bg-gray-700 border-gray-600"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => executeTrade('buy')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!selectedAsset || !tradeAmount || loading}
                    >
                      {loading ? 'Processando...' : 'Comprar'}
                    </Button>
                    <Button
                      onClick={() => executeTrade('sell')}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!selectedAsset || !tradeAmount || loading}
                    >
                      {loading ? 'Processando...' : 'Vender'}
                    </Button>
                  </div>
                  
                  {/* Asset Prediction Info */}
                  {selectedAsset && (
                    <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Previsão ML:</span>
                        {(() => {
                          const asset = assets.find(a => a.symbol === selectedAsset)
                          return asset ? (
                            <div className="flex items-center space-x-2">
                              {getPredictionBadge(asset.mlPrediction)}
                              <span className="text-sm text-gray-300">
                                {asset.confidence}% confiança
                              </span>
                            </div>
                          ) : null
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bot Settings */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configurações do Bot</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nível de Risco</Label>
                    <Select value={botSettings.riskLevel} onValueChange={(value) => setBotSettings(prev => ({ ...prev, riskLevel: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tamanho Máximo do Trade: ${botSettings.maxTradeSize}</Label>
                    <Input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={botSettings.maxTradeSize}
                      onChange={(e) => setBotSettings(prev => ({ ...prev, maxTradeSize: parseInt(e.target.value) }))}
                      className="bg-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stop Loss: {botSettings.stopLoss}%</Label>
                      <Input
                        type="range"
                        min="1"
                        max="20"
                        value={botSettings.stopLoss}
                        onChange={(e) => setBotSettings(prev => ({ ...prev, stopLoss: parseInt(e.target.value) }))}
                        className="bg-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Take Profit: {botSettings.takeProfit}%</Label>
                      <Input
                        type="range"
                        min="1"
                        max="50"
                        value={botSettings.takeProfit}
                        onChange={(e) => setBotSettings(prev => ({ ...prev, takeProfit: parseInt(e.target.value) }))}
                        className="bg-gray-700"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Ativos do Mercado</CardTitle>
                <CardDescription>Preços de ativos em tempo real e previsões ML</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assets.map(asset => (
                    <div key={asset.symbol} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold">
                          {asset.symbol}
                        </div>
                        <div>
                          <div className="font-semibold">{asset.name}</div>
                          <div className="text-sm text-gray-400">{asset.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className={`flex items-center justify-end space-x-1 ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="text-sm">{Math.abs(asset.change24h).toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Previsão ML</div>
                        <div className="flex items-center space-x-2">
                          {getPredictionBadge(asset.mlPrediction)}
                          <span className={`text-sm ${getPredictionColor(asset.mlPrediction)}`}>
                            {asset.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Volume</div>
                        <div className="text-sm">${(asset.volume / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    <span>Performance do Modelo ML</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Acurácia da Previsão</span>
                        <span>87.3%</span>
                      </div>
                      <Progress value={87.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Fator de Lucro</span>
                        <span>2.34</span>
                      </div>
                      <Progress value={76.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taxa de Acerto</span>
                        <span>73.5%</span>
                      </div>
                      <Progress value={73.5} className="h-2" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Informações do Modelo</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• Rede Neural LSTM</div>
                      <div>• Dados de treinamento: 2 anos</div>
                      <div>• Features: 45 indicadores técnicos</div>
                      <div>• Frequência de atualização: A cada 5 minutos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Previsões Atuais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assets.map(asset => (
                      <div key={asset.symbol} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{asset.symbol}</span>
                          {getPredictionBadge(asset.mlPrediction)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confiança</span>
                            <span>{asset.confidence}%</span>
                          </div>
                          <Progress value={asset.confidence} className="h-1" />
                          <div className="text-xs text-gray-400">
                            Movimento esperado: {asset.mlPrediction === 'buy' ? '+' : asset.mlPrediction === 'sell' ? '-' : '±'}
                            {Math.abs(asset.change24h * 0.8).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="opentrades" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Trades Abertos ({openTrades.length})</span>
                </CardTitle>
                <CardDescription>
                  Gerencie suas posições abertas com Take Profit e Stop Loss automáticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {openTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum trade aberto no momento</p>
                    <p className="text-sm">Execute trades na aba Trading para abrir posições</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {openTrades.map(trade => (
                        <div key={trade.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}`}>
                                {trade.type === 'buy' ? 'C' : 'V'}
                              </div>
                              <div>
                                <div className="font-semibold text-lg">{trade.symbol}</div>
                                <div className="text-sm text-gray-400">
                                  {trade.type === 'buy' ? 'Compra' : 'Venda'} • {trade.quantity.toFixed(4)} unidades
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${trade.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${trade.unrealized_pnl >= 0 ? '+' : ''}{trade.unrealized_pnl.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {((trade.unrealized_pnl / (trade.entry_price * trade.quantity)) * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400">Entrada</div>
                              <div className="font-semibold">${trade.entry_price.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Atual</div>
                              <div className="font-semibold">${trade.current_price.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Take Profit</div>
                              <div className="font-semibold text-green-400">
                                {trade.take_profit ? `$${trade.take_profit.toFixed(2)}` : 'Não definido'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Stop Loss</div>
                              <div className="font-semibold text-red-400">
                                {trade.stop_loss ? `$${trade.stop_loss.toFixed(2)}` : 'Não definido'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-400">
                                Aberto há {Math.floor((Date.now() - new Date(trade.timestamp).getTime()) / (1000 * 60 * 60))}h
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => closeTradeAPI(trade.id, 'manual')}
                                  disabled={loading}
                                  className="bg-gray-600 hover:bg-gray-700 border-gray-500"
                                >
                                  Fechar Manualmente
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Progress indicators for TP/SL */}
                          {(trade.take_profit || trade.stop_loss) && (
                            <div className="mt-3 space-y-2">
                              {trade.take_profit && (
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Progresso para Take Profit</span>
                                    <span>
                                      {trade.type === 'buy' 
                                        ? `${(((trade.current_price - trade.entry_price) / (trade.take_profit - trade.entry_price)) * 100).toFixed(1)}%`
                                        : `${(((trade.entry_price - trade.current_price) / (trade.entry_price - trade.take_profit)) * 100).toFixed(1)}%`
                                      }
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-600 rounded-full h-1.5">
                                    <div 
                                      className="bg-green-500 h-1.5 rounded-full" 
                                      style={{
                                        width: `${Math.min(100, Math.abs(
                                          trade.type === 'buy'
                                            ? ((trade.current_price - trade.entry_price) / (trade.take_profit - trade.entry_price)) * 100
                                            : ((trade.entry_price - trade.current_price) / (trade.entry_price - trade.take_profit)) * 100
                                        ))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {trade.stop_loss && (
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Distância para Stop Loss</span>
                                    <span>
                                      {trade.type === 'buy' 
                                        ? `${Math.max(0, ((trade.entry_price - trade.current_price) / (trade.entry_price - trade.stop_loss)) * 100).toFixed(1)}%`
                                        : `${Math.max(0, ((trade.current_price - trade.entry_price) / (trade.stop_loss - trade.entry_price)) * 100).toFixed(1)}%`
                                      }
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-600 rounded-full h-1.5">
                                    <div 
                                      className="bg-red-500 h-1.5 rounded-full" 
                                      style={{
                                        width: `${Math.min(100, Math.abs(
                                          trade.type === 'buy'
                                            ? ((trade.entry_price - trade.current_price) / (trade.entry_price - trade.stop_loss)) * 100
                                            : ((trade.current_price - trade.entry_price) / (trade.stop_loss - trade.entry_price)) * 100
                                        ))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Auto-closed trades notification */}
            {autoClosedTrades.length > 0 && (
              <Card className="bg-orange-900/20 border-orange-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-400">
                    <Activity className="h-5 w-5" />
                    <span>Trades Fechados Automaticamente ({autoClosedTrades.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {autoClosedTrades.map((trade, index) => (
                        <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{trade.symbol}</div>
                              <div className="text-sm text-gray-400">
                                Fechado: {trade.reason} • ${trade.close_price.toFixed(2)}
                              </div>
                            </div>
                            <div className={`text-right ${trade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              <div className="font-semibold">
                                {trade.realized_pnl >= 0 ? '+' : ''}${trade.realized_pnl.toFixed(2)}
                              </div>
                              <div className="text-xs">
                                {((trade.realized_pnl / (trade.entry_price * trade.quantity)) * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="autotrade" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configurações de Auto Trade</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ativos Habilitados</Label>
                    <div className="space-y-2">
                      {['BTC', 'ETH', 'SOL', 'ADA', 'DOT'].map(asset => (
                        <div key={asset} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={autoTradeSettings.enabledAssets.includes(asset)}
                            onChange={(e) => {
                              const newAssets = e.target.checked
                                ? [...autoTradeSettings.enabledAssets, asset]
                                : autoTradeSettings.enabledAssets.filter(a => a !== asset)
                              updateAutoTradeSetting('enabledAssets', newAssets)
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <Label>{asset}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Confiança Mínima: {autoTradeSettings.minConfidence}%</Label>
                    <Input
                      type="range"
                      min="50"
                      max="95"
                      value={autoTradeSettings.minConfidence}
                      onChange={(e) => updateAutoTradeSetting('minConfidence', parseInt(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Máximo de Trades por Dia: {autoTradeSettings.maxDailyTrades}</Label>
                    <Input
                      type="range"
                      min="1"
                      max="50"
                      value={autoTradeSettings.maxDailyTrades}
                      onChange={(e) => updateAutoTradeSetting('maxDailyTrades', parseInt(e.target.value))}
                      className="bg-gray-700"
                    />
                    <div className="text-sm text-gray-400">
                      Trades hoje: {dailyTradeCount}/{autoTradeSettings.maxDailyTrades}
                    </div>
                    <Progress 
                      value={(dailyTradeCount / autoTradeSettings.maxDailyTrades) * 100} 
                      className="w-full h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Intervalo entre Trades: {autoTradeSettings.tradeInterval}s</Label>
                    <Input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={autoTradeSettings.tradeInterval}
                      onChange={(e) => updateAutoTradeSetting('tradeInterval', parseInt(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Multiplicador de Risco: {autoTradeSettings.riskMultiplier}x</Label>
                    <Input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={autoTradeSettings.riskMultiplier}
                      onChange={(e) => updateAutoTradeSetting('riskMultiplier', parseFloat(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Status do Auto Trade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge className={isAutoTradeEnabled ? 'bg-green-600' : 'bg-gray-600'}>
                        {isAutoTradeEnabled ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Bot Principal</span>
                      <Badge className={isBotActive ? 'bg-green-600' : 'bg-red-600'}>
                        {isBotActive ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Ativos Monitorados</span>
                      <span>{autoTradeSettings.enabledAssets.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Trades Hoje</span>
                      <span>{trades.filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString()).length}/{autoTradeSettings.maxDailyTrades}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Próximo Trade</span>
                      <span>{autoTradeSettings.tradeInterval}s</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Regras Atuais</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• Executar apenas quando confiança ≥ {autoTradeSettings.minConfidence}%</div>
                      <div>• Limitar a {autoTradeSettings.maxDailyTrades} trades por dia</div>
                      <div>• Intervalo mínimo de {autoTradeSettings.tradeInterval} segundos</div>
                      <div>• Multiplicador de risco: {autoTradeSettings.riskMultiplier}x</div>
                      <div>• Apenas ativos selecionados</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={toggleAutoTrade}
                    className={`w-full ${isAutoTradeEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={!isBotActive}
                  >
                    {isAutoTradeEnabled ? 'Desativar Auto Trade' : 'Ativar Auto Trade'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Histórico de Trading</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {trades.map(trade => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {trade.type === 'buy' ? 'C' : 'V'}
                          </div>
                          <div>
                            <div className="font-semibold">{trade.symbol}</div>
                            <div className="text-sm text-gray-400 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{trade.timestamp}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-sm text-gray-400">{trade.amount} unidades</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">ML: {trade.mlConfidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}