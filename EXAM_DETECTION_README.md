# Exam Auto-Detection & Google Calendar Integration

A production-ready hackathon feature that automatically detects exams/tests from user input and adds them to Google Calendar using **Google Gemini AI** and **Google Calendar API**.

## 🎯 Overview

This feature intelligently parses unstructured user input (text, transcripts, OCR output) to detect academic events (exams, tests, quizzes, assignments) and creates calendar events with reminders after user confirmation.

**Core Architecture:**
```
User Input (raw text/transcript/OCR)
        ↓
    Gemini AI (parsing & validation)
        ↓
    User Confirmation (review & edit)
        ↓
    Google Calendar API (event creation)
        ↓
    Confirmation & Calendar Link
```

## 🏗️ Architecture

### Backend Services

#### 1. **GeminiService** (`src/lib/gemini-service.ts`)
- Sends user input to Gemini 2.0 Flash for structured event extraction
- Returns JSON with extracted event details
- Validates extracted data and enforces confidence thresholds
- Handles ambiguous dates and missing information gracefully

**Key Features:**
- Strict system prompt that enforces JSON-only responses
- Confidence scoring (0-1) for detection reliability
- Validates date/time formats
- Supports multiple event types: exam, test, quiz, assignment

#### 2. **CalendarService** (`src/lib/calendar-service.ts`)
- Creates Google Calendar events using the Calendar API
- Handles timezone conversion and datetime formatting
- Sets automatic reminders (1 day before, 1 hour before)
- Validates datetime structures and API responses

**Capabilities:**
- ISO 8601 datetime formatting
- Timezone-aware event creation
- Multi-reminder support
- Event link generation

### API Endpoints

#### `POST /api/exam-detection/parse`
**Purpose:** Parse user input and extract event details

**Request:**
```json
{
  "input": "Mathematics exam on February 15, 2024 at 2 PM",
  "userTimezone": "America/New_York"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "event": {
    "event_title": "Mathematics Exam",
    "date": "2024-02-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "event_type": "exam",
    "confidence_score": 0.95,
    "subject": "Mathematics",
    "additional_notes": null
  },
  "userTimezone": "America/New_York"
}
```

**Failure Response (200):**
```json
{
  "success": false,
  "reason": "NO_EVENT_DETECTED",
  "message": "Could not detect an exam/test event in the provided input"
}
```

#### `POST /api/exam-detection/confirm`
**Purpose:** Create Google Calendar event after user confirmation

**Request:**
```json
{
  "event": {
    "event_title": "Mathematics Exam",
    "date": "2024-02-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "event_type": "exam",
    "confidence_score": 0.95,
    "subject": "Mathematics"
  },
  "userTimezone": "America/New_York"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "eventId": "abc123xyz456",
  "calendarLink": "https://calendar.google.com/calendar/u/0/r/eventedit/abc123xyz456"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Failed to create calendar event",
  "error": "Calendar API error: Invalid credentials"
}
```

### Frontend Component

#### `ExamDetectionModal` (`src/components/exam-detection-modal.tsx`)
React component with complete user flow:

1. **Input State** - User pastes/enters exam details
2. **Parsing State** - AI processes input (loading)
3. **Confirmation State** - User reviews and edits extracted data
4. **Creating State** - Calendar event is created (loading)
5. **Success State** - Confirmation with calendar link
6. **Error State** - Error handling with retry option

**Editable Fields in Confirmation:**
- Event title
- Subject
- Date
- Start time
- End time
- Event type
- Additional notes

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- Google Account with:
  - Google OAuth 2.0 credentials (Client ID & Secret)
  - Gemini API key
  - Google Calendar API enabled

### Step 1: Get API Keys

#### Google OAuth 2.0
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add `http://localhost:3000/auth/callback/google` to authorized redirect URIs
6. Copy **Client ID** and **Client Secret**

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the generated key

### Step 2: Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Authentication
AUTH_SECRET=$(openssl rand -base64 32)  # Run: npx auth secret
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000

