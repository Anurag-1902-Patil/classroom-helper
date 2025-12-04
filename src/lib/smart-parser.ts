import { analyzeAnnouncement, GeminiEvent } from "@/app/actions/gemini"

export interface DetectedEvent {
    title: string
    date?: Date
    type: "TEST" | "ASSIGNMENT" | "EVENT"
    status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
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
                let date: Date | undefined
                if (gEvent.due_date_iso) {
                    const d = new Date(gEvent.due_date_iso)
                    if (!isNaN(d.getTime())) {
                        date = d
                    }
                }

                // Map Confidence Score String to Number
                let confidence = 0.5
                if (gEvent.confidence_score === "HIGH") confidence = 0.9
                if (gEvent.confidence_score === "MEDIUM") confidence = 0.6
                if (gEvent.confidence_score === "LOW") confidence = 0.3

                // Map Event Type
                let type: "TEST" | "ASSIGNMENT" | "EVENT" = "EVENT"
                if (gEvent.event_type === "TEST" || gEvent.event_type === "QUIZ") type = "TEST"
                if (gEvent.event_type === "SUBMISSION") type = "ASSIGNMENT"
                if (gEvent.event_type === "EVENT") type = "EVENT"

                // Push if valid date OR if it has a special status (even without date)
                if (date || gEvent.status === "POSTPONED" || gEvent.status === "CANCELLED") {
                    events.push({
                        title: gEvent.event_title,
                        date: date,
                        type: type,
                        status: gEvent.status || "CONFIRMED",
                        confidence: confidence,
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
