export interface Project {
  id: string
  name: string
  user_id: string
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  status: 'en_cours' | 'termine' | 'en_retard'
  due_date: string
  assigned_to: string
  created_at: string
}

export interface UserXP {
  id: string
  user_id: string
  xp: number
  level: number
}
