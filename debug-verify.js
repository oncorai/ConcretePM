const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugVerification() {
  console.log('=== DEBUGGING VERIFICATION ===\n');
  
  // 1. Check Telegram session
  const session = await prisma.telegramSession.findFirst({
    where: { chatId: '6995463189' },
    orderBy: { updatedAt: 'desc' }
  });
  
  console.log('1. Latest Telegram Session:');
  console.log('   Code:', session?.verificationCode);
  console.log('   Expiry:', session?.verificationExpiry);
  console.log('   Expired?', session?.verificationExpiry < new Date() ? 'YES ❌' : 'NO ✅');
  console.log('   User ID:', session?.userId || 'Not linked');
  
  // 2. Check all users
  const users = await prisma.user.findMany();
  console.log('\n2. Users in database:');
  users.forEach(user => {
    console.log(`   - ${user.email} (ID: ${user.id}, Telegram: ${user.telegramChatId || 'not linked'})`);
  });
  
  // 3. Test the verification query
  if (session?.verificationCode) {
    console.log('\n3. Testing verification query:');
    const testQuery = await prisma.telegramSession.findFirst({
      where: {
        verificationCode: session.verificationCode,
        verificationExpiry: {
          gt: new Date()
        }
      }
    });
    
    console.log('   Query result:', testQuery ? 'FOUND ✅' : 'NOT FOUND ❌');
  }
  
  // 4. Try manual verification
  if (session && users.length > 0) {
    console.log('\n4. Simulating manual verification:');
    try {
      await prisma.user.update({
        where: { id: users[0].id },
        data: { telegramChatId: '6995463189' }
      });
      
      await prisma.telegramSession.update({
        where: { id: session.id },
        data: {
          userId: users[0].id,
          verificationCode: null,
          verificationExpiry: null
        }
      });
      
      console.log('   Manual link: SUCCESS ✅');
      console.log('   Your account is now linked!');
      console.log('   Try sending /help to the bot');
      
    } catch (error) {
      console.log('   Manual link: FAILED ❌', error.message);
    }
  }
  
  await prisma.$disconnect();
}

debugVerification().catch(console.error);