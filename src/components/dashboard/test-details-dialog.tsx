"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CombinedItem } from "@/hooks/useClassroomData"
import { Material } from "@/lib/api/classroom"

// Helper to safely get title from union type
const getMaterialTitle = (m: Material) => {
    if ('driveFile' in m) return m.driveFile.title
    if ('youtubeVideo' in m) return m.youtubeVideo.title
    if ('link' in m) return m.link.title
    if ('form' in m) return m.form.title
    return "Attachment"
}

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, BookOpen, Clock, FileText, Download } from "lucide-react"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { useState, useMemo } from "react"

interface TestDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: CombinedItem
    allItems: CombinedItem[]
}

export function TestDetailsDialog({ open, onOpenChange, item, allItems }: TestDetailsDialogProps) {
    if (!item) return null

    // Calculate countdown
    const countdown = useMemo(() => {
        if (!item.date) return null
        const diff = differenceInDays(item.date, new Date())
        if (diff < 0) return "Test Completed"
        if (diff === 0) return "Today"
        if (diff === 1) return "Tomorrow"
        return `${diff} Days Left`
    }, [item.date])

    // Find study materials
    const studyMaterials = useMemo(() => {
        if (!allItems) return []

        // Filter for items that are in the same course and have materials
        const candidates = allItems.filter(i =>
            i.courseId === item.courseId &&
            // Include Materials, Assignments, Announcements if they have attachments
            (i.materials && i.materials.length > 0) &&
            // excude the test itself
            i.id !== item.id
        )

        // Scoring system
        const scoredMaterials = candidates.map(candidate => {
            let score = 0

            // 1. Direct Topic Match (Highest Priority)
            if (item.topicId && candidate.topicId && item.topicId === candidate.topicId) {
                score += 100
            }

            // 2. Unit Match (e.g. "Unit 5" in both titles)
            const unitRegex = /Unit\s?(\d+)/i
            const itemUnit = item.title.match(unitRegex) || (item.testType || "").match(unitRegex)
            const candidateUnit = candidate.title.match(unitRegex) || (candidate.description || "").match(unitRegex)

            if (itemUnit && candidateUnit && itemUnit[1] === candidateUnit[1]) {
                score += 50
            }

            // 3. Keyword Match
            // Exclude common words
            const stopWords = ['unit', 'test', 'exam', 'chapter', 'assignment', 'due', 'tomorrow', 'today']
            const keywords = item.title.toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.includes(w))

            const candidateText = (candidate.title + " " + (candidate.description || "") + " " + (candidate.summary || "")).toLowerCase()

            keywords.forEach(keyword => {
                if (candidateText.includes(keyword)) {
                    score += 10
                }
            })

            return { material: candidate, score }
        })

        // Filter and sort
        return scoredMaterials
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(m => m.material)

    }, [item, allItems])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden gap-0">
                {/* Header Section with Gradient */}
                <div className="relative p-6 bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800/50">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge variant="outline" className="bg-zinc-900/50 border-zinc-700 text-zinc-400">
                            {item.courseName}
                        </Badge>
                    </div>

                    <DialogHeader className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 text-sm font-medium uppercase tracking-wider">
                                <Clock className="w-4 h-4" />
                                {countdown}
                            </div>
                            <DialogTitle className="text-2xl font-bold leading-tight">
                                {item.title}
                            </DialogTitle>
                            {item.summary && (
                                <DialogDescription className="text-zinc-400 text-base">
                                    {item.summary}
                                </DialogDescription>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                            onClick={() => window.open(item.link, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Test
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                            onClick={() => window.open(`https://classroom.google.com/c/${item.courseId}`, '_blank')}
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Go to Class
                        </Button>
                    </div>

                    {/* Study Materials Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Study Material
                        </h3>

                        <ScrollArea className="h-[200px] -mr-4 pr-4">
                            {studyMaterials.length > 0 ? (
                                <div className="space-y-3">
                                    {studyMaterials.map((material) => (
                                        <Card
                                            key={material.id}
                                            className="bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700 transition-colors cursor-pointer group"
                                            onClick={() => window.open(material.link, '_blank')}
                                        >
                                            <CardContent className="p-3 flex items-start gap-3">
                                                <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                                                    <FileText className="w-5 h-5 text-zinc-400 group-hover:text-purple-400" />
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-purple-200 transition-colors">
                                                            {material.title}
                                                        </h4>
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-zinc-700 text-zinc-500">
                                                            {material.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                        {material.materials?.map(m => getMaterialTitle(m)).join(", ") || "View Materials"}
                                                    </p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                                    <p className="text-sm text-zinc-500">No matching study materials found.</p>
                                    <Button
                                        variant="link"
                                        className="text-purple-400 text-xs mt-1 h-auto p-0"
                                        onClick={() => window.open(`https://classroom.google.com/c/${item.courseId}`, '_blank')}
                                    >
                                        Browse Class Drive
                                    </Button>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
