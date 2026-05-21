"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, getProjects, addProject, updateProject, deleteProject } from "@/lib/supabase"
import { Plus, Trash2, Edit2, DollarSign, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react"

type Project = {
  id: string
  name: string
  budget_prevu: number
  budget_depense: number
  created_at: string
}

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: "", budget_prevu: "" })
  const [syncing, setSyncing] = useState(false)
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
    await loadProjects()
  }

  const loadProjects = async () => {
    setLoading(true)
    const { data, error } = await getProjects()
    if (!error && data) {
      setProjects(data)
    }
    setLoading(false)
  }

  const handleAddProject = async () => {
    if (!formData.name) return
    
    setSyncing(true)
    const { data, error } = await addProject(
      formData.name,
      parseInt(formData.budget_prevu) || 0
    )
    
    if (!error && data) {
      await loadProjects()
      setShowModal(false)
      setFormData({ name: "", budget_prevu: "" })
    }
    setSyncing(false)
  }

  const handleUpdateProject = async () => {
    if (!editingProject || !formData.name) return
    
    setSyncing(true)
    const { error } = await updateProject(editingProject.id, {
      name: formData.name,
      budget_prevu: parseInt(formData.budget_prevu) || 0
    })
    
    if (!error) {
      await loadProjects()
      setShowModal(false)
      setEditingProject(null)
      setFormData({ name: "", budget_prevu: "" })
    }
    setSyncing(false)
  }

  const handleDeleteProject = async (id: string) => {
    if (confirm("Supprimer ce projet ?")) {
      setSyncing(true)
      const { error } = await deleteProject(id)
      if (!error) {
        await loadProjects()
      }
      setSyncing(false)
    }
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      budget_prevu: project.budget_prevu.toString()
    })
    setShowModal(true)
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
  }

  const getBudgetStatus = (budgetPrevu: number, budgetDepense: number) => {
    if (budgetPrevu === 0) return { label: "Non défini", color: "text-gray-600", bgColor: "bg-gray-100", icon: AlertCircle }
    const percentage = (budgetDepense / budgetPrevu) * 100
    if (percentage >= 100) return { label: "Dépassé", color: "text-red-600", bgColor: "bg-red-100", icon: AlertCircle }
    if (percentage >= 80) return { label: "Attention", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: TrendingUp }
    return { label: "Bon", color: "text-green-600", bgColor: "bg-green-100", icon: TrendingDown }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalBudgetPrevu = projects.reduce((sum, p) => sum + p.budget_prevu, 0)
  const totalBudgetDepense = projects.reduce((sum, p) => sum + p.budget_depense, 0)
  const totalRestant = totalBudgetPrevu - totalBudgetDepense

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Projets & Budgets
          </h1>
          {syncing && <RefreshCw size={20} className="animate-spin text-blue-500" />}
        </div>

        {/* Résumé des budgets */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Budget total</p>
            <p className="text-sm font-bold">{formatMoney(totalBudgetPrevu)}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Dépensé</p>
            <p className="text-sm font-bold text-orange-600">{formatMoney(totalBudgetDepense)}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Restant</p>
            <p className={`text-sm font-bold ${totalRestant >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMoney(Math.abs(totalRestant))}
            </p>
          </div>
        </div>

        {/* Bouton ajouter */}
        <button
          onClick={() => {
            setEditingProject(null)
            setFormData({ name: "", budget_prevu: "" })
            setShowModal(true)
          }}
          className="w-full mb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Ajouter un projet
        </button>

        {/* Liste des projets */}
        <div className="space-y-4">
          {projects.map((project) => {
            const percentage = project.budget_prevu > 0 ? (project.budget_depense / project.budget_prevu) * 100 : 0
            const status = getBudgetStatus(project.budget_prevu, project.budget_depense)
            const StatusIcon = status.icon
            const restant = project.budget_prevu - project.budget_depense
            
            return (
              <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border p-5 transition-all hover:shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bgColor} ${status.color}`}>
                      <StatusIcon size={12} />
                      <span>{status.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(project)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {project.budget_prevu > 0 && (
                  <>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Budget utilisé</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t">
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
              </div>
            )
          })}
          
          {projects.length === 0 && (
            <div className="text-center py-12 bg-white/80 rounded-2xl">
              <p className="text-gray-500">Aucun projet</p>
              <p className="text-sm text-gray-400 mt-1">Cliquez sur "Ajouter" pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingProject ? "Modifier" : "Nouveau projet"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du projet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900"
                  placeholder="Nom du projet"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Budget prévu (FCFA)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.budget_prevu}
                    onChange={(e) => setFormData({ ...formData, budget_prevu: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border rounded-xl dark:bg-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Annuler</button>
              <button onClick={editingProject ? handleUpdateProject : handleAddProject} className="flex-1 bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700">
                {editingProject ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
