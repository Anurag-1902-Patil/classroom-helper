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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
        System Instruction: Academic Event & Summary Parser

        Role:
        You are an AI assistant for a student dashboard. Your goal is to extract events AND generate a concise "Smart Summary" for every announcement.

        Input Context:
        reference_date: "${new Date().toISOString()}" (Current ISO Date)
        text: "${text}"

        Your Task:
        1. Analyze the text for any events, deadlines, or important updates.
        2. Generate a **Summary Headline** (Max 10 words) that captures the core message.
        3. Classify the event type strictly.

        Extraction Rules:

        1. Event Types (STRICT):
           - DEADLINE/TEST: Exams, quizzes, assignments with a due date. (High Priority)
           - URGENT_UPDATE: Class cancellations, room changes, immediate requirements. (Highest Priority)
           - GENERAL_INFO: Reminders, materials to bring, general announcements. (Standard Priority)

        2. Summary Headline:
           - MAX 10 WORDS.
           - Be direct and actionable.
           - Example: "Math Test Tomorrow: Study Chapter 3" or "Class Cancelled: Stay Home".

        3. Date Resolution:
           - Assume **India Standard Time (IST)**.
           - If "Due this Friday", calculate exact ISO date.
           - If NO specific date is mentioned (e.g., general info), set "due_date_iso" to null.
           - **Postponed**: If postponed with new date, use it. If no new date, set date to null and status to "POSTPONED".

        4. Noise Filtering:
           - Ignore "Good morning", "Hope you are well".
           - Focus on the *actionable* content.

        Output Format (JSON Array):
        [
          {
            "event_title": "String (Full Title)",
            "summary_headline": "String (Max 10 words)",
            "event_type": "DEADLINE/TEST" | "URGENT_UPDATE" | "GENERAL_INFO",
            "due_date_iso": "ISO 8601 String or null",
            "original_text_snippet": "String",
            "confidence_score": "HIGH" | "MEDIUM" | "LOW",
            "requires_prep": Boolean,
            "status": "CONFIRMED" | "POSTPONED" | "CANCELLED" (Default: CONFIRMED)
          }
        ]
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
