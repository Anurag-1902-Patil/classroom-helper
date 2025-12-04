"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface GeminiEvent {
    event_title: string
    summary_headline: string
    event_type: "DEADLINE/TEST" | "URGENT_UPDATE" | "GENERAL_INFO"
    due_date_iso: string | null
    original_text_snippet: string
    confidence_score: "HIGH" | "MEDIUM" | "LOW"
    requires_prep: boolean
    status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
}

export async function analyzeAnnouncement(text: string): Promise<GeminiEvent[]> {
    if (!genAI) {
        console.warn("Gemini API key not found")
        return []
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const currentDate = new Date()
        const currentDateStr = currentDate.toISOString().split('T')[0] // YYYY-MM-DD
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1
        const currentDay = currentDate.getDate()
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()]

        const prompt = `
        System Instruction: Academic Event & Summary Parser

        Role:
        You are an AI assistant for a student dashboard. Your goal is to extract events AND generate a concise "Smart Summary" for every announcement.

        Input Context:
        Current Date: ${currentDateStr} (${dayOfWeek})
        Current Time: ${currentDate.toISOString()}
        Current Year: ${currentYear}
        Current Month: ${currentMonth}
        Current Day: ${currentDay}
        Text to analyze: "${text}"

        Your Task:
        1. Analyze the text for any events, deadlines, tests, or important updates.
        2. Generate a **Summary Headline** (Max 10 words) that captures the core message.
        3. Extract ALL dates and times mentioned in the text.
        4. Classify the event type strictly.

        CRITICAL DATE PARSING RULES:
        - Parse dates in ANY format: "Monday 08/12/2025", "Dec 15", "15 Dec-19th Dec", "08/12/2025 at 8 pm", "15 Dec-19 Dec"
        - Handle relative dates: "Monday" means the next Monday from current date
        - Handle date ranges: If submission window is "15 Dec-19th Dec", use the END date (19th Dec) as the due_date_iso
        - Handle time formats: "8 pm", "8:00 PM", "20:00", "at 8 pm" - convert to 24-hour format in ISO
        - Handle month formats: "Dec", "December", "12" - all should be recognized
        - If year is not specified, assume current year or next year if date has passed
        - For tests/exams: Extract the exact date and time mentioned
        - For submission windows: Use the LAST date of the window as the deadline
        - Always output dates in ISO 8601 format: "YYYY-MM-DDTHH:mm:ss" (include time if mentioned)

        Examples:
        - "Monday 08/12/2025 at 8 pm" → "2025-12-08T20:00:00"
        - "15 Dec-19th Dec" → "2024-12-19T23:59:59" (use end date, default to end of day)
        - "Submission will be taken during the practicals (15 Dec-19th Dec)" → "2024-12-19T23:59:59"
        - "unit test no.4 on Monday 08/12/2025 at 8 pm" → "2025-12-08T20:00:00"

        Extraction Rules:

        1. Event Types (STRICT):
           - DEADLINE/TEST: Exams, quizzes, tests, assignments with a due date or submission window. (High Priority)
             Examples: "unit test", "exam", "quiz", "assignment due", "submission"
           - URGENT_UPDATE: Class cancellations, room changes, immediate requirements, schedule changes. (Highest Priority)
             Examples: "class cancelled", "room changed", "immediate", "urgent"
           - GENERAL_INFO: Reminders, materials to bring, general announcements without specific deadlines. (Standard Priority)
             Examples: "reminder", "bring materials", "general notice"

        2. Date Extraction:
           - Extract the PRIMARY date/time for the event
           - If multiple dates mentioned, prioritize the most important one (test date > submission date > announcement date)
           - If date range given, use the END date as due_date_iso
           - If only time mentioned without date, use current date with that time
           - Always include time if mentioned, otherwise default to end of day (23:59:59)

        3. Summary Headline:
           - Must be concise (Max 10 words)
           - Should capture the essence: "Unit Test 4 on Dec 8", "Case Study Due Dec 19", "Class Cancelled Tomorrow"

        Output Format (JSON Array):
        Return an array of events found. If multiple events in one announcement, return multiple objects.
        [
          {
            "event_title": "String (Full descriptive title of the event)",
            "summary_headline": "String (Max 10 words, concise summary)",
            "event_type": "DEADLINE/TEST" | "URGENT_UPDATE" | "GENERAL_INFO",
            "due_date_iso": "ISO 8601 String (YYYY-MM-DDTHH:mm:ss) or null if no date found",
            "original_text_snippet": "String (relevant excerpt from text)",
            "confidence_score": "HIGH" | "MEDIUM" | "LOW",
            "requires_prep": Boolean,
            "status": "CONFIRMED" | "POSTPONED" | "CANCELLED" (Default: CONFIRMED)
          }
        ]

        IMPORTANT: Always extract dates even if they're in unusual formats. Be thorough in parsing dates and times.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const textResponse = response.text()

        // Clean up markdown code blocks if present
        const cleanedText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim()

        try {
            const events = JSON.parse(cleanedText) as GeminiEvent[]
            return events
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", textResponse)
            return []
        }

    } catch (error) {
        console.error("Error calling Gemini:", error)
        return []
    }
}
