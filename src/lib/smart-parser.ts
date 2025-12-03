export interface DetectedEvent {
    title: string
    date: Date
    type: "TEST" | "ASSIGNMENT" | "EVENT"
    confidence: number
    sourceText: string
    courseId?: string
}

export function parseAnnouncementText(text: string, courseId?: string): DetectedEvent[] {
    const events: DetectedEvent[] = []

    // Regex for dates: 
    // 1. Month DD (e.g., "Dec 5", "December 5th")
    // 2. MM/DD (e.g., "12/5")
    const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b|\b(\d{1,2})\/(\d{1,2})\b/gi

    const keywords = {
        TEST: ["test", "exam", "midterm", "final", "quiz"],
        ASSIGNMENT: ["assignment", "homework", "project", "submission", "due"],
    }

    return events
}
