'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { use } from 'react'

async function checkRoundCompletion(game_code, round_code, router) {
  const response = await fetch('http://localhost:5000/check_round_completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gameCode: game_code,
      roundCode: round_code,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    if (data.allUsersCompleted) {
      if (data.newRoundCode && data.newRoundCode !== round_code && data.newRoundCode !== 'null') {
        router.push(`/${game_code}/${data.newRoundCode}/portfolio`);
      } else {
        router.push(`/${game_code}/game_concluded`);
      }
    }
  }
}

export default function Page({ params }) {
  const actualParams = use(params)
  const { game_code, round_code } = actualParams
  return <WaitComponent game_code={game_code} round_code={round_code} />
}

function WaitComponent({ game_code, round_code, roundDuration = 120 }) {
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState(roundDuration)
  const router = useRouter()

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

    const checkCompletionInterval = setInterval(() => {
      checkRoundCompletion(game_code, round_code, router)
    }, 10000) // Check every 10 seconds

    return () => {
      clearInterval(timer)
      clearInterval(checkCompletionInterval)
    }
  }, [roundDuration, router, game_code, round_code])

  useEffect(() => {
    checkRoundCompletion(game_code, round_code, router)
  }, [game_code, round_code, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Waiting for Other Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LineChart className="w-16 h-16 text-primary" strokeWidth={1.5} />
            </motion.div>
            <Progress value={progress} className="w-full" />
            <div className="text-center text-2xl font-semibold">
              {timeLeft}s
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground"
          >
            Next round starting soon...
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}