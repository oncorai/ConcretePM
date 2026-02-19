# Twilio Webhook Configuration Guide

## Overview
This guide explains how to configure Twilio webhooks for the Leaderboards dispatch and worker management system.

## Webhook Endpoints

### 1. Primary SMS Webhook
**Endpoint:** `/api/sms/webhook`
**Purpose:** Handles all worker SMS interactions including clock in/out, time tracking, and dispatch confirmations.

**Features:**
- **Clock In/Out:** Workers text "IN" or "OUT" to track time
- **Hours Tracking:** Text "HOURS" to see daily/weekly totals
- **Assignment Status:** Text "STATUS" to see today's assignment
- **Confirmations:** Text "YES/NO" or "1/2" to confirm/decline assignments
- **Help:** Text "HELP" or "INFO" for available commands

### 2. WhatsApp Webhook (Optional)
**Endpoint:** `/api/whatsapp/webhook`
**Purpose:** Handles WhatsApp Business API messages for workers who prefer WhatsApp.

### 3. Dispatch Webhook
**Endpoint:** `/api/dispatch/webhook`
**Purpose:** Handles dispatch-specific notifications and responses.

### 4. Status Callback
**Endpoint:** `/api/sms/status`
**Purpose:** Tracks message delivery status for reporting.

## Production Setup

### Step 1: Access Twilio Console
1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Phone Numbers > Manage > Active Numbers
3. Click on your phone number (+18329806601)

### Step 2: Configure Webhooks
In the Messaging section, set:

**When a message comes in:**
- Webhook: `https://your-domain.com/api/sms/webhook`
- Method: HTTP POST

**Status callback URL (optional):**
- URL: `https://your-domain.com/api/sms/status`
- Method: HTTP POST

### Step 3: Save Configuration
Click "Save Configuration" at the bottom of the page.

## Local Development Setup

### Option 1: Using ngrok (Recommended)
```bash
# Install ngrok
brew install ngrok

# Start your Next.js app
npm run dev

# In another terminal, start ngrok
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL in Twilio Console with your endpoints
```

### Option 2: Using localtunnel
```bash
# Install localtunnel
npm install -g localtunnel

# Start your Next.js app
npm run dev

# In another terminal, start localtunnel
lt --port 3001 --subdomain yourproject

# Use https://yourproject.loca.lt in Twilio Console
```

### Option 3: Using the setup script
```bash
# Make the script executable
chmod +x setup-twilio-webhooks.sh

# Run the setup script
./setup-twilio-webhooks.sh
```

## Environment Variables

Ensure these are set in your `.env` file:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+18329806601
```

## Testing Webhooks

### Test Clock In/Out
```
Send to your Twilio number:
"IN" - Clock in
"OUT" - Clock out
"HOURS" - Check hours
```

### Test Dispatch Confirmation
```
"YES" or "1" - Confirm assignment
"NO" or "2" - Decline assignment
"STATUS" - Check today's assignment
```

### Test Help System
```
"HELP" - Get list of commands
"INFO" - Get list of commands
```

## Webhook Security (Optional but Recommended)

### Verify Twilio Signatures
Add signature verification to your webhooks:

```typescript
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  // Get the signature from headers
  const signature = req.headers.get('X-Twilio-Signature');

  // Verify the request came from Twilio
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const url = `${process.env.NEXTAUTH_URL}/api/sms/webhook`;

  const isValid = twilio.validateRequest(
    authToken,
    signature,
    url,
    await req.formData()
  );

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process the webhook...
}
```

## Common Issues & Solutions

### Issue: Webhooks not receiving messages
**Solution:** Ensure your ngrok/tunnel is running and the URL is correctly configured in Twilio.

### Issue: "Your phone number is not registered"
**Solution:** Add the worker to the database with their phone number (without +1 prefix).

### Issue: Clock in/out not working
**Solution:** Check that the Worker model has the correct phone number format and timeEntries relation.

### Issue: Assignments not showing
**Solution:** Verify WorkerAssignment records exist for the current date with proper dispatchGroup relations.

## Monitoring

### View Webhook Logs
1. In Twilio Console, go to Monitor > Logs > Errors
2. Check for any webhook failures or errors
3. Review message logs in Monitor > Logs > Messaging

### Local Development Monitoring
- Check ngrok dashboard: http://localhost:4040
- View server logs in your terminal
- Check database for Message and TimeEntry records

## Database Models Used

The webhooks interact with these Prisma models:
- `Worker` - Worker profiles with phone numbers
- `TimeEntry` - Clock in/out records
- `WorkerAssignment` - Daily dispatch assignments
- `DispatchGroup` - Project/site information
- `Message` - SMS message history
- `Team` - Worker team assignments

## Support

For issues or questions:
1. Check the server logs for error messages
2. Verify webhook URLs are accessible (test with curl)
3. Ensure database has proper worker records
4. Check Twilio Console for delivery failures