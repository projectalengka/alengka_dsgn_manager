"use server"

import { prisma } from "@/lib/prisma"

export interface StudioProfileFormData {
  name: string
  tagline: string
  address: string
  contact: string
  bankInfo: string
  logo: string
}

export async function getStudioProfile() {
  let studio = await prisma.studio.findUnique({
    where: { id: "default" },
  })

  if (!studio) {
    studio = await prisma.studio.create({
      data: {
        id: "default",
        name: "Design Studio",
        tagline: "Creative Design Solutions",
        address: "Jakarta, Indonesia",
        contact: "studio@example.com | +62 812-3456-7890",
        bankInfo: "BCA 872-0492-911 a.n. Design Studio",
        logo: "",
      },
    })
  }

  return studio
}

export async function updateStudioProfile(data: StudioProfileFormData) {
  const studio = await prisma.studio.upsert({
    where: { id: "default" },
    update: {
      name: data.name,
      tagline: data.tagline,
      address: data.address,
      contact: data.contact,
      bankInfo: data.bankInfo,
      logo: data.logo,
    },
    create: {
      id: "default",
      name: data.name,
      tagline: data.tagline,
      address: data.address,
      contact: data.contact,
      bankInfo: data.bankInfo,
      logo: data.logo,
    },
  })

  return studio
}
