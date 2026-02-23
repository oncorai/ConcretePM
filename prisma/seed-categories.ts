import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default buyout categories for concrete work
// Based on standard concrete PM workflow
const defaultCategories = [
  { name: 'Concrete', orderIndex: 1 },
  { name: 'Rebar', orderIndex: 2 },
  { name: 'Lumber', orderIndex: 3 },
  { name: 'Vapor Barrier', orderIndex: 4 },
  { name: 'Bond Breaker', orderIndex: 5 },
  { name: 'Cure/Densifier', orderIndex: 6 },
  { name: 'Chair/Dobies', orderIndex: 7 },
  { name: 'Formsavers', orderIndex: 8 },
  { name: 'Waterstop', orderIndex: 9 },
  { name: 'Expansion Joint', orderIndex: 10 },
  { name: 'Patching', orderIndex: 11 },
  { name: 'Mastic', orderIndex: 12 },
  { name: 'Dowels/Dadds', orderIndex: 13 },
  { name: 'Formwork', orderIndex: 14 },
  { name: 'Confilm', orderIndex: 15 },
  { name: 'CJ Plan/Pour Plan', orderIndex: 16 },
]

async function main() {
  console.log('Seeding buyout categories...')
  
  for (const category of defaultCategories) {
    await prisma.buyoutCategory.upsert({
      where: { name: category.name },
      update: { orderIndex: category.orderIndex },
      create: {
        name: category.name,
        orderIndex: category.orderIndex,
        isDefault: true,
      },
    })
    console.log(`  ✓ ${category.name}`)
  }
  
  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
