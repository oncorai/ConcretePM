#!/bin/bash

# Twilio Webhook Setup Script
# This script helps configure Twilio webhooks for local development

echo "🔧 Twilio Webhook Setup"
echo "========================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo "Install it with: brew install ngrok"
    echo "Or download from: https://ngrok.com/download"
    exit 1
fi

# Start ngrok
echo "📡 Starting ngrok tunnel to localhost:3001..."
ngrok http 3001 &

# Give ngrok time to start
sleep 3

# Get ngrok URL (this is a simplified version, you may need to check the ngrok dashboard)
echo ""
echo "✅ Ngrok is running!"
echo ""
echo "📌 Configure these webhooks in your Twilio Console:"
echo "   https://console.twilio.com/console/phone-numbers"
echo ""
echo "1. SMS Webhook (Main):"
echo "   URL: https://YOUR-NGROK-URL.ngrok.io/api/sms/webhook"
echo "   Method: POST"
echo "   Configure for: 'A message comes in'"
echo ""
echo "2. WhatsApp Webhook (if using WhatsApp):"
echo "   URL: https://YOUR-NGROK-URL.ngrok.io/api/whatsapp/webhook"
echo "   Method: POST"
echo ""
echo "3. Status Callback URL (optional):"
echo "   URL: https://YOUR-NGROK-URL.ngrok.io/api/sms/status"
echo ""
echo "📝 Note: Replace YOUR-NGROK-URL with the actual URL shown in the ngrok terminal"
echo ""
echo "🔗 Ngrok Dashboard: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop the tunnel"

# Keep the script running
wait