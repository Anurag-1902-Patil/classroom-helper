"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { format, isSameDay } from "date-fns"
import { CombinedItem } from "@/hooks/useClassroomData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import "react-day-picker/dist/style.css"

import { TestDetailsDialog } from "./test-details-dialog"

interface CalendarViewProps {
    items: CombinedItem[]
}

export function CalendarView({ items }: CalendarViewProps) {
    const [selectedTest, setSelectedTest] = React.useState<CombinedItem | null>(null)

    // Filter items for the selected date (including date ranges)
    const selectedDateItems = items.filter(item => {
        if (!selectedDate) return false

        // Check if item is on this exact date
        if (item.date && isSameDay(item.date, selectedDate)) return true

        // Check if selected date is within date range (submission windows)
        if (item.startDate && item.endDate) {
            const selected = selectedDate.getTime()
            const start = item.startDate.getTime()
            const end = item.endDate.getTime()
            return selected >= start && selected <= end
        }

        return false
    })

    // Get days with events for modifiers (include all dates in ranges)
    const daysWithEvents: Date[] = []
    items.forEach(item => {
        if (item.date) {
            daysWithEvents.push(item.date)
        }
        // For date ranges, add all days in the range
        if (item.startDate && item.endDate) {
            const start = new Date(item.startDate)
            const end = new Date(item.endDate)
            const current = new Date(start)
            while (current <= end) {
                daysWithEvents.push(new Date(current))
                current.setDate(current.getDate() + 1)
            }
        }
    })

    const handleItemClick = (item: CombinedItem) => {
        if (item.type === "TEST" || (item.type === "URGENT" && item.testType)) {
            setSelectedTest(item)
        } else if (item.link) {
            window.open(item.link, "_blank")
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Card className="md:col-span-5 lg:col-span-4 bg-zinc-900/40 border-zinc-800/60">
                <CardContent className="p-4 flex justify-center">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        modifiers={{
                            hasEvent: daysWithEvents
                        }}
                        modifiersStyles={{
                            hasEvent: {
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                color: '#a855f7' // purple-500
                            }
                        }}
                        styles={{
                            caption: { color: 'white' },
                            head_cell: { color: '#a1a1aa' }, // zinc-400
                            day: { color: '#e4e4e7' }, // zinc-200
                            nav_button: { color: '#a1a1aa' },
                        }}
                        className="text-zinc-100"
                    />
                </CardContent>
            </Card>

            <Card className="md:col-span-7 lg:col-span-8 bg-zinc-900/40 border-zinc-800/60 min-h-[400px]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        {selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : "Select a date"}
                        <Badge variant="outline" className="ml-auto border-zinc-700 text-zinc-400">
                            {selectedDateItems.length} Events
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedDateItems.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDateItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={cn(
                                        "flex gap-4 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800 transition-all duration-300",
                                        (item.type === "TEST" || (item.type === "URGENT" && item.testType) || item.link)
                                            ? "cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700 hover:shadow-lg hover:shadow-purple-500/5 active:scale-[0.99]"
                                            : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-1 h-full min-h-[3rem] rounded-full shrink-0",
                                        item.type === "ASSIGNMENT" ? "bg-blue-500" :
                                            item.type === "EVENT" ? "bg-purple-500" : "bg-zinc-500"
                                    )} />
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-zinc-200 group-hover:text-purple-300 transition-colors">{item.summary || item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                                            {/* Status badges first */}
                                            {item.status === "POSTPONED" && (
                                                <Badge variant="outline" className="text-[10px] h-5 border-orange-500/50 text-orange-300 bg-orange-500/20">
                                                    ⚠️ POSTPONED
                                                </Badge>
                                            )}
                                            {item.status === "CANCELLED" && (
                                                <Badge variant="outline" className="text-[10px] h-5 border-red-500/50 text-red-300 bg-red-500/20">
                                                    ❌ CANCELLED
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-300">
                                                {item.courseName}
                                            </Badge>
                                            {item.type === "TEST" && (
                                                <Badge variant="outline" className="text-[10px] h-5 border-orange-500/50 text-orange-400 bg-orange-500/10">
                                                    {item.testType || "TEST"}
                                                </Badge>
                                            )}
                                            {item.type === "SUBMISSION_WINDOW" && (
                                                <Badge variant="outline" className="text-[10px] h-5 border-blue-500/50 text-blue-400 bg-blue-500/10">
                                                    Submission Window
                                                </Badge>
                                            )}
                                            {item.startDate && item.endDate ? (
                                                <span>{format(item.startDate, "MMM d")} - {format(item.endDate, "MMM d")}</span>
                                            ) : item.date && (
                                                <span>{format(item.date, "h:mm a")}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                            <p>No events scheduled for this day.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TestDetailsDialog
                open={!!selectedTest}
                onOpenChange={(open) => !open && setSelectedTest(null)}
                item={selectedTest!}
                allItems={items}
            />
        </div>
    )
}

