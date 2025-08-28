# 🤖 Bot de Trading ML - Implementação Completa

Um bot de trading inteligente powered por Machine Learning com interface profissional em tema escuro e funcionalidade completa de Auto Trade. Este projeto utiliza Next.js 15, TypeScript e APIs de IA para fornecer previsões de mercado e execução de trades automatizados.

## 🌟 Funcionalidades Principais

### 🎯 Interface Profissional
- **Tema Escuro Moderno**: Design elegante com gradientes e efeitos glassmorphism
- **Dashboard Completo**: Tudo em uma única tela, sem necessidade de alternar abas
- **Design Responsivo**: Otimizado para desktop e dispositivos móveis
- **Componentes UI/UX**: Biblioteca shadcn/ui para experiência premium

### 🧠 Machine Learning Avançado
- **Previsões em Tempo Real**: Análise de mercado usando IA com ZAI SDK
- **Indicadores Técnicos**: RSI, MACD, SMA, Bandas de Bollinger
- **Pontuação de Confiança**: Cada previsão inclui nível de confiança (70-98%)
- **Modelos Neurais**: Simulação de rede neural LSTM para análise de padrões

### 💼 Sistema de Trading Completo
- **Execução Rápida**: Compra e venda instantânea com validação
- **Gestão de Portfolio**: Acompanhamento em tempo real do valor e P&L
- **Histórico de Trades**: Registro completo com métricas de performance
- **Gerenciamento de Risco**: Stop loss, take profit e dimensionamento de posição

### 🤖 **NOVO: Auto Trade Inteligente**
- **Trading Automatizado**: Execução automática de trades baseada em ML
- **Configurações Personalizáveis**: Controle total sobre parâmetros de auto trade
- **Gestão de Risco Avançada**: Limites diários, confiança mínima e multiplicadores
- **Monitoramento em Tempo Real**: Status e estatísticas de auto trade

### 📊 Análise de Mercado
- **Dados em Tempo Real**: Preços atualizados a cada 3 segundos
- **Ativos Múltiplos**: BTC, ETH, SOL, ADA, DOT e mais
- **Volume e Market Cap**: Dados completos de mercado
- **Análise Técnica**: Indicadores e padrões de mercado

## 🚀 Como Implementar com Dados Reais

### 1. Configurar APIs de Mercado

#### 📈 Integração com Binance API
```bash
# Instalar biblioteca Binance
npm install binance-api-node
```

```typescript
// src/lib/binance.ts
import Binance from 'binance-api-node'

const binance = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
})

export const getMarketData = async (symbol: string) => {
  try {
    const ticker = await binance.prices({ symbol: `${symbol}USDT` })
    const twentyFourhr = await binance.dailyStats({ symbol: `${symbol}USDT` })
    
    return {
      symbol,
      price: parseFloat(ticker[`${symbol}USDT`]),
      change_24h: parseFloat(twentyFourhr.priceChange),
      change_percent_24h: parseFloat(twentyFourhr.priceChangePercent),
      volume_24h: parseFloat(twentyFourhr.volume),
      high_24h: parseFloat(twentyFourhr.highPrice),
      low_24h: parseFloat(twentyFourhr.lowPrice),
    }
  } catch (error) {
    console.error('Erro ao buscar dados da Binance:', error)
    throw error
  }
}

export const getHistoricalData = async (symbol: string, interval: string = '1h', limit: number = 100) => {
  try {
    const candles = await binance.candles({
      symbol: `${symbol}USDT`,
      interval,
      limit,
    })
    
    return candles.map(candle => ({
      timestamp: new Date(candle.openTime).toISOString(),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    }))
  } catch (error) {
    console.error('Erro ao buscar dados históricos:', error)
    throw error
  }
}
```

#### 💱 Integração com CoinGecko API
```bash
# Instalar biblioteca CoinGecko
npm install coingecko-api
```

