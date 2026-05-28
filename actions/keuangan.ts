"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { FinancialRecord, FinanceFormData, FinanceSummary } from "@/types"

type PrismaRecord = {
  id: string; title: string; amount: number; date: Date
  category: string; notes: string; createdAt: Date; updatedAt: Date
}

function mapRecord(r: PrismaRecord): FinancialRecord {
  return {
    id: r.id, title: r.title, amount: r.amount, date: r.date,
    category: r.category, notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

export async function getFinancialRecords(
  month?: number, year?: number
): Promise<FinancialRecord[]> {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)

  const records = await prisma.financialRecord.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: "desc" },
  })
  return records.map(mapRecord)
}

export async function getAllFinancialRecords(): Promise<FinancialRecord[]> {
  const records = await prisma.financialRecord.findMany({
    orderBy: { date: "desc" },
  })
  return records.map(mapRecord)
}

export async function createFinancialRecord(data: FinanceFormData): Promise<FinancialRecord> {
  if (!data.title?.trim()) throw new Error("Nama pemasukan harus diisi.")
  if (typeof data.amount !== "number" || data.amount <= 0) throw new Error("Nominal tidak valid.")
  if (!data.date) throw new Error("Tanggal harus diisi.")
  if (!data.category?.trim()) throw new Error("Kategori harus diisi.")

  const r = await prisma.financialRecord.create({
    data: {
      title: data.title.trim(),
      amount: data.amount,
      date: new Date(data.date),
      category: data.category.trim(),
      notes: data.notes?.trim() || "",
    },
  })
  revalidatePath("/")
  return mapRecord(r)
}

export async function deleteFinancialRecord(id: string): Promise<void> {
  await prisma.financialRecord.delete({ where: { id } })
  revalidatePath("/")
}

export async function getFinanceSummary(month?: number, year?: number): Promise<FinanceSummary> {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)

  const records = await prisma.financialRecord.findMany({
    where: { date: { gte: start, lt: end } },
  })

  const totalIncome = records.reduce((sum, r) => sum + r.amount, 0)
  const transactionCount = records.length
  const maxIncome = records.length > 0 ? Math.max(...records.map((r) => r.amount)) : 0

  const lastMonthStart = new Date(y, m - 2, 1)
  const lastMonthEnd = new Date(y, m - 1, 1)
  const lastMonthRecords = await prisma.financialRecord.findMany({
    where: { date: { gte: lastMonthStart, lt: lastMonthEnd } },
  })
  const lastMonthIncome = lastMonthRecords.reduce((sum, r) => sum + r.amount, 0)
  const comparisonPercent = lastMonthIncome > 0
    ? Math.round(((totalIncome - lastMonthIncome) / lastMonthIncome) * 100)
    : totalIncome > 0 ? 100 : 0

  const yearRecords = await prisma.financialRecord.findMany({
    where: { date: { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) } },
    orderBy: { date: "asc" },
  })

  const monthlyMap: Record<string, number> = {}
  yearRecords.forEach((r) => {
    const key = `${r.date.getMonth() + 1}`
    monthlyMap[key] = (monthlyMap[key] || 0) + r.amount
  })

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  const monthlyData = monthNames.map((name, idx) => ({
    month: name,
    total: monthlyMap[`${idx + 1}`] || 0,
  }))

  return { totalIncome, transactionCount, maxIncome, lastMonthIncome, comparisonPercent, monthlyData }
}
