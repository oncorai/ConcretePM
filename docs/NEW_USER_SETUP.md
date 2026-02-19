# New User Setup Guide for WhatsApp Integration

## For Site Managers (Admins)

### Initial Setup (One-time)
1. **Create your account** on the website
2. **Create a project** with your construction site details
3. **Link your WhatsApp** during account setup or in Settings

### Daily Use
- Send daily reports via WhatsApp
- View reports on the web dashboard
- Manage multiple projects

## For Workers

### Setup Process
1. **Admin creates your account** with your phone number
2. **You receive a WhatsApp message** with login details
3. **Start sending reports** - no website login needed!

## Technical Setup for Deployment

### 1. Environment Setup
```env
# Production .env
DATABASE_URL=your_production_db
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_secure_secret

# Twilio (Production)
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1yourwhatsappnumber
```

### 2. Twilio Production Setup
1. **Get WhatsApp Business API approval** (takes 1-2 weeks)
2. **Get a dedicated WhatsApp number** from Twilio
3. **Configure production webhook**: `https://yourdomain.com/api/whatsapp/webhook`

### 3. Database Setup
```bash
# Run migrations on production
npx prisma migrate deploy
```

## Simplified User Onboarding Flow

### Option 1: Self-Service (Site Managers)
1. Sign up on website
2. Create project
3. In Settings, click "Connect WhatsApp"
4. Enter phone number
5. Receive WhatsApp verification message
6. Start using!

### Option 2: Admin-Managed (Workers)
1. Admin bulk imports workers via CSV
2. System sends WhatsApp welcome messages
3. Workers immediately start reporting

### Option 3: WhatsApp-First Signup
1. User texts "start" to company WhatsApp
2. Bot asks for verification code from admin
3. Admin provides code
4. User is linked and ready

## What We Need to Build

1. **Settings page** with WhatsApp connection
2. **Bulk user import** with phone numbers
3. **Welcome message system**
4. **Admin dashboard** to manage WhatsApp users
5. **Verification flow** for WhatsApp-first signups