import { prisma } from '../src/core/database/prisma'

/**
 * The smoke test writes real rows into whatever database it is pointed at, and
 * the pilot database is the same one. This removes what it left behind and
 * nothing else: accounts at @fasha.test, and the opportunities they created,
 * whose titles carry the run's timestamp.
 *
 * Anything else that looks like a test is only listed, never deleted. That is
 * your data and your call.
 */
async function main() {
  const accounts = await prisma.user.deleteMany({
    where: { email: { endsWith: '@fasha.test' } },
  })

  const opportunities = await prisma.opportunity.deleteMany({
    where: {
      OR: [
        { title: { startsWith: 'Organisation post 1' } },
        { title: { startsWith: 'Volunteer proposal 1' } },
        { title: { startsWith: 'Smoke ' } },
      ],
    },
  })

  console.log(`Deleted ${accounts.count} smoke accounts and their work.`)
  console.log(`Deleted ${opportunities.count} smoke opportunities.`)

  const suspicious = await prisma.opportunity.findMany({
    where: { OR: [{ title: { startsWith: 'Test' } }, { title: { startsWith: 'test' } }] },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  if (suspicious.length === 0) {
    console.log('Nothing else looks like test data.')

    return
  }

  console.log('\nThese look like your own test rows. Delete them yourself if you want them gone:')

  for (const row of suspicious) {
    console.log(`  ${row.createdAt.toISOString().slice(0, 10)}  ${row.title}  (${row.id})`)
  }

  console.log('\n  npx prisma studio   opens the table if you would rather click.')
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
