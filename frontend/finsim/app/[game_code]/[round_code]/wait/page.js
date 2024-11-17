'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Component({ roundDuration = 30 }) {
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