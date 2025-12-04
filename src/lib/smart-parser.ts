import { analyzeAnnouncement, GeminiEvent } from "@/app/actions/gemini"

export interface DetectedEvent {
    title: string
    date: Date
    type: "TEST" | "ASSIGNMENT" | "EVENT"
    confidence: number
    sourceText: string
    courseId?: string
}

export async function parseAnnouncementText(text: string, courseId?: string): Promise<DetectedEvent[]> {
    const events: DetectedEvent[] = []

    // 1. Try Gemini Analysis
    try {
        const geminiEvents = await analyzeAnnouncement(text)

        if (geminiEvents && geminiEvents.length > 0) {
            geminiEvents.forEach(gEvent => {
                const date = new Date(gEvent.date)
                if (!isNaN(date.getTime())) {
                    events.push({
                        title: gEvent.title,
                        date: date,
                        type: gEvent.type,
                        confidence: gEvent.confidence,
                        sourceText: text,
                        courseId
                    })
                }
            })
            return events
        }
    } catch (e) {
        console.error("Gemini analysis failed, falling back to regex", e)
    }

    // 2. Fallback to Regex (Basic)
    // Regex for dates: 
    // 1. Month DD (e.g., "Dec 5", "December 5th")
    // 2. MM/DD (e.g., "12/5")
    const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b|\b(\d{1,2})\/(\d{1,2})\b/gi

    // Simple regex implementation for fallback (can be expanded if needed)
    // For now, we rely mainly on Gemini as requested.

    return events
}
