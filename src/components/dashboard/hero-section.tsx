"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { useClassroomData } from "@/hooks/useClassroomData"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Calendar, Clock, LayoutDashboard, BookOpen, AlertCircle, TestTube } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "./notification-bell"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
    const { data: session } = useSession()
    const { data: items, isLoading } = useClassroomData()

    // Find the next upcoming item (prioritize by date, then by priority)
    const nextItem = useMemo(() => {
        if (!items || items.length === 0) return null
        
        const now = new Date()
        
        // Filter items with future dates or high priority items
        const upcomingItems = items
            .filter(i => {
                // Include items with future dates
                if (i.date && i.date > now) return true
                // Include high priority items even without dates
                if (i.priority === "HIGH" && !i.date) return true
                // Include today's items
                if (i.date) {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const itemDate = new Date(i.date)
                    itemDate.setHours(0, 0, 0, 0)
                    if (itemDate.getTime() === today.getTime()) return true
                }
                return false
            })
            .sort((a, b) => {
                // Sort by: date first (earliest first), then by priority
                if (a.date && b.date) {
                    return a.date.getTime() - b.date.getTime()
                }
                if (a.date && !b.date) return -1
                if (!a.date && b.date) return 1
                // Both have no date, sort by priority
                const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
            })
        
        return upcomingItems[0] || null
    }, [items])
    
    const firstName = session?.user?.name?.split(" ")[0] || "Student"

    return (
        <div className="space-y-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
                        Focus Mode, <span className="text-zinc-400">{firstName}.</span>
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Here's what's on your radar for today.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Link href="/resources">
                        <Button variant="outline" className="gap-2 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all">
                            <BookOpen className="w-4 h-4" />
                            Library
                        </Button>
                    </Link>
                    <Link href="/summary">
                        <Button variant="outline" className="gap-2 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all">
                            <LayoutDashboard className="w-4 h-4" />
                            Weekly Summary
                        </Button>
                    </Link>
                </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-2"
                >
                    <Card className="h-full bg-zinc-900/50 backdrop-blur-md border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest font-medium">
                                <Clock className="w-4 h-4" />
                                Next Up
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-3/4 bg-zinc-800/50" />
                                    <Skeleton className="h-5 w-1/2 bg-zinc-800/50" />
                                </div>
                            ) : nextItem ? (
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {nextItem.status === "POSTPONED" && (
                                                <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/50 text-[10px] animate-pulse">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    POSTPONED
                                                </Badge>
                                            )}
                                            {nextItem.status === "CANCELLED" && (
                                                <Badge className="bg-red-500/30 text-red-300 border-red-500/50 text-[10px]">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    CANCELLED
                                                </Badge>
                                            )}
                                            {nextItem.type === "TEST" && (
                                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                                                    <TestTube className="w-3 h-3 mr-1" />
                                                    {nextItem.testType || "TEST"}
                                                </Badge>
                                            )}
                                            {nextItem.type === "URGENT" && (
                                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    URGENT
                                                </Badge>
                                            )}
                                            {nextItem.type === "SUBMISSION_WINDOW" && (
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    SUBMISSION WINDOW
                                                </Badge>
                                            )}
                                            {nextItem.summary && (
                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
                                                    AI Summary
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {nextItem.summary || nextItem.title}
                                        </h2>
                                        {nextItem.summary && nextItem.title !== nextItem.summary && (
                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                                                {nextItem.title}
                                            </p>
                                        )}
                                        <p className="text-zinc-400 mt-3 flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs border border-zinc-700 font-medium">
                                                {nextItem.courseSection || nextItem.courseName}
                                            </span>
                                            {nextItem.startDate && nextItem.endDate ? (
                                                <span className="text-sm flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {nextItem.startDate.toLocaleDateString()} - {nextItem.endDate.toLocaleDateString()}
                                                </span>
                                            ) : nextItem.date ? (
                                                <span className="text-sm flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {nextItem.date.toLocaleDateString()}
                                                    {nextItem.date.toLocaleTimeString && (
                                                        <> at {nextItem.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-zinc-500">No specific date</span>
                                            )}
                                        </p>
                                    </div>

                                    {nextItem.link && (
                                        <a
                                            href={nextItem.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                        >
                                            Open in Classroom <ArrowRight className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="text-zinc-500 py-4">
                                    <p className="text-lg font-medium text-zinc-400">All caught up!</p>
                                    <p className="text-sm">No upcoming deadlines detected.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Placeholder for Stats or Weekly Progress */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link href="/summary">
                        <Card className="h-full bg-zinc-900/50 backdrop-blur-md border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 cursor-pointer group">
                            <CardHeader>
                                <CardTitle className="text-zinc-400 text-xs uppercase tracking-widest font-medium group-hover:text-white transition-colors">
                                    Weekly Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-[120px]">
                                <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                    <Calendar className="w-10 h-10 text-zinc-600 group-hover:text-white mx-auto mb-2 transition-colors" />
                                    <p className="text-sm text-zinc-400 group-hover:text-zinc-300">View Digest</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            </div>
        </div>
    )
}
