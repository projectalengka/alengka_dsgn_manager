export type ProjectStatus = "On Progress" | "Revisi" | "Done" | "Cancel"

export interface Project {
  id: string
  clientName: string
  projectTitle: string
  categoryId: string
  category: Category
  price: number
  status: ProjectStatus
  deadline: Date
  notes: string
  previewImage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFormData {
  clientName: string
  projectTitle: string
  categoryId: string
  price: number
  status: ProjectStatus
  deadline: string
  notes: string
  previewImage?: string
}

export interface Category {
  id: string
  name: string
  iconName: string
  _count?: { projects: number }
}

export type Tab = "dashboard" | "projects" | "analytics" | "categories"

export interface Filters {
  search: string
  status: string
  category: string
  sortBy: "createdAt_desc" | "createdAt_asc" | "price_desc" | "deadline_asc"
}

export interface DashboardStats {
  total: number
  onProgress: number
  revisi: number
  done: number
  cancel: number
  totalIncome: number
  pipelineIncome: number
}
