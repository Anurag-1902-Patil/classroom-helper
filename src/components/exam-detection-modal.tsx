"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import type { ExtractedEvent } from "@/lib/gemini-service";

interface ExamDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProcessingState = "input" | "parsing" | "confirmation" | "creating" | "success" | "error";

interface DetectionError {
  reason: string;
  message: string;
}

/**
 * Exam Detection Modal Component
 * 
 * Flow:
 * 1. Input: User enters unstructured text about exam
 * 2. Parsing: AI processes input (Gemini)
 * 3. Confirmation: User reviews extracted details
 * 4. Creating: Calendar event is created
 * 5. Success: Event added to calendar
 * 6. Error: Handles failures gracefully
 */
export function ExamDetectionModal({
  isOpen,
  onClose,
}: ExamDetectionModalProps) {
  const [state, setState] = useState<ProcessingState>("input");
  const [userInput, setUserInput] = useState("");
  const [extractedEvent, setExtractedEvent] = useState<ExtractedEvent | null>(null);
  const [error, setError] = useState<DetectionError | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [editedEvent, setEditedEvent] = useState<ExtractedEvent | null>(null);

  // Reset modal state
  const handleReset = () => {
    setState("input");
    setUserInput("");
    setExtractedEvent(null);
    setError(null);
    setSuccessMessage("");
    setEditedEvent(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  /**
   * Step 1: Send raw input to backend for parsing
   */
  const handleParseInput = async () => {
    if (!userInput.trim()) {
      setError({ reason: "EMPTY_INPUT", message: "Please enter exam details" });
      return;
    }

    setState("parsing");
    setError(null);

    try {
      const response = await fetch("/api/exam-detection/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userInput,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();

      if (data.success && data.event) {
        setExtractedEvent(data.event);
        setEditedEvent(data.event); // Allow user to edit
        setState("confirmation");
      } else {
        setError({
          reason: data.reason,
          message: data.message || "Could not detect an exam event",
        });
        setState("error");
      }
    } catch (err) {
      setError({
        reason: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      });
      setState("error");
    }
  };

  /**
   * Step 2: Send confirmed event to backend for calendar creation
   */
  const handleConfirmEvent = async () => {
    if (!editedEvent) return;

    setState("creating");
    setError(null);

    try {
      const response = await fetch("/api/exam-detection/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: editedEvent,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          `✓ Event "${editedEvent.event_title}" added to Google Calendar`
        );
        setState("success");
      } else {
        setError({
          reason: "CREATION_ERROR",
          message: data.error || "Failed to create calendar event",
        });
        setState("error");
      }
    } catch (err) {
      setError({
        reason: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      });
      setState("error");
    }
  };

  const handleEditField = (field: keyof ExtractedEvent, value: any) => {
    if (editedEvent) {
      setEditedEvent({ ...editedEvent, [field]: value });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold">Auto-Detect Exam</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* INPUT STATE */}
        {state === "input" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste exam details (text, transcript, or OCR):
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Example: Mathematics exam on February 15, 2024 at 2 PM in Room 201. Exam will last 2 hours. Bring student ID."
                className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleParseInput}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Analyze Input
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* PARSING STATE */}
        {state === "parsing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Analyzing with AI...</p>
          </div>
        )}

        {/* CONFIRMATION STATE */}
        {state === "confirmation" && editedEvent && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Review Extracted Event
              </h3>
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium">
                    Event Title
                  </label>
                  <Input
                    value={editedEvent.event_title}
                    onChange={(e) =>
                      handleEditField("event_title", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>

                {/* Subject */}
                {editedEvent.subject && (
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={editedEvent.subject}
                      onChange={(e) =>
                        handleEditField("subject", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={editedEvent.date}
                      onChange={(e) =>
                        handleEditField("date", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <Input
                        type="time"
                        value={editedEvent.start_time}
                        onChange={(e) =>
                          handleEditField("start_time", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        value={editedEvent.end_time}
                        onChange={(e) =>
                          handleEditField("end_time", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Type and Confidence */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Event Type</label>
                    <select
                      value={editedEvent.event_type}
                      onChange={(e) =>
                        handleEditField(
                          "event_type",
                          e.target.value as ExtractedEvent["event_type"]
                        )
                      }
                      className="w-full mt-1 p-2 border rounded-lg"
                    >
                      <option value="exam">Exam</option>
                      <option value="test">Test</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Confidence: {(editedEvent.confidence_score * 100).toFixed(0)}%
                    </label>
                    <div className="mt-1 p-2 bg-gray-100 rounded-lg text-sm">
                      {editedEvent.confidence_score > 0.8
                        ? "High confidence"
                        : editedEvent.confidence_score > 0.6
                        ? "Medium confidence"
                        : "Low confidence"}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {editedEvent.additional_notes && (
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={editedEvent.additional_notes}
                      onChange={(e) =>
                        handleEditField("additional_notes", e.target.value)
                      }
                      className="mt-1"
                      placeholder="Additional information"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmEvent}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Add to Calendar
              </Button>
              <Button
                onClick={() => setState("input")}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {/* CREATING STATE */}
        {state === "creating" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Creating calendar event...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {state === "success" && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-lg font-semibold text-gray-800">
              {successMessage}
            </p>
            <p className="text-sm text-gray-600">
              The event has been added to your Google Calendar with reminders.
            </p>
            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <div className="space-y-4 text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <p className="text-lg font-semibold text-gray-800">
              {error?.message}
            </p>
            <p className="text-sm text-gray-600">{error?.reason}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setState("input")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
