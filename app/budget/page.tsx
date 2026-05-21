"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, getProjects, getExpenses, addExpense, deleteExpense } from "@/lib/supabase"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, Trash2, PieChart, RefreshCw } from "lucide-react"
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

type Project = {
  id: string
  name: string
  budget_prevu: number
  budget_depense: number
}

type Expense = {
  id: string
  project_id: string
  description: string
  amount: number
  category: string
  expense_date: string
}

export default function BudgetPage() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [syncing, setSyncing] = useState(false)
  const [formData, setFormData] = useState({ description: "", amount: "", category: "materiel" })
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
    const [projectsData, expensesData] = await Promise.all([
      getProjects(),
      getExpenses()
    ])
    
    if (!projectsData.error && projectsData.data) {
      setProjects(projectsData.data)
    }
    if (!expensesData.error && expensesData.data) {
      setExpenses(expensesData.data)
    }
    setLoading(false)
  }

  const handleAddExpense = async () => {
    if (!selectedProject || !formData.description || !formData.amount) return
    
    setSyncing(true)
    const { error } = await addExpense({
      project_id: selectedProject,
      description: formData.description,
      amount: parseInt(formData.amount),
      category: formData.category
    })
    
    if (!error) {
      await loadData()
      setShowModal(false)
      setSelectedProject("")
      setFormData({ description: "", amount: "", category: "materiel" })
    }
    setSyncing(false)
  }

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Supprimer cette dépense ?")) {
      setSyncing(true)
      const { error } = await deleteExpense(id)
      if (!error) {
        await loadData()
      }
      setSyncing(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      materiel: "Matériel",
      main_oeuvre: "Main d'œuvre",
      transport: "Transport",
      admin: "Administratif",
      autre: "Autre"
    }
    return categories[category] || category
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalBudget = projects.reduce((sum, p) => sum + p.budget_prevu, 0)
  const totalDepense = projects.reduce((sum, p) => sum + p.budget_depense, 0)
  const totalRestant = totalBudget - totalDepense
  const pourcentageGlobal = totalBudget > 0 ? (totalDepense / totalBudget) * 100 : 0

  const chartData = projects
    .filter(p => p.budget_depense > 0)
    .map(p => ({ name: p.name, value: p.budget_depense, restant: p.budget_prevu - p.budget_depense }))
  
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"]

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestion du Budget
          </h1>
          {syncing && <RefreshCw size={20} className="animate-spin text-blue-500" />}
        </div>

        {/* Cartes récapitulatives */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 rounded-2xl p-4 shadow-lg text-center">
            <DollarSign size={24} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatMoney(totalBudget)}</p>
            <p className="text-xs text-gray-500">Budget total</p>
          </div>
          <div className="bg-white/80 rounded-2xl p-4 shadow-lg text-center">
            <TrendingDown size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{formatMoney(totalDepense)}</p>
            <p className="text-xs text-gray-500">Total dépensé</p>
          </div>
          <div className="bg-white/80 rounded-2xl p-4 shadow-lg text-center">
            <TrendingUp size={24} className={`mx-auto mb-2 ${totalRestant >= 0 ? "text-green-500" : "text-red-500"}`} />
            <p className={`text-2xl font-bold ${totalRestant >= 0 ? "text-green-600" : "text-red-600"}`}>{formatMoney(Math.abs(totalRestant))}</p>
            <p className="text-xs text-gray-500">{totalRestant >= 0 ? "Restant" : "Dépassement"}</p>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="bg-white/80 rounded-2xl p-5 shadow-lg mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Utilisation globale du budget</span>
            <span>{pourcentageGlobal.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${pourcentageGlobal >= 100 ? "bg-red-500" : pourcentageGlobal >= 80 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(pourcentageGlobal, 100)}%` }} />
          </div>
        </div>

        {/* Graphique */}
        {chartData.length > 0 && (
          <div className="bg-white/80 rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PieChart size={24} className="text-blue-500" />
              Répartition des dépenses par projet
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value as number)} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Détail par projet */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Détail par projet</h2>
          {projects.map((project) => {
            const percentage = project.budget_prevu > 0 ? (project.budget_depense / project.budget_prevu) * 100 : 0
            const restant = project.budget_prevu - project.budget_depense
            const projectExpenses = expenses.filter(e => e.project_id === project.id)
            
            return (
              <div key={project.id} className="bg-white/80 rounded-2xl shadow-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-xs text-gray-500">Budget: {formatMoney(project.budget_prevu)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProject(project.id)
                      setFormData({ description: "", amount: "", category: "materiel" })
                      setShowModal(true)
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Dépense
                  </button>
                </div>
                
                {project.budget_prevu > 0 && (
                  <>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progression</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center mb-4 pb-3 border-b">
                      <div>
                        <p className="text-xs text-gray-500">Prévu</p>
                        <p className="text-sm font-semibold">{formatMoney(project.budget_prevu)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Dépensé</p>
                        <p className="text-sm font-semibold text-orange-600">{formatMoney(project.budget_depense)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Restant</p>
                        <p className={`text-sm font-semibold ${restant >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatMoney(Math.abs(restant))}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Liste des dépenses */}
                {projectExpenses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Dépenses :</p>
                    <div className="space-y-2">
                      {projectExpenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span>{expense.description}</span>
                            <span className="text-xs text-gray-400 ml-2">{getCategoryLabel(expense.category)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-orange-600">{formatMoney(expense.amount)}</span>
                            <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal ajout dépense */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter une dépense</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="Ex: Achat ciment" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Montant (FCFA) *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="0" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="materiel">Matériel</option>
                  <option value="main_oeuvre">Main d'œuvre</option>
                  <option value="transport">Transport</option>
                  <option value="admin">Administratif</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Annuler</button>
              <button onClick={handleAddExpense} className="flex-1 bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
