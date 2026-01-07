import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json()

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            },
        })

        const prompt = `You are a chatbot intent classifier for a student study assistant app.

User Message: "${message}"

Your task:
1. Determine if this is a "greeting", "search", or "other".
2. If "search", extract search criteria:
   - courseName: e.g., "Math", "Biology"
   - type: "TEST", "ASSIGNMENT", or null
   - keywords: ARRAY of keywords (break down ranges like "Unit 3-5" into ["Unit 3", "Unit 4", "Unit 5"])
   - fileFormat: "PDF", "PPT", "DOC", "FORM", "VIDEO", or null

CRITICAL: For ranges like "Unit 3 - 5" or "Unit 3-5", expand into individual units: ["Unit 3", "Unit 4", "Unit 5"].
CRITICAL: Aggressively deconstruct phrases. "Physics Unit 3-5 and Question Bank" → ["Physics", "Unit 3", "Unit 4", "Unit 5", "Question Bank"].

Return JSON:
{
  "intent": "greeting | search | other",
  "reply": "A friendly response (for greetings)",
  "criteria": {
    "courseName": "string or null",
    "type": "TEST | ASSIGNMENT | null",
    "keywords": ["array", "of", "keywords"],
    "fileFormat": "PDF | PPT | DOC | FORM | VIDEO | null"
  }
}

Examples:
- "Show me Math assignments" → intent: "search", criteria: { courseName: "Math", type: "ASSIGNMENT", keywords: ["Math", "assignments"] }
- "Unit 3 - 5" → intent: "search", criteria: { keywords: ["Unit 3", "Unit 4", "Unit 5"] }
- "Physics Unit 3-5 PDFs" → intent: "search", criteria: { courseName: "Physics", keywords: ["Physics", "Unit 3", "Unit 4", "Unit 5", "PDFs"], fileFormat: "PDF" }
- "Hello" → intent: "greeting", reply: "Hi! How can I help you study today?"`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        try {
            const parsed = JSON.parse(responseText)
            return NextResponse.json(parsed)
        } catch (e) {
            console.error("Failed to parse Gemini response:", responseText)
            return NextResponse.json({
                intent: "other",
                reply: "I'm not sure I understand. Try asking for specific materials.",
            })
        }
    } catch (error) {
        console.error("Chat intent error:", error)
        return NextResponse.json(
            { error: "Failed to process intent" },
            { status: 500 }
        )
    }
}
