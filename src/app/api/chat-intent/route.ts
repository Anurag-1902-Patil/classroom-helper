
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    if (!process.env.GROQ_API_KEY) {
        console.error("DEBUG: GROQ_API_KEY is missing");
        return NextResponse.json({ error: "Groq API Key missing" }, { status: 500 });
    }

    try {
        const { message } = await req.json();
        console.log("DEBUG: Received message for Groq:", message);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a smart classroom assistant query parser.
                    Your job is to extract search criteria from the user's query to help find relevant study materials.
                    
                    Return a JSON object with the following structure:
                    {
                        "intent": "search" | "greeting" | "unknown",
                        "reply": "Optional conversational reply (only for greetings or unknown)",
                        "criteria": {
                            "courseName": string | null, // e.g., "Biology", "Math"
                            "keywords": string[] | null, // Array of search terms: ["Unit 3", "Unit 4", "Genetics"]
                            "type": "ASSIGNMENT" | "TEST" | "MATERIAL" | null,
                            "fileFormat": "PDF" | "PPT" | "DOC" | "FORM" | "VIDEO" | null
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
                    - **CRITICAL: Expand ranges.** If user says "Unit 3 - 5", return keywords: ["Unit 3", "Unit 4", "Unit 5"].
                    - Extract all important topics into "keywords".
                    - Return ONLY raw JSON. No markdown formatting.`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const jsonResponse = completion.choices[0]?.message?.content;

        if (!jsonResponse) throw new Error("Empty response from Groq");

        return NextResponse.json(JSON.parse(jsonResponse));

    } catch (error: any) {
        console.error("DEBUG: Groq parsing error:", error);
        return NextResponse.json({ error: "Failed to parse query", details: error.message }, { status: 500 });
    }
}
