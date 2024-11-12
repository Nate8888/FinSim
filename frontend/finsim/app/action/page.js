'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

export default function Action() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-12">
        <div className="flex flex-col items-center space-y-2 animate-float">
          <div className="rounded-full bg-black p-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">FinSim</h1>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <Link href="/create">
            <Button 
              className="w-[200px] bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
            >
              Create a game
            </Button>
          </Link>
          
          <span className="text-sm text-muted-foreground">Or</span>
          
          <Link href="/join">
            <Button 
              className="w-[200px] bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
            >
              Join a game
            </Button>
          </Link>
        </div>
      </div>
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}