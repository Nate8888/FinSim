'use client'

import { useEffect, useRef, useState } from 'react'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, LineChart as ChartIcon, Newspaper, Settings, Trophy } from "lucide-react"
import { ErrorBoundary } from 'react-error-boundary'
import Chart from 'chart.js/auto'

function ErrorFallback({error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

const data = [
  { round: 1, balance: 1200000 },
  { round: 2, balance: 1400000 },
  { round: 3, balance: 1300000 },
  { round: 4, balance: 1600000 },
  { round: 5, balance: 1550000 },
]

export default function Component() {
  const [time, setTime] = useState(90)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext('2d')
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => `Round ${d.round}`),
          datasets: [{
            label: 'Balance',
            data: data.map(d => d.balance),
            borderColor: 'hsl(var(--primary))',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => `$${(value / 1000000).toFixed(1)}M`
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `Balance: $${(context.parsed.y / 1000000).toFixed(2)}M`
              }
            }
          }
        }
      })
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  const formatTime = () => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
            <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-lg">{formatTime()}</span>
            <Button className="bg-green-600 hover:bg-green-700">Submit</Button>
          </div>
        </div>

        {/* Chart */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-[200px]">
              <canvas ref={chartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        {/* Asset Summary */}
        <div className="mb-6 rounded-xl bg-yellow-100 p-6 shadow-lg">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">Cash:</div>
              <div className="text-lg font-semibold">$115,000.00</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Assets:</div>
              <div className="text-lg font-semibold">$1,440,432.50</div>
            </div>
          </div>
          
          {/* Asset Cards */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden bg-white">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <ChartIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Apple</h3>
                      <span className="text-sm text-green-600">+5.50%</span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm text-gray-600">
                      <span>Holdings: $150,000</span>
                      <span>1,000 shares</span>
                      <span>5.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container mx-auto flex justify-around p-2">
          {[
            { icon: Home, label: "Portfolio" },
            { icon: ChartIcon, label: "Trade" },
            { icon: Newspaper, label: "News" },
            { icon: Trophy, label: "Leaderboard" },
            { icon: Settings, label: "Settings" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex flex-col items-center p-2 text-gray-600 hover:text-primary"
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}