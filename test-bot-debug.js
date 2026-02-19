require('dotenv').config({ path: '.env.local' });
const { Telegraf } = require('telegraf');

console.log('Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Found' : 'Not found');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Log everything
bot.use((ctx, next) => {
  console.log('Update received:', new Date().toISOString());
  console.log('Update type:', ctx.updateType);
  console.log('From:', ctx.from);
  if (ctx.message) {
    console.log('Message:', ctx.message);
  }
  return next();
});

bot.command('start', async (ctx) => {
  console.log('START COMMAND RECEIVED');
  try {
    await ctx.reply('Bot is working!');
    console.log('Reply sent successfully');
  } catch (err) {
    console.error('Failed to send reply:', err);
  }
});

bot.on('text', (ctx) => {
  console.log('Text received:', ctx.message.text);
  return ctx.reply(`You said: ${ctx.message.text}`);
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start bot
bot.telegram.deleteWebhook()
  .then(() => {
    console.log('Webhook deleted');
    return bot.launch();
  })
  .then(() => {
    console.log('Bot launched successfully');
  })
  .catch(err => {
    console.error('Failed to start bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));