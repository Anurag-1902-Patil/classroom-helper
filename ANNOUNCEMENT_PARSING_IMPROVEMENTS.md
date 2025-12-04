# Announcement Parsing Improvements

## Overview
This document explains the major improvements made to the announcement parsing system to properly analyze Google Classroom announcements, extract dates, detect tests, handle submission windows, and display POSTPONED/CANCELLED statuses.

## Key Improvements

### 1. **Completely Rewritten AI Parser** (`src/app/actions/ai-parser.ts`)
   - **New, highly detailed prompt** that explicitly instructs Gemini AI to:
     - Extract test names and numbers (e.g., "Unit Test 4")
     - Parse dates in ANY format: "Monday 08/12/2025", "Dec 15-19th", "15 Dec-19 Dec"
     - Detect POSTPONED and CANCELLED statuses
     - Handle submission windows (date ranges from X to Y)
     - Extract times: "8 pm", "8:00 PM", "20:00"
   
   - **Comprehensive examples** in the prompt showing exactly what to extract
   - **Better error handling** with detailed logging for debugging
   - **Multiple event extraction** - can extract multiple events from one announcement

### 2. **Date Range Support** 
   - **Submission windows** are now properly detected:
     - "Submission will be taken during 15 Dec-19th Dec" → Creates events with start_date and end_date
     - Calendar shows all days in the range
     - Timeline displays: "Dec 15 - Dec 19"
   
   - **Start and end dates** stored separately in the data model

### 3. **Enhanced Status Detection**
   - **POSTPONED status**: Shows prominently with orange badge and ⚠️ icon
   - **CANCELLED status**: Shows prominently with red badge and ❌ icon
   - Status appears FIRST in badges (most important)
   - Animated pulse effect for POSTPONED items

### 4. **Better Test Detection**
   - Extracts test names: "Unit Test 4", "Midterm Exam", etc.
   - Shows test type in badges
   - Properly categorizes as "TEST" type with HIGH priority

### 5. **Improved Calendar View**
   - Shows all days with events (including all days in date ranges)
   - Displays date ranges: "Dec 15 - Dec 19"
   - Shows POSTPONED/CANCELLED badges
   - Better visual indicators for different event types

### 6. **Enhanced Timeline Display**
   - POSTPONED/CANCELLED badges appear FIRST (most important)
   - Date ranges displayed: "Dec 15 - Dec 19"
   - Test type shown (e.g., "Unit Test 4")
   - Submission window badges

### 7. **Better Logging & Debugging**
   - Console logs show:
     - Which announcements are being processed
     - How many events were detected
     - Event details (title, date, status)
   - Easy to debug if something isn't working

## Data Model Changes

### CombinedItem Interface
Now includes:
- `startDate?: Date` - For date ranges
- `endDate?: Date` - For date ranges  
- `testType?: string` - Test name/number
- `type: "SUBMISSION_WINDOW"` - New type for submission windows

## Examples of What Gets Extracted

### Example 1: Test Announcement
**Input:**
> "Dear Students, There will be unit test no.4 of C Programming based on unit 4 on Monday 08/12/2025 at 8 pm."

**Extracted:**
- Title: "Unit Test 4 - C Programming (Unit 4)"
- Summary: "Unit Test 4 on Dec 8 at 8 PM"
- Type: TEST
- Date: 2025-12-08T20:00:00
- Test Type: "Unit Test 4"
- Status: CONFIRMED

### Example 2: Submission Window
**Input:**
> "Submission will be taken during the practicals (15 Dec-19th Dec). Late submission will not be accepted."

**Extracted:**
- Title: "Case Study Submission Window"
- Summary: "Submit between Dec 15-19"
- Type: SUBMISSION_WINDOW
- Start Date: 2024-12-15T00:00:00
- End Date: 2024-12-19T23:59:59
- Status: CONFIRMED

### Example 3: Postponed Event
**Input:**
> "The test has been postponed to next week due to technical issues."

**Extracted:**
- Title: "Test Postponed"
- Summary: "Test postponed to next week"
- Type: TEST
- Status: POSTPONED
- Shows prominently with ⚠️ POSTPONED badge

## Environment Variables

Add to your `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

## How It Works

1. **Fetch Announcements** - All announcements are fetched from Google Classroom
2. **Process in Batches** - Announcements processed 3 at a time to avoid rate limits
3. **AI Analysis** - Each announcement is sent to Gemini AI for parsing
4. **Extract Events** - Multiple events can be extracted from one announcement
5. **Date Parsing** - Dates parsed in any format with time handling
6. **Display** - Events appear in:
   - "Next Up" section (most urgent first)
   - Timeline feed (organized by date)
   - Calendar view (visual calendar)
   - Priority banner (urgent items)

## Troubleshooting

If announcements aren't being analyzed:

1. **Check API Key** - Ensure GEMINI_API_KEY is set in `.env.local`
2. **Check Console** - Look for logs starting with:
   - 📢 Processing announcement...
   - ✅ Found X events...
   - ❌ Error messages
3. **Check Cache** - Clear browser localStorage cache if needed
4. **Check Network** - Ensure Gemini API is accessible

## Future Enhancements (Optional)

If Gemini doesn't work well, you can add:
- **OpenAI GPT-4** as an alternative
- **Claude API** as another option
- **Local LLM** (like Ollama) for offline use
- **Regex fallback** for common patterns

The architecture is designed to easily swap AI providers!

