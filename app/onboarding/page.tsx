"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Target, TrendingUp, Users, DollarSign } from "lucide-react"

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const slides = [
    { icon: <Target size={48} className="text-blue-500" />, title: "Gérez vos projets facilement", description: "Centralisez tous vos projets, tâches et équipes au même endroit", color: "from-blue-500 to-blue-600" },
    { icon: <CheckCircle size={48} className="text-green-500" />, title: "Suivez vos tâches en temps réel", description: "Statuts En cours, Terminé, En retard - Ne perdez plus le fil", color: "from-green-500 to-green-600" },
    { icon: <DollarSign size={48} className="text-purple-500" />, title: "Contrôlez vos budgets", description: "Suivez vos dépenses, gérez vos finances et évitez les dépassements", color: "from-purple-500 to-purple-600" },
    { icon: <TrendingUp size={48} className="text-orange-500" />, title: "Analysez vos performances", description: "Graphiques, rapports PDF/Excel pour suivre votre progression", color: "from-orange-500 to-orange-600" },
    { icon: <Users size={48} className="text-indigo-500" />, title: "Travaillez en équipe", description: "Assignez des tâches, suivez les responsables, collaborez efficacement", color: "from-indigo-500 to-indigo-600" }
  ]

  const handleNext = () => { if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1) }
  const handlePrev = () => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1) }
  const handleStart = () => { localStorage.setItem("hasSeenOnboarding", "true"); router.push("/auth") }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const slide = slides[currentSlide]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-r ${slide.color} flex items-center justify-center mb-8 shadow-xl`}>
            {slide.icon}
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">{slide.title}</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">{slide.description}</p>
          <div className="flex gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? "w-8 bg-blue-500" : "w-2 bg-gray-300 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="p-6 pb-8">
          {currentSlide < slides.length - 1 ? (
            <div className="flex gap-3">
              {currentSlide > 0 && (
                <button onClick={handlePrev} className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Précédent</button>
              )}
              <button onClick={handleNext} className={`py-3 px-4 bg-gradient-to-r ${slide.color} text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md ${currentSlide > 0 ? "flex-1" : "w-full"}`}>Suivant</button>
            </div>
          ) : (
            <button onClick={handleStart} className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md">🚀 Commencer</button>
          )}
        </div>
      </div>
    </div>
  )
}
