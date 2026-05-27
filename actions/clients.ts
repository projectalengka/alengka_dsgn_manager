"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Client, ClientFormData } from "@/types"

function mapClient(c: {
  id: string; name: string; phone: string; email: string
  address: string; company: string; notes: string
  createdAt: Date; updatedAt: Date
  _count?: { projects: number }
}): Client {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    company: c.company,
    notes: c.notes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _count: c._count,
  }
}

export async function getClients(): Promise<Client[]> {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  })
  return clients.map(mapClient)
}

export async function searchClients(query: string): Promise<Client[]> {
  const where = query.trim()
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { company: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query } },
        ],
      }
    : {}   // empty query = return all (limited by take)

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
    take: 10,
  })
  return clients.map(mapClient)
}

function validateClient(data: ClientFormData): string | null {
  if (!data.name?.trim()) return "Nama klien harus diisi."
  // phone & email bersifat opsional — tidak divalidasi format jika kosong
  return null
}

export async function createClient(data: ClientFormData): Promise<Client> {
  const error = validateClient(data)
  if (error) throw new Error(error)

  const c = await prisma.client.create({
    data: {
      name: data.name.trim(),
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
      address: data.address?.trim() || "",
      company: data.company?.trim() || "",
      notes: data.notes?.trim() || "",
    },
    include: { _count: { select: { projects: true } } },
  })
  revalidatePath("/")
  return mapClient(c)
}

export async function updateClient(id: string, data: ClientFormData): Promise<Client> {
  const error = validateClient(data)
  if (error) throw new Error(error)

  const c = await prisma.client.update({
    where: { id },
    data: {
      name: data.name.trim(),
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
      address: data.address?.trim() || "",
      company: data.company?.trim() || "",
      notes: data.notes?.trim() || "",
    },
    include: { _count: { select: { projects: true } } },
  })
  revalidatePath("/")
  return mapClient(c)
}

export async function deleteClient(id: string): Promise<void> {
  // Set clientId to null on related projects before deleting
  await prisma.project.updateMany({ where: { clientId: id }, data: { clientId: null } })
  await prisma.client.delete({ where: { id } })
  revalidatePath("/")
}
