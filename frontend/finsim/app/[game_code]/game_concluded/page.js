'use client'

import { Card } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from 'next/navigation'
import { Tooltip as UITooltip } from "@/components/ui/tooltip"
import { use } from 'react'
import { useLoading } from '@/contexts/loading-context'

export default function Page({ params }) {
  const actualParams = use(params)
  const { game_code } = actualParams
  return <GameConcluded game_code={game_code} />
}

function GameConcluded({ game_code }) {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState([])
  const [history, setHistory] = useState([])
  const { setLoading } = useLoading()

  const players = [
    { id: 1, name: "David Curtis", color: "#FF0000" },
    { id: 2, name: "Sarah Chen", color: "#000000" },
    { id: 3, name: "Ray Johnson", color: "#0000FF" },
    { id: 4, name: "Emma Wilson", color: "#FFA500" },
    { id: 5, name: "Michael Brown", color: "#8B4513" },
    { id: 6, name: "Olivia Taylor", color: "#800000" },
    { id: 7, name: "Daniel Lee", color: "#000080" },
    { id: 8, name: "Sophia Martinez", color: "#8B0000" },
  ]

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      const response = await fetch(`https://finsimulator.uc.r.appspot.com/leaderboard?gameCode=${game_code}`)
      const data = await response.json()
      setLeaderboard(data.leaderboard)
      setHistory(data.history)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [game_code])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white">
      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-md px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Game Concluded</h1>
          </div>

          {/* Leaderboard List */}
          <div className="mb-8 space-y-4">
            {leaderboard.map((player, index) => (
              <Card key={index} className="flex items-center gap-4 p-4">
                <div className="text-lg font-bold">{index + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${player.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Chart Legend */}
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {leaderboard.map((player, index) => (
              <div key={index} className="flex items-center">
                <div className="h-6 w-6 mr-1 flex items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: players[index]?.color || "#000" }}>
                  {player.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-xs font-medium">{player.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          {/* Portfolio Chart */}
          <div className="mb-20 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="round" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, "Portfolio Value"]}
                  labelFormatter={(label) => `Round ${label}`}
                />
                {leaderboard.map((player, index) => (
                  <Line
                    key={player.name}
                    type="monotone"
                    dataKey={player.name}
                    stroke={players[index]?.color || "#000"}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Button className="bg-green-600 hover:bg-green-700" onClick={() => router.push('/action')}>Continue</Button>
        </div>
      </main>
    </div>
  )
}