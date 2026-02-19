require('dotenv').config({ path: '.env.local' });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const YOUR_CHAT_ID = '6995463189';

console.log('Starting simple bot...');

// Function to get updates
async function getUpdates(offset = 0) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`
    );
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return offset;
    }
    
    for (const update of data.result) {
      console.log('Got update:', update.message?.text);
      
      // Update offset
      offset = update.update_id + 1;
      
      // Handle /start command
      if (update.message?.text === '/start') {
        const code = Math.floor(100000 + Math.random() * 900000);
        console.log('Generated code:', code);
        
        // Send reply
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: update.message.chat.id,
            text: `Welcome! Your code is: ${code}`,
          }),
        });
        
        // Save to database
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
          await prisma.telegramSession.upsert({
            where: { chatId: YOUR_CHAT_ID },
            create: {
              chatId: YOUR_CHAT_ID,
              verificationCode: code.toString(),
              verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
            },
            update: {
              verificationCode: code.toString(),
              verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
              userId: null,
            },
          });
          
          console.log('Code saved to database');
          await prisma.$disconnect();
        } catch (err) {
          console.error('DB error:', err.message);
        }
      }
    }
    
    return offset;
  } catch (error) {
    console.error('Error:', error.message);
    return offset;
  }
}

// Main loop
async function main() {
  let offset = 0;
  
  // Clear old updates
  const clearResponse = await fetch(
    `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1`
  );
  const clearData = await clearResponse.json();
  if (clearData.result.length > 0) {
    offset = clearData.result[0].update_id + 1;
  }
  
  console.log('Bot ready! Send /start to get a code.');
  
  // Poll for updates
  while (true) {
    offset = await getUpdates(offset);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main().catch(console.error);