# Exam Detection: Complete Setup & Testing Guide

## 🚀 5-Minute Quick Start

### Step 1: Get Your API Keys (2 minutes)

**Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key to `.env.local`

**Google OAuth Credentials:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Search for "Google Calendar API" and enable it
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Authorized redirect URI: `http://localhost:3000/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

### Step 2: Configure Environment (1 minute)

Create `.env.local`:
```bash
AUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GEMINI_API_KEY=your_gemini_key
NEXTAUTH_URL=http://localhost:3000
```

### Step 3: Run the App (2 minutes)

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

---

## 📋 Complete Setup Instructions

### Prerequisites Checklist

- [ ] Node.js 18+ installed (`node -v`)
- [ ] Google Account with admin access
- [ ] npm or yarn package manager
- [ ] Code editor (VS Code recommended)

### Detailed Setup

#### 1. Google Cloud Project Setup

**Create Project:**
```bash
1. Go to https://console.cloud.google.com/
2. Click "Select a Project" → "New Project"
3. Name: "Classroom Helper" (or preferred name)
4. Create
```

**Enable Google Calendar API:**
```bash
1. In Google Cloud Console, search for "Calendar"
2. Click "Google Calendar API"
3. Click "Enable"
```

**Create OAuth Credentials:**
```bash
1. Go to "Credentials" in left sidebar
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Under "Authorized redirect URIs", click "Add URI"
5. Add: http://localhost:3000/auth/callback/google
6. Add: http://localhost:3000/api/auth/callback/google
7. Click "Create"
8. Copy "Client ID" and "Client Secret"
```

#### 2. Gemini API Setup

**Get API Key:**
```bash
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key in Google Cloud"
3. Select your project
4. Click "Create API Key"
5. Copy the generated key
```

**Note:** Gemini API is free tier, no billing required

#### 3. Environment Configuration

**Create `.env.local` file in project root:**

```bash
# Authentication (NextAuth)
AUTH_SECRET=$(openssl rand -base64 32)    # Or generate manually
GOOGLE_CLIENT_ID=<paste_client_id_here>
GOOGLE_CLIENT_SECRET=<paste_client_secret_here>
NEXTAUTH_URL=http://localhost:3000

# Exam Detection
GEMINI_API_KEY=<paste_gemini_key_here>
GOOGLE_CALENDAR_TIMEZONE=America/New_York
ENABLE_EXAM_DETECTION=true
```

**Generate AUTH_SECRET:**
```bash
# Option 1: Using openssl (Linux/Mac)
openssl rand -base64 32

# Option 2: Using PowerShell (Windows)
$bytes = New-Object 'System.Byte[]' 32
(New-Object 'System.Security.Cryptography.RNGCryptoServiceProvider').GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Option 3: Using NextAuth CLI
npx auth secret
```

#### 4. Installation & Dependencies

```bash
# Install dependencies
npm install

# or with yarn
yarn install
```

**Already included packages:**
```json
{
  "@google/generative-ai": "^0.24.1",    // Gemini
  "next-auth": "^5.0.0-beta.30",          // OAuth
  "next": "^16.0.7",                      // Next.js
  "react": "^19.2.1"                      // React
}
```

#### 5. Run Development Server

```bash
npm run dev
```

Expected output:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## 🧪 Testing the Feature

### Test 1: Basic Event Detection

**Steps:**
1. Open http://localhost:3000
2. Login with Google account
3. Click "Auto-Detect Exam" button
4. Paste test text:
   ```
   Physics exam on March 15, 2024 at 2:00 PM, 
   Room 201, duration 3 hours
   ```
5. Click "Analyze Input"
6. Verify extraction:
   - Title: "Physics Exam" ✓
   - Date: "2024-03-15" ✓
   - Time: "14:00 - 17:00" ✓
   - Confidence: >0.9 ✓
7. Click "Add to Calendar"
8. Verify event appears in Google Calendar

**Expected Result:**
- ✓ Event created in Google Calendar
- ✓ Title: "Physics Exam"
- ✓ Reminders: 1 day + 1 hour before
- ✓ Description: "Auto-detected using AI"

### Test 2: Ambiguous Date Handling

**Input Text:**
```
Dr. Smith said the Chemistry exam will be sometime next week, 
probably on Wednesday afternoon around 3 PM
```

**Expected Behavior:**
- Confidence score: 0.65-0.75 (medium confidence)
- Date: Next Wednesday from current date
- Start time: 15:00 (3 PM)
- End time: 17:00 (estimated 2 hours)
- Allow user to edit before confirming

### Test 3: No Event Detected

**Input Text:**
```
I really enjoyed learning about organic chemistry this semester. 
The professor's explanations were very clear.
```

**Expected Result:**
- Modal shows: "Could not detect an exam/test event"
- Reason: "NO_EVENT_DETECTED"
- Offer to try again
- No calendar event created

### Test 4: Event Editing

**Steps:**
1. Parse an event (use Test 1)
2. In confirmation modal, edit:
   - Change date to tomorrow
   - Change start time to 10:00
   - Add note: "Bring ID"
3. Click "Add to Calendar"
4. Open Google Calendar
5. Verify event shows edited details

**Expected Result:**
- ✓ Event date changed
- ✓ Event time changed
- ✓ Note appears in description

### Test 5: Error Handling - Missing Auth

**Steps:**
1. Try accessing `/api/exam-detection/parse` directly
2. Don't include authentication

**Expected Result:**
```json
{
  "success": false,
  "reason": "UNAUTHORIZED",
  "message": "Not authenticated"
}
```
Status: 401

### Test 6: Error Handling - Invalid Input

**Steps:**
1. Paste empty text
2. Click "Analyze Input"

**Expected Result:**
- Modal shows: "Please enter exam details"
- No API call made
- Cursor returns to input field

### Test 7: Timezone Handling

**Steps:**
1. Open browser dev tools → Application → Cookies
2. Change system timezone (System Settings)
3. Parse event with times
4. Check Google Calendar for correct timezone conversion

**Expected Result:**
- Event time adjusted for timezone
- Reminders fire at correct time in user's zone

### Test 8: Concurrent Requests

**Steps:**
1. Open 2 exam detection modals (in separate browser tabs)
2. Parse events simultaneously
3. Add to calendar from both

**Expected Result:**
- Both events created successfully
- No race conditions
- Independent state in each modal

---

## 🐛 Debugging Checklist

### API Not Responding

```bash
# 1. Check server is running
curl http://localhost:3000/api/exam-detection/parse
# Should return 405 (POST required)

# 2. Check environment variables
echo $GEMINI_API_KEY
echo $GOOGLE_CLIENT_ID

# 3. Check logs in terminal
npm run dev  # Look for errors
```

### Gemini API Error

```
Error: "INVALID_ARGUMENT: Invalid API key"
Solution:
  1. Copy API key correctly (no spaces)
  2. Check makersuite.google.com/app/apikey
  3. Regenerate key if needed
  4. Restart dev server
```

### Google Calendar Not Showing Events

```
Checklist:
  ✓ User logged in with Google account
  ✓ Google Calendar API enabled in Cloud Console
  ✓ OAuth credentials correct
  ✓ User has Calendar write permission
  ✓ Event shows in Google Calendar web (calendar.google.com)
  ✓ Check Calendar settings → Access Control
```

### OAuth Redirect Error

```
Error: "Redirect URL mismatch"
Solution:
  1. Go to Google Cloud Console → Credentials
  2. Edit OAuth Client ID
  3. Add authorized redirect URI:
     - http://localhost:3000/auth/callback/google
     - http://localhost:3000/api/auth/callback/google
  4. Save and restart
```

### Modal Not Opening

```
Debug steps:
  1. Check browser console for errors
  2. Verify ExamDetectionModal component imported
  3. Check isOpen state is toggling
  4. Verify onClose callback working
  5. Check Tailwind CSS loaded (modal should have style)
