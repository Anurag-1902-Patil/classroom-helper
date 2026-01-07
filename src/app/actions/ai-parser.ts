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
export async function parseWithGroq(text: string): Promise<ParsedEvent[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn("Groq API key not found")
    return []
  }

  try {
    const groq = new Groq({ apiKey });

    const currentDate = new Date()
    const currentDateStr = currentDate.toISOString().split('T')[0]
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentDay = currentDate.getDate()
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()]

    const prompt = `You are an expert academic event parser. Analyze this classroom announcement and extract ALL important information into a JSON array.

ANNOUNCEMENT TEXT:
"${text}"

CURRENT CONTEXT:
- Today's Date: ${currentDateStr} (${dayOfWeek})
- Current Year: ${currentYear}

YOUR TASK - Extract EVERYTHING:

1. **TESTS/EXAMS**: Look for words like "test", "exam", "quiz", "midterm", "final", "unit test", "assessment"
   - Extract the test name/number (e.g., "Unit Test 4", "Midterm Exam")
   - Extract the EXACT date and time
   - Check if it's POSTPONED or CANCELLED

2. **SUBMISSION WINDOWS**: Look for phrases like "submission", "submit", "due", "between", "from X to Y"
   - Extract START date and END date for submission windows

3. **DATE PARSING RULES**:
   - "Monday 08/12/2025" → 2025-12-08
   - "Monday at 8 pm" → Next Monday at 20:00:00

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
      model: "llama3-8b-8192",
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
export async function analyzeAnnouncement(text: string): Promise<ParsedEvent[]> {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Try Groq first
  const groqResults = await parseWithGroq(text)

  if (groqResults && groqResults.length > 0) {
    return groqResults
  }

  console.warn("⚠️ Groq returned no results, falling back to basic parsing")
  return []
}