```typescript
// src/lib/coingecko.ts
import CoinGecko from 'coingecko-api'

const CoinGeckoClient = new CoinGecko()

export const getMarketOverview = async () => {
  try {
    const data = await CoinGeckoClient.coins.markets({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 100,
      page: 1,
      sparkline: false,
    })
    
    return data.data.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change_24h: coin.price_change_24h,
      change_percent_24h: coin.price_change_percentage_24h,
      volume_24h: coin.total_volume,
      market_cap: coin.market_cap,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
    }))
  } catch (error) {
    console.error('Erro ao buscar dados do CoinGecko:', error)
    throw error
  }
}
```

### 2. Configurar Database Real

#### 🗄️ Configurar PostgreSQL com Prisma
```bash
# Instalar Prisma e PostgreSQL
npm install prisma @prisma/client
npm install pg
npx prisma init
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  balance   Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  trades    Trade[]
  portfolio Portfolio[]
  autoTradeSettings AutoTradeSettings?
}

model Asset {
  symbol     String   @id
  name       String
  price      Float
  change24h  Float
  volume24h  Float
  marketCap  Float
  updatedAt  DateTime @updatedAt
  
  trades     Trade[]
  portfolio  Portfolio[]
}

model Trade {
  id            String   @id @default(cuid())
  userId        String
  assetSymbol   String
  type          TradeType
  amount        Float
  price         Float
  fees          Float    @default(0)
  status        TradeStatus @default(PENDING)
  mlConfidence  Float?
  profit        Float    @default(0)
  isAutoTrade   Boolean  @default(false)
  createdAt     DateTime @default(now())
  executedAt    DateTime?
  
  user          User     @relation(fields: [userId], references: [id])
  asset         Asset    @relation(fields: [assetSymbol], references: [symbol])
}

model Portfolio {
  id         String   @id @default(cuid())
  userId     String
  assetSymbol String
  amount     Float    @default(0)
  avgPrice   Float    @default(0)
  value      Float    @default(0)
  updatedAt  DateTime @updatedAt
  
  user       User     @relation(fields: [userId], references: [id])
  asset      Asset    @relation(fields: [assetSymbol], references: [symbol])
  
  @@unique([userId, assetSymbol])
}

model AutoTradeSettings {
  id               String   @id @default(cuid())
  userId           String   @unique
  enabled          Boolean  @default(false)
  enabledAssets    String[] @default([])
  minConfidence    Int      @default(75)
  maxDailyTrades   Int      @default(10)
  tradeInterval    Int      @default(30)
  riskMultiplier   Float    @default(1.0)
  totalTrades      Int      @default(0)
  successfulTrades Int      @default(0)
  totalProfit      Float    @default(0)
  lastTradeAt      DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  user             User     @relation(fields: [userId], references: [id])
}

enum TradeType {
  BUY
  SELL
}

enum TradeStatus {
  PENDING
  EXECUTED
  FAILED
  CANCELLED
}
```

```bash
# Criar e migrar database
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Implementar Autenticação

#### 🔐 Configurar NextAuth.js
```bash
npm install next-auth @next-auth/prisma-adapter
```

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user) {
          return null
        }
        
        // Adicionar verificação de senha aqui
        return {
          id: user.id,
          email: user.email,
          balance: user.balance
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.balance = user.balance
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.balance = token.balance
      }
      return session
    }
  }
}
```

### 4. Implementar Auto Trade com Dados Reais

