"use client";

import { useState } from "react";
import { ExamDetectionModal } from "@/components/exam-detection-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wand2, Calendar } from "lucide-react";

/**
 * SAMPLE PAGE: Exam Detection Feature Demo
 * 
 * This is a complete example of how to use the ExamDetectionModal
 * in your application. Copy and adapt for your needs.
 */
export default function ExamDetectionDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Exam Auto-Detection
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Automatically parse exam details and add them to your Google Calendar
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature Description */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 bg-white">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Paste Your Exam Details
                    </h3>
                    <p className="text-slate-600">
                      Copy exam information from emails, notices, or syllabi.
                      Paste any format—we'll understand it.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      AI Extracts Key Details
                    </h3>
                    <p className="text-slate-600">
                      Gemini AI automatically identifies dates, times, subjects,
                      and location from the text.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Review & Confirm
                    </h3>
                    <p className="text-slate-600">
                      Check the extracted details and edit if needed before
                      adding to your calendar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Auto-Added to Calendar
                    </h3>
                    <p className="text-slate-600">
                      Event appears in Google Calendar with automatic reminders
                      (1 day + 1 hour before).
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Example Input */}
            <Card className="p-8 bg-white">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Example Input
              </h2>
              <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-600 font-mono text-sm text-slate-700">
                <p>
                  Computer Science 201 Final Exam
                </p>
                <p>Date: May 15, 2024</p>
                <p>Time: 2:00 PM - 4:00 PM</p>
                <p>Location: Science Building Room 401</p>
                <p>Note: Bring student ID and calculator</p>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                The AI will automatically extract: date (2024-05-15), start time
                (14:00), end time (16:00), subject (Computer Science), location,
                and confidence score.
              </p>
            </Card>

            {/* Supported Formats */}
            <Card className="p-8 bg-white">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                What We Support
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Input Types
                  </h4>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li>✓ Email announcements</li>
                    <li>✓ Course syllabi</li>
                    <li>✓ OCR text from images</li>
                    <li>✓ Voice transcripts</li>
                    <li>✓ Plain text notes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Event Types
                  </h4>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li>✓ Exams</li>
                    <li>✓ Tests</li>
                    <li>✓ Quizzes</li>
                    <li>✓ Assignments</li>
                    <li>✓ Assessments</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar: Call to Action */}
          <div className="lg:col-span-1">
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 sticky top-6">
              <div className="text-center space-y-6">
                <div>
                  <Wand2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900">
                    Ready to Try?
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Click below to open the exam detection modal and test it out
                    with your own exam details.
                  </p>
                </div>

                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Open Exam Detector
                </Button>

                <div className="pt-4 border-t border-blue-200">
                  <p className="text-xs text-slate-600 font-semibold mb-2">
                    REQUIREMENTS:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li>✓ Google Account</li>
                    <li>✓ Calendar enabled</li>
                    <li>✓ No setup needed</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <p className="text-xs text-slate-600 font-semibold mb-2">
                    FEATURES:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li>⚡ AI-powered extraction</li>
                    <li>🔄 Edit before confirming</li>
                    <li>📌 Auto reminders (1d + 1h)</li>
                    <li>🌍 Timezone aware</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* FAQ */}
            <Card className="p-6 mt-6 bg-white">
              <h3 className="font-bold text-slate-900 mb-4">FAQ</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">
                    Does it save my data?
                  </p>
                  <p className="text-slate-600 text-xs">
                    Only the calendar event is saved. Input text is not stored.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Can I edit after creating?
                  </p>
                  <p className="text-slate-600 text-xs">
                    Edit before confirming. After that, edit in Google Calendar.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Works offline?
                  </p>
                  <p className="text-slate-600 text-xs">
                    No, requires internet for AI processing.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ExamDetectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Footer */}
      <div className="mt-16 border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-600">
          <p>
            Powered by{" "}
            <span className="font-semibold text-slate-900">Google Gemini</span>{" "}
            and{" "}
            <span className="font-semibold text-slate-900">
              Google Calendar API
            </span>
          </p>
          <p className="mt-2">
            Questions? See{" "}
            <a
              href="https://github.com"
              className="text-blue-600 hover:underline"
            >
              documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
