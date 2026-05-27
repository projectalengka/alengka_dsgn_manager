export type ProjectStatus = "On Progress" | "Revisi" | "Done" | "Cancel"

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  company: string
  notes: string
  createdAt: Date
  updatedAt: Date
  _count?: { projects: number }
}

export interface ClientFormData {
  name: string
  phone: string
  email: string
  address: string
  company: string
  notes: string
}

export interface Project {
  id: string
  clientName: string
  clientId?: string | null
  projectTitle: string
  categoryId: string
  category: Category
  price: number
  status: ProjectStatus
  deadline: Date
  notes: string
  referenceLink: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFormData {
  clientName: string
  clientId?: string | null
  projectTitle: string
  categoryId: string
  price: number
  status: ProjectStatus
  deadline: string
  notes: string
  referenceLink?: string
}

export interface Category {
  id: string
  name: string
  iconName: string
  _count?: { projects: number }
}

export type Tab = "dashboard" | "projects" | "analytics" | "categories" | "crm"

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
