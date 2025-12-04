"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface GeminiEvent {
    title: string
    date: string // ISO string or specific format
    type: "TEST" | "ASSIGNMENT" | "EVENT"
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
        
        IMPORTANT:
        1. Assume the user is in India Standard Time (IST).
        2. Dates in the text are likely in DD/MM/YYYY format (e.g., 08/12/2025 is December 8th, 2025).
        3. If a time is mentioned (e.g., "8 pm"), combine it with the date.
        4. Return the "date" field as a valid ISO 8601 string (e.g., "2025-12-08T20:00:00.000Z"). 
           - If the event is at 8 PM IST, convert it to UTC or return it with the offset (e.g. 2025-12-08T20:00:00+05:30).
           - If you return UTC, ensure it corresponds to the correct IST time (8 PM IST = 2:30 PM UTC).
        
        Output format (JSON only, no markdown):
        [
            {
                "title": "Short title of the event",
                "date": "ISO 8601 date string",
                "type": "TEST" | "ASSIGNMENT" | "EVENT",
                "confidence": number (0-1),
                "summary": "Brief summary of the announcement"
            }
        ]
        
        If no specific event with a date is found, return an empty array.
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
