# 🚀 SMS System Launch Guide

## ✅ Pre-Launch Checklist

### 1. **Twilio Configuration**
- [ ] Twilio Account SID configured in `.env`
- [ ] Twilio Auth Token configured in `.env`
- [ ] Twilio Phone Number configured in `.env`
- [ ] Webhook URL set in Twilio Console: `https://your-domain.com/api/sms/webhook`

### 2. **Database Setup**
- [ ] All workers imported with phone numbers
- [ ] Workers linked to dispatch system
- [ ] Projects have phases and subphases with cost codes
- [ ] Cost codes have units (sqft, cy, ton, etc.)

### 3. **Environment Variables**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
DATABASE_URL=your_database_url
NEXTAUTH_URL=https://your-domain.com
```

### 4. **Test Numbers**
- [ ] Add test worker phone numbers to database
- [ ] Assign test workers to dispatch groups
- [ ] Link dispatch groups to projects

---

## 📱 SMS Commands Reference

### **For Workers (Bilingual)**
| Command | Description | Response |
|---------|------------|----------|
| `IN` | Clock in (with optional photo) | Confirms clock-in with time and location |
| `OUT` | Clock out | Shows hours worked today |
| `HOURS` | Check hours | Shows today and week total |
| `STATUS` | Today's assignment | Shows project, location, time |
| `YES/SI` | Confirm dispatch | Confirms tomorrow's assignment |
| `NO` | Decline dispatch | Declines and notifies supervisor |
| `HELP` | Show commands | Lists all available commands |

### **For Superintendents/PMs Only**
| Command | Description | Response |
|---------|------------|----------|
| `CODES` | View cost codes | Shows list of project phases |
| `[Phase Name]` | Get phase codes | Shows all codes for that phase with units |

---

## 🔄 Daily Workflow

### **Evening Before (6:00 PM)**
1. Dispatch sends assignments via "Send All" button
2. Workers receive bilingual SMS
3. Workers reply YES/NO to confirm

### **Morning (7:00 AM)**
1. Workers text `IN` with photo
2. System confirms clock-in
3. Work begins

### **End of Day (3:30 PM)**
1. Workers text `OUT`
2. System calculates hours (with lunch logic)
3. When ALL workers done → Super gets summary

### **Cost Coding Process**
1. Super receives daily hours summary
2. Super texts `CODES` → Gets phase list
3. Super texts phase name → Gets cost codes
4. Super replies with: `CODE HOURS QUANTITY`
5. PM receives confirmation request
6. Daily report generated

---

## 🏗️ System Features

### **Automatic Lunch Deduction**
- Workers ≥8 hours: 30 min auto-deducted
- Finisher role: NO deduction
- Workers <8 hours: Super asked if lunch taken

### **Photo Verification**
- Workers send photo with `IN` command
- Photos stored for Super review
- No complex GPS needed

### **Role-Based Access**
- Workers: Basic commands only
- Super/PM: Access to CODES command
- Dispatch routing based on roles

### **Project Integration**
- All data linked through dispatch
- Cost codes pulled from actual project
- Real-time budget tracking

---

## 🚨 Testing Guide

### **Test Worker Flow**
```bash
# 1. Send test dispatch (from dispatch page)
# 2. Check phone for message
# 3. Reply: YES
# 4. Next morning: IN
# 5. Check status: HOURS
# 6. End of day: OUT
```

### **Test Super/PM Flow**
```bash
# 1. Wait for all workers to clock out
# 2. Receive hours summary
# 3. Text: CODES
# 4. Text: Foundation
# 5. Reply: 021010 8.5 250
# 6. Check for PM notification
```

---

## 📊 Database Schema

### **Key Tables**
- `Worker` - All crew members with phone numbers
- `DispatchWorker` - Links to dispatch system
- `WorkerAssignment` - Daily assignments
- `TimeEntry` - Clock in/out records
- `DispatchGroup` - Links to projects
- `Project` → `Phase` → `SubPhase` - Cost code structure
- `CostCodingSession` - Tracks daily coding
- `Message` - SMS history

---

## 🔧 Troubleshooting

### **Worker not receiving messages**
1. Check phone number format (+1XXXXXXXXXX)
2. Verify worker in database
3. Check Twilio logs

### **CODES command not working**
1. Verify user role (must be Super/PM)
2. Check project has phases/subphases
3. Verify dispatch assignment exists

### **Clock in/out issues**
1. Check worker has today's assignment
2. Verify not already clocked in/out
3. Check timezone settings

---

## 🚀 Launch Steps

### **1. Production Deployment**
```bash
# Deploy to production
vercel --prod

# Or your deployment command
git push origin main
```

### **2. Configure Twilio Webhook**
1. Go to Twilio Console
2. Phone Numbers → Your Number
3. Webhook: `https://your-domain.com/api/sms/webhook`
4. Method: POST
5. Save

### **3. Initial Data Setup**
```sql
-- Verify workers have phone numbers
SELECT name, phoneNumber FROM Worker WHERE phoneNumber IS NOT NULL;

-- Check dispatch assignments
SELECT * FROM WorkerAssignment WHERE date >= CURRENT_DATE;

-- Verify project cost codes
SELECT p.name, ph.name, sp.costCode, sp.name, sp.unit
FROM Project p
JOIN Phase ph ON ph.projectId = p.id
JOIN SubPhase sp ON sp.phaseId = ph.id
WHERE sp.costCode IS NOT NULL;
```

### **4. Send Test Message**
```bash
# From Twilio Console or API
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
--data-urlencode "Body=HELP" \
--data-urlencode "From=+1YOURPHONE" \
--data-urlencode "To=YOUR_TWILIO_NUMBER" \
-u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

---

## 📞 Support Contacts

- **Twilio Support**: https://www.twilio.com/help/contact
- **System Issues**: Contact your administrator
- **Database Issues**: Check Prisma Studio

---

## ✅ Go-Live Checklist

- [ ] All workers imported with correct phone numbers
- [ ] Test messages working both ways
- [ ] Cost codes loaded for all projects
- [ ] Superintendents/PMs have correct roles
- [ ] Dispatch assignments created for tomorrow
- [ ] Backup database before launch
- [ ] Monitor first day closely
- [ ] Have support ready for questions

---

## 📱 Quick Reference Card for Field

### **Workers**
```
Morning: IN + photo
Evening: OUT
Check hours: HOURS
Confirm work: YES
```

### **Superintendents**
```
Get codes: CODES
Pick phase: Foundation
Code hours: 021010 8.5 250
```

---

## 🎯 Success Metrics

- Workers clocking in/out via SMS
- Automatic lunch calculations
- Daily cost coding completed
- PM receiving daily reports
- Budget tracking in real-time

---

Ready to launch! 🚀