import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Projets
export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
  return { data, error }
}

export async function addProject(name: string, budgetPrevu: number) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, budget_prevu: budgetPrevu, user_id: user?.id })
    .select()
    .single()
  return { data, error }
}

export async function updateProject(id: string, updates: any) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  return { data, error }
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id)
  return { error }
}

// Tâches
export async function getTasks(projectId?: string) {
  let query = supabase.from("tasks").select("*").order("created_at", { ascending: false })
  if (projectId) query = query.eq("project_id", projectId)
  const { data, error } = await query
  return { data, error }
}

export async function addTask(task: any) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...task, user_id: user?.id })
    .select()
    .single()
  return { data, error }
}

export async function updateTask(id: string, updates: any) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  return { data, error }
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  return { error }
}

// Dépenses
export async function getExpenses(projectId?: string) {
  let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false })
  if (projectId) query = query.eq("project_id", projectId)
  const { data, error } = await query
  return { data, error }
}

export async function addExpense(expense: any) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...expense, user_id: user?.id })
    .select()
    .single()
  return { data, error }
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id)
  return { error }
}

// XP Utilisateur
export async function getUserXP() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("user_xp")
    .select("*")
    .eq("user_id", user?.id)
    .single()
  return { data, error }
}

export async function updateUserXP(xp: number, level: number) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("user_xp")
    .upsert({ user_id: user?.id, xp, level })
    .select()
    .single()
  return { data, error }
}
