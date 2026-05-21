"use client"
import { useEffect, useState } from "react"

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse mb-8"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  )
}

export function withLoading(Component: React.ComponentType<any>) {
  return function WithLoadingComponent(props: any) {
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
      const timer = setTimeout(() => setLoading(false), 500)
      return () => clearTimeout(timer)
    }, [])
    
    if (loading) return <LoadingSkeleton />
    return <Component {...props} />
  }
}
