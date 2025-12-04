"use client"

import { useState, useEffect } from "react"
import { useClassroomData, CombinedItem } from "@/hooks/useClassroomData"
import { motion, AnimatePresence } from "framer-motion"
import { subDays, isFuture, isAfter } from "date-fns"
import { Check, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function NoticeBoard() {
    const { data: items } = useClassroomData()
    const [isPaused, setIsPaused] = useState(false)
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
    const [filteredItems, setFilteredItems] = useState<CombinedItem[]>([])

    useEffect(() => {
        if (!items) return

        const now = new Date()
        const lastWeek = subDays(now, 7)

        const filtered = items
            .filter(item => {
                // Filter 1: Timeframe (Last Week onwards)
                const itemDate = item.date ? new Date(item.date) : null
                const isRecent = itemDate ? isAfter(itemDate, lastWeek) : true // Keep no-date items? Let's say yes for now if they are relevant

                // Filter 2: Completion (Not in local completed state)
                // Note: Real app should persist this to DB
                const isNotDone = !completedIds.has(item.id) && item.status !== 'DONE'

                return isRecent && isNotDone
            })
            .sort((a, b) => {
                // Filter 3: Future Priority
                // Sort by date: Future closest -> Future farthest -> No Date -> Past
                const dateA = a.date ? new Date(a.date).getTime() : Infinity
                const dateB = b.date ? new Date(b.date).getTime() : Infinity
                return dateA - dateB
            })

        setFilteredItems(filtered)
    }, [items, completedIds])

    const markAsDone = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setCompletedIds(prev => new Set(prev).add(id))
        // Here you would also call an API to update the status in the DB
    }

    if (filteredItems.length === 0) return null

    return (
        <div
            className="w-full overflow-hidden bg-zinc-900/60 backdrop-blur-md border-y border-zinc-800/50 h-12 flex items-center relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

            <div className="flex items-center gap-4 px-4 text-xs font-medium text-purple-400 uppercase tracking-wider shrink-0 z-20 bg-zinc-950/50 h-full backdrop-blur-sm border-r border-zinc-800/50">
                <AlertCircle className="w-4 h-4" />
                Notice Board
            </div>

            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <motion.div
                    className="flex gap-12 whitespace-nowrap px-12"
                    animate={{ x: isPaused ? 0 : "-100%" }}
                    transition={{
                        ease: "linear",
                        duration: filteredItems.length * 5, // Adjust speed based on content length
                        repeat: Infinity,
                        repeatType: "loop"
                    }}
                    style={{ x: 0 }} // Initial state
                >
                    {/* Duplicate items for seamless loop if needed, but simple marquee for now */}
                    {[...filteredItems, ...filteredItems].map((item, idx) => (
                        <div
                            key={`${item.id}-${idx}`}
                            className="inline-flex items-center gap-3 text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer group/item"
                        >
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                item.priority === "HIGH" ? "bg-red-500 animate-pulse" : "bg-zinc-600"
                            )} />

                            <span className="font-medium">{item.title}</span>

                            {item.date && (
                                <span className="text-zinc-500 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}

                            <button
                                onClick={(e) => markAsDone(e, item.id)}
                                className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-green-500/20 text-green-400 rounded-full transition-all"
                                title="Mark as Done"
                            >
                                <Check className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