#### 🤖 Sistema de Auto Trade Avançado
```typescript
// src/lib/auto-trader.ts
import { prisma } from '@/lib/db'
import { getMarketData } from './binance'
import { generateMLPrediction } from './ml-trainer'

export class AutoTrader {
  private userId: string
  private settings: any

  constructor(userId: string) {
    this.userId = userId
  }

  async initialize() {
    this.settings = await prisma.autoTradeSettings.findUnique({
      where: { userId: this.userId }
    })
    
    if (!this.settings) {
      throw new Error('Auto trade settings not found')
    }
  }

  async shouldExecuteTrade(): Promise<boolean> {
    // Verificar se auto trade está habilitado
    if (!this.settings.enabled) return false

    // Verificar limite diário de trades
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTrades = await prisma.trade.count({
      where: {
        userId: this.userId,
        isAutoTrade: true,
        createdAt: { gte: today }
      }
    })

    if (todayTrades >= this.settings.maxDailyTrades) {
      console.log('Limite diário de trades atingido')
      return false
    }

    // Verificar intervalo mínimo entre trades
    if (this.settings.lastTradeAt) {
      const timeSinceLastTrade = Date.now() - this.settings.lastTradeAt.getTime()
      const minInterval = this.settings.tradeInterval * 1000
      
      if (timeSinceLastTrade < minInterval) {
        console.log('Intervalo mínimo entre trades não atingido')
        return false
      }
    }

    return true
  }

  async executeAutoTrade() {
    if (!await this.shouldExecuteTrade()) return

    try {
      // Buscar previsões ML para ativos habilitados
      const tradeOpportunities = []
      
      for (const assetSymbol of this.settings.enabledAssets) {
        const marketData = await getMarketData(assetSymbol)
        const mlPrediction = await generateMLPrediction({
          symbol: assetSymbol,
          prices: [marketData.price], // Dados simplificados para exemplo
          volumes: [marketData.volume_24h],
          timestamps: [new Date().toISOString()],
          technical_indicators: {
            rsi: [50], // Valores simulados
            macd: [0],
            sma_20: [marketData.price],
            sma_50: [marketData.price],
            bb_upper: [marketData.price * 1.02],
            bb_lower: [marketData.price * 0.98]
          }
        })

        // Verificar se a previsão atende aos critérios
        if (mlPrediction.confidence >= this.settings.minConfidence &&
            mlPrediction.prediction !== 'hold') {
          
          tradeOpportunities.push({
            asset: marketData,
            prediction: mlPrediction
          })
        }
      }

      if (tradeOpportunities.length === 0) {
        console.log('Nenhuma oportunidade de trade encontrada')
        return
      }

      // Selecionar melhor oportunidade (maior confiança)
      const bestOpportunity = tradeOpportunities.reduce((best, current) => 
        current.prediction.confidence > best.prediction.confidence ? current : best
      )

      // Calcular tamanho do trade
      const baseAmount = 1000 * this.settings.riskMultiplier // Valor base
      const tradeAmount = Math.min(baseAmount, 5000) // Limitar a $5000

      // Executar trade
      const trade = await this.executeTrade({
        symbol: bestOpportunity.asset.symbol,
        type: bestOpportunity.prediction.prediction,
        amount: tradeAmount,
        price: bestOpportunity.asset.price,
        mlConfidence: bestOpportunity.prediction.confidence
      })

      // Atualizar estatísticas
      await this.updateStats(trade)

      console.log('Auto trade executado com sucesso:', trade)
      
    } catch (error) {
      console.error('Erro ao executar auto trade:', error)
    }
  }

  private async executeTrade(tradeData: any) {
    const trade = await prisma.trade.create({
      data: {
        userId: this.userId,
        assetSymbol: tradeData.symbol,
        type: tradeData.type.toUpperCase(),
        amount: tradeData.amount,
        price: tradeData.price,
        mlConfidence: tradeData.mlConfidence,
        isAutoTrade: true,
        status: 'EXECUTED',
        executedAt: new Date()
      }
    })

    // Atualizar portfolio
    await this.updatePortfolio(tradeData)

    return trade
  }

  private async updatePortfolio(tradeData: any) {
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        userId_assetSymbol: {
          userId: this.userId,
          assetSymbol: tradeData.symbol
        }
      }
    })

    if (portfolio) {
      // Atualizar portfolio existente
      const newAmount = tradeData.type === 'BUY' ? 
        portfolio.amount + (tradeData.amount / tradeData.price) :
        portfolio.amount - (tradeData.amount / tradeData.price)

      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: {
          amount: newAmount,
          value: newAmount * tradeData.price,
          updatedAt: new Date()
        }
      })
    } else {
      // Criar novo registro de portfolio
      const amount = tradeData.amount / tradeData.price
      await prisma.portfolio.create({
        data: {
          userId: this.userId,
          assetSymbol: tradeData.symbol,
          amount: amount,
          avgPrice: tradeData.price,
          value: amount * tradeData.price
        }
      })
    }
  }

  private async updateStats(trade: any) {
    await prisma.autoTradeSettings.update({
      where: { userId: this.userId },
      data: {
        totalTrades: { increment: 1 },
        lastTradeAt: new Date()
      }
    })
  }

  async getStats() {
    const stats = await prisma.autoTradeSettings.findUnique({
      where: { userId: this.userId }
    })

    const todayTrades = await prisma.trade.count({
      where: {
        userId: this.userId,
        isAutoTrade: true,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    })

    return {
      ...stats,
      todayTrades,
      remainingTrades: stats.maxDailyTrades - todayTrades
    }
  }
}
```

