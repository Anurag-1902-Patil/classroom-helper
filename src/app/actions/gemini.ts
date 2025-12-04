"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface GeminiEvent {
    event_title: string
    event_type: "TEST" | "QUIZ" | "SUBMISSION" | "EVENT"
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
        System Instruction: Academic Deadline & Event Extractor

        Role:
        You are a precision Academic Event Parser. Your goal is to analyze unstructured text from Google Classroom (announcements, assignment descriptions, comments) and extract specific, actionable academic events with 100% accuracy.

        Input Context:
        reference_date: "${new Date().toISOString()}" (Current ISO Date)
        text: "${text}"

        Your Task:
        Analyze the text. If it contains a hidden or explicit deadline, test date, or submission requirement, extract it.

        Extraction Rules:

        1. Event Types:
           - TEST: Major exams, midterms, finals. (High Priority)
           - QUIZ: Small assessments, pop quizzes.
           - SUBMISSION: Homework, projects, essays due.
           - EVENT: Field trips, guest lectures, special class times.

        2. Date Resolution (CRITICAL):
           - Assume the user is in **India Standard Time (IST)**.
           - If a post says "Due this Friday", calculate the exact ISO timestamp (YYYY-MM-DD) based on the reference_date.
           - If no time is specified, default to 23:59:00 (11:59 PM).
           - **Postponed Events**: 
             - If an event is postponed and a NEW DATE is given, use that new date. 
             - If NO new date is given, set "due_date_iso" to null and "status" to "POSTPONED".
             - If cancelled, set "status" to "CANCELLED".

        3. Noise Filtering:
           - Ignore general greetings or vague statements without actionable dates.
           - **IGNORE** the date the announcement was posted. Only extract the *scheduled* event date.

        4. Confidence Scoring:
           - HIGH: Date and Topic are explicitly stated.
           - MEDIUM: Relative date used (e.g., "Quiz next class").
           - LOW: Vague or ambiguous language.

        Output Format:
        You must output ONLY a valid JSON array. Do not output markdown formatting.

        JSON Schema:
        [
          {
            "event_title": "String (Concise title)",
            "event_type": "TEST" | "QUIZ" | "SUBMISSION" | "EVENT",
            "due_date_iso": "ISO 8601 String (YYYY-MM-DDTHH:mm:ss) or null",
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