# AI & Calendar
GEMINI_API_KEY=your_gemini_key_here
GOOGLE_CALENDAR_TIMEZONE=America/New_York
ENABLE_EXAM_DETECTION=true
```

### Step 3: Install Dependencies

```bash
npm install
# OR
yarn install
```

The project already includes:
- `@google/generative-ai` - Gemini integration
- `next-auth` - Google OAuth
- Other required dependencies

### Step 4: Run Development Server

```bash
npm run dev
# OR
yarn dev
```

Visit `http://localhost:3000` and test the exam detection feature.

## 📋 Gemini Prompt Engineering

The system prompt used for event extraction is optimized for:

1. **JSON-only output** - No markdown, explanations, or extra text
2. **High confidence threshold** - Requires >0.6 confidence to return event
3. **Structured extraction** - Forces strict output format
4. **Ambiguous date handling** - Makes reasonable assumptions for "next week", "coming Friday", etc.
5. **Missing time estimation** - Default 09:00 start, 2-hour duration for end

**Key Prompt Rules:**
```
- ONLY respond with valid JSON
- If confidence < 0.6, return {"success": false, "reason": "NO_EVENT_DETECTED"}
- Always use ISO 8601 format for dates (YYYY-MM-DD)
- Always use 24-hour time format (HH:MM)
- Extract event_type as one of: exam, test, quiz, assignment
```

## 🎬 Demo Flow

### Example 1: Direct Event Information
**User Input:**
```
Our physics midterm is scheduled for March 10, 2024 at 2:00 PM. 
The exam will be held in Room 301 and should take about 3 hours.
```

**Gemini Response:**
```json
{
  "success": true,
  "event": {
    "event_title": "Physics Midterm",
    "date": "2024-03-10",
    "start_time": "14:00",
    "end_time": "17:00",
    "event_type": "exam",
    "confidence_score": 0.98,
    "subject": "Physics",
    "additional_notes": "Room 301"
  }
}
```

### Example 2: Ambiguous Information
**User Input:**
```
Our professor mentioned the chemistry test will be next Friday afternoon, probably around 1 PM.
```

**Gemini Response:**
```json
{
  "success": true,
  "event": {
    "event_title": "Chemistry Test",
    "date": "2024-01-12",
    "start_time": "13:00",
    "end_time": "15:00",
    "event_type": "test",
    "confidence_score": 0.72,
    "subject": "Chemistry",
    "additional_notes": "Approximate time - professor not specific"
  }
}
```

### Example 3: No Event Detected
**User Input:**
```
I really enjoyed the chemistry class today. We covered acid-base reactions and the professor explained buffers well.
```

**Gemini Response:**
```json
{
  "success": false,
  "reason": "NO_EVENT_DETECTED"
}
```

## 🛡️ Error Handling

### Frontend Error Scenarios

| Scenario | Handling |
|----------|----------|
| Empty Input | Show validation error |
| Network Timeout | Retry with error message |
| No Event Detected | Show "No exam found" message |
| Invalid Credentials | Redirect to login |
| Calendar API Failure | Show specific error, allow retry |

### Backend Validation

```typescript
// Validates:
✓ Required fields (title, date, time, type)
✓ Date format (YYYY-MM-DD)
✓ Time format (HH:MM)
✓ Confidence score (0-1 range)
✓ User authentication
✓ Google OAuth token availability
```

## 🔧 Customization

### Change Timezone
Update `userTimezone` parameter:
```typescript
const response = await fetch("/api/exam-detection/parse", {
  body: JSON.stringify({
    input: "...",
    userTimezone: "Europe/London" // Change timezone
  })
});
```

### Modify Reminders
Edit `CalendarService.createEvent()`:
```typescript
reminders: {
  useDefault: false,
  overrides: [
    { method: "notification", minutes: 1440 }, // 1 day
    { method: "notification", minutes: 60 },   // 1 hour
    { method: "email", minutes: 1440 }         // Add email reminder
  ]
}
```

