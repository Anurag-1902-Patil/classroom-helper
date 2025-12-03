"use client"

import { useSession } from "next-auth/react"
import { useClassroomData } from "@/hooks/useClassroomData"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Calendar, Clock, LayoutDashboard, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "./notification-bell"

export function HeroSection() {
    const { data: session } = useSession()
    const { data: items, isLoading } = useClassroomData()

    const nextItem = items?.find(i => i.date && i.date > new Date())
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
                                        <h2 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {nextItem.title}
                                        </h2>
                                        <p className="text-zinc-400 mt-2 flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs border border-zinc-700 font-medium">
                                                {nextItem.courseSection || nextItem.courseName}
                                            </span>
                                            <span className="text-sm flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {nextItem.date?.toLocaleDateString()} at {nextItem.date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
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
