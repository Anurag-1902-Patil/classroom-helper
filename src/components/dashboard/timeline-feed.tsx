"use client"

import { useState } from "react"
import { useClassroomData, CombinedItem } from "@/hooks/useClassroomData"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { usePushSubscription } from "@/hooks/usePushSubscription"
import { AlertCircle, BookOpen, Calendar, CheckCircle2, ArrowRight, Clock, Bell, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isToday, isTomorrow, isThisWeek, isPast, isFuture } from "date-fns"
import { CalendarView } from "./calendar-view"

export function TimelineFeed() {
    const { data: items, isLoading } = useClassroomData()
    const [view, setView] = useState<"timeline" | "calendar">("timeline")
    const { subscribeToPush, isSupported, subscription } = usePushSubscription()

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

    // Group items by date category
    // Filter out past items (before today)
    const upcomingItems = items.filter(i => {
        if (!i.date) return true // Keep items with no date
        return !isPast(i.date) || isToday(i.date) // Keep today and future
    })

    const groupedItems = {
        today: upcomingItems.filter(i => i.date && isToday(i.date)),
        tomorrow: upcomingItems.filter(i => i.date && isTomorrow(i.date)),
        thisWeek: upcomingItems.filter(i => i.date && isThisWeek(i.date) && !isToday(i.date) && !isTomorrow(i.date) && isFuture(i.date)),
        upcoming: upcomingItems.filter(i => i.date && !isThisWeek(i.date) && isFuture(i.date)),
        noDate: upcomingItems.filter(i => !i.date),
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-400" />
                    Schedule & Tasks
                </h2>
                <div className="flex items-center gap-2">
                    {isSupported && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={subscribeToPush}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title={subscription ? "Notifications Enabled" : "Enable Notifications"}
                        >
                            {subscription ? <BellRing className="w-5 h-5 text-purple-400" /> : <Bell className="w-5 h-5" />}
                        </Button>
                    )}
                    <Tabs value={view} onValueChange={(v) => setView(v as "timeline" | "calendar")} className="w-auto">
                        <TabsList className="bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {view === "calendar" ? (
                <CalendarView items={items} />
            ) : (
                <div className="space-y-8">
                    {/* Today */}
                    {groupedItems.today.length > 0 && (
                        <TimelineSection title="Today" items={groupedItems.today} />
                    )}

                    {/* Tomorrow */}
                    {groupedItems.tomorrow.length > 0 && (
                        <TimelineSection title="Tomorrow" items={groupedItems.tomorrow} />
                    )}

                    {/* This Week */}
                    {groupedItems.thisWeek.length > 0 && (
                        <TimelineSection title="This Week" items={groupedItems.thisWeek} />
                    )}

                    {/* Upcoming */}
                    {groupedItems.upcoming.length > 0 && (
                        <TimelineSection title="Upcoming" items={groupedItems.upcoming} />
                    )}

                    {/* No Date / Others */}
                    {groupedItems.noDate.length > 0 && (
                        <TimelineSection title="No Due Date" items={groupedItems.noDate} />
                    )}
                </div>
            )}
        </div>
    )
}

function TimelineSection({ title, items }: { title: string, items: CombinedItem[] }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider pl-2 border-l-2 border-zinc-800">{title}</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                {items.map((item, index) => (
                    <TimelineItem key={item.id} item={item} index={index} />
                ))}
            </div>
        </div>
    )
}

function TimelineItem({ item, index }: { item: CombinedItem; index: number }) {
    const isDetected = item.id.startsWith("detected-") || !!item.summary // It's detected if it has a summary or ID prefix
    const isUrgent = item.priority === "HIGH"

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
        >
            {/* Icon / Dot */}
            <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative",
                item.type === 'URGENT' ? "bg-red-900/20 border-red-500/30" : "bg-zinc-900"
            )}>
                {item.type === "ASSIGNMENT" && <BookOpen className="w-4 h-4 text-blue-400" />}
                {item.type === "TEST" && <Clock className="w-4 h-4 text-orange-400" />}
                {item.type === "URGENT" && <AlertCircle className="w-4 h-4 text-red-400" />}
                {item.type === "INFO" && <Bell className="w-4 h-4 text-zinc-400" />}
                {(item.type === "EVENT" || item.type === "ANNOUNCEMENT") && <Calendar className="w-4 h-4 text-purple-400" />}
                {item.type === "MATERIAL" && <BookOpen className="w-4 h-4 text-zinc-500" />}

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
                                        AI Summary
                                    </Badge>
                                )}
                                {item.type === 'TEST' && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-orange-500/50 text-orange-400 bg-orange-500/10">
                                        Test
                                    </Badge>
                                )}
                                {item.status === "POSTPONED" && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-orange-500/50 text-orange-400 bg-orange-500/10">
                                        Postponed
                                    </Badge>
                                )}
                                {item.status === "CANCELLED" && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-red-500/50 text-red-400 bg-red-500/10">
                                        Cancelled
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-medium text-zinc-200 text-sm leading-snug">
                                    {item.summary || item.title}
                                </h3>
                                {item.summary && (
                                    <p className="text-xs text-zinc-500 line-clamp-1">
                                        Original: {item.title}
                                    </p>
                                )}
                            </div>

                            <div className="text-xs text-zinc-500 flex items-center justify-between w-full">
                                {item.date ? (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(item.date, "MMM d, h:mm a")}
                                    </span>
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
