"use client"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { CheckCircle, AlertCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextType = {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const getIcon = (type: ToastType) => {
    switch(type) {
      case "success": return <CheckCircle size={18} className="text-green-500" />
      case "error": return <AlertCircle size={18} className="text-red-500" />
      default: return <Info size={18} className="text-blue-500" />
    }
  }

  const getBgColor = (type: ToastType) => {
    switch(type) {
      case "success": return "bg-green-100 dark:bg-green-950/50 border-green-300"
      case "error": return "bg-red-100 dark:bg-red-950/50 border-red-300"
      default: return "bg-blue-100 dark:bg-blue-950/50 border-blue-300"
    }
  }

  if (!mounted) return <>{children}</>

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 left-4 md:left-auto md:right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border animate-slide-in ${getBgColor(toast.type)}`}>
            {getIcon(toast.type)}
            <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{toast.message}</p>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
