"use server"

// Multi-provider AI parser with fallback support
import Groq from "groq-sdk";

export interface ParsedEvent {
  event_title: string
  summary_headline: string
  event_type: "DEADLINE/TEST" | "URGENT_UPDATE" | "GENERAL_INFO" | "SUBMISSION_WINDOW"
  start_date_iso: string | null // For date ranges
  due_date_iso: string | null // Primary deadline
  original_text_snippet: string
  confidence_score: "HIGH" | "MEDIUM" | "LOW"
  requires_prep: boolean
  status?: "CONFIRMED" | "POSTPONED" | "CANCELLED"
  test_type?: string // e.g., "Unit Test 4", "Midterm", "Quiz"
}

// Groq Parser
export async function parseWithGroq(text: string, postedDate?: string): Promise<ParsedEvent[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn("Groq API key not found")
    return []
  }

  try {
    const groq = new Groq({ apiKey });

    const referenceDate = postedDate ? new Date(postedDate) : new Date()
    const referenceDateStr = referenceDate.toISOString().split('T')[0]
    const referenceYear = referenceDate.getFullYear()
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][referenceDate.getDay()]

    const prompt = `You are an expert academic event parser. Analyze this classroom announcement and extract ALL important information into a JSON array.

ANNOUNCEMENT TEXT:
"${text}"

CURRENT CONTEXT:
- Announcement Date: ${referenceDateStr} (${dayOfWeek})
- Reference Year: ${referenceYear}

YOUR TASK - Extract EVERYTHING relative to the Announcement Date:

1. **TESTS/EXAMS**: Look for words like "test", "exam", "quiz", "midterm", "final", "unit test", "assessment"
   - Extract the test name/number (e.g., "Unit Test 4", "Midterm Exam")
   - Extract the EXACT date and time via the Announcement Date context.
   - Example: If announcement date is Monday Dec 1st and says "test next Monday", date is Dec 8th.
   - Check if it's POSTPONED or CANCELLED

2. **SUBMISSION WINDOWS**: Look for phrases like "submission", "submit", "due", "between", "from X to Y"
   - Extract START date and END date for submission windows

3. **DATE PARSING RULES**:
   - "Monday 08/12" → Use Reference Year unless 08/12 is in past relative to Announcement Date.
   - "Next week" → Add 7 days to Announcement Date.

OUTPUT FORMAT (JSON Array):
[
  {
    "event_title": "Full descriptive title",
    "summary_headline": "Concise 10-word summary",
    "event_type": "DEADLINE/TEST" | "SUBMISSION_WINDOW" | "URGENT_UPDATE" | "GENERAL_INFO",
    "start_date_iso": "ISO 8601 string or null",
    "due_date_iso": "ISO 8601 string or null",
    "original_text_snippet": "Relevant excerpt",
    "confidence_score": "HIGH" | "MEDIUM" | "LOW",
    "requires_prep": true/false,
    "status": "CONFIRMED" | "POSTPONED" | "CANCELLED",
    "test_type": "Unit Test 4" or null
  }
]

Analyze the announcement and return ONLY raw JSON.`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a JSON-only response bot. Output valid JSON arrays only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    let textResponse = completion.choices[0]?.message?.content || "[]"

    // Try to extract JSON from response just in case
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      textResponse = jsonMatch[0]
    }

    try {
      const events = JSON.parse(textResponse) as ParsedEvent[]
      console.log("✅ Groq parsed events:", events.length, "for text:", text.substring(0, 50))
      return events
    } catch (parseError) {
      console.error("❌ Failed to parse Groq response:", textResponse.substring(0, 200))
      return []
    }

  } catch (error) {
    console.error("❌ Error calling Groq:", error)
    return []
  }
}

// Main parser function with logging
export async function analyzeAnnouncement(text: string, postedDate?: string): Promise<ParsedEvent[]> {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Try Groq first
  const groqResults = await parseWithGroq(text, postedDate)

  if (groqResults && groqResults.length > 0) {
    return groqResults
  }

  console.warn("⚠️ Groq returned no results, falling back to basic parsing")
  return []
}
