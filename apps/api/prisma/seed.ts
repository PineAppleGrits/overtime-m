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

  // Seed Roles
  console.log('Seeding roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      isSystem: true,
    },
  });

  const playerRole = await prisma.role.upsert({
    where: { name: 'player' },
    update: {},
    create: {
      name: 'player',
      description: 'Player role - Auto-assigned on public registration',
      isSystem: true,
    },
  });

  const refereeRole = await prisma.role.upsert({
    where: { name: 'referee' },
    update: {},
    create: {
      name: 'referee',
      description: 'Referee/Árbitro - Assigned by admin invitation',
      isSystem: true,
    },
  });

  const tableOfficialRole = await prisma.role.upsert({
    where: { name: 'table_official' },
    update: {},
    create: {
      name: 'table_official',
      description: 'Table Official/Oficial de Mesa - Assigned by admin invitation',
      isSystem: true,
    },
  });

  const photographerRole = await prisma.role.upsert({
    where: { name: 'photographer' },
    update: {},
    create: {
      name: 'photographer',
      description: 'Photographer/Fotógrafo - Assigned by admin invitation',
      isSystem: true,
    },
  });

  console.log('Roles seeded:', {
    adminRole,
    playerRole,
    refereeRole,
    tableOfficialRole,
    photographerRole,
  });

  // Seed Permissions
  console.log('Seeding permissions...');
  const modules = ['users', 'teams', 'players', 'tournaments', 'matches', 'venues', 'staff', 'registrations', 'payments'];
  const actions = ['create', 'read', 'update', 'delete'];
  const scopes = ['own', 'assigned', 'all'];

  for (const module of modules) {
    for (const action of actions) {
      for (const scope of scopes) {
        await prisma.permission.upsert({
          where: {
            module_action_scope: {
              module,
              action,
              scope,
            },
          },
          update: {},
          create: {
            module,
            action,
            scope,
          },
        });
      }
    }
  }

  console.log('Permissions seeded');

  // Assign all permissions to admin role
  console.log('Assigning permissions to admin role...');
  const allPermissions = await prisma.permission.findMany();
  
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign read permissions to player role
  console.log('Assigning permissions to player role...');
  const playerPermissions = await prisma.permission.findMany({
    where: {
      action: 'read',
      scope: {
        in: ['own', 'all'],
      },
    },
  });

  for (const permission of playerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: playerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: playerRole.id,
        permissionId: permission.id,
      },
    });
  }

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

