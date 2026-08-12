const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Connected! PostgreSQL version:', result[0].version);
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
