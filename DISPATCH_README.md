# Dispatch Feature Documentation

## Overview
The Dispatch feature provides a drag-and-drop interface for assigning construction workers to different project sites, replacing the manual Excel screenshot workflow with an efficient, real-time system with SMS notifications.

## Features
- **Visual Dispatch Board** - Drag-and-drop interface for worker assignments
- **Worker Management** - Add and manage workers with roles and contact info
- **Project Groups** - Create project sites with location and start times
- **SMS Notifications** - Send dispatch notifications via Twilio
- **Response Handling** - Workers can confirm/decline via SMS reply
- **Real-time Updates** - Status updates automatically when workers respond

## Setup

### 1. Configure Twilio (Optional but Recommended)
Add these to your `.env` file:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

To get Twilio credentials:
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the Console
3. Purchase a phone number with SMS capabilities

### 2. Configure Webhook (For SMS Replies)
In your Twilio console:
1. Go to Phone Numbers > Manage > Active Numbers
2. Click on your phone number
3. In "Messaging Configuration", set webhook to:
   - URL: `https://your-domain.com/api/twilio/webhook`
   - Method: HTTP POST

For local development, use ngrok:
```bash
ngrok http 3001
# Use the HTTPS URL for the webhook
```

## Usage

### Access the Dispatch Board
Navigate to `/dashboard/dispatch` in your application.

### Adding Workers
1. Click "Add Worker" button
2. Enter:
   - Name (e.g., "John Smith")
   - Phone (e.g., "555-123-4567")
   - Role (Carpenter, Laborer, Operator, Foreman, etc.)
3. Click "Add Worker"

Workers appear in the "Unassigned Workers" column.

### Creating Project Groups
1. Click "Add Project" button
2. Enter:
   - Project Name (e.g., "Horizons at Skyway")
   - Location (e.g., "123 Main St, Seattle WA")
   - Start Time (e.g., "7:00 AM")
3. Click "Add Project"

Project groups appear as columns on the board.

### Assigning Workers
1. Drag worker tokens from "Unassigned Workers" to project columns
2. Reorder workers within groups by dragging
3. Move workers between projects as needed

### Sending Dispatch Notifications
1. Assign all workers to their projects
2. Click "Send Dispatch" button
3. Each worker receives an SMS:
   ```
   Hi John, you've been assigned to Horizons at Skyway for Mon, Sep 18 at 7:00 AM.
   📍 123 Main St, Seattle WA

   Reply YES to confirm or NO to decline.
   ```

### Worker Responses
- Workers reply "YES" or "NO" to the SMS
- Status automatically updates in the UI:
  - ✅ Green check = Confirmed
  - ❌ Red X = Declined
  - 🕐 Yellow clock = Pending

### Date Selection
- Use the date picker to plan dispatch for different days
- Each date maintains its own dispatch configuration

## Worker Roles & Colors
- **Carpenter** - Blue
- **Laborer** - Green
- **Operator** - Orange
- **Foreman** - Purple
- **Electrician** - Yellow
- **Plumber** - Cyan
- **Others** - Gray

## Database Schema

### DispatchGroup
- Represents a project/site for a specific date
- Contains: name, location, startTime, date, status

### DispatchAssignment
- Links workers to groups for specific dates
- Tracks: userId, groupId, date, status (pending/confirmed/declined)

### DispatchCommunication
- Logs all SMS messages sent and received
- Stores: message content, Twilio SID, delivery status

## API Endpoints

- `GET /api/dispatch?date=YYYY-MM-DD` - Get dispatch configuration
- `POST /api/dispatch/assign` - Assign worker to group
- `POST /api/dispatch/groups` - Create new project group
- `POST /api/dispatch/workers` - Add new worker
- `POST /api/dispatch/send` - Send SMS notifications
- `POST /api/twilio/webhook` - Handle SMS replies (Twilio webhook)

## Troubleshooting

### SMS Not Sending
- Check Twilio credentials in `.env`
- Verify phone numbers include country code
- Check Twilio account balance
- View console logs for error messages

### Workers Not Receiving SMS
- Verify phone number format (10 digits for US)
- Check worker has valid phone number in system
- Ensure Twilio phone number has SMS capabilities

### Replies Not Updating Status
- Verify webhook URL is configured in Twilio
- Check webhook is accessible (use ngrok for local)
- Ensure database migrations are up to date

## Development Mode
Without Twilio configured, the system will:
- Log SMS messages to console
- Allow full UI functionality
- Show mock status for sent messages

## Future Enhancements
- Export dispatch as PDF/image
- Bulk import workers from CSV
- Worker availability calendar
- Conflict detection for double-booking
- Weather integration
- Analytics dashboard
- Multi-day dispatch planning