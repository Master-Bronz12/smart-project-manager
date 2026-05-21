"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, getTasks, addTask, updateTask, deleteTask, getProjects, updateUserXP, getUserXP } from "@/lib/supabase"
import { Plus, Trash2, Edit2, CheckCircle, Clock, AlertCircle, X, Calendar, User, RefreshCw } from "lucide-react"

type Project = {
  id: string
  name: string
}

type Task = {
  id: string
  title: string
  description: string
  status: "en_cours" | "termine" | "en_retard"
  responsible: string
  due_date: string
  project_id: string
  created_at: string
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    responsible: "",
    due_date: "",
    project_id: ""
  })
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
    await Promise.all([loadTasks(), loadProjects()])
  }

  const loadTasks = async () => {
    setLoading(true)
    const { data, error } = await getTasks()
    if (!error && data) {
      setTasks(data)
    }
    setLoading(false)
  }

  const loadProjects = async () => {
    const { data, error } = await getProjects()
    if (!error && data) {
      setProjects(data)
    }
  }

  const updateXP = async (tasksList: Task[]) => {
    const completedTasks = tasksList.filter(t => t.status === "termine").length
    const xp = completedTasks * 10
    const level = Math.floor(xp / 100) + 1
    await updateUserXP(xp, level)
  }

  const handleAddTask = async () => {
    if (!formData.title || !formData.responsible || !formData.project_id) return
    
    setSyncing(true)
    const { data, error } = await addTask({
      title: formData.title,
      description: formData.description,
      responsible: formData.responsible,
      due_date: formData.due_date,
      project_id: formData.project_id,
      status: "en_cours"
    })
    
    if (!error && data) {
      await loadTasks()
      await updateXP([...tasks, data])
      setShowModal(false)
      setFormData({ title: "", description: "", responsible: "", due_date: "", project_id: "" })
    }
    setSyncing(false)
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title) return
    
    setSyncing(true)
    const { error } = await updateTask(editingTask.id, {
      title: formData.title,
      description: formData.description,
      responsible: formData.responsible,
      due_date: formData.due_date,
      project_id: formData.project_id
    })
    
    if (!error) {
      await loadTasks()
      setShowModal(false)
      setEditingTask(null)
      setFormData({ title: "", description: "", responsible: "", due_date: "", project_id: "" })
    }
    setSyncing(false)
  }

  const handleUpdateStatus = async (id: string, newStatus: Task["status"]) => {
    setSyncing(true)
    const { error } = await updateTask(id, { status: newStatus })
    if (!error) {
      await loadTasks()
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
      await updateXP(updatedTasks)
    }
    setSyncing(false)
  }

  const handleDeleteTask = async (id: string) => {
    if (confirm("Supprimer cette tâche ?")) {
      setSyncing(true)
      const { error } = await deleteTask(id)
      if (!error) {
        await loadTasks()
      }
      setSyncing(false)
    }
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      responsible: task.responsible,
      due_date: task.due_date || "",
      project_id: task.project_id
    })
    setShowModal(true)
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "en_cours": return { label: "En cours", icon: Clock, color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-50" }
      case "termine": return { label: "Terminé", icon: CheckCircle, color: "from-green-500 to-green-600", bgColor: "bg-green-50" }
      case "en_retard": return { label: "En retard", icon: AlertCircle, color: "from-red-500 to-red-600", bgColor: "bg-red-50" }
      default: return { label: "Inconnu", icon: Clock, color: "from-gray-500 to-gray-600", bgColor: "bg-gray-50" }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "termine").length,
    inProgress: tasks.filter(t => t.status === "en_cours").length,
    late: tasks.filter(t => t.status === "en_retard").length
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || "Sans projet"
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestion des tâches
          </h1>
          {syncing && <RefreshCw size={20} className="animate-spin text-blue-500" />}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Terminées</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.late}</p>
            <p className="text-xs text-gray-500">En retard</p>
          </div>
        </div>

        {/* Bouton ajouter */}
        <button
          onClick={() => {
            setEditingTask(null)
            setFormData({ title: "", description: "", responsible: "", due_date: "", project_id: projects[0]?.id || "" })
            setShowModal(true)
          }}
          className="w-full mb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Ajouter une tâche
        </button>

        {/* Liste des tâches */}
        <div className="space-y-4">
          {tasks.map((task) => {
            const statusConfig = getStatusConfig(task.status)
            const StatusIcon = statusConfig.icon
            const isLate = task.status === "en_retard"
            const isCompleted = task.status === "termine"
            
            return (
              <div key={task.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border p-5 transition-all hover:shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${statusConfig.color} shadow-md`}>
                        <StatusIcon size={14} className="text-white" />
                      </div>
                      <h3 className="font-semibold">{task.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Projet: {getProjectName(task.project_id)}</p>
                    {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{task.responsible}</span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span className={isLate && !isCompleted ? "text-red-500 font-medium" : ""}>
                            {new Date(task.due_date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(task)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button onClick={() => handleUpdateStatus(task.id, "en_cours")} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${task.status === "en_cours" ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>En cours</button>
                  <button onClick={() => handleUpdateStatus(task.id, "termine")} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${task.status === "termine" ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Terminé</button>
                  <button onClick={() => handleUpdateStatus(task.id, "en_retard")} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${task.status === "en_retard" ? "bg-gradient-to-r from-red-500 to-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>En retard</button>
                </div>
              </div>
            )
          })}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 bg-white/80 rounded-2xl">
              <p className="text-gray-500">Aucune tâche</p>
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
              <h2 className="text-xl font-bold">{editingTask ? "Modifier" : "Nouvelle tâche"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Projet *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900"
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900" placeholder="Nom de la tâche" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900" placeholder="Description..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Responsable *</label>
                <input type="text" value={formData.responsible} onChange={(e) => setFormData({ ...formData, responsible: e.target.value })} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900" placeholder="Nom du responsable" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date d'échéance</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Annuler</button>
              <button onClick={editingTask ? handleUpdateTask : handleAddTask} className="flex-1 bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700">{editingTask ? "Modifier" : "Créer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
