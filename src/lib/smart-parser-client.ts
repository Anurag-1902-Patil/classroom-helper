// Client-side wrapper for parsing announcements via API route

export interface DetectedEvent {
    title: string
    summary?: string
    date?: Date
    startDate?: Date
    endDate?: Date
    type: "TEST" | "ASSIGNMENT" | "EVENT" | "URGENT" | "INFO" | "SUBMISSION_WINDOW"
    status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
    confidence: number
    sourceText: string
    courseId?: string
    testType?: string
}

export async function parseAnnouncementText(text: string, courseId?: string): Promise<DetectedEvent[]> {
    const events: DetectedEvent[] = []

    if (!text || text.trim().length === 0) {
        return events
    }

    // Check Cache first
    const cacheKey = `ai-cache-v2-${text.length}-${text.slice(0, 30)}-${text.slice(-30)}`
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            try {
                const cachedEvents = JSON.parse(cached)
                console.log("📦 Using cached events:", cachedEvents.length)
                return cachedEvents.map((e: any) => ({
                    ...e,
                    date: e.date ? new Date(e.date) : undefined,
                    startDate: e.startDate ? new Date(e.startDate) : undefined,
                    endDate: e.endDate ? new Date(e.endDate) : undefined,
                }))
            } catch (e) {
                console.error("Cache parse error", e)
            }
        }
    }

    // Call API route for parsing
    try {
        console.log("🌐 Calling API to parse announcement...")
        const response = await fetch('/api/parse-announcement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`)
        }

        const data = await response.json()
        const parsedEvents = data.events || []

        if (parsedEvents && parsedEvents.length > 0) {
            parsedEvents.forEach((pEvent: any) => {
                let date: Date | undefined
                let startDate: Date | undefined
                let endDate: Date | undefined

                // Parse due date
                if (pEvent.due_date_iso) {
                    const d = new Date(pEvent.due_date_iso)
                    if (!isNaN(d.getTime())) {
                        date = d
                    }
                }

                // Parse start date
                if (pEvent.start_date_iso) {
                    const sd = new Date(pEvent.start_date_iso)
                    if (!isNaN(sd.getTime())) {
                        startDate = sd
                    }
                }

                // Parse end date
                if (pEvent.due_date_iso && pEvent.event_type === "SUBMISSION_WINDOW") {
                    const ed = new Date(pEvent.due_date_iso)
                    if (!isNaN(ed.getTime())) {
                        endDate = ed
                        if (!date) date = ed
                    }
                } else if (pEvent.due_date_iso) {
                    const ed = new Date(pEvent.due_date_iso)
                    if (!isNaN(ed.getTime())) {
                        date = ed
                    }
                }

                // Map Confidence Score
                let confidence = 0.5
                if (pEvent.confidence_score === "HIGH") confidence = 0.9
                if (pEvent.confidence_score === "MEDIUM") confidence = 0.6
                if (pEvent.confidence_score === "LOW") confidence = 0.3

                // Map Event Type
                let type: DetectedEvent["type"] = "EVENT"
                if (pEvent.event_type === "DEADLINE/TEST") type = "TEST"
                if (pEvent.event_type === "URGENT_UPDATE") type = "URGENT"
                if (pEvent.event_type === "GENERAL_INFO") type = "INFO"
                if (pEvent.event_type === "SUBMISSION_WINDOW") type = "SUBMISSION_WINDOW"

                // Create event
                const baseEvent: DetectedEvent = {
                    title: pEvent.event_title,
                    summary: pEvent.summary_headline,
                    date: date || endDate,
                    startDate: startDate,
                    endDate: endDate,
                    type: type,
                    status: pEvent.status || "CONFIRMED",
                    confidence: confidence,
                    sourceText: text,
                    courseId,
                    testType: pEvent.test_type
                }

                // Always include if it has dates, status, or is urgent/submission window
                if (date || startDate || endDate || 
                    pEvent.status === "POSTPONED" || 
                    pEvent.status === "CANCELLED" || 
                    type === "URGENT" || 
                    type === "SUBMISSION_WINDOW") {
                    events.push(baseEvent)
                }
            })

            // Save to Cache
            if (typeof window !== 'undefined' && events.length > 0) {
                localStorage.setItem(cacheKey, JSON.stringify(events))
            }

            console.log(`✅ Parsed ${events.length} events from announcement`)
            return events
        }
    } catch (error) {
        console.error("❌ API parsing failed:", error)
    }

    console.warn("⚠️ No events extracted from announcement")
    return events
}

