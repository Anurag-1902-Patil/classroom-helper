"use client"

import { useState, useMemo } from "react"
import { useClassroomData, CombinedItem } from "@/hooks/useClassroomData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, AlertCircle, CheckCircle2, FileText, Link as LinkIcon, Youtube } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SummaryPage() {
    const { data: items, isLoading } = useClassroomData()
    const [selectedWeekStart, setSelectedWeekStart] = useState<string>("")

    // 1. Generate available weeks from data
    const weeks = useMemo(() => {
        if (!items) return []
        const uniqueWeeks = new Set<string>()

        items.forEach(item => {
            if (item.date) {
                const startOfWeek = getStartOfWeek(item.date)
                uniqueWeeks.add(startOfWeek.toISOString())
            }
        })

        // Add current week if not present
        const currentWeek = getStartOfWeek(new Date())
        uniqueWeeks.add(currentWeek.toISOString())

        return Array.from(uniqueWeeks)
            .map(d => new Date(d))
            .sort((a, b) => b.getTime() - a.getTime()) // Newest first
    }, [items])

    // Set default selection to current week/newest week
    if (!selectedWeekStart && weeks.length > 0) {
        setSelectedWeekStart(weeks[0].toISOString())
    }

    // 2. Filter items by selected week
    const filteredItems = useMemo(() => {
        if (!items || !selectedWeekStart) return []
        const start = new Date(selectedWeekStart)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)

        return items.filter(item => {
            if (!item.date) return false
            return item.date >= start && item.date < end
        })
    }, [items, selectedWeekStart])

    // 3. Group by Course
    const groupedItems = useMemo(() => {
        const groups: Record<string, CombinedItem[]> = {}
        filteredItems.forEach(item => {
            if (!groups[item.courseName]) {
                groups[item.courseName] = []
            }
            groups[item.courseName].push(item)
        })
        return groups
    }, [filteredItems])

    const formatDateRange = (isoDate: string) => {
        if (!isoDate) return ""
        const start = new Date(isoDate)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Weekly Summary</h1>
                        <p className="text-zinc-400">Review your workload and past activity.</p>
                    </div>

                    <div className="w-full md:w-64">
                        <Select value={selectedWeekStart} onValueChange={setSelectedWeekStart}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectValue placeholder="Select Week" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                {weeks.map(week => (
                                    <SelectItem key={week.toISOString()} value={week.toISOString()}>
                                        {formatDateRange(week.toISOString())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="text-zinc-500">Loading summary...</div>
                ) : Object.keys(groupedItems).length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                        <p className="text-zinc-400">No items found for this week.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {Object.entries(groupedItems).map(([courseName, items], index) => (
                            <motion.div
                                key={courseName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-zinc-900/40 backdrop-blur-sm border-zinc-800/60">
                                    <CardHeader className="pb-3 border-b border-zinc-800/50">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-medium text-white">{courseName}</CardTitle>
                                            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                                                {items.length} Item{items.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 grid gap-4 md:grid-cols-2">
                                        {items.map(item => (
                                            <div key={item.id} className="flex flex-col gap-3 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 shrink-0">
                                                        {item.type === "ASSIGNMENT" ? (
                                                            <BookOpen className="w-4 h-4 text-blue-400" />
                                                        ) : item.type === "EVENT" ? (
                                                            <AlertCircle className="w-4 h-4 text-purple-400" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 overflow-hidden w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-zinc-700 text-zinc-400">
                                                                {item.type === "ASSIGNMENT" ? "ASSIGNMENT" : item.type === "EVENT" ? "EVENT" : "NOTICE"}
                                                            </Badge>
                                                            <span className="text-xs text-zinc-500">
                                                                {item.date?.toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm font-medium text-zinc-200" title={item.title}>
                                                            {item.title}
                                                        </p>

                                                        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                                                            <span className="text-blue-400 font-medium">
                                                                {item.courseSection || item.courseName}
                                                            </span>
                                                            {item.courseSection && (
                                                                <>
                                                                    <span className="text-zinc-700">•</span>
                                                                    <span className="text-zinc-500">{item.courseName}</span>
                                                                </>
                                                            )}
                                                        </p>

                                                        {item.description && (
                                                            <p className="text-xs text-zinc-400 mt-2 line-clamp-3 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Attachments */}
                                                {item.materials && item.materials.length > 0 && (
                                                    <div className="mt-2 space-y-2 pl-7 border-l-2 border-zinc-800 ml-1">
                                                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            Attachments
                                                        </p>
                                                        <div className="grid gap-2">
                                                            {item.materials.map((mat, idx) => {
                                                                let icon = <FileText className="w-3 h-3" />
                                                                let title = "Attachment"
                                                                let link = "#"

                                                                if ('driveFile' in mat) {
                                                                    title = mat.driveFile.title
                                                                    link = mat.driveFile.alternateLink
                                                                    icon = <FileText className="w-3 h-3 text-blue-400" />
                                                                } else if ('youtubeVideo' in mat) {
                                                                    title = mat.youtubeVideo.title
                                                                    link = mat.youtubeVideo.alternateLink
                                                                    icon = <Youtube className="w-3 h-3 text-red-400" />
                                                                } else if ('link' in mat) {
                                                                    title = mat.link.title
                                                                    link = mat.link.url
                                                                    icon = <LinkIcon className="w-3 h-3 text-green-400" />
                                                                } else if ('form' in mat) {
                                                                    title = mat.form.title
                                                                    link = mat.form.formUrl
                                                                    icon = <FileText className="w-3 h-3 text-purple-400" />
                                                                }

                                                                return (
                                                                    <a
                                                                        key={idx}
                                                                        href={link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white hover:underline truncate bg-zinc-800/30 p-1.5 rounded border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors"
                                                                    >
                                                                        {icon}
                                                                        <span className="truncate">{title}</span>
                                                                    </a>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function getStartOfWeek(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}
