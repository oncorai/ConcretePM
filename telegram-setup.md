# Telegram Bot Setup Guide

## 1. Create a Telegram Bot

1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "Construction Project Manager")
4. Choose a username (must end in 'bot', e.g., "construction_project_bot")
5. You'll receive a bot token - save this!

## 2. Configure Environment Variables

Add to your `.env.local` file:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 3. Install Dependencies

```bash
npm install telegraf csv-parse
```

## 4. Set Up Webhook

For production, visit:
```
https://your-domain.com/api/telegram/webhook?action=setWebhook
```

For local development, use ngrok:
```bash
ngrok http 3000
# Then use the ngrok URL for NEXT_PUBLIC_APP_URL
```

## 5. Bot Commands

### Create a New Project
```
/newproject

Then send:
Project Name: Downtown Office Complex
Client: ABC Corp
Location: 123 Main St, City
Start Date: 2024-01-15
End Date: 2024-12-31
Budget Hours: 10000
```

### Upload Phases CSV
```
/uploadphases

Then either:
1. Send a CSV file, or
2. Paste CSV text:

Phase,Sub-Phase,Cost Code,Budget Quantity,Budget Unit,Budget Hours,Labor Rate
Earthwork,Site Clearing,02110,5000,SF,100,45
Earthwork,Excavation,02220,3000,CY,200,50
```

### Submit Daily Report
```
/dailyreport

Then send:
Date: 2024-01-20
Weather: Sunny
Temperature: 75/55
Workers: 12
Hours: 96
Progress: Earthwork:Site Clearing:500:10, Earthwork:Excavation:200:15
Notes: Good progress on site clearing
```

### Check Status
```
/status
```

## 6. Additional Features to Add

### Equipment Tracking
Add to daily report format:
```
Equipment: Forklift:8, Excavator:6, Dump Truck:4
```

### Photo Uploads
Handle photo messages for progress documentation

### Voice Notes
Convert voice messages to text for notes

### Location Sharing
Track job site check-ins

### Notifications
- Daily report reminders
- Weather alerts
- Budget threshold warnings

## 7. Security Considerations

1. Implement user authentication:
   - Link Telegram users to system users
   - Verify permissions per project

2. Add validation:
   - Date ranges
   - Numeric values
   - Required fields

3. Rate limiting:
   - Prevent spam
   - Limit API calls

## 8. Advanced Features

### Inline Keyboards
Add buttons for common actions:
```typescript
bot.command('menu', (ctx) => {
  ctx.reply('Choose an action:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Status', callback_data: 'status' }],
        [{ text: '📝 Daily Report', callback_data: 'daily_report' }],
        [{ text: '📈 Progress Chart', callback_data: 'progress_chart' }],
      ]
    }
  });
});
```

### Progress Charts
Generate and send progress visualizations:
```typescript
import { createCanvas } from 'canvas';

async function generateProgressChart(project: any) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  
  // Draw chart...
  
  return canvas.toBuffer();
}
```

### Scheduled Reports
Daily/weekly summaries:
```typescript
import { CronJob } from 'cron';

new CronJob('0 17 * * 1-5', async () => {
  // Send weekly summary every Friday at 5 PM
  const users = await getActiveUsers();
  for (const user of users) {
    await sendWeeklySummary(user.telegramId);
  }
});
```