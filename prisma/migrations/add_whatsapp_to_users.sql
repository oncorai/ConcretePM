-- Add WhatsApp phone number to users table
ALTER TABLE "User" ADD COLUMN "whatsappNumber" TEXT UNIQUE;