"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, getProjects, getTasks, getUserXP } from "@/lib/supabase"
import { FileText, Download, TrendingUp, Target, RefreshCw, CheckCircle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [userXP, setUserXP] = useState({ xp: 0, level: 1 })
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const exportPDF = () => {
    try {
      const doc = new jsPDF()
      
      // En-tête
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 40, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text("Smart Project Manager", 105, 20, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Rapport généré le ${new Date().toLocaleDateString("fr-FR")}`, 105, 32, { align: "center" })
      
      // Statistiques
      const stats = {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === "termine").length,
        lateTasks: tasks.filter(t => t.status === "en_retard").length,
        inProgressTasks: tasks.filter(t => t.status === "en_cours").length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "termine").length / tasks.length) * 100) : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget_prevu || 0), 0),
        totalDepense: projects.reduce((sum, p) => sum + (p.budget_depense || 0), 0)
      }
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.text("Résumé", 14, 55)
      
      const summaryData = [
        ["Projets", stats.totalProjects.toString()],
        ["Tâches totales", stats.totalTasks.toString()],
        ["Tâches terminées", stats.completedTasks.toString()],
        ["Tâches en retard", stats.lateTasks.toString()],
        ["Taux de complétion", `${stats.completionRate}%`],
        ["Budget total", `${stats.totalBudget.toLocaleString("fr-FR")} FCFA`],
        ["Budget dépensé", `${stats.totalDepense.toLocaleString("fr-FR")} FCFA`],
        ["XP total", userXP.xp.toString()],
        ["Niveau", userXP.level.toString()]
      ]
      
      autoTable(doc, {
        startY: 60,
        head: [["Indicateur", "Valeur"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 }
      })
      
      // Projets
      let finalY = (doc as any).lastAutoTable.finalY + 10
      doc.text("Liste des projets", 14, finalY)
      
      const projectsDataTable = projects.map(p => [
        p.name,
        `${p.budget_prevu?.toLocaleString("fr-FR") || 0} FCFA`,
        `${p.budget_depense?.toLocaleString("fr-FR") || 0} FCFA`,
        `${((p.budget_depense / p.budget_prevu) * 100 || 0).toFixed(1)}%`
      ])
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Nom", "Budget prévu", "Budget dépensé", "Utilisation"]],
        body: projectsDataTable,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      })
      
      // Tâches
      finalY = (doc as any).lastAutoTable.finalY + 10
      if (finalY > 250) {
        doc.addPage()
        finalY = 20
      }
      
      doc.text("Dernières tâches", 14, finalY)
      
      const tasksDataTable = tasks.slice(0, 10).map(t => [
        t.title,
        t.responsible || "-",
        t.status === "en_cours" ? "En cours" : t.status === "termine" ? "Terminé" : "En retard",
        t.due_date ? new Date(t.due_date).toLocaleDateString("fr-FR") : "-"
      ])
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Tâche", "Responsable", "Statut", "Échéance"]],
        body: tasksDataTable,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      })
      
      // Sauvegarde
      doc.save(`rapport_spm_${new Date().toISOString().split("T")[0]}.pdf`)
      showToast("PDF téléchargé avec succès !", "success")
    } catch (error) {
      console.error("Erreur PDF:", error)
      showToast("Erreur lors de la génération du PDF", "error")
    }
  }

  const exportExcel = () => {
    try {
      const headers = ["Type", "Nom", "Responsable", "Statut", "Budget prévu", "Budget dépensé", "Date échéance"]
      const data: Array<Array<string | number>> = []
      
      projects.forEach(p => {
        data.push(["Projet", p.name, "", "", p.budget_prevu || 0, p.budget_depense || 0, ""])
      })
      
      tasks.forEach(t => {
        data.push([
          "Tâche",
          t.title,
          t.responsible || "",
          t.status === "en_cours" ? "En cours" : t.status === "termine" ? "Terminé" : "En retard",
          "",
          "",
          t.due_date ? new Date(t.due_date).toLocaleDateString("fr-FR") : ""
        ])
      })
      
      const csvContent = [headers, ...data].map(row => row.join(",")).join("\n")
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute("download", `rapport_spm_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showToast("Excel téléchargé avec succès !", "success")
    } catch (error) {
      console.error("Erreur Excel:", error)
      showToast("Erreur lors de la génération du fichier Excel", "error")
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
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === "termine").length,
    lateTasks: tasks.filter(t => t.status === "en_retard").length,
    inProgressTasks: tasks.filter(t => t.status === "en_cours").length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "termine").length / tasks.length) * 100) : 0,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget_prevu || 0), 0)
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg z-50 animate-slide-in ${
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          <CheckCircle size={16} />
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Rapports & Statistiques
          </h1>
          {syncing && <RefreshCw size={20} className="animate-spin text-blue-500" />}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-blue-500" />
              <p className="text-sm">Taux complétion</p>
            </div>
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${stats.completionRate}%` }} />
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-500" />
              <p className="text-sm">Tâches terminées</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
            <p className="text-xs text-gray-500">sur {stats.totalTasks} totales</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-500" />
            Détail des activités
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Projets</span>
              <span className="font-semibold">{stats.totalProjects}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Tâches en cours</span>
              <span className="font-semibold text-yellow-600">{stats.inProgressTasks}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Tâches en retard</span>
              <span className="font-semibold text-red-600">{stats.lateTasks}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Budget total</span>
              <span className="font-semibold text-purple-600">{stats.totalBudget.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={exportPDF}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Télécharger en PDF
          </button>
          
          <button
            onClick={exportExcel}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Télécharger en Excel (CSV)
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            💡 Les fichiers sont téléchargés directement dans votre dossier "Téléchargements"
          </p>
        </div>
      </div>
    </div>
  )
}
