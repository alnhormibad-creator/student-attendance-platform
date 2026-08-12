const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@attendance.app' },
    update: {},
    create: {
      email: 'admin@attendance.app',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@attendance.app' },
    update: {},
    create: {
      email: 'student@attendance.app',
      username: 'student',
      password: studentPassword,
      role: 'STUDENT',
      isVerified: true,
    },
  });

  console.log('✓ Created admin:', admin.username);
  console.log('✓ Created student:', student.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
