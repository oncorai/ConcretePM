# ⚠️ URGENT: Bot Token Security

Your Telegram bot token has been exposed. Please follow these steps immediately:

## 1. Revoke the Current Token (DO THIS NOW)

1. Open Telegram
2. Go to @BotFather
3. Send `/mybots`
4. Select "Secretary Skinner"
5. Choose "API Token"
6. Click "Revoke current token"
7. Click "Yes, revoke the token"

## 2. Get a New Token

1. After revoking, BotFather will show a new token
2. Copy the new token
3. Update your `.env.local` file with the new token

## 3. Security Best Practices

- **NEVER** share your bot token publicly
- **NEVER** commit tokens to Git
- Add `.env.local` to `.gitignore` (already done)
- Use environment variables for all secrets
- Rotate tokens regularly

## 4. Check for Unauthorized Use

Check if anyone used your bot while the token was exposed:
- Look for unexpected messages in your bot
- Check for unknown users
- Review any data that might have been accessed

Remember: Anyone with your bot token can:
- Send messages as your bot
- Read all messages sent to your bot
- Access your bot's data
- Delete your bot's messages

**Please revoke the token immediately before continuing!**