'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Home, LineChart as ChartIcon, Newspaper, Settings, Trophy, ChevronDown, Info } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"

export default async function Page({ params }) {
  const { game_code, round_code } = await params
  return <News game_code={game_code} round_code={round_code} />
}

function News({ game_code, round_code }) {
  const router = useRouter()
  const [time, setTime] = useState(90)
  console.log('game_code:', game_code);
  console.log('round_code:', round_code);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = () => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const macroIndicators = [
    { label: "Interest Rate", value: "5.50%", change: "Quarter Change: +0.25%" },
    { label: "Inflation Rate", value: "3.10%", change: "Quarter Change: -0.15%" },
    { label: "GDP Growth", value: "2.40%", change: "Quarter Change: +0.30%" },
  ]

  const globalNews = [
    "Global trade tensions escalate as new tariffs announced",
    "Climate summit concludes with ambitious carbon reduction goals",
    "Tech industry faces increased scrutiny over data privacy concerns"
  ]

  const companyNews = [
    {
      headline: "Apple reports Sales vs Expected Sales: USD$120.1B vs USD$118.2B",
      content: "Apple Inc. has exceeded market expectations in its latest quarterly report. The tech giant reported sales of USD$120.1 billion, surpassing the expected USD$118.2 billion. This performance was driven by strong iPhone sales and growth in services revenue. However, there are concerns about supply chain constraints affecting future production."
    },
    {
      headline: "Google's AI breakthrough could revolutionize search technology",
      content: "Google has announced a major breakthrough in AI language models, which could significantly enhance its search capabilities. The new technology demonstrates improved understanding of context and nuance in queries, potentially leading to more accurate and relevant search results. This development could have far-reaching implications for the tech industry and how we interact with information online."
    },
    {
      headline: "Microsoft's cloud division shows strong growth, Azure revenue up 30% YoY",
      content: "Microsoft's cloud computing division has reported impressive growth, with Azure revenue increasing by 30% year-over-year. This performance has exceeded market expectations and solidifies Microsoft's position as a leader in the cloud services market. The company attributes this success to increased adoption of its AI and machine learning services by enterprise customers."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white pb-16">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <img alt="Profile" src="/globe.svg?height=48&width=48" />
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">David Curtis</h1>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">$1,555,432.50</span>
                <span className="text-sm font-medium text-green-600">+15.55%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={`Game Code: ${game_code} | Round Code: ${round_code}`}>
              <Info className="h-5 w-5 text-gray-600" />
            </Tooltip>
            <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-lg">{formatTime()}</span>
            <Button className="bg-green-600 hover:bg-green-700">Submit</Button>
          </div>
        </div>

        {/* Macro Overview */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-lg font-semibold">Economic Indicators:</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                {macroIndicators.map((indicator, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">{indicator.label}</div>
                    <div className="text-sm font-bold">{indicator.value}</div>
                    <div className="text-xs text-muted-foreground">{indicator.change}</div>
                  </div>
                ))}
              </div>
              </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-lg font-semibold">Global News:</h2>
              <ul className="space-y-1 text-sm">
                {globalNews.map((news, index) => (
                  <li key={index} className="text-muted-foreground">{news}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Company News */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Company News:</h2>
          {companyNews.map((news, index) => (
            <Collapsible key={index} className="w-full">
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="text-left">
                      <div className="font-semibold">{news.headline}</div>
                    </div>
                    <ChevronDown className="h-5 w-5" />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">{news.content}</p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container mx-auto flex justify-around p-2">
          {[
            { icon: Home, label: "Portfolio", link: `/${game_code}/${round_code}/portfolio`, selected: false },
            { icon: ChartIcon, label: "Trade", link: `/${game_code}/${round_code}/trade`, selected: false },
            { icon: Newspaper, label: "News", link: `/${game_code}/${round_code}/news`, selected: true },
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
      </div>
    </div>
  )
}