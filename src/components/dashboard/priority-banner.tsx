"use client"

import { useClassroomData } from "@/hooks/useClassroomData"
import { AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function PriorityBanner() {
    const { data: items } = useClassroomData()

    const urgentItems = items?.filter(i => i.priority === "HIGH") || []

    if (urgentItems.length === 0) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sticky top-0 z-50 w-full bg-red-500/10 backdrop-blur-md border-b border-red-500/20 overflow-hidden"
            >
                <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 text-red-200 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 animate-pulse shrink-0" />
                    <div className="flex gap-4 overflow-hidden whitespace-nowrap">
                        <span>
                            {urgentItems.length} urgent deadline{urgentItems.length > 1 ? 's' : ''}: {urgentItems.map(i => i.title).join(", ")}
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