### Change Event Type Options
In `exam-detection-modal.tsx`, update the select options:
```tsx
<select value={editedEvent.event_type}>
  <option value="exam">Exam</option>
  <option value="test">Test</option>
  <option value="midterm">Mid-term</option>
  {/* Add more types */}
</select>
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  User Frontend                           │
│         (ExamDetectionModal Component)                   │
│  Input → Parsing → Confirmation → Creating → Success    │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
    POST /parse            POST /confirm
         │                      │
    ┌────▼─────────┐      ┌────▼────────────┐
    │   GeminiService    │   CalendarService │
    │  (Extract Event)  │   (Create Event)  │
    └────┬─────────┘      └────┬────────────┘
         │                      │
    Gemini API          Google Calendar API
         │                      │
    ┌────▼─────────────────────▼────┐
    │     Structured Event Data      │
    │   ✓ Title, Date, Time         │
    │   ✓ Type, Confidence           │
    │   ✓ Calendar Link              │
    └───────────────────────────────┘
```

## 🧪 Testing

### Manual Test Cases

**Test 1: High Confidence Event**
```
Input: "Computer Science exam is on January 15, 2024 from 10:00 AM to 12:00 PM"
Expected: High confidence (>0.9), exact details extracted
```

**Test 2: Ambiguous Date**
```
Input: "Math quiz next Tuesday morning"
Expected: Medium confidence (0.6-0.8), reasonable date assumption
```

**Test 3: No Event**
```
Input: "I love studying calculus because it helps me understand physics better"
Expected: No event detected, reason: NO_EVENT_DETECTED
```

**Test 4: Edit Confirmation**
```
Steps:
1. Parse input with auto-detected values
2. Edit the date/time in confirmation modal
3. Submit edited event to calendar
Expected: Calendar shows edited values
```

## 📝 Code Structure

```
src/
├── lib/
│   ├── gemini-service.ts          # Gemini AI integration
│   ├── calendar-service.ts        # Google Calendar API
│   └── ...
├── app/
│   └── api/
│       └── exam-detection/
│           ├── parse/
│           │   └── route.ts       # Parse endpoint
│           └── confirm/
│               └── route.ts       # Confirm endpoint
├── components/
│   └── exam-detection-modal.tsx   # User UI component
└── ...
```

## 🔐 Security Considerations

1. **OAuth Token Management** - Tokens stored securely in session
2. **Input Validation** - All inputs validated before API calls
3. **API Key Protection** - Gemini key only used server-side
4. **Authentication Check** - Both endpoints require `getServerSession()`
5. **CORS** - API endpoints protected by Next.js framework

## 🚨 Troubleshooting

### "Google Calendar access not available"
- User not logged in with Google OAuth
- Google Calendar API not enabled in Google Cloud Console
- OAuth token expired (user needs to re-authenticate)

### "AI service not configured"
- `GEMINI_API_KEY` not set in `.env.local`
- API key is incorrect or revoked

### "Calendar API error: Invalid time zone"
- `userTimezone` parameter has incorrect format
- Use valid IANA timezone (e.g., `America/New_York`, `Europe/London`)

### No events appearing in calendar
- Check user's calendar is set to "primary"
- Verify Google Calendar API is enabled
- Check reminders notification settings in Google Calendar

## 📚 References

- [Google Gemini API Docs](https://ai.google.dev/)
- [Google Calendar API Docs](https://developers.google.com/calendar)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [IANA Timezone Database](https://www.iana.org/time-zones)

## 🎓 Hackathon Notes

**Why Google-Only Stack?**
- ✅ Gemini: Best AI for understanding academic context
- ✅ Google Calendar: Seamless integration with OAuth
- ✅ Google Cloud: Reliable, scalable infrastructure
- ✅ No third-party dependencies: Simpler architecture

**Production Readiness:**
- ✅ Error handling for all failure paths
- ✅ Input validation at frontend and backend
- ✅ Clear user feedback for every state
- ✅ Confidence scoring for reliability
- ✅ Timezone-aware datetime handling

**Quick Start (5 minutes):**
1. Set API keys in `.env.local`
2. Run `npm install && npm run dev`
3. Click "Auto-Detect Exam" button
4. Paste exam information
5. Review and confirm
6. Done! Event in Google Calendar

---

**Built with ❤️ for the hackathon using Google technologies**
