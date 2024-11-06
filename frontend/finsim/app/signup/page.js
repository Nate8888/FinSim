'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto min-h-screen max-w-md px-6 py-12">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-background p-4 shadow-sm">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>
          <p className="text-sm text-muted-foreground">Create Your Account</p>
        </div>
        <div className="mt-8 space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input id="email" placeholder="email" required type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">PASSWORD</Label>
              <Input id="password" placeholder="password" required type="password" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label className="text-sm" htmlFor="terms">
                By creating an account, I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>
            <Button className="w-full bg-yellow-400 font-medium hover:bg-yellow-500" type="submit">
              Register
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Button className="w-full bg-black text-white hover:bg-gray-800" variant="outline">
            Sign in with Google
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link className="font-medium underline" href="/">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}