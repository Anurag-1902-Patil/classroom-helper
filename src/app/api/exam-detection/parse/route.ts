import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GeminiService } from "@/lib/gemini-service";

/**
 * POST /api/exam-detection/parse
 * 
 * Analyzes user input to detect exam/test events
 * 
 * Request body:
 * {
 *   "input": "string - user input (text, transcript, or OCR output)",
 *   "userTimezone": "string - optional user timezone (default: America/New_York)"
 * }
 * 
 * Response:
 * Success (event detected):
 * {
 *   "success": true,
 *   "event": {
 *     "event_title": "Physics Mid-term Exam",
 *     "date": "2024-02-15",
 *     "start_time": "14:00",
 *     "end_time": "16:00",
 *     "event_type": "exam",
 *     "confidence_score": 0.95,
 *     "subject": "Physics",
 *     "additional_notes": "Room 201, bring ID"
 *   }
 * }
 * 
 * Failure (no event detected):
 * {
 *   "success": false,
 *   "reason": "NO_EVENT_DETECTED",
 *   "message": "Could not detect an exam/test event in the provided input"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, reason: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { input, userTimezone } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { success: false, reason: "INVALID_INPUT", message: "Input must be a non-empty string" },
        { status: 400 }
      );
    }

    // Initialize Gemini service
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { success: false, reason: "SERVER_ERROR", message: "AI service not configured" },
        { status: 500 }
      );
    }

    const geminiService = new GeminiService(geminiApiKey);

    // Extract event using Gemini
    const extractionResult = await geminiService.extractEvent(input);

    if (!extractionResult.success) {
      return NextResponse.json(
        {
          success: false,
          reason: extractionResult.reason,
          message: "Could not detect an exam/test event in the provided input",
        },
        { status: 200 } // 200 because this is not an error, just no event found
      );
    }

    // Return extracted event for user confirmation
    return NextResponse.json(
      {
        success: true,
        event: extractionResult.event,
        userTimezone: userTimezone || "America/New_York",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Parse endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        reason: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
