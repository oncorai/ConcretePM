require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = `https://api.telegram.org/bot${token}`;

// Your chat ID from earlier
const YOUR_CHAT_ID = '6995463189';

async function sendTestMessage() {
  console.log('Sending test message to verify connection...');
  
  try {
    const response = await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: YOUR_CHAT_ID,
        text: '🤖 Bot is back online!\n\nSend /start to get a verification code.',
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Connection verified!');
      startPolling();
    } else {
      console.error('Failed to send message:', result);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

async function startPolling() {
  let offset = 0;
  
  console.log('Starting to poll for messages...');
  
  while (true) {
    try {
      const response = await fetch(`${baseUrl}/getUpdates?timeout=30&offset=${offset}`);
      const data = await response.json();
      
      if (data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          
          if (update.message && update.message.text) {
            console.log(`Got message: ${update.message.text}`);
            
            if (update.message.text === '/start') {
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              
              await fetch(`${baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: update.message.chat.id,
                  text: `Welcome to Leaderboards! 🏗️\n\nYour verification code: ${code}\n\nThis code expires in 10 minutes.`
                })
              });
              
              console.log(`Sent code ${code} to user ${update.message.from.id}`);
              
              // Save to database
              try {
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                
                await prisma.telegramSession.upsert({
                  where: { chatId: update.message.chat.id.toString() },
                  create: {
                    chatId: update.message.chat.id.toString(),
                    verificationCode: code,
                    verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
                  },
                  update: {
                    verificationCode: code,
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
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Start the bot
sendTestMessage();