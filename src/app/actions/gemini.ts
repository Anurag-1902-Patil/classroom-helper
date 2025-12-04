"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface GeminiEvent {
    title: string
    date: string | null // ISO string or specific format
    type: "TEST" | "ASSIGNMENT" | "EVENT"
    status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
    confidence: number
    summary: string
}

export async function analyzeAnnouncement(text: string): Promise<GeminiEvent[]> {
    if (!genAI) {
        console.warn("Gemini API key not found")
        return []
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
        Analyze the following classroom announcement and extract any specific events, tests, or assignments with their due dates or scheduled times.
        Return the result as a JSON array of objects.
        
        Announcement: "${text}"
        
        Current Date: ${new Date().toISOString()}
        
        IMPORTANT RULES:
        1. **IGNORE Announcement Date**: Do NOT use the date the announcement was posted or created. Only look for dates referring to when the event/test/assignment is *scheduled* to happen.
        2. **IST Timezone**: Assume the user is in India Standard Time (IST).
        3. **Date Format**: Dates in text are likely DD/MM/YYYY.
        4. **Postponed Events**:
           - If an event is postponed and a **NEW DATE** is given, use that new date.
           - If an event is postponed but **NO NEW DATE** is mentioned (e.g., "postponed until further notice"), set "date" to null or empty string, and status to "POSTPONED".
           - Do NOT default to today's date.
        5. **Past Events**: If the event date extracted is in the past (before Current Date), still return it, but ensure the date is correct.
        
        Output format (JSON only, no markdown):
        [
            {
                "title": "Short title of the event",
                "date": "ISO 8601 date string or null",
                "type": "TEST" | "ASSIGNMENT" | "EVENT",
                "status": "CONFIRMED" | "POSTPONED" | "CANCELLED",
                "confidence": number (0-1),
                "summary": "Brief summary of the announcement"
            }
        ]
        
        If no specific event is found, return an empty array.
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
