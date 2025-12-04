"use client"

import { useState, useEffect } from "react"
import { useClassroomData, CombinedItem } from "@/hooks/useClassroomData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertCircle, BookOpen, Info, CheckCircle2, Clock, Megaphone } from "lucide-react"
import { format, isAfter, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

export function SummarySection() {
    const { data: items, isLoading } = useClassroomData()
    const [filteredItems, setFilteredItems] = useState<CombinedItem[]>([])
    const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null)
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!items) return

        // CUTOFF DATE: November 20, 2024
        const CUTOFF_DATE = new Date('2024-11-20')

        const filtered = items
            .filter(item => {
                // 1. Filter by Date (Strict Cutoff)
                // If item has a date, check it. If no date (like General Info), check creation time if available, or assume recent?
                // For now, if no date, we include it unless it's explicitly old (which we can't tell easily without creation date).
                // But user requirement says: "Do not show ANY assignment... posted or due before Nov 20".
                // Since we don't have "posted" date easily available in CombinedItem for all types, we'll rely on 'date' (due date) for assignments.
                // For detected events, 'date' is the event date.

                if (item.date && !isAfter(item.date, CUTOFF_DATE)) {
                    return false
                }

                // 2. Filter by Status
                if (item.status === 'DONE' || completedIds.has(item.id)) {
                    return false
                }

                return true
            })
            .sort((a, b) => {
                // Sort Order: URGENT_UPDATE -> DEADLINE/TEST -> Date

                // Priority 1: URGENT
                if (a.type === 'URGENT' && b.type !== 'URGENT') return -1
                if (a.type !== 'URGENT' && b.type === 'URGENT') return 1

                // Priority 2: TEST / DEADLINE
                const isATest = a.type === 'TEST' || a.type === 'ASSIGNMENT'
                const isBTest = b.type === 'TEST' || b.type === 'ASSIGNMENT'
                if (isATest && !isBTest) return -1
                if (!isATest && isBTest) return 1

                // Priority 3: Date (Soonest first)
                const dateA = a.date ? new Date(a.date).getTime() : Infinity
                const dateB = b.date ? new Date(b.date).getTime() : Infinity
                return dateA - dateB
            })

        setFilteredItems(filtered)
    }, [items, completedIds])

    const markAsDone = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setCompletedIds(prev => new Set(prev).add(id))
    }

    if (isLoading) return <SummarySkeleton />
    if (filteredItems.length === 0) return null

    return (
        <>
            <Card className="h-[500px] flex flex-col bg-zinc-900/50 backdrop-blur-md border-zinc-800">
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                    <CardTitle className="text-lg font-medium flex items-center gap-2 text-white">
                        <Megaphone className="w-5 h-5 text-purple-400" />
                        Daily Summary
                    </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                    "group p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 transition-all cursor-pointer relative overflow-hidden",
                                    item.type === 'URGENT' && "border-red-500/30 bg-red-500/5"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon Badge */}
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        item.type === 'URGENT' && "bg-red-500/20 text-red-400",
                                        item.type === 'TEST' && "bg-orange-500/20 text-orange-400",
                                        item.type === 'ASSIGNMENT' && "bg-blue-500/20 text-blue-400",
                                        item.type === 'INFO' && "bg-zinc-500/20 text-zinc-400",
                                        (item.type === 'EVENT' || item.type === 'ANNOUNCEMENT') && "bg-purple-500/20 text-purple-400"
                                    )}>
                                        {item.type === 'URGENT' && <AlertCircle className="w-4 h-4" />}
                                        {item.type === 'TEST' && <Clock className="w-4 h-4" />}
                                        {item.type === 'ASSIGNMENT' && <BookOpen className="w-4 h-4" />}
                                        {(item.type === 'INFO' || item.type === 'ANNOUNCEMENT') && <Info className="w-4 h-4" />}
                                        {item.type === 'EVENT' && <Megaphone className="w-4 h-4" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] px-1.5 py-0 h-4",
                                                item.type === 'URGENT' && "border-red-500/50 text-red-400",
                                                item.type === 'TEST' && "border-orange-500/50 text-orange-400",
                                                item.type === 'ASSIGNMENT' && "border-blue-500/50 text-blue-400",
                                                item.type === 'INFO' && "border-zinc-700 text-zinc-400"
                                            )}>
                                                {item.type.replace('_', ' ')}
                                            </Badge>
                                            {item.date && (
                                                <span className="text-[10px] text-zinc-500">
                                                    {format(item.date, "MMM d")}
                                                </span>
                                            )}
                                        </div>

                                        {/* Headline / Title */}
                                        <h4 className="text-sm font-medium text-zinc-200 leading-snug">
                                            {item.summary || item.title}
                                        </h4>

                                        {/* Course Name */}
                                        <p className="text-[11px] text-zinc-500 mt-1 truncate">
                                            {item.courseName}
                                        </p>
                                    </div>

                                    {/* Done Button */}
                                    <button
                                        onClick={(e) => markAsDone(e, item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-green-500/20 text-green-400 rounded-full transition-all absolute right-2 top-1/2 -translate-y-1/2"
                                        title="Mark as Done"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>{selectedItem?.title}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            {selectedItem?.courseName} • {selectedItem?.date ? format(selectedItem.date, "PPP p") : "No Date"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        {selectedItem?.summary && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="text-sm text-purple-200 font-medium">AI Summary: {selectedItem.summary}</p>
                            </div>
                        )}
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto p-2 bg-zinc-900/50 rounded-md">
                            {selectedItem?.description}
                        </div>
                        {selectedItem?.link && (
                            <a
                                href={selectedItem.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm text-blue-400 hover:underline"
                            >
                                View in Classroom
                            </a>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function SummarySkeleton() {
    return (
        <Card className="h-[500px] bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-zinc-800/50 rounded-lg animate-pulse" />
                ))}
            </CardContent>
        </Card>
    )
}