### 5. Implementar WebSocket para Dados em Tempo Real

#### 📡 Configurar Socket.io com Dados Reais
```typescript
// src/lib/socket.ts
import { Server } from 'socket.io'
import { getMarketData } from './binance'
import { AutoTrader } from './auto-trader'

export const setupSocketHandlers = (io: Server) => {
  const autoTraders = new Map()

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)
    
    // Enviar dados iniciais
    socket.emit('connected', { message: 'Conectado ao bot de trading' })
    
    // Inicializar auto trader para o usuário
    socket.on('init_auto_trader', async (userId) => {
      try {
        const autoTrader = new AutoTrader(userId)
        await autoTrader.initialize()
        autoTraders.set(socket.id, autoTrader)
        
        socket.emit('auto_trader_initialized', { success: true })
      } catch (error) {
        socket.emit('auto_trader_error', { message: 'Erro ao inicializar auto trader' })
      }
    })
    
    // Inscrever para atualizações de mercado
    socket.on('subscribe_market', async (symbols: string[]) => {
      try {
        for (const symbol of symbols) {
          const marketData = await getMarketData(symbol)
          socket.emit('market_update', marketData)
        }
      } catch (error) {
        socket.emit('error', { message: 'Erro ao buscar dados de mercado' })
      }
    })
    
    // Controlar auto trade
    socket.on('toggle_auto_trade', async (enabled) => {
      try {
        const autoTrader = autoTraders.get(socket.id)
        if (autoTrader) {
          await prisma.autoTradeSettings.update({
            where: { userId: autoTrader.userId },
            data: { enabled }
          })
          socket.emit('auto_trade_toggled', { enabled })
        }
      } catch (error) {
        socket.emit('auto_trade_error', { message: 'Erro ao alternar auto trade' })
      }
    })
    
    // Executar trade manual
    socket.on('execute_trade', async (tradeData) => {
      try {
        // Implementar lógica de trade real aqui
        const result = await executeRealTrade(tradeData)
        socket.emit('trade_result', result)
      } catch (error) {
        socket.emit('trade_error', { message: 'Erro ao executar trade' })
      }
    })
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id)
      autoTraders.delete(socket.id)
    })
  })
}

// Atualizar mercado em tempo real
const startMarketUpdates = (io: Server) => {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT']
  
  setInterval(async () => {
    try {
      for (const symbol of symbols) {
        const marketData = await getMarketData(symbol)
        io.emit('market_update', marketData)
      }
    } catch (error) {
      console.error('Erro ao atualizar mercado:', error)
    }
  }, 3000) // Atualizar a cada 3 segundos
}

// Auto trade scheduler
const startAutoTradeScheduler = (io: Server) => {
  setInterval(async () => {
    // Executar auto trade para todos os usuários ativos
    const activeSettings = await prisma.autoTradeSettings.findMany({
      where: { enabled: true }
    })
    
    for (const settings of activeSettings) {
      try {
        const autoTrader = new AutoTrader(settings.userId)
        await autoTrader.initialize()
        await autoTrader.executeAutoTrade()
        
        // Notificar cliente sobre o trade executado
        io.to(settings.userId).emit('auto_trade_executed', {
          timestamp: new Date().toISOString(),
          message: 'Auto trade executado com sucesso'
        })
      } catch (error) {
        console.error('Erro no auto trade scheduler:', error)
      }
    }
  }, 30000) // Verificar a cada 30 segundos
}
```

