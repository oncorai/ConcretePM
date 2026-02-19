#!/bin/bash

# Test SMS Webhook Script
# Tests the webhook with your phone number (623) 294-9652

echo "📱 Testing SMS Webhook for (623) 294-9652"
echo "========================================="
echo ""

# Test URL (using your ngrok URL)
WEBHOOK_URL="https://f32a34f5a0b9.ngrok-free.app/api/sms/webhook"

echo "Testing worker commands..."
echo ""

# Test 1: Clock In
echo "1. Testing CLOCK IN command:"
curl -X POST $WEBHOOK_URL \
  -d "From=+16232949652" \
  -d "Body=IN" \
  --silent | grep -o '<Message>.*</Message>' | sed 's/<[^>]*>//g'

echo ""
echo "---"

# Test 2: Check Hours
echo "2. Testing HOURS command:"
curl -X POST $WEBHOOK_URL \
  -d "From=+16232949652" \
  -d "Body=HOURS" \
  --silent | grep -o '<Message>.*</Message>' | sed 's/<[^>]*>//g'

echo ""
echo "---"

# Test 3: Status Check
echo "3. Testing STATUS command:"
curl -X POST $WEBHOOK_URL \
  -d "From=+16232949652" \
  -d "Body=STATUS" \
  --silent | grep -o '<Message>.*</Message>' | sed 's/<[^>]*>//g'

echo ""
echo "---"

# Test 4: Help
echo "4. Testing HELP command:"
curl -X POST $WEBHOOK_URL \
  -d "From=+16232949652" \
  -d "Body=HELP" \
  --silent | grep -o '<Message>.*</Message>' | sed 's/<[^>]*>//g'

echo ""
echo "========================================="
echo "✅ Test complete!"
echo ""
echo "To test with real SMS:"
echo "1. Make sure you have a Worker record with phone: 6232949652"
echo "2. Text any of these commands to your Twilio number"
echo "3. Check the responses"