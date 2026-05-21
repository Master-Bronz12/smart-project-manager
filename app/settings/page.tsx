"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, updateUserXP, getUserXP } from "@/lib/supabase"
import { User, Bell, Moon, Sun, Trash2, Save, RefreshCw, Shield, Mail, LogOut, CheckCircle } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({ name: "", email: "", role: "Utilisateur" })
  const [preferences, setPreferences] = useState({ theme: "auto", notifications: true, emailReports: false })
  const [userXP, setUserXP] = useState({ xp: 0, level: 1 })
  const [showResetModal, setShowResetModal] = useState(false)
  const [showSaveMessage, setShowSaveMessage] = useState(false)
  const [saveMessageType, setSaveMessageType] = useState<"success" | "error">("success")
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
    setUser(session.user)
    
    // Charger le profil depuis localStorage (temporaire, à migrer vers Supabase plus tard)
    const savedProfile = localStorage.getItem("userProfile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    } else {
      setProfile({
        name: session.user.email?.split("@")[0] || "Utilisateur",
        email: session.user.email || "",
        role: "Utilisateur"
      })
    }
    
    // Charger les préférences
    const savedPrefs = localStorage.getItem("userPreferences")
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs))
      applyTheme(JSON.parse(savedPrefs).theme)
    } else {
      applyTheme(preferences.theme)
    }
    
    // Charger XP
    const { data: xpData } = await getUserXP()
    if (xpData) setUserXP({ xp: xpData.xp, level: xpData.level })
    
    setLoading(false)
  }

  const applyTheme = (theme: string) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  const showMessage = (message: string, type: "success" | "error") => {
    setSaveMessageType(type)
    setShowSaveMessage(true)
    setTimeout(() => setShowSaveMessage(false), 3000)
  }

  const saveProfile = async () => {
    setSyncing(true)
    // Sauvegarder dans localStorage (temporaire)
    localStorage.setItem("userProfile", JSON.stringify(profile))
    showMessage("Profil mis à jour !", "success")
    setSyncing(false)
  }

  const savePreferences = () => {
    setSyncing(true)
    localStorage.setItem("userPreferences", JSON.stringify(preferences))
    applyTheme(preferences.theme)
    showMessage("Préférences enregistrées !", "success")
    setSyncing(false)
  }

  const resetAllData = async () => {
    setSyncing(true)
    
    // Supprimer les projets, tâches et dépenses de l'utilisateur
    const { error: projectsError } = await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    const { error: tasksError } = await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    const { error: expensesError } = await supabase.from("expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    
    // Réinitialiser XP
    await updateUserXP(0, 1)
    setUserXP({ xp: 0, level: 1 })
    
    // Nettoyer localStorage
    localStorage.removeItem("projects")
    localStorage.removeItem("tasks")
    localStorage.removeItem("userXP")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("userPreferences")
    localStorage.removeItem("depenses")
    localStorage.removeItem("hasSeenOnboarding")
    
    setShowResetModal(false)
    showMessage("Toutes les données ont été réinitialisées !", "success")
    
    setTimeout(() => {
      window.location.href = "/auth"
    }, 1500)
    setSyncing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Message de confirmation */}
        {showSaveMessage && (
          <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce ${
            saveMessageType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            <CheckCircle size={18} />
            {saveMessageType === "success" ? "Succès !" : "Erreur"}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Paramètres
          </h1>
          {syncing && <RefreshCw size={20} className="animate-spin text-blue-500" />}
        </div>

        {/* Section Profil */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User size={24} className="text-blue-500" />
            Profil utilisateur
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rôle</label>
              <select
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900"
              >
                <option>Utilisateur</option>
                <option>Chef de projet</option>
                <option>Administrateur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Niveau</label>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                <Shield size={18} />
                <span>Niveau {userXP.level} - {userXP.xp} XP</span>
              </div>
            </div>
            <button
              onClick={saveProfile}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <Save size={18} />
              Enregistrer le profil
            </button>
          </div>
        </div>

        {/* Section Préférences */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell size={24} className="text-purple-500" />
            Préférences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {preferences.theme === "dark" ? <Moon size={18} /> : preferences.theme === "light" ? <Sun size={18} /> : <RefreshCw size={18} />}
                <span>Thème</span>
              </div>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="px-3 py-1 border rounded-lg dark:bg-gray-900"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Bell size={18} />
                <span>Notifications</span>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span>Recevoir rapports par email</span>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, emailReports: !preferences.emailReports })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.emailReports ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.emailReports ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            
            <button
              onClick={savePreferences}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <Save size={18} />
              Enregistrer les préférences
            </button>
          </div>
        </div>

        {/* Section Danger */}
        <div className="bg-red-50/80 rounded-2xl shadow-lg p-6 border border-red-200">
          <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            <Trash2 size={24} />
            Zone de danger
          </h2>
          <p className="text-gray-700 mb-4 text-sm">
            La réinitialisation supprimera définitivement tous vos projets, tâches et données. Cette action est irréversible.
          </p>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
          >
            <RefreshCw size={18} />
            Réinitialiser toutes les données
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold">Confirmer la réinitialisation</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Annuler</button>
              <button onClick={resetAllData} className="flex-1 bg-red-600 text-white rounded-xl py-2 hover:bg-red-700">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
