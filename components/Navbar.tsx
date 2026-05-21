"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, CheckSquare, DollarSign, BarChart3, Settings } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  const hiddenPages = ["/login", "/register", "/splash", "/onboarding", "/auth"]
  if (hiddenPages.includes(pathname)) return null

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#3b82f6", activeColor: "bg-blue-500" },
    { href: "/projects", label: "Projets", icon: FolderKanban, color: "#10b981", activeColor: "bg-green-500" },
    { href: "/tasks", label: "Tâches", icon: CheckSquare, color: "#f59e0b", activeColor: "bg-yellow-500" },
    { href: "/budget", label: "Budget", icon: DollarSign, color: "#8b5cf6", activeColor: "bg-purple-500" },
    { href: "/reports", label: "Rapports", icon: BarChart3, color: "#ec4899", activeColor: "bg-pink-500" },
    { href: "/settings", label: "Paramètres", icon: Settings, color: "#6b7280", activeColor: "bg-gray-500" }
  ]

  return (
    <>
      <div className="h-16"></div>
      <nav className="fixed bottom-4 left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 animate-fade-in">
        <div className="flex justify-around items-center h-14 px-2">
          {links.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 transition-all duration-200 group"
              >
                <div 
                  className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? `${link.activeColor} shadow-lg` : ""}`}
                  style={isActive ? { boxShadow: `0 0 15px ${link.color}50` } : {}}
                >
                  <Icon 
                    size={18} 
                    className={`transition-all duration-200 ${isActive ? "text-white" : ""}`} 
                    style={!isActive ? { color: link.color } : {}}
                  />
                </div>
                <span className={`text-[10px] font-medium transition-all duration-200 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
