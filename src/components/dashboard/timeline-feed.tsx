"use client"

import { useClassroomData, CombinedItem } from "@/hooks/useClassroomData"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BookOpen, Calendar, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function TimelineFeed() {
    const { data: items, isLoading } = useClassroomData()

    if (isLoading) {
        return <TimelineSkeleton />
    }

    if (!items || items.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                <p>No timeline items found.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-400" />
                Timeline
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                {items.map((item, index) => (
                    <TimelineItem key={item.id} item={item} index={index} />
                ))}
            </div>
        </div>
    )
}

function TimelineItem({ item, index }: { item: CombinedItem; index: number }) {
    const isDetected = item.id.startsWith("detected-")
    const isUrgent = item.priority === "HIGH"

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
        >
            {/* Icon / Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                {item.type === "ASSIGNMENT" ? (
                    <BookOpen className="w-4 h-4 text-blue-400" />
                ) : item.type === "EVENT" ? (
                    <AlertCircle className="w-4 h-4 text-purple-400" />
                ) : (
                    <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                )}
                {isUrgent && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-zinc-900" />
                )}
            </div>

            {/* Card */}
            <Card className={cn(
                "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/40 backdrop-blur-sm border-zinc-800/60 hover:bg-zinc-900/60 transition-all duration-300 hover:border-zinc-700",
                isDetected && "border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
                isUrgent && !isDetected && "border-red-500/30"
            )}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 w-full">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={cn(
                                    "text-[10px] px-1.5 py-0 h-5 border-zinc-700 bg-zinc-800/50 text-zinc-300",
                                )}>
                                    {item.courseName}
                                </Badge>
                                {isDetected && (
                                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-purple-500/20 animate-pulse border">
                                        Detected
                                    </Badge>
                                )}
                                {isUrgent && !isDetected && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-300 border-red-500/20 border hover:bg-red-500/30">
                                        Due Soon
                                    </Badge>
                                )}
                            </div>

                            <h3 className="font-medium text-zinc-200 text-sm leading-snug">
                                {item.title}
                            </h3>

                            <div className="text-xs text-zinc-500 flex items-center justify-between w-full">
                                {item.date ? (
                                    <span>{item.date.toLocaleDateString()} • {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                ) : (
                                    <span>No due date</span>
                                )}
                            </div>
                        </div>

                        {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-300 transition-colors mt-1">
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function TimelineSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-32 bg-zinc-800/50" />
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-zinc-800/50">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="w-10 h-10 rounded-full bg-zinc-800/50 shrink-0 z-10" />
                        <Skeleton className="h-24 w-full bg-zinc-800/50 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    )
}
