# WhatsApp Setup - Manual Steps

## Step 1: Install ngrok
Download ngrok from: https://ngrok.com/download
1. Click "Download for Mac"
2. Unzip the file
3. Move ngrok to your Applications folder or somewhere in your PATH

## Step 2: Start ngrok
Open a new terminal and run:
```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.0.0
Region                        United States (us)
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

## Step 3: Configure Twilio
1. Go to: https://console.twilio.com
2. Navigate to: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. You'll see instructions like "To get started, send 'join word-word' to +1 415 523 8886"
4. Open WhatsApp on your phone and send that join message
5. Click on **Sandbox settings** (or "Configure sandbox")
6. In the **"When a message comes in"** field, enter:
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/api/whatsapp/webhook
   ```
   (Replace YOUR-NGROK-URL with your actual ngrok URL from step 2)
7. Set **Method** to: POST
8. Click **Save**

## Step 4: Link Your WhatsApp Number
Run this command, replacing with your actual email and phone number:
```bash
cd /Users/jacobskinner/Documents/Leaderboards/leaderboards
npx tsx src/scripts/link-whatsapp.ts your@email.com +1234567890
```

Example:
```bash
npx tsx src/scripts/link-whatsapp.ts john@construction.com +14155551234
```

**Important**: Include the country code (+1 for US)

## Step 5: Test It!
1. Make sure your Next.js app is running (`npm run dev`)
2. Send "hi" to the Twilio WhatsApp number: **+1 415 523 8886**
3. You should receive a welcome message!

## Test Commands
Try these messages:
- `hi` - Get welcome message
- `3 workers 8 hours` - Quick crew entry
- `report` - Start guided report
- `help` - See all commands

## Troubleshooting
- **No response?** Check that ngrok is still running
- **"Number not linked"?** Make sure you ran the link-whatsapp.ts script
- **Webhook errors?** Check the ngrok terminal for incoming requests
- **Still stuck?** Check Twilio Console for error logs