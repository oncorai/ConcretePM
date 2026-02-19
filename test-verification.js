const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVerification() {
  try {
    // Check all telegram sessions
    const sessions = await prisma.telegramSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('Recent Telegram sessions:');
    sessions.forEach(session => {
      console.log({
        chatId: session.chatId,
        code: session.verificationCode,
        expiry: session.verificationExpiry,
        userId: session.userId,
        created: session.createdAt
      });
    });
    
    // Check if your chat ID exists
    const yourSession = await prisma.telegramSession.findUnique({
      where: { chatId: '6995463189' }
    });
    
    console.log('\nYour session:', yourSession);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVerification();