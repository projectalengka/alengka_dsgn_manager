"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Category } from "@/types"

function mapCategory(c: { id: string; name: string; iconName: string; defaultPrice: number; _count?: { projects: number } }): Category {
  return {
    id: c.id,
    name: c.name,
    iconName: c.iconName,
    defaultPrice: c.defaultPrice,
    _count: c._count,
  }
}

export async function getCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  })
  return categories.map((c) => mapCategory({
    id: c.id,
    name: c.name,
    iconName: c.iconName,
    defaultPrice: c.defaultPrice,
    _count: c._count,
  }))
}

export async function createCategory(name: string, iconName: string, defaultPrice: number = 0): Promise<Category> {
  const id = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
  const c = await prisma.category.create({
    data: { id, name, iconName, defaultPrice },
  })
  revalidatePath("/")
  return { id: c.id, name: c.name, iconName: c.iconName, defaultPrice: c.defaultPrice }
}

export async function updateCategory(id: string, name: string, iconName: string, defaultPrice: number = 0): Promise<Category> {
  const c = await prisma.category.update({
    where: { id },
    data: { name, iconName, defaultPrice },
  })
  revalidatePath("/")
  return { id: c.id, name: c.name, iconName: c.iconName, defaultPrice: c.defaultPrice }
}

export async function deleteCategory(id: string): Promise<void> {
  const projectCount = await prisma.project.count({ where: { categoryId: id } })
  if (projectCount > 0) {
    throw new Error(`Tidak bisa hapus kategori: ${projectCount} proyek masih menggunakannya.`)
  }
  await prisma.category.delete({ where: { id } })
  revalidatePath("/")
}
