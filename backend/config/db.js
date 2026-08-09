const prisma = require('./prisma');

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Database Connected: Supabase Postgres');
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    console.error('Check that DATABASE_URL is correct in .env (or Render env vars).');
    process.exit(1);
  }
};

module.exports = connectDB;