"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

interface DetectedEvent {
  title: string
  summary?: string
  date?: string
  startDate?: string
  endDate?: string
  type: "TEST" | "ASSIGNMENT" | "EVENT" | "URGENT" | "INFO" | "SUBMISSION_WINDOW"
  status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
  testType?: string
}

async function parseWithGemini(text: string, postedDate?: string): Promise<DetectedEvent[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  })

  // Calculate current context date
  const contextDate = postedDate ? new Date(postedDate) : new Date()
  const formattedContextDate = contextDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const prompt = `You are an AI that extracts event information from text. A professor posted this announcement on ${formattedContextDate}.

CRITICAL DATE RULES:
1. The CURRENT CONTEXT is ${formattedContextDate} (when this was posted).
2. If the text says "next week" or "coming week", calculate from ${formattedContextDate}.
3. EXAMPLE: Posted Nov 7, 2025 + "Coming week" = Nov 14, 2025
4. If a specific date is mentioned (like "Unit Test on Dec 5"), use the YEAR from the posting context if no year is specified.
5. If an event is marked POSTPONED or CANCELLED, still extract its original date.

Extract ALL events/deadlines from this text:
"""
${text}
"""

Return a JSON array of objects with this schema:
{
  "events": [
    {
      "title": "Brief event name",
      "summary": "One sentence summary",
      "date": "YYYY-MM-DD format (for single-date events)",
      "startDate": "YYYY-MM-DD (for date ranges like submission windows)",
      "endDate": "YYYY-MM-DD (for date ranges)",
      "type": "TEST | ASSIGNMENT | EVENT | URGENT | INFO | SUBMISSION_WINDOW",
      "status": "CONFIRMED | POSTPONED | CANCELLED",
      "testType": "e.g., Unit Test 4 (only for tests)"
    }
  ]
}

Rules:
- Use "SUBMISSION_WINDOW" for date ranges (e.g., "submit between Dec 1-5").
- Use "TEST" for exams/quizzes.
- Use "URGENT" for postponements/cancellations/critical updates.
- Use "INFO" for general announcements with no action needed.
- For "POSTPONED" tests, mark status as "POSTPONED" but keep the NEW date if mentioned.`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  try {
    const parsed = JSON.parse(responseText)
    return parsed.events || []
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", responseText)
    return []
  }
}

export async function analyzeAnnouncement(text: string, postedDate?: string): Promise<DetectedEvent[]> {
  if (!text || text.trim().length === 0) {
    return []
  }

  try {
    const events = await parseWithGemini(text, postedDate)
    console.log(`✅ Gemini detected ${events.length} events`)
    return events
  } catch (error) {
    console.error("❌ Gemini parsing error:", error)
    return []
  }
}
