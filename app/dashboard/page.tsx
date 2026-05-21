"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, getProjects, getTasks, getUserXP } from "@/lib/supabase"
import { FolderKanban, CheckCircle, AlertCircle, DollarSign, TrendingUp, Target, Award, RefreshCw } from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [userXP, setUserXP] = useState({ xp: 0, level: 1 })
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/auth")
      return
    }
    await loadData()
  }

  const loadData = async () => {
    setLoading(true)
    setSyncing(true)
    
    const [projectsData, tasksData, xpData] = await Promise.all([
      getProjects(),
      getTasks(),
      getUserXP()
    ])
    
    if (!projectsData.error && projectsData.data) setProjects(projectsData.data)
    if (!tasksData.error && tasksData.data) setTasks(tasksData.data)
    if (!xpData.error && xpData.data) setUserXP({ xp: xpData.data.xp, level: xpData.data.level })
    
    setLoading(false)
    setSyncing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget_prevu || 0), 0)
  const tasksDone = tasks.filter(t => t.status === "termine").length
  const tasksLate = tasks.filter(t => t.status === "en_retard").length
  const tasksInProgress = tasks.filter(t => t.status === "en_cours").length
  const level = userXP.level
  const xpToNextLevel = (level * 100) - userXP.xp

  const evolutionData = [
    { mois: "Jan", tâches: 4, projets: 2 },
    { mois: "Fév", tâches: 7, projets: 3 },
    { mois: "Mar", tâches: 12, projets: 4 },
    { mois: "Avr", tâches: 18, projets: 5 },
    { mois: "Mai", tâches: 24, projets: 6 },
    { mois: "Juin", tâches: tasksDone, projets: projects.length }
  ]

  const statusData = [
    { name: "Terminées", value: tasksDone, color: "#10b981" },
    { name: "En cours", value: tasksInProgress, color: "#f59e0b" },
    { name: "En retard", value: tasksLate, color: "#ef4444" }
  ]

  const productivityData = [
    { jour: "Lun", complétées: 3, créées: 5 },
    { jour: "Mar", complétées: 4, créées: 3 },
    { jour: "Mer", complétées: 6, créées: 4 },
    { jour: "Jeu", complétées: 5, créées: 7 },
    { jour: "Ven", complétées: 8, créées: 4 },
    { jour: "Sam", complétées: 2, créées: 1 },
    { jour: "Dim", complétées: 1, créées: 0 }
  ]

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          {syncing && <RefreshCw size={20} className="animate-spin text-blue-500" />}
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-2xl p-5 transition hover:scale-105">
            <FolderKanban size={20} className="text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-sm text-gray-600">Projets actifs</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-5 transition hover:scale-105">
            <CheckCircle size={20} className="text-green-500 mb-2" />
            <p className="text-2xl font-bold">{tasksDone}</p>
            <p className="text-sm text-gray-600">Tâches terminées</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-5 transition hover:scale-105">
            <AlertCircle size={20} className="text-red-500 mb-2" />
            <p className="text-2xl font-bold">{tasksLate}</p>
            <p className="text-sm text-gray-600">Tâches en retard</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-5 transition hover:scale-105">
            <DollarSign size={20} className="text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{totalBudget.toLocaleString("fr-FR")} FCFA</p>
            <p className="text-sm text-gray-600">Budget total</p>
          </div>
        </div>

        {/* Section XP */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Niveau {level}</p>
                <p className="text-white font-bold text-xl">{userXP.xp} XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Prochain niveau</p>
              <p className="text-white font-bold">{xpToNextLevel} XP restants</p>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${userXP.xp % 100}%` }} />
          </div>
        </div>

        {/* Graphique évolution */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-500" />
            Évolution des tâches et projets
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tâches" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="projets" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graphiques circulaire et barres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target size={20} className="text-purple-500" />
              Répartition des tâches
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                  {statusData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award size={20} className="text-green-500" />
              Productivité hebdomadaire
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="complétées" fill="#10b981" />
                <Bar dataKey="créées" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Activité récente</h2>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.responsible}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === "termine" ? "bg-green-100 text-green-700" :
                    task.status === "en_cours" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    {task.status === "termine" ? "Terminé" : task.status === "en_cours" ? "En cours" : "En retard"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Commencez par créer des projets et des tâches !</p>
          )}
        </div>
      </div>
    </div>
  )
}
