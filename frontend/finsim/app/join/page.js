'use client'

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Join() {
  const [gameCode, setGameCode] = useState("")
  const router = useRouter()
  const { isAuthenticated, getIdToken } = useAuth()

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router, isAuthenticated])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (gameCode.length === 5) {
      try {
        const idToken = await getIdToken()
        const response = await fetch('http://localhost:5000/join_room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ gameCode, idToken })
        })
        const result = await response.json()
        if (response.ok) {
          alert("Successfully joined the game with code: " + gameCode)
          router.push(`/lobby/${gameCode}`)
        } else {
          alert("Failed to join the game: " + result.error)
        }
      } catch (error) {
        alert("Error joining game: " + error.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/action" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              Join a game
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="gameCode" className="block text-lg text-center">
                Please enter a game code:
              </label>
              <Input
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="text-center uppercase tracking-wider text-2xl h-16 font-mono"
                maxLength={5}
                placeholder="XQWSA"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg"
              disabled={gameCode.length !== 5}
            >
              Join the game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}