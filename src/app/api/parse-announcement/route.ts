import { NextRequest, NextResponse } from "next/server"
import { analyzeAnnouncement } from "@/app/actions/ai-parser"

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json()

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            )
        }

        console.log("🔍 API: Analyzing announcement:", text.substring(0, 100))
        
        const events = await analyzeAnnouncement(text)
        
        console.log("✅ API: Parsed", events.length, "events")
        
        return NextResponse.json({ events })
    } catch (error) {
        console.error("❌ API: Error parsing announcement:", error)
        return NextResponse.json(
            { error: "Failed to parse announcement", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

