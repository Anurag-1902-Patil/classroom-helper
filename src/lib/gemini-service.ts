import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ExtractedEvent {
    event_title: string;
    date: string; // ISO format (YYYY-MM-DD)
    start_time: string; // HH:MM (24-hour format)
    end_time: string; // HH:MM (24-hour format)
    event_type: "exam" | "test" | "quiz" | "assignment" | "unknown";
    confidence_score: number; // 0-1
    subject?: string;
    additional_notes?: string;
}

type EventExtractionResult =
    | { success: true; event: ExtractedEvent }
    | { success: false; reason: string };

/**
 * Gemini-based event extraction service
 * Parses unstructured user input to detect and extract exam/test details
 */
class GeminiService {
    private model: any;

    constructor(apiKey: string) {
        const ai = new GoogleGenerativeAI(apiKey);
        this.model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });
    }

    /**
     * Parse user input and extract event details using Gemini
     * @param userInput - Raw user input (text, transcript, OCR output)
     * @returns Extracted event or failure reason
     */
    async extractEvent(userInput: string): Promise<EventExtractionResult> {
        try {
            const prompt = `You are an academic event extraction AI. Analyze this input and detect if it mentions an exam, test, quiz, or assessment.

STRICT RULES:
1. ONLY respond with valid JSON
2. If confidence < 0.6, respond with: {"success": false, "reason": "NO_EVENT_DETECTED"}
3. Extract ONLY if the input clearly mentions a test/exam/quiz/assessment date
4. For ambiguous dates ("next week", "coming Friday"), make reasonable assumptions and set lower confidence (0.5-0.7)
5. For missing end times, estimate 2 hours after start time
6. For missing times, use "09:00" as default
7. Always use ISO 8601 date format (YYYY-MM-DD) and 24-hour time format (HH:MM)

If you detect an event, respond with this JSON structure:
{
  "success": true,
  "event": {
    "event_title": "string (e.g., 'Mathematics Mid-term Exam')",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "event_type": "exam|test|quiz|assignment",
    "confidence_score": number (0-1),
    "subject": "string (optional, e.g., 'Mathematics')",
    "additional_notes": "string (optional, any additional context)"
  }
}

If NO event detected:
{
  "success": false,
  "reason": "NO_EVENT_DETECTED"
}

User input to analyze:
"""
${userInput}
"""`;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            try {
                const parsedResponse = JSON.parse(responseText);

                if (!parsedResponse.success) {
                    return { success: false, reason: parsedResponse.reason };
                }

                const event = parsedResponse.event as ExtractedEvent;

                // Validate extracted event
                if (!this.isValidEvent(event)) {
                    return { success: false, reason: "INVALID_EVENT_DATA" };
                }

                return { success: true, event };
            } catch (parseError) {
                console.error("Failed to parse Gemini response:", responseText);
                return { success: false, reason: "PARSING_ERROR" };
            }
        } catch (error) {
            console.error("Gemini extraction error:", error);
            return {
                success: false,
                reason: error instanceof Error ? error.message : "UNKNOWN_ERROR",
            };
        }
    }

    /**
     * Validate extracted event structure
     */
    private isValidEvent(event: any): boolean {
        // Check required fields
        if (
            !event.event_title ||
            !event.date ||
            !event.start_time ||
            !event.end_time ||
            event.confidence_score === undefined
        ) {
            return false;
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
            return false;
        }

        // Validate time format (HH:MM)
        if (!/^\d{2}:\d{2}$/.test(event.start_time)) {
            return false;
        }
        if (!/^\d{2}:\d{2}$/.test(event.end_time)) {
            return false;
        }

        // Validate confidence score
        if (
            typeof event.confidence_score !== "number" ||
            event.confidence_score < 0 ||
            event.confidence_score > 1
        ) {
            return false;
        }

        // Validate event type
        const validTypes = ["exam", "test", "quiz", "assignment", "unknown"];
        if (!validTypes.includes(event.event_type)) {
            return false;
        }

        return true;
    }
}

export { GeminiService };
export type { ExtractedEvent, EventExtractionResult };
