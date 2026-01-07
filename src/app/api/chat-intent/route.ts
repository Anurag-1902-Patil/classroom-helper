
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 })
    }

    try {
        const { message } = await req.json()
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
        You are a smart classroom assistant query parser.
        User Query: "${message}"

        Your job is to extract search criteria from the user's query to help find relevant study materials.
        
        Return a JSON object with the following structure:
        {
            "intent": "search" | "greeting" | "unknown",
            "reply": "Optional conversational reply (only for greetings or unknown)",
            "criteria": {
                "courseName": string | null, // e.g., "Biology", "Math"
                "topic": string | null, // e.g., "Genetics", "Unit 5"
                "type": "ASSIGNMENT" | "TEST" | "MATERIAL" | null,
                "fileFormat": "PDF" | "PPT" | "DOC" | "FORM" | "VIDEO" | null // If they ask for specific file types
            }
        }

        Rules:
        - If the user asks for "notes", "materials", "docs", treat it as intent="search".
        - If the user explicitly asks for "PDFs", set fileFormat="PDF".
        - If the user asks for "slides", "ppts", "presentations", set fileFormat="PPT".
        - If "forms" or "quizzes", set fileFormat="FORM".
        - If "videos" or "recordings", set fileFormat="VIDEO".
        - If the user asks "Do I have a test?", treat it as intent="search" with type="TEST".
        - If the user says "Hi" or "Hello", treat as intent="greeting".
        - Extract the specific course name if mentioned.
        - Extract keywords like "Unit 5", "Chapter 1", "DNA" into "topic".
        - Return ONLY raw JSON. No markdown formatting.
        `

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // Clean markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        return NextResponse.json(JSON.parse(cleanText))

    } catch (error) {
        console.error("Chat parsing error:", error)
        return NextResponse.json({ error: "Failed to parse query" }, { status: 500 })
    }
}
