import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CalendarService } from "@/lib/calendar-service";
import { ExtractedEvent } from "@/lib/gemini-service";

/**
 * POST /api/exam-detection/confirm
 * 
 * Creates a Google Calendar event after user confirmation
 * 
 * Request body:
 * {
 *   "event": {
 *     "event_title": "Physics Mid-term Exam",
 *     "date": "2024-02-15",
 *     "start_time": "14:00",
 *     "end_time": "16:00",
 *     "event_type": "exam",
 *     "confidence_score": 0.95,
 *     "subject": "Physics",
 *     "additional_notes": "Room 201, bring ID"
 *   },
 *   "userTimezone": "America/New_York" (optional)
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "message": "Event created successfully",
 *   "eventId": "abc123xyz",
 *   "calendarLink": "https://calendar.google.com/calendar/u/0/r/eventedit/abc123xyz"
 * }
 * 
 * Response (failure):
 * {
 *   "success": false,
 *   "message": "Failed to create calendar event",
 *   "error": "Calendar API error: Invalid time zone"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's Google access token from session
    // @ts-expect-error - session.accessToken is added in auth.ts
    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Google Calendar access not available" },
        { status: 401 }
      );
    }

    const { event, userTimezone } = await request.json() as {
      event: ExtractedEvent;
      userTimezone?: string;
    };

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event data is required" },
        { status: 400 }
      );
    }

    // Validate event structure
    if (
      !event.event_title ||
      !event.date ||
      !event.start_time ||
      !event.end_time
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required event fields" },
        { status: 400 }
      );
    }

    // Initialize Calendar service with user's access token
    const calendarService = new CalendarService(
      accessToken as string,
      userTimezone
    );

    // Create the calendar event
    const createResult = await calendarService.createEvent(event);

    if (!createResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create calendar event",
          error: createResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully",
        eventId: createResult.eventId,
        calendarLink: createResult.calendarLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Confirm endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
