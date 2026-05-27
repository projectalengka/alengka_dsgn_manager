import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const categories = [
  { id: "Logo", name: "Desain Logo Identitas", iconName: "Sparkles", defaultPrice: 1500000 },
  { id: "Jersey", name: "Koleksi Jersey Olahraga", iconName: "Shirt", defaultPrice: 1200000 },
  { id: "Clothing", name: "Desain T-Shirt & Apparel", iconName: "Shirt", defaultPrice: 900000 },
  { id: "Poster", name: "Poster & Media Cetak", iconName: "PenTool", defaultPrice: 750000 },
  { id: "UI Design", name: "Desain Antarmuka Web/App", iconName: "Laptop", defaultPrice: 5000000 },
  { id: "Branding", name: "Pedoman Panduan Brand", iconName: "Compass", defaultPrice: 3500000 },
  { id: "Illustration", name: "Ilustrasi Digital", iconName: "ImageIcon", defaultPrice: 2000000 },
  { id: "Motion Design", name: "Motion Graphic Grafis", iconName: "Video", defaultPrice: 4000000 },
]

const clientNames = [
  "Budi Santoso", "Andi Irawan", "Siti Aminah", "Dewi Lestari", "Reza Rahadian",
  "Toko Kopi ABC", "PT Maju Mundur", "CV Karya Cipta", "Agus Setiawan", "Rini Yulianti",
  "Dimas Anggara", "Warung Nasi Uduk 99", "Kafe Senja", "Dina Fitriani", "Eko Prasetyo",
  "Fina Amanda", "Galih Purnama", "Hadi Sucipto", "Indra Wijaya", "Joko Susilo"
]

const projectTitles = [
  "Redesign Logo Perusahaan", "Desain Baju Futsal Tim", "UI/UX Aplikasi Mobile", 
  "Branding Kafe Baru", "Poster Event Konser", "Animasi Logo Opening", 
  "Ilustrasi Cover Buku", "Desain Kemasan Kopi", "Desain Seragam Kantor",
  "Aset Grafis Sosial Media", "Desain Maskot Tim", "Katalog Produk Tahunan",
  "Desain Baju Esport", "Company Profile Book", "Motion Graphic Iklan IG",
  "Desain Web Landing Page", "Logo Toko Kue", "Poster Lomba 17an",
  "Desain Menu Restoran", "Branding Minuman Kekinian"
]

async function main() {
  console.log("Seeding database...")

  // Hapus data lama agar bersih
  await prisma.project.deleteMany()
  await prisma.client.deleteMany()
  await prisma.category.deleteMany()

  // 1. Create categories
  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }

  // 2. Create 20 Clients
  const createdClients = []
  for (let i = 0; i < 20; i++) {
    const client = await prisma.client.create({
      data: {
        name: clientNames[i],
        email: `client${i+1}@example.com`,
        phone: `0812345678${i.toString().padStart(2, '0')}`,
        company: i % 3 === 0 ? `PT Usaha ${i+1}` : "",
        address: `Jl. Sudirman No. ${i+1}, Jakarta`
      }
    })
    createdClients.push(client)
  }

  // 3. Create 20 Projects
  const statuses = ["On Progress", "Revisi", "Done", "Cancel"]
  for (let i = 0; i < 20; i++) {
    const client = createdClients[i]
    const category = categories[i % categories.length]
    
    // Tanggal acak dalam 30 hari ke depan
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + (i % 30) + 1)

    await prisma.project.create({
      data: {
        clientName: client.name,
        clientId: client.id,
        projectTitle: projectTitles[i],
        categoryId: category.id,
        price: category.defaultPrice + (i * 100000),
        status: statuses[i % statuses.length],
        deadline: deadline,
        notes: `Catatan untuk proyek ${projectTitles[i]}. Harap diperhatikan detail revisi dan pengirimannya.`
      }
    })
  }

  console.log(`Seeded ${categories.length} categories, 20 clients, and 20 projects.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
