import { ExtractedEvent } from "./gemini-service";

interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders: {
    useDefault: boolean;
    overrides: Array<{
      method: "email" | "popup" | "notification";
      minutes: number;
    }>;
  };
}

interface CalendarEventResponse {
  success: boolean;
  eventId?: string;
  error?: string;
  calendarLink?: string;
}

/**
 * Google Calendar API integration service
 * Creates calendar events from extracted exam/test data
 */
class CalendarService {
  private accessToken: string;
  private calendarId: string = "primary"; // Default user calendar
  private timezone: string = "America/New_York"; // Configurable via env

  constructor(accessToken: string, timezone?: string) {
    this.accessToken = accessToken;
    if (timezone) {
      this.timezone = timezone;
    }
  }

  /**
   * Create a calendar event from extracted exam data
   * @param extractedEvent - Event data from Gemini extraction
   * @returns Calendar API response with event ID and link
   */
  async createEvent(extractedEvent: ExtractedEvent): Promise<CalendarEventResponse> {
    try {
      // Combine date and time into ISO 8601 format
      const startDateTime = this.buildDateTime(
        extractedEvent.date,
        extractedEvent.start_time
      );
      const endDateTime = this.buildDateTime(
        extractedEvent.date,
        extractedEvent.end_time
      );

      const calendarEvent: CalendarEvent = {
        summary: extractedEvent.event_title,
        description: `Auto-detected ${extractedEvent.event_type} using AI\n${extractedEvent.additional_notes
            ? `Additional notes: ${extractedEvent.additional_notes}`
            : ""
          }`,
        start: {
          dateTime: startDateTime,
          timeZone: this.timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: this.timezone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "notification", minutes: 1440 }, // 1 day before
            { method: "notification", minutes: 60 }, // 1 hour before
          ],
        },
      };

      // Call Google Calendar API
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(calendarEvent),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Calendar API error:", errorData);
        return {
          success: false,
          error: `Calendar API error: ${errorData.error?.message || "Unknown error"}`,
        };
      }

      const createdEvent = await response.json();

      return {
        success: true,
        eventId: createdEvent.id,
        calendarLink: createdEvent.htmlLink,
      };
    } catch (error) {
      console.error("Calendar creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build ISO 8601 datetime string from date and time components
   * @param date - ISO date (YYYY-MM-DD)
   * @param time - 24-hour time (HH:MM)
   * @returns ISO 8601 datetime string
   */
  private buildDateTime(date: string, time: string): string {
    // Validate date and time format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date format: ${date}`);
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new Error(`Invalid time format: ${time}`);
    }

    return `${date}T${time}:00`;
  }

  /**
   * Get event details from calendar (for verification)
   * @param eventId - Google Calendar event ID
   */
  async getEvent(eventId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Get event error:", error);
      throw error;
    }
  }

  /**
   * Update calendar timezone
   */
  setTimezone(timezone: string): void {
    this.timezone = timezone;
  }
}

export { CalendarService };
export type { CalendarEvent, CalendarEventResponse };
