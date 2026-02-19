require('dotenv').config({ path: '.env.local' });
const { Telegraf } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('No token!');
  process.exit(1);
}

console.log('Token exists:', token.substring(0, 10) + '...');

const bot = new Telegraf(token);

// Log EVERYTHING
bot.use((ctx, next) => {
  console.log('\n=== UPDATE RECEIVED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Type:', ctx.updateType);
  console.log('From:', ctx.from);
  console.log('Chat:', ctx.chat);
  if (ctx.message) {
    console.log('Message:', JSON.stringify(ctx.message, null, 2));
  }
  console.log('===================\n');
  return next();
});

bot.start((ctx) => {
  console.log('START COMMAND HANDLER CALLED');
  return ctx.reply('Hello! Bot received your /start command.');
});

bot.help((ctx) => {
  console.log('HELP COMMAND HANDLER CALLED');
  return ctx.reply('This is the help message.');
});

bot.on('text', (ctx) => {
  console.log('TEXT HANDLER CALLED');
  return ctx.reply(`You said: ${ctx.message.text}`);
});

// Start bot
console.log('Starting bot...');
bot.launch({
  dropPendingUpdates: true
}).then(() => {
  console.log('✅ Bot launched successfully!');
}).catch(err => {
  console.error('❌ Failed to launch:', err);
});

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('Stopping bot...');
  bot.stop('SIGINT');
});

console.log('Waiting for messages...');