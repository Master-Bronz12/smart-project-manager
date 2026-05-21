"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export default function SplashPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const timer = setTimeout(() => {
      const checkAndRedirect = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
        
        if (session) {
          router.push("/dashboard")
        } else if (hasSeenOnboarding === "true") {
          router.push("/auth")
        } else {
          router.push("/onboarding")
        }
      }
      checkAndRedirect()
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-lg">
            <span className="text-6xl">📊</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Smart PM</h1>
          <p className="text-white/80 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="text-center animate-bounce">
        <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-lg">
          <img src="/logo.svg" alt="Smart PM Logo" className="w-24 h-24" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Smart PM</h1>
        <p className="text-white/80 text-sm">Smart Project Manager</p>
      </div>
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <div className="inline-flex gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
