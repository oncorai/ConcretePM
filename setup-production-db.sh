#!/bin/bash

echo "========================================="
echo "Production Database Setup for Leaderboards"
echo "========================================="
echo ""
echo "This script will set up your production database."
echo ""
echo "Please enter your Supabase/PostgreSQL connection string"
echo "(It should start with postgresql://...)"
echo ""
read -p "DATABASE_URL: " DB_URL

if [ -z "$DB_URL" ]; then
    echo "Error: No database URL provided"
    exit 1
fi

echo ""
echo "Setting up database schema..."
echo ""

# Push the schema to production database
DATABASE_URL="$DB_URL" npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure this DATABASE_URL is added to your Vercel environment variables"
    echo "2. Redeploy your Vercel project to use the new database"
    echo "3. Configure your Twilio webhook URL"
else
    echo ""
    echo "❌ Database setup failed. Please check your connection string and try again."
    exit 1
fi