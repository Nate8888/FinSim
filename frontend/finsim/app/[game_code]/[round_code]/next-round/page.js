'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, BarChartIcon as ChartIcon, Newspaper, Settings, Trophy, BookOpen, ArrowLeft, Info } from 'lucide-react'
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip } from "@/components/ui/tooltip"

export default async function Page({ params }) {
  const { game_code, round_code } = await params
  return <RoundLoadingScreen game_code={game_code} round_code={round_code} />
}

function RoundLoadingScreen({ 
  game_code, 
  round_code, 
  roundNumber = 1, 
  portfolioValue = 1000000, 
  roundDuration = 30,
  previousRoundPerformance = 5.52,
  upcomingEvent = "Global economic summit",
  stocks = [
    { symbol: 'AAK', change: -5.52, isOwned: true },
    { symbol: 'BBL', change: 5.52, isOwned: true },
    { symbol: 'CCM', change: 5.52, isOwned: true },
    { symbol: 'DDP', change: 5.52, isOwned: true },
    { symbol: 'EEQ', change: 5.52, isOwned: true },
    { symbol: 'FFR', change: 5.52, isOwned: false },
    { symbol: 'GGS', change: 5.52, isOwned: false },
    { symbol: 'HHT', change: 5.52, isOwned: false }
  ]
}) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState(roundDuration)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer)
          return 100
        }
        const newProgress = oldProgress + 100 / roundDuration
        setTimeLeft(Math.max(0, roundDuration - Math.floor(newProgress / (100 / roundDuration))))
        return Math.min(newProgress, 100)
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [roundDuration])

  const StockList = ({ stocks, title }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500">{title}:</h3>
      <div className="space-y-2">
        {stocks.map((stock, index) => (
          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full" />
              <span className="font-medium">{stock.symbol}</span>
            </div>
            <span className={`font-semibold ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stock.change >= 0 ? '+' : ''}{stock.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Last Round Results
          </CardTitle>
          <div className="text-xs font-medium text-gray-600 text-right">
            <Tooltip content={`Game Code: ${game_code} | Round Code: ${round_code}`}>
              <Info className="h-5 w-5 text-gray-600" />
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-500">YOUR PORTFOLIO</div>
            <div className="text-2xl font-bold text-green-500">
              {previousRoundPerformance >= 0 ? '+' : ''}{previousRoundPerformance}%
            </div>
            <div className="text-sm font-medium">
              Portfolio Value: ${portfolioValue.toLocaleString()}
            </div>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="text-center text-lg font-semibold">
            Next round starts in: {timeLeft}s
          </div>
          
          <ScrollArea className="h-[300px] pr-4">
            <StockList 
              stocks={stocks.filter(s => s.isOwned)} 
              title="YOUR STOCKS" 
            />
            <div className="my-4" />
            <StockList 
              stocks={stocks.filter(s => !s.isOwned)} 
              title="OTHER STOCKS" 
            />
          </ScrollArea>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-yellow-100 p-4 rounded-lg flex items-start space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800">Upcoming Event:</h3>
              <p className="text-sm text-yellow-700">{upcomingEvent}</p>
            </div>
            </motion.div>
          </CardContent>
        </Card>
        {/* Bottom Navigation */}
        {/* <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
          <div className="container mx-auto flex justify-around p-2">
            {[
              { icon: Home, label: "Portfolio", link: `/${game_code}/${round_code}/portfolio`, selected: false },
              { icon: ChartIcon, label: "Trade", link: `/${game_code}/${round_code}/trade`, selected: false },
              { icon: Newspaper, label: "News", link: `/${game_code}/${round_code}/news`, selected: false },
              { icon: Trophy, label: "Leaderboard", link: `/${game_code}/${round_code}/leaderboard`, selected: false },
              { icon: Settings, label: "Settings", link: `/${game_code}/${round_code}/settings`, selected: false },
            ].map(({ icon: Icon, label, link, selected }) => (
              <a
                key={label}
                href={link}
                className={`flex flex-col items-center p-2 hover:text-primary ${selected ? "text-blue-600" : "text-gray-600"}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </a>
            ))}
          </div>
        </div> */}
      </div>
  )
}