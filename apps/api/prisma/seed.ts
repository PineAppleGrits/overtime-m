import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed Sports
  console.log('Seeding sports...');
  const basketball = await prisma.sport.upsert({
    where: { code: 'BASKET' },
    update: {},
    create: {
      name: 'Basketball',
      code: 'BASKET',
      description: 'Baloncesto/Básquet',
    },
  });

  const football = await prisma.sport.upsert({
    where: { code: 'FOOTBALL' },
    update: {},
    create: {
      name: 'Football',
      code: 'FOOTBALL',
      description: 'Fútbol',
    },
  });

  console.log('Sports seeded:', { basketball, football });
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

