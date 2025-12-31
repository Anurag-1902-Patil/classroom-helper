# Exam Detection API: Examples & Testing

## API Endpoints Overview

```
POST /api/exam-detection/parse     - Parse & extract event from input
POST /api/exam-detection/confirm   - Create calendar event
```

---

## Endpoint 1: Parse Input

**URL:** `POST http://localhost:3000/api/exam-detection/parse`

**Authentication:** Required (NextAuth session)

### Example 1: High Confidence Event

**Request:**
```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "input": "The Physics midterm exam is scheduled for March 15, 2024, from 2:00 PM to 4:00 PM in Room 301. Duration is 2 hours. Bring your student ID.",
    "userTimezone": "America/New_York"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "event": {
    "event_title": "Physics Midterm Exam",
    "date": "2024-03-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "event_type": "exam",
    "confidence_score": 0.96,
    "subject": "Physics",
    "additional_notes": "Room 301, bring student ID"
  },
  "userTimezone": "America/New_York"
}
```

### Example 2: Medium Confidence Event

**Request:**
```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "input": "Our professor mentioned the chemistry quiz will be sometime next week, probably on Thursday afternoon around 1 PM. It should take about an hour.",
    "userTimezone": "Europe/London"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "event": {
    "event_title": "Chemistry Quiz",
    "date": "2024-01-11",
    "start_time": "13:00",
    "end_time": "14:00",
    "event_type": "quiz",
    "confidence_score": 0.68,
    "subject": "Chemistry",
    "additional_notes": "Approximate time based on professor's mention"
  },
  "userTimezone": "Europe/London"
}
```

### Example 3: No Event Detected

**Request:**
```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "input": "I really enjoyed the biology class today. The professor explained evolution very clearly.",
    "userTimezone": "America/Chicago"
  }'
```

**Response (200 OK):**
```json
{
  "success": false,
  "reason": "NO_EVENT_DETECTED",
  "message": "Could not detect an exam/test event in the provided input",
  "userTimezone": "America/Chicago"
}
```

### Example 4: Low Confidence Event

**Request:**
```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -d '{
    "input": "We might have a test soon, maybe early next month. Not sure about time though.",
    "userTimezone": "Asia/Tokyo"
  }'
```

**Response (200 OK):**
```json
{
  "success": false,
  "reason": "NO_EVENT_DETECTED",
  "message": "Could not detect an exam/test event in the provided input",
  "userTimezone": "Asia/Tokyo"
}
```
*(Confidence too low, event not returned)*

### Error: Not Authenticated

**Request:** (without session)
```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -d '{"input": "Exam on March 15"}'
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "reason": "UNAUTHORIZED",
  "message": "Not authenticated"
}
```

### Error: Invalid Input

**Request:**
```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"input": ""}'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "reason": "INVALID_INPUT",
  "message": "Input must be a non-empty string"
}
```

### Error: Server Configuration

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "reason": "SERVER_ERROR",
  "message": "AI service not configured"
}
```
*(GEMINI_API_KEY not set in environment)*

---

## Endpoint 2: Confirm & Create Event

**URL:** `POST http://localhost:3000/api/exam-detection/confirm`

**Authentication:** Required (NextAuth session + Google OAuth token)

### Example 1: Successful Event Creation

**Request:**
```bash
curl -X POST http://localhost:3000/api/exam-detection/confirm \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "event": {
      "event_title": "Physics Midterm Exam",
      "date": "2024-03-15",
      "start_time": "14:00",
      "end_time": "16:00",
      "event_type": "exam",
      "confidence_score": 0.96,
      "subject": "Physics",
      "additional_notes": "Room 301, bring student ID"
    },
    "userTimezone": "America/New_York"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "eventId": "abc123xyz456789",
  "calendarLink": "https://calendar.google.com/calendar/u/0/r/eventedit/abc123xyz456789"
}
```

### Example 2: Event with Edits

**Request:** (User edited the event before confirming)
```bash
curl -X POST http://localhost:3000/api/exam-detection/confirm \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "event": {
      "event_title": "CS101 Final Exam - EDITED",
      "date": "2024-04-20",
      "start_time": "10:00",
      "end_time": "12:30",
      "event_type": "exam",
      "confidence_score": 0.92,
      "subject": "Computer Science",
      "additional_notes": "Room 405 - Calculator & ID required - EDITED BY USER"
    },
    "userTimezone": "America/Los_Angeles"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "eventId": "def456uvw789012",
  "calendarLink": "https://calendar.google.com/calendar/u/0/r/eventedit/def456uvw789012"
}
```

### Example 3: Missing Calendar Access

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Google Calendar access not available"
}
```
*(User not logged in with Google or token expired)*

### Example 4: Invalid Event Data

**Request:** (Missing required fields)
```bash
curl -X POST http://localhost:3000/api/exam-detection/confirm \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "event": {
      "event_title": "Exam",
      "date": "2024-03-15"
    }
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required event fields"
}
```

### Example 5: Calendar API Error

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Failed to create calendar event",
  "error": "Calendar API error: Invalid time zone 'InvalidZone'"
}
```

