# SMS System Logic Flow

## 1. GPS Check-In via SMS

### How it works:
Workers can include their GPS coordinates when clocking in for location verification.

### Methods:

#### Option 1: Manual GPS (Current Implementation)
- Worker texts: `IN 34.0522,-118.2437`
- System extracts coordinates from message
- Verifies if within 500 meters of job site
- Stores GPS data with time entry

#### Option 2: Automated GPS via Smartphone
Workers can use their phone's share location feature:
- **iPhone**: Long press message field → Share Location → Send Current Location
- **Android**: Attachment icon → Location → Send current location
- Then text "IN" with the location

### Response Messages:
- ✓ Location verified - Within job site radius
- ⚠️ Location outside job site - GPS logged but flagged
- No GPS - Normal clock in without verification

### Database Storage:
```sql
TimeEntry {
  gpsLatitude: Float?
  gpsLongitude: Float?
  gpsVerified: Boolean
}
```

## 2. Quantities & Manhours Logic Flow

### Clock-Out Process:

When a worker clocks out, the system automatically:

1. **Calculates Hours Worked**
   ```
   hours = (clockOut - clockIn) / (1000 * 60 * 60)
   ```

2. **Updates Assignment Status**
   - Marks worker assignment as "completed"

3. **Updates Project Metrics**
   - Adds manhours to project total
   - Calculates quantity based on worker role
   - Creates production log entry

### Quantity Calculation by Role:

```javascript
// Examples - customize per your needs
Concrete Worker: 10 cubic yards/hour
Framing: 150 sq ft/hour
Electrical: 20 outlets/hour
Plumbing: 15 fixtures/hour
Drywall: 200 sq ft/hour
Painting: 300 sq ft/hour
```

### Production Tracking:

```sql
ProductionLog {
  projectId: String
  workerId: String
  date: DateTime
  manhours: Float
  quantity: Float
  workerRole: String
  verified: Boolean (from GPS)
}
```

## 3. Automated Alerts & Notifications

### Budget Alerts (90% Threshold):
When project reaches 90% of budgeted manhours:
- PM receives: "⚠️ BUDGET ALERT - Project at 90% manhours"
- Includes actual vs budgeted comparison

### Daily Summary to PM:
End of day summary includes:
- Total workers: X confirmed, Y declined, Z pending
- Total manhours logged today
- Production quantities by trade
- GPS verification rate

### Decline Notifications:
When worker declines assignment:
- PM notified immediately
- Super notified immediately
- Critical alert if >20% decline rate

### Full Crew Confirmation:
When all workers confirm:
- PM receives success notification
- Super receives success notification

## 4. Complete Worker Flow

### Morning:
1. Worker receives dispatch SMS (bilingual)
2. Responds YES/NO to confirm/decline
3. PM/Super notified of response

### Clock In:
1. Worker texts: `IN` or `IN lat,lon`
2. System creates time entry
3. GPS verified if coordinates provided
4. Response confirms clock-in with location status

### During Day:
- `HOURS` - Check current hours
- `STATUS` - View assignment details

### Clock Out:
1. Worker texts: `OUT`
2. System calculates hours worked
3. Updates project manhours automatically
4. Calculates production quantity by role
5. Creates production log
6. Checks budget thresholds
7. Sends alerts if needed

### Data Flow:
```
Worker Clock Out
    ↓
Calculate Hours (8.5 hrs)
    ↓
Update Project Manhours (+8.5)
    ↓
Calculate Quantity (8.5 × rate)
    ↓
Create Production Log
    ↓
Check Budget (if >90%)
    ↓
Send PM Alert (if needed)
    ↓
Update Reports/Dashboard
```

## 5. Reporting & Analytics

### Real-time Metrics:
- Live manhours tracking
- Daily production rates
- GPS verification percentage
- Worker attendance rate

### Project Manager View:
- Budget vs Actual (manhours & quantities)
- Daily/Weekly production trends
- Crew confirmation status
- Location verification rates

### Superintendent View:
- Today's crew list with status
- Clock in/out times
- Production by worker
- GPS heat map of work areas

## 6. Example SMS Commands

### Worker Commands:
```
IN - Clock in
IN 34.052,-118.243 - Clock in with GPS
OUT - Clock out
HOURS - View hours worked
STATUS - Today's assignment
YES/NO - Confirm/decline assignment
HELP - Show commands
```

### Response Examples:
```
Clock In with GPS:
"✅ Clocked in at 7:00 AM
📍 Downtown Tower Project
✓ Location verified

Text OUT when done."

Clock Out:
"✅ Clocked out at 3:30 PM
⏱️ Today: 8.5 hours
📊 Production: 85 cubic yards

Great work! See you tomorrow."
```

## 7. Integration Points

### With Dispatch System:
- Pulls daily assignments
- Updates worker status
- Tracks confirmations

### With Project Management:
- Updates project metrics
- Tracks budget consumption
- Logs daily production

### With Payroll:
- Provides verified hours
- GPS-verified attendance
- Role-based tracking

### With Reporting:
- Real-time dashboards
- Production analytics
- Cost tracking
- Efficiency metrics