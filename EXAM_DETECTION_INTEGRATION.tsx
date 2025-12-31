/**
 * EXAM DETECTION INTEGRATION GUIDE
 * 
 * This file shows how to integrate the ExamDetectionModal component
 * into your existing application (e.g., dashboard, course pages, etc.)
 */

import { useState } from "react";
import { ExamDetectionModal } from "@/components/exam-detection-modal";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

/**
 * Example 1: Dashboard Integration
 * Add a floating action button to trigger exam detection
 */
export function DashboardWithExamDetection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your existing dashboard content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        {/* Dashboard content here */}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        title="Auto-detect exam from text"
      >
        <Wand2 className="w-6 h-6" />
      </button>

      {/* Modal */}
      <ExamDetectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

/**
 * Example 2: Course Page Integration
 * Add exam detection button in course header
 */
export function CoursePageWithExamDetection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold">Computer Science 101</h1>
          <p className="text-gray-600">Fundamentals of Programming</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
          variant="outline"
        >
          <Wand2 className="w-4 h-4" />
          Quick Add Exam
        </Button>
      </div>

      {/* Course Content */}
      <div className="space-y-4">
        {/* Announcements, assignments, etc. */}
      </div>

      <ExamDetectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

/**
 * Example 3: Announcement Processing
 * Automatically detect exams from announcement text
 * (UI shows exam detection after processing)
 */
export function AnnouncementWithExamDetection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcementText] = useState(`
    IMPORTANT NOTICE:
    
    All students must note that the Mid-Semester Examination for 
    Computer Science will be held on:
    
    📅 Date: March 15, 2024
    🕐 Time: 10:00 AM - 12:30 PM
    📍 Location: Engineering Building, Room 201
    
    Duration: 2.5 hours
    Format: 50% MCQ, 50% Short Answer
    
    Please bring your student ID and calculator.
  `);

  const handleDetectExamFromAnnouncement = () => {
    // In a real app, you might pre-fill the modal with the announcement text
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Announcement Display */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
        <h2 className="text-lg font-bold mb-4">Important Announcement</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{announcementText}</p>
      </div>

      {/* Action Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleDetectExamFromAnnouncement}
          className="gap-2"
        >
          <Wand2 className="w-4 h-4" />
          Auto-Detect Exam Date
        </Button>
        <Button variant="outline">Dismiss</Button>
      </div>

      <ExamDetectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

/**
 * Example 4: Bulk Import Integration
 * Process multiple exam notices or OCR outputs
 */
export function BulkExamDetection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pastedContent, setPastedContent] = useState("");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Bulk Exam Detection</h1>
      <p className="text-gray-600">
        Paste multiple exam announcements or notices (one per line or separated by empty lines)
      </p>

      <textarea
        value={pastedContent}
        onChange={(e) => setPastedContent(e.target.value)}
        placeholder="Paste exam details here..."
        className="w-full h-40 p-4 border rounded-lg font-mono text-sm"
      />

      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={!pastedContent.trim()}
        className="w-full"
      >
        Start Auto-Detecting Exams
      </Button>

      <ExamDetectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setPastedContent("");
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST
 * 
 * ✓ Import ExamDetectionModal component
 * ✓ Add useState for modal open/close state
 * ✓ Add trigger button (floating, inline, menu option)
 * ✓ Pass isOpen and onClose props to modal
 * ✓ Test with sample exam text
 * ✓ Verify event appears in Google Calendar
 * ✓ Test timezone handling
 * ✓ Test error scenarios (network, auth)
 * 
 * STYLING NOTES
 * 
 * The modal uses Tailwind CSS and Radix UI components from your existing setup.
 * Match your app's design system by adjusting colors:
 * 
 * - Primary: blue-600 → Change to your brand color
 * - Success: green-600 → Match your success state
 * - Error: red-600 → Match your error state
 * 
 * Lucide icons used:
 * - Calendar: Header icon
 * - Loader2: Loading states
 * - CheckCircle2: Success state
 * - AlertCircle: Error state
 * - Wand2: Action button (suggested)
 */

/**
 * CUSTOMIZATION OPTIONS
 * 
 * 1. Pre-fill Modal with Text:
 *    Pass initial text via prop (requires modal update)
 * 
 * 2. Change Modal Size:
 *    Edit max-w-2xl in ExamDetectionModal
 * 
 * 3. Auto-close on Success:
 *    Currently auto-closes after success, can be changed
 * 
 * 4. Notification Integration:
 *    Add toast notification when event created
 * 
 * 5. Event Preview:
 *    Add calendar preview showing event on map
 */