### Example 6: Network/Server Error

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Failed to process request",
  "error": "Network error: ECONNREFUSED"
}
```

---

## Testing with Postman

### Setup Postman

1. Open [Postman](https://www.postman.com/)
2. Create new collection: "Exam Detection API"
3. Create new environment: "Local Development"

### Environment Variables

```json
{
  "base_url": "http://localhost:3000",
  "session_cookie": "your_session_cookie_here"
}
```

### Request 1: Parse Event

**Tab: Headers**
```
Content-Type: application/json
Cookie: {{session_cookie}}
```

**Tab: Body (raw JSON)**
```json
{
  "input": "Biology midterm exam on April 10, 2024 from 9:00 AM to 11:00 AM",
  "userTimezone": "America/New_York"
}
```

**Tab: URL**
```
{{base_url}}/api/exam-detection/parse
```

### Request 2: Confirm Event

**Tab: Headers**
```
Content-Type: application/json
Cookie: {{session_cookie}}
```

**Tab: Body (raw JSON)**
```json
{
  "event": {
    "event_title": "Biology Midterm Exam",
    "date": "2024-04-10",
    "start_time": "09:00",
    "end_time": "11:00",
    "event_type": "exam",
    "confidence_score": 0.95,
    "subject": "Biology"
  },
  "userTimezone": "America/New_York"
}
```

**Tab: URL**
```
{{base_url}}/api/exam-detection/confirm
```

---

## Testing with cURL

### Parse Request

```bash
curl -X POST http://localhost:3000/api/exam-detection/parse \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "input": "Statistics exam March 20 2024 at 3 PM",
    "userTimezone": "America/New_York"
  }' | jq
```

### Confirm Request

```bash
curl -X POST http://localhost:3000/api/exam-detection/confirm \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "event": {
      "event_title": "Statistics Exam",
      "date": "2024-03-20",
      "start_time": "15:00",
      "end_time": "17:00",
      "event_type": "exam",
      "confidence_score": 0.90
    },
    "userTimezone": "America/New_York"
  }' | jq
```

---

## Event Extraction Examples

### Test Case 1: Clear Date & Time

**Input:**
```
CSC101 Final Examination
Date: May 15, 2024
Time: 10:00 AM - 12:00 PM (2 hours)
Location: Building A, Room 201
```

**Expected Output:**
```json
{
  "event_title": "CSC101 Final Examination",
  "date": "2024-05-15",
  "start_time": "10:00",
  "end_time": "12:00",
  "event_type": "exam",
  "confidence_score": 0.98,
  "subject": "CSC101",
  "additional_notes": "Building A, Room 201"
}
```

### Test Case 2: Relative Dates

**Input:**
```
Quick reminder - math test next Tuesday at 2 PM in the science wing
```

**Expected Output:**
```json
{
  "event_title": "Math Test",
  "date": "2024-01-16",
  "start_time": "14:00",
  "end_time": "16:00",
  "event_type": "test",
  "confidence_score": 0.72,
  "subject": "Math",
  "additional_notes": "Science wing, relative date interpreted"
}
```

### Test Case 3: Minimal Information

**Input:**
```
Final exam on Friday
```

**Expected Output:**
```json
{
  "event_title": "Final Exam",
  "date": "2024-01-12",
  "start_time": "09:00",
  "end_time": "11:00",
  "event_type": "exam",
  "confidence_score": 0.55,
  "additional_notes": "Date/time may be inaccurate - minimal information provided"
}
```

### Test Case 4: No Event

**Input:**
```
My professor is really good at teaching complex topics
```

**Expected Output:**
```json
{
  "success": false,
  "reason": "NO_EVENT_DETECTED"
}
```

---

## Timezone Examples

### US Timezones
```
America/New_York         - EST/EDT (Eastern)
America/Chicago          - CST/CDT (Central)
America/Denver           - MST/MDT (Mountain)
America/Los_Angeles      - PST/PDT (Pacific)
```

### International Timezones
```
Europe/London            - GMT/BST (UK)
Europe/Paris             - CET/CEST (Central Europe)
Asia/Tokyo               - JST (Japan)
Asia/Kolkata             - IST (India)
Australia/Sydney         - AEDT/AEST (Sydney)
```

---

## Response Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Parsing complete (event found or not found) |
| 201 | Created | Calendar event successfully created |
| 400 | Bad Request | Invalid input or missing fields |
| 401 | Unauthorized | Not authenticated or no calendar access |
| 500 | Server Error | API key missing or calendar API error |

---

## Troubleshooting API Issues

### Problem: 401 Unauthorized

**Solution:**
1. Login to the app first
2. Check cookie is being sent
3. Verify NextAuth is configured
4. Check .env.local has GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

### Problem: No Event Detected (When Expected)

**Solution:**
1. Check confidence score threshold (must be >0.6)
2. Ensure date information is clear
3. Include keywords: exam, test, quiz, midterm, final, assessment
4. Provide specific dates (not just "soon")

### Problem: Calendar API Error

**Solution:**
1. Verify Google Calendar API is enabled
2. Check OAuth token is valid
3. Ensure timezone format is correct (IANA format)
4. Check user has Calendar write permission

### Problem: Gemini API Error

**Solution:**
1. Verify GEMINI_API_KEY in .env.local
2. Check API key is correct (no spaces)
3. Confirm Gemini API is enabled on makersuite.google.com
4. Check rate limits not exceeded

---

## Real-World Usage Patterns

### Pattern 1: Course Syllabus Parsing
```
User pastes entire syllabus section about exams
→ Multiple exam dates extracted from one input
→ Could process multiple lines separately
```

### Pattern 2: Email Forwarding
```
User forwards exam announcement email
→ Extract from plain text email body
→ Auto-populate calendar
```

### Pattern 3: OCR from Image
```
User takes screenshot of exam notice
→ OCR extracts text
→ Send text to our API
→ Get structured event
```

### Pattern 4: Voice Transcription
```
User records voice note about exam
→ Transcribe to text (using Web Speech API)
→ Send to our API
→ Confirm and add to calendar
```

---

**Ready to test?** Start the dev server and use any example above!
