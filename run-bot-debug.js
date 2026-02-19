require('dotenv').config({ path: '.env.local' });
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Simple /start command
bot.command('start', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  console.log(`\n[START] Chat ID: ${chatId}`);
  
  try {
    // Check if already linked
    const existing = await prisma.telegramSession.findUnique({
      where: { chatId },
      include: { user: true }
    });
    
    if (existing && existing.user) {
      console.log('[START] User already linked:', existing.user.email);
      await ctx.reply(
        `✅ Your account is already linked!\n\n` +
        `Email: ${existing.user.email}\n` +
        `Role: ${existing.user.role}\n\n` +
        `You can use all available commands. Try /help`
      );
      return;
    }
    
    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log('[START] Generating new code:', code);
    
    // Save to database
    await prisma.telegramSession.upsert({
      where: { chatId },
      create: {
        chatId,
        verificationCode: code,
        verificationExpiry: expiry,
      },
      update: {
        verificationCode: code,
        verificationExpiry: expiry,
        awaitingData: null,
        context: null,
        userId: null, // Clear any existing link
      },
    });
    
    console.log('[START] Code saved to database');
    
    await ctx.reply(
      `Welcome to Leaderboards! 🏗️\n\n` +
      `To link your account:\n` +
      `1. Go to http://localhost:3000/dashboard/settings/telegram\n` +
      `2. Enter this code: *${code}*\n\n` +
      `This code expires in 10 minutes.`,
      { parse_mode: 'Markdown' }
    );
    
    console.log('[START] Reply sent');
    
  } catch (error) {
    console.error('[START] Error:', error);
    await ctx.reply('Error generating code. Please try again.');
  }
});

bot.command('test', async (ctx) => {
  await ctx.reply('Bot is working! ' + new Date().toLocaleTimeString());
});

bot.command('check', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const session = await prisma.telegramSession.findUnique({
    where: { chatId },
    include: { user: true }
  });
  
  if (!session) {
    await ctx.reply('No session found. Use /start first.');
  } else if (session.user) {
    await ctx.reply(`Linked to: ${session.user.email}`);
  } else {
    await ctx.reply(`Current code: ${session.verificationCode || 'none'}`);
  }
});

// Start bot
bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log('✅ Debug bot is running!');
  console.log('Commands: /start, /test, /check');
});

process.once('SIGINT', () => bot.stop('SIGINT'));