```

---

## 📊 Test Cases & Expected Results

### Test Case Matrix

| Input | Confidence | Type | Result |
|-------|-----------|------|--------|
| "Exam on Feb 15, 2024 at 2 PM" | 0.95+ | Exam | ✓ Created |
| "Quiz next Friday" | 0.65-0.75 | Quiz | ✓ Created (editable) |
| "Studying for test" | <0.6 | - | ✗ Not detected |
| "Meeting at 3 PM" | <0.6 | - | ✗ Not detected |
| "CS exam 3/15/24 10am-12pm" | 0.98 | Exam | ✓ Created |
| "Final exam sometime next week" | 0.55-0.70 | Exam | ✓ Created (low conf) |

---

## 🎯 Demo Scripts

### Demo 1: High Confidence Event (30 seconds)

```
User Input:
"Computer Science Final Exam
Date: April 20, 2024
Time: 10:00 AM - 12:00 PM
Location: Science Building, Room 405
Bring: Calculator, ID"

Expected Result:
- Confidence: 0.98
- Fields auto-filled and correct
- Click "Add to Calendar"
- Event appears immediately
```

### Demo 2: Ambiguous Event (45 seconds)

```
User Input:
"Our professor mentioned the statistics test 
would be sometime next week, probably Wednesday 
or Thursday afternoon, around 2 or 3 PM"

Expected Result:
- Confidence: 0.68
- Date shows Wednesday next week
- Time shows 14:00 (2 PM)
- User notes: "Ambiguous - professor not specific"
- User can edit before confirming
- Click "Add to Calendar"
```

### Demo 3: Multi-Event Processing (1 minute)

```
Input Multiple Announcements:
"1. Math midterm March 10 at 9 AM"
"2. Biology quiz March 15 at 2 PM"
"3. History exam March 20 3-5 PM"

Process:
1. Parse first event → Confirm → Add
2. Parse second event → Confirm → Add
3. Parse third event → Confirm → Add

Result:
- All 3 events in Google Calendar
- With proper reminders
```

---

## 📱 Mobile Testing

### Mobile Test Checklist

- [ ] Modal responsive on iPhone (max-w-2xl)
- [ ] Keyboard doesn't cover input fields
- [ ] Buttons touchable (min 44px height)
- [ ] Date/time inputs work on mobile
- [ ] Loading states visible
- [ ] Error messages readable
- [ ] Calendar link openable in mobile browser

**Test on devices:**
```bash
# Desktop: http://localhost:3000
# Mobile: http://<your-ip>:3000 (same network)
# Or use Chrome DevTools device simulation
```

---

## 🔍 Monitoring & Analytics

### Key Metrics to Track

1. **Detection Accuracy**
   - Events detected: X per session
   - Confidence score distribution
   - Types detected: exams vs tests vs quizzes

2. **User Flow**
   - Modal open rate
   - Parse success rate
   - Confirmation rate (% that confirm vs edit)
   - Calendar creation success

3. **Error Rates**
   - API errors
   - Auth failures
   - Calendar API failures
   - Network timeouts

### Add Analytics (Optional)

```typescript
// In exam-detection-modal.tsx
const trackEvent = (eventName: string, data?: any) => {
  // Use your analytics service
  console.log(`[Analytics] ${eventName}`, data);
};

// Usage
const handleParseInput = async () => {
  trackEvent("exam_parse_start", { inputLength: userInput.length });
  // ... rest of function
  trackEvent("exam_parse_success", { confidence: data.event.confidence_score });
};
```

---

## 📚 Additional Resources

### Google APIs Documentation
- [Gemini API Docs](https://ai.google.dev/docs)
- [Calendar API Docs](https://developers.google.com/calendar/api)
- [OAuth 2.0 Flow](https://developers.google.com/identity/protocols/oauth2)

### Next.js & React
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [React Hooks](https://react.dev/reference/react/hooks)

### Tools & Testing
- [Postman](https://www.postman.com/) - Test APIs
- [cURL](https://curl.se/) - Terminal API testing
- [Google Calendar](https://calendar.google.com/) - Verify events

---

## ✅ Completion Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Google Calendar API enabled
- [ ] OAuth credentials verified
- [ ] Gemini API key active
- [ ] All tests passing
- [ ] Error handling tested
- [ ] Mobile responsive verified
- [ ] Performance acceptable (<2s response)
- [ ] Security audit complete
- [ ] Documentation updated

---

**Questions or issues?** Check [EXAM_DETECTION_README.md](./EXAM_DETECTION_README.md) for comprehensive feature documentation.