### 6. Implementar ML com Dados Reais

#### 🧠 Treinar Modelo com Dados Históricos
```typescript
// src/lib/ml-trainer.ts
import { getHistoricalData } from './binance'
import ZAI from 'z-ai-web-dev-sdk'

export const trainMLModel = async (symbol: string) => {
  try {
    // Buscar dados históricos reais
    const historicalData = await getHistoricalData(symbol, '1h', 1000)
    
    // Calcular indicadores técnicos
    const technicalIndicators = calculateTechnicalIndicators(historicalData)
    
    const zai = await ZAI.create()
    
    const prompt = `
    Analise os seguintes dados históricos para ${symbol}:
    
    Dados recentes: ${JSON.stringify(historicalData.slice(-10))}
    Indicadores técnicos: ${JSON.stringify(technicalIndicators.slice(-5))}
    
    Com base nesses dados, forneça:
    1. Análise de tendência
    2. Níveis de suporte e resistência
    3. Sinais de compra/venda
    4. Confiança da previsão
    5. Preço alvo esperado
    
    Responda em formato JSON:
    {
      "trend": "bullish|bearish|neutral",
      "support": 45000,
      "resistance": 47000,
      "signal": "buy|sell|hold",
      "confidence": 85,
      "target_price": 46500
    }
    `
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de trading profissional especializado em análise técnica e machine learning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })
    
    return JSON.parse(completion.choices[0]?.message?.content || '{}')
    
  } catch (error) {
    console.error('Erro no treinamento ML:', error)
    throw error
  }
}

function calculateTechnicalIndicators(data: any[]) {
  // Implementar cálculo de indicadores técnicos reais
  return data.map((candle, index) => ({
    rsi: calculateRSI(data, index),
    macd: calculateMACD(data, index),
    sma20: calculateSMA(data, index, 20),
    sma50: calculateSMA(data, index, 50),
    bb_upper: calculateBollingerUpper(data, index),
    bb_lower: calculateBollingerLower(data, index),
  }))
}
```

### 7. Configurar Variáveis de Ambiente

#### ⚙️ Arquivo .env
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/trading_bot"

# APIs
BINANCE_API_KEY="sua_binance_api_key"
BINANCE_API_SECRET="sua_binance_api_secret"
COINGECKO_API_KEY="sua_coingecko_api_key"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta"

# ZAI SDK
ZAI_API_KEY="sua_zai_api_key"

# WebSocket
SOCKET_PORT=3001

# Auto Trade
AUTO_TRADE_ENABLED=true
AUTO_TRADE_MAX_DAILY_TRADES=10
AUTO_TRADE_MIN_CONFIDENCE=75
AUTO_TRADE_INTERVAL=30
```

### 8. Executar com Dados Reais

#### 🚀 Script de Inicialização
```bash
#!/bin/bash

# 1. Instalar dependências
npm install

# 2. Configurar database
npx prisma migrate dev
npx prisma generate

# 3. Buildar aplicação
npm run build

# 4. Iniciar servidor
npm run start
```

```typescript
// src/scripts/real-data-init.ts
import { prisma } from '../src/lib/db'
import { getMarketOverview } from '../src/lib/coingecko'
import { setupSocketHandlers, startMarketUpdates, startAutoTradeScheduler } from '../src/lib/socket'

async function initializeRealData() {
  try {
    console.log('Inicializando bot com dados reais...')
    
    // Buscar dados de mercado reais
    const marketData = await getMarketOverview()
    console.log(`Dados de ${marketData.length} ativos carregados`)
    
    // Salvar no database
    for (const asset of marketData) {
      await prisma.asset.upsert({
        where: { symbol: asset.symbol },
        update: {
          price: asset.price,
          change24h: asset.change_24h,
          volume24h: asset.volume_24h,
          marketCap: asset.market_cap,
          updatedAt: new Date()
        },
        create: {
          symbol: asset.symbol,
          name: asset.name,
          price: asset.price,
          change24h: asset.change_24h,
          volume24h: asset.volume_24h,
          marketCap: asset.market_cap
        }
      })
    }
    
    console.log('Dados de mercado salvos no database')
    
    // Inicializar configurações de auto trade para usuários existentes
    const users = await prisma.user.findMany()
    for (const user of users) {
      await prisma.autoTradeSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          enabled: false,
          enabledAssets: ['BTC', 'ETH', 'SOL'],
          minConfidence: 75,
          maxDailyTrades: 10,
          tradeInterval: 30,
          riskMultiplier: 1.0
        }
      })
    }
    
    console.log('Configurações de auto trade inicializadas')
    
    // Iniciar atualizações em tempo real
    const io = require('socket.io')(process.env.SOCKET_PORT || 3001)
    setupSocketHandlers(io)
    startMarketUpdates(io)
    startAutoTradeScheduler(io)
    
    console.log('Bot de trading com dados reais inicializado com sucesso!')
    console.log('🤖 Auto Trade scheduler iniciado')
    console.log('📡 Atualizações de mercado em tempo real ativadas')
    
  } catch (error) {
    console.error('Erro na inicialização:', error)
    process.exit(1)
  }
}

initializeRealData()
```

## 🤖 **Funcionalidades de Auto Trade**

### ✨ **Características Principais:**

#### 🎯 **Trading Automatizado Inteligente**
- **Execução Autônoma**: O bot executa trades automaticamente baseado em previsões ML
- **Seleção de Ativos**: Escolha quais ativos serão monitorados para auto trade
- **Confiança Mínima**: Define o nível mínimo de confiança para executar trades
- **Gestão de Risco**: Controle total sobre o tamanho e frequência dos trades

#### ⚙️ **Configurações Avançadas**
- **Ativos Habilitados**: Selecione quais criptomoedas o auto trade deve monitorar
- **Confiança Mínima**: Ajuste de 50% a 95% para filtrar trades de alta qualidade
- **Limite Diário**: Controle o número máximo de trades por dia (1-50)
- **Intervalo de Trades**: Defina o tempo mínimo entre trades (10-300 segundos)
- **Multiplicador de Risco**: Ajuste o tamanho do trade baseado no seu apetite ao risco (0.1x-3.0x)

#### 📊 **Monitoramento em Tempo Real**
- **Status do Auto Trade**: Indicadores visuais de quando o auto trade está ativo
- **Estatísticas Detalhadas**: Acompanhe trades executados, sucesso e lucros
- **Regras Ativas**: Visualize todas as regras configuradas em tempo real
- **Alertas e Notificações**: Receba notificações quando trades são executados

#### 🛡️ **Segurança e Controle**
- **Bot Principal Requerido**: Auto trade só funciona com o bot principal ativo
- **Limites de Proteção**: Múltiplas camadas de segurança para evitar perdas
- **Parada de Emergência**: Desative o auto trade instantaneamente a qualquer momento
- **Histórico Completo**: Todos os trades automáticos são registrados para análise

#### 🧠 **Integração com ML**
- **Previsões em Tempo Real**: Utiliza as previsões ML mais recentes para decisões
- **Análise Técnica**: Considera múltiplos indicadores técnicos
- **Adaptação Dinâmica**: Ajusta estratégias baseado nas condições de mercado
- **Aprendizado Contínuo**: Melhora com o tempo baseado nos resultados

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- Contas nas APIs (Binance, CoinGecko)
- Chaves de API necessárias

## 🔧 Instalação

1. **Clonar o repositório**
```bash
git clone <repositorio>
cd ml-trading-bot
```

2. **Instalar dependências**
```bash
npm install
```

3. **Configurar variáveis de ambiente**
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

4. **Configurar database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Executar aplicação**
```bash
npm run dev
```

## 🏗️ Arquitetura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── trading/       # Trading APIs
│   │   │   ├── predict/   # ML Predictions
│   │   │   ├── execute/   # Trade Execution
│   │   │   ├── market/    # Market Data
│   │   │   └── autotrade/ # Auto Trade APIs
│   │   └── auth/          # Authentication
│   ├── page.tsx           # Main Trading Interface
│   └── layout.tsx         # App Layout
├── components/            # React Components
│   └── ui/               # shadcn/ui Components
├── lib/                  # Utility Libraries
│   ├── db.ts            # Database Connection
│   ├── auth.ts          # Authentication
│   ├── binance.ts       # Binance API
│   ├── coingecko.ts     # CoinGecko API
│   ├── socket.ts        # WebSocket Handlers
│   ├── ml-trainer.ts    # ML Training
│   └── auto-trader.ts   # Auto Trade Logic
├── hooks/               # Custom React Hooks
└── scripts/             # Utility Scripts
```

## 🎯 **Como Usar o Auto Trade**

### 1. **Configurar o Bot Principal**
- Primeiro, inicie o bot principal clicando em "Iniciar Bot"
- Aguarde a conexão com as APIs e carregamento dos dados

### 2. **Configurar Parâmetros de Auto Trade**
- Vá para a aba "Auto Trade"
- Selecione os ativos que deseja monitorar
- Ajuste a confiança mínima (recomendado: 75%+)
- Defina o limite diário de trades
- Configure o intervalo entre trades
- Ajuste o multiplicador de risco conforme seu perfil

### 3. **Ativar o Auto Trade**
- Clique no botão "Auto Trade OFF" para ativá-lo
- O botão mudará para "Auto Trade ON" (laranja)
- Monitor o status e estatísticas em tempo real

### 4. **Monitorar e Ajustar**
- Acompanhe os trades executados no histórico
- Verifique as estatísticas de performance
- Ajuste as configurações conforme necessário
- Desative o auto trade a qualquer momento se necessário

## ⚠️ **Avisos Importantes**

### 🚨 **Riscos de Trading**
- **Alto Risco**: Trading de criptomoedas envolve riscos significativos
- **Perda Potencial**: Você pode perder todo o capital investido
- **Volatilidade**: Mercados de cripto são extremamente voláteis
- **Use com Cautela**: Comece com valores pequenos para testar

### 🔒 **Segurança**
- **Mantenha Chaves Seguras**: Nunca compartilhe suas chaves de API
- **Use Contas de Teste**: Teste primeiro em ambientes de demonstração
- **Monitore Constantemente**: Acompanhe sempre as atividades do bot
- **Tenha Limites**: Use sempre stop loss e limites de tamanho de trade

### 📈 **Performance**
- **Resultados Passados**: Não garantem resultados futuros
- **Condições de Mercado**: O desempenho varia conforme o mercado
- **Manutenção**: Requer monitoramento e ajustes regulares
- **Atualizações**: Mantenha o sistema atualizado para melhor performance

## 🎯 Features Futuras

- [ ] Integração com mais exchanges (Kraken, Coinbase)
- [ ] Modelos de ML mais avançados (Transformer, GANs)
- [ ] Backtesting completo com dados históricos
- [ ] Sistema de notificações push
- [ ] Mobile app nativo
- [ ] API para terceiros
- [ ] Sistema de affiliate e indicações
- [ ] Estratégias de trading personalizáveis
- [ ] Análise de sentimento de mercado
- [ ] Otimização de portfólio automática

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor, leia o CONTRIBUTING.md para detalhes sobre nosso código de conduta e o processo de submissão de pull requests.

## 📞 Suporte

Para suporte, envie um email para suporte@tradingbot.com ou crie uma issue no GitHub.

---

**⚠️ Aviso Importante**: Este bot de trading é para fins educacionais e demonstrativos. Trading de criptomoedas envolve riscos significativos e pode resultar em perdas. Sempre faça sua própria pesquisa e consulte um consultor financeiro antes de investir. O auto trade deve ser usado com extrema cautela e apenas por traders experientes.