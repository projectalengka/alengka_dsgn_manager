"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Project, Category, ProjectFormData, ProjectStatus } from "@/types"

type PrismaProjectWithCategory = {
  id: string; clientName: string; projectTitle: string; categoryId: string
  price: number; status: string; deadline: Date; notes: string
  referenceLink: string | null; createdAt: Date; updatedAt: Date
  category: { id: string; name: string; iconName: string }
}

function mapProject(p: PrismaProjectWithCategory): Project {
  return {
    id: p.id,
    clientName: p.clientName,
    projectTitle: p.projectTitle,
    categoryId: p.categoryId,
    category: p.category as Category,
    price: p.price,
    status: p.status as ProjectStatus,
    deadline: p.deadline,
    notes: p.notes,
    referenceLink: p.referenceLink,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export async function getProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })
  return projects.map(mapProject)
}

function validateProject(data: ProjectFormData): string | null {
  if (!data.clientName?.trim()) return "Nama klien harus diisi."
  if (!data.projectTitle?.trim()) return "Judul proyek harus diisi."
  if (!data.categoryId) return "Kategori harus dipilih."
  if (typeof data.price !== "number" || data.price < 0) return "Harga tidak valid."
  if (!data.deadline) return "Deadline harus diisi."
  if (data.notes && data.notes.length > 5000) return "Catatan terlalu panjang (maks 5000 karakter)."
  return null
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const error = validateProject(data)
  if (error) throw new Error(error)

  const p = await prisma.project.create({
    data: {
      clientName: data.clientName.trim(),
      projectTitle: data.projectTitle.trim(),
      categoryId: data.categoryId,
      price: data.price,
      status: data.status,
      deadline: new Date(data.deadline),
      notes: data.notes?.trim() || "",
      referenceLink: data.referenceLink || null,
    },
    include: { category: true },
  })
  revalidatePath("/")
  return mapProject(p)
}

export async function updateProject(id: string, data: ProjectFormData): Promise<Project> {
  const error = validateProject(data)
  if (error) throw new Error(error)

  const p = await prisma.project.update({
    where: { id },
    data: {
      clientName: data.clientName.trim(),
      projectTitle: data.projectTitle.trim(),
      categoryId: data.categoryId,
      price: data.price,
      status: data.status,
      deadline: new Date(data.deadline),
      notes: data.notes?.trim() || "",
      referenceLink: data.referenceLink || null,
    },
    include: { category: true },
  })
  revalidatePath("/")
  return mapProject(p)
}

export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({ where: { id } })
  revalidatePath("/")
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
  const p = await prisma.project.update({
    where: { id },
    data: { status },
    include: { category: true },
  })
  revalidatePath("/")
  return mapProject(p)
}


