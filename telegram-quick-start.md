# Quick Start: Connect Telegram Bot

## Step 1: Create Your Bot (5 minutes)

1. **Open Telegram** on your phone or desktop
2. **Search for** `@BotFather` (official bot creator)
3. **Start a chat** and send `/newbot`
4. **Follow prompts**:
   - Name your bot: `Construction Manager` (or any name)
   - Choose username: `your_construction_bot` (must end in 'bot')
5. **Save the token** you receive (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Step 2: Add Bot Token to Your App

1. Open your `.env.local` file
2. Add these lines:
```bash
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL later
```

## Step 3: Start the Bot Locally

Since you're developing locally, you have two options:

### Option A: Use Polling (Easiest for Development)

Create this file to run the bot locally:

`src/scripts/run-telegram-bot.ts`:
```typescript
import bot from '../lib/telegram-bot';

console.log('Starting Telegram bot...');

// Use polling for local development
bot.launch({
  webhook: undefined  // This enables polling mode
});

console.log('Bot is running! Send /start to your bot on Telegram');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

Then run:
```bash
npx tsx src/scripts/run-telegram-bot.ts
```

### Option B: Use Ngrok for Webhooks (Production-like)

1. Install ngrok: `brew install ngrok` (Mac) or download from ngrok.com
2. Run your Next.js app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (like `https://abc123.ngrok.io`)
5. Update `.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```
6. Set webhook by visiting:
   ```
   https://abc123.ngrok.io/api/telegram/webhook?action=setWebhook
   ```

## Step 4: Test Your Bot

1. **Find your bot** on Telegram (search for the username you chose)
2. **Start a chat** with your bot
3. **Send** `/start` - you should see the welcome message
4. **Try creating a project**:
   ```
   /newproject
   
   Project Name: Test Project
   Client: ABC Company
   Location: 123 Main St
   Start Date: 2024-01-20
   End Date: 2024-12-31
   Budget Hours: 1000
   ```

## Step 5: Production Deployment

When you deploy to production:

1. Update `.env` with your production URL:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

2. Set the webhook by visiting:
   ```
   https://your-app.vercel.app/api/telegram/webhook?action=setWebhook
   ```

## Troubleshooting

### Bot not responding?
- Check your bot token is correct
- Make sure the bot script is running (for polling)
- Check terminal for error messages

### "User not found" errors?
- The bot currently uses 'telegram-user' as default userId
- You'll need to implement proper user authentication

### Want to test without creating projects?
Try the `/status` command first - it just checks existing data

## Next Steps

1. **Link Telegram users to your app users**:
   - Add a "Connect Telegram" button in user settings
   - Store Telegram chat IDs with user accounts

2. **Add more features**:
   - Photo uploads for progress documentation
   - Voice message transcription
   - Location-based check-ins

3. **Set up notifications**:
   - Daily report reminders
   - Budget alerts
   - Weather warnings