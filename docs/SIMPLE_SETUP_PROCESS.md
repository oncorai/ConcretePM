# Simple Setup Process for New Users

## Current Manual Process (What you just did)

1. **Website Setup**
   - Create account on website
   - Create a project
   
2. **WhatsApp Setup** (Currently manual via scripts)
   - Admin runs: `npx tsx src/scripts/update-user-whatsapp.ts email@example.com +1234567890`
   - User joins Twilio sandbox
   - Ready to use!

## Improved Process (What we should build)

### For Site Managers
1. **Sign up** on website
2. **Create project**
3. **Go to Settings** → WhatsApp
4. **Enter phone number** and click Connect
5. **Follow WhatsApp instructions**
6. Done! Start sending reports

### For Workers (No website access needed)
1. **Admin adds worker** on website with:
   - Name
   - Phone number
   - Role (worker)
   
2. **Worker receives WhatsApp message**:
   ```
   Welcome to [Company Name]! 
   You've been added to the Downtown Office project.
   
   Send "hi" to get started or "help" for commands.
   ```

3. **Worker can immediately** send daily reports

## What Makes This Simple

### For Admins
- One-click WhatsApp setup in Settings
- Bulk import workers from CSV
- Workers don't need passwords or emails

### For Workers  
- Just need their phone number
- No app to download
- No passwords to remember
- Works on any phone with WhatsApp

## Quick Implementation Plan

1. **Add WhatsApp field** to signup form
2. **Create Settings page** with WhatsApp connection
3. **Add "Invite Workers"** feature that:
   - Takes phone numbers
   - Creates accounts
   - Sends WhatsApp invites
4. **Auto-send welcome messages** when workers are added

## Example Worker Invite Flow

```
Admin Dashboard:
[Invite Workers]
  ├─ Enter phone numbers (comma separated)
  ├─ Select project
  └─ Click "Send Invites"

Workers receive:
"Welcome! You've been added to [Project].
Reply with crew hours like: 3 workers 8 hours"
```

This makes it as simple as texting!