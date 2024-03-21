import { db } from '~/utils/db.server'
import bcrypt from 'bcryptjs'

function createPassword(password: string) {
  return {
    hash: bcrypt.hashSync(password, 10),
  }
}

async function seed() {
  console.time('Database has been seeded')

  console.time('Demo user created')
  await db.user.create({
    data: {
      email: 'demo@user.com',
      password: { create: createPassword('demopassword') },
      entries: {
        create: [
          {
            id: 'd27a197e',
            date: new Date(),
            type: 'learning',
            text: 'Learning Remix for great good!',
          },
        ],
      },
    },
  })
  console.timeEnd('Demo user created')

  console.timeEnd('Database has been seeded')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
