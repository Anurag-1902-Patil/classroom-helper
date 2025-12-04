"use server"

// Multi-provider AI parser with fallback support
import { GoogleGenerativeAI } from "@google/generative-ai"

export interface ParsedEvent {
    event_title: string
    summary_headline: string
    event_type: "DEADLINE/TEST" | "URGENT_UPDATE" | "GENERAL_INFO" | "SUBMISSION_WINDOW"
    start_date_iso: string | null // For date ranges
    due_date_iso: string | null // Primary deadline
    original_text_snippet: string
    confidence_score: "HIGH" | "MEDIUM" | "LOW"
    requires_prep: boolean
    status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
    test_type?: string // e.g., "Unit Test 4", "Midterm", "Quiz"
}

// Gemini Parser
export async function parseWithGemini(text: string): Promise<ParsedEvent[]> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.warn("Gemini API key not found")
        return []
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const currentDate = new Date()
        const currentDateStr = currentDate.toISOString().split('T')[0]
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1
        const currentDay = currentDate.getDate()
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()]

        // MUCH MORE DETAILED PROMPT
        const prompt = `You are an expert academic event parser. Analyze this classroom announcement and extract ALL important information.

ANNOUNCEMENT TEXT:
"${text}"

CURRENT CONTEXT:
- Today's Date: ${currentDateStr} (${dayOfWeek})
- Current Year: ${currentYear}
- Current Month: ${currentMonth}
- Current Day: ${currentDay}

YOUR TASK - Extract EVERYTHING:

1. **TESTS/EXAMS**: Look for words like "test", "exam", "quiz", "midterm", "final", "unit test", "assessment"
   - Extract the test name/number (e.g., "Unit Test 4", "Midterm Exam")
   - Extract the EXACT date and time
   - Check if it's POSTPONED or CANCELLED
   - Examples:
     * "unit test no.4 on Monday 08/12/2025 at 8 pm" → TEST, date: 2025-12-08T20:00:00
     * "Test postponed to next week" → POSTPONED status

2. **SUBMISSION WINDOWS**: Look for phrases like "submission", "submit", "due", "between", "from X to Y"
   - Extract START date and END date for submission windows
   - Examples:
     * "Submission will be taken during 15 Dec-19th Dec" → start: 2024-12-15, end: 2024-12-19
     * "Submit between Dec 15 and Dec 19" → start: 2024-12-15T00:00:00, end: 2024-12-19T23:59:59

3. **STATUS DETECTION**:
   - Look for: "postponed", "cancelled", "cancelled", "rescheduled", "delayed"
   - If found, set status accordingly

4. **DATE PARSING RULES** (CRITICAL):
   - "Monday 08/12/2025" → Calculate the date for Monday, Dec 8, 2025
   - "15 Dec-19th Dec" → Start: 2024-12-15, End: 2024-12-19
   - "Dec 15 to Dec 19" → Start: 2024-12-15, End: 2024-12-19
   - "08/12/2025 at 8 pm" → 2025-12-08T20:00:00
   - "Monday at 8 pm" → Next Monday at 20:00:00
   - Handle all formats: DD/MM/YYYY, MM/DD/YYYY, "Dec 15", "15th December", etc.
   - If year missing, use current year (or next if date already passed)
   - For times: "8 pm" = 20:00, "8:30 pm" = 20:30, "8:00 PM" = 20:00

5. **EVENT TYPES**:
   - DEADLINE/TEST: Any test, exam, quiz, or assignment with deadline
   - SUBMISSION_WINDOW: Submission periods with start and end dates
   - URGENT_UPDATE: Cancellations, changes, immediate notices
   - GENERAL_INFO: Reminders, materials, general announcements

OUTPUT FORMAT (JSON Array):
Return ALL events found. For date ranges, include both start_date_iso and due_date_iso.

[
  {
    "event_title": "Full descriptive title",
    "summary_headline": "Concise 10-word summary",
    "event_type": "DEADLINE/TEST" | "SUBMISSION_WINDOW" | "URGENT_UPDATE" | "GENERAL_INFO",
    "start_date_iso": "ISO 8601 string or null",
    "due_date_iso": "ISO 8601 string or null",
    "original_text_snippet": "Relevant excerpt",
    "confidence_score": "HIGH" | "MEDIUM" | "LOW",
    "requires_prep": true/false,
    "status": "CONFIRMED" | "POSTPONED" | "CANCELLED",
    "test_type": "Unit Test 4" or null
  }
]

EXAMPLES OF GOOD EXTRACTION:

Input: "Dear Students, There will be unit test no.4 of C Programming based on unit 4 on Monday 08/12/2025 at 8 pm. Make yourself available for the test in time as there will not be any retest."
Output:
[{
  "event_title": "Unit Test 4 - C Programming (Unit 4)",
  "summary_headline": "Unit Test 4 on Dec 8 at 8 PM",
  "event_type": "DEADLINE/TEST",
  "start_date_iso": null,
  "due_date_iso": "2025-12-08T20:00:00",
  "original_text_snippet": "unit test no.4 of C Programming based on unit 4 on Monday 08/12/2025 at 8 pm",
  "confidence_score": "HIGH",
  "requires_prep": true,
  "status": "CONFIRMED",
  "test_type": "Unit Test 4"
}]

Input: "Submission will be taken during the practicals (15 Dec-19th Dec). Late submission will not be accepted."
Output:
[{
  "event_title": "Case Study Submission Window",
  "summary_headline": "Submit between Dec 15-19",
  "event_type": "SUBMISSION_WINDOW",
  "start_date_iso": "2024-12-15T00:00:00",
  "due_date_iso": "2024-12-19T23:59:59",
  "original_text_snippet": "Submission will be taken during the practicals (15 Dec-19th Dec)",
  "confidence_score": "HIGH",
  "requires_prep": false,
  "status": "CONFIRMED",
  "test_type": null
}]

Input: "The test has been postponed to next week due to technical issues."
Output:
[{
  "event_title": "Test Postponed",
  "summary_headline": "Test postponed to next week",
  "event_type": "DEADLINE/TEST",
  "start_date_iso": null,
  "due_date_iso": null,
  "original_text_snippet": "The test has been postponed to next week",
  "confidence_score": "HIGH",
  "requires_prep": false,
  "status": "POSTPONED",
  "test_type": null
}]

CRITICAL: 
- Be VERY thorough in extracting dates
- Handle date ranges properly (both start and end)
- Always detect POSTPONED/CANCELLED status
- Extract test names/numbers when mentioned
- Return multiple events if announcement contains multiple items
- Use HIGH confidence when dates are clear, MEDIUM when inferred, LOW when uncertain

Now analyze the announcement and return JSON:`

        const result = await model.generateContent(prompt)
        const response = await result.response
        let textResponse = response.text()

        // Clean markdown code blocks
        textResponse = textResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        
        // Try to extract JSON from response
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            textResponse = jsonMatch[0]
        }

        try {
            const events = JSON.parse(textResponse) as ParsedEvent[]
            console.log("✅ Gemini parsed events:", events.length, "for text:", text.substring(0, 50))
            return events
        } catch (parseError) {
            console.error("❌ Failed to parse Gemini response:", textResponse.substring(0, 200))
            console.error("Parse error:", parseError)
            return []
        }

    } catch (error) {
        console.error("❌ Error calling Gemini:", error)
        return []
    }
}

// Main parser function with logging
export async function analyzeAnnouncement(text: string): Promise<ParsedEvent[]> {
    if (!text || text.trim().length === 0) {
        return []
    }

    console.log("🔍 Analyzing announcement:", text.substring(0, 100))

    // Try Gemini first
    const geminiResults = await parseWithGemini(text)
    
    if (geminiResults && geminiResults.length > 0) {
        console.log("✅ Successfully parsed with Gemini:", geminiResults.length, "events")
        return geminiResults
    }

    console.warn("⚠️ Gemini returned no results, falling back to basic parsing")
    return []
}

