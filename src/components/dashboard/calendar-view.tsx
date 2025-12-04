"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { format, isSameDay } from "date-fns"
import { CombinedItem } from "@/hooks/useClassroomData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import "react-day-picker/dist/style.css"

interface CalendarViewProps {
    items: CombinedItem[]
}

export function CalendarView({ items }: CalendarViewProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())

    // Filter items for the selected date
    const selectedDateItems = items.filter(item =>
        item.date && selectedDate && isSameDay(item.date, selectedDate)
    )

    // Get days with events for modifiers
    const daysWithEvents = items
        .filter(item => item.date)
        .map(item => item.date!)

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
                                <div key={item.id} className="flex gap-4 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <div className={cn(
                                        "w-1 h-full min-h-[3rem] rounded-full shrink-0",
                                        item.type === "ASSIGNMENT" ? "bg-blue-500" :
                                            item.type === "EVENT" ? "bg-purple-500" : "bg-zinc-500"
                                    )} />
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-zinc-200">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-300">
                                                {item.courseName}
                                            </Badge>
                                            {item.date && (
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
        </div>
    )
}
