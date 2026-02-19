# EXACT Twilio Webhook URLs to Configure

## Current Active Webhook URL:
```
https://b639af307c21.ngrok-free.app/api/sms/webhook
```

## Steps to Update in Twilio Console:

1. Go to: https://console.twilio.com/console/phone-numbers/incoming
2. Click on your phone number: **(623) 294-9652**
3. Scroll to the **"Messaging Configuration"** section
4. Update these EXACT settings:

### A MESSAGE COMES IN
- **Webhook:** `https://b639af307c21.ngrok-free.app/api/sms/webhook`
- **HTTP Method:** `HTTP POST` (make sure it's POST, not GET)

### PRIMARY HANDLER FAILS
- Leave blank

### STATUS CALLBACK URL (Optional)
- **URL:** `https://b639af307c21.ngrok-free.app/api/sms/status`
- **HTTP Method:** `HTTP POST`

5. Click **"Save Configuration"** button at the bottom

## Testing After Configuration:

Once saved, test by texting to (623) 294-9652:
- `HELP` - Should return command list
- `HOURS` - Should return your hours
- `STATUS` - Should return assignment status

## Troubleshooting:

If still not working:
1. Make sure the webhook URL is EXACTLY as shown above (no trailing slash)
2. Ensure HTTP method is POST (not GET)
3. Check that you clicked "Save Configuration"
4. Try texting again after 30 seconds

## Important Notes:
- This ngrok URL is temporary and will change when ngrok restarts
- The "Reply STOP to unsubscribe" message is normal and added by Twilio
- Your Worker record is created with phone: 6232949652 (without country code)