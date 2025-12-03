"use client"

import { useState, useMemo } from "react"
import { useClassroomData } from "@/hooks/useClassroomData"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Youtube, Link as LinkIcon, Search, Filter, ExternalLink, BookOpen, Download } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function ResourcesPage() {
    const { data: items, isLoading } = useClassroomData()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCourse, setSelectedCourse] = useState<string>("all")

    // Extract unique courses
    const courses = useMemo(() => {
        if (!items) return []
        const unique = new Set<string>()
        items.forEach(item => unique.add(item.courseName))
        return Array.from(unique).sort()
    }, [items])

    // Flatten and process materials
    const allMaterials = useMemo(() => {
        if (!items) return []

        const materials: any[] = []

        items.forEach(item => {
            if (item.materials) {
                item.materials.forEach(mat => {
                    let type = "FILE"
                    let title = "Untitled"
                    let link = "#"
                    let icon = <FileText className="w-5 h-5 text-blue-400" />
                    let thumbnail = null

                    if ('driveFile' in mat) {
                        type = "PDF/DOC"
                        // @ts-ignore - API structure is nested
                        const file = mat.driveFile.driveFile
                        title = file?.title || "Untitled"
                        link = file?.alternateLink || "#"
                        thumbnail = file?.thumbnailUrl
                        icon = <FileText className="w-5 h-5 text-blue-400" />
                    } else if ('youtubeVideo' in mat) {
                        type = "VIDEO"
                        title = mat.youtubeVideo.title
                        link = mat.youtubeVideo.alternateLink
                        thumbnail = mat.youtubeVideo.thumbnailUrl
                        icon = <Youtube className="w-5 h-5 text-red-400" />
                    } else if ('link' in mat) {
                        type = "LINK"
                        title = mat.link.title
                        link = mat.link.url
                        thumbnail = mat.link.thumbnailUrl
                        icon = <LinkIcon className="w-5 h-5 text-green-400" />
                    } else if ('form' in mat) {
                        type = "FORM"
                        title = mat.form.title
                        link = mat.form.formUrl
                        icon = <FileText className="w-5 h-5 text-purple-400" />
                    }

                    materials.push({
                        id: `${item.id}-${title}`,
                        title,
                        link,
                        type,
                        icon,
                        thumbnail,
                        courseName: item.courseName,
                        courseSection: item.courseSection,
                        date: item.date,
                        sourceTitle: item.title // The assignment/announcement title
                    })
                })
            }
        })

        return materials
    }, [items])

    // Filter materials
    const filteredMaterials = useMemo(() => {
        return allMaterials.filter(mat => {
            const title = mat.title || ""
            const courseName = mat.courseName || ""

            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                courseName.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCourse = selectedCourse === "all" || mat.courseName === selectedCourse

            return matchesSearch && matchesCourse
        })
    }, [allMaterials, searchQuery, selectedCourse])

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Resource Library
                    </h1>
                    <p className="text-zinc-400">
                        Access all your course materials, notes, and recordings in one place.
                    </p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search for notes, slides, or recordings..."
                        className="pl-9 bg-zinc-950/50 border-zinc-800 text-zinc-200 focus:ring-blue-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[250px]">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-200">
                            <SelectValue placeholder="Filter by Course" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-zinc-900/50 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : filteredMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMaterials.map((mat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <a
                                href={mat.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-full group"
                            >
                                <Card className="h-full bg-zinc-900/30 border-zinc-800/50 group-hover:border-zinc-700 group-hover:bg-zinc-900/50 transition-all overflow-hidden flex flex-col">
                                    <CardContent className="p-4 flex flex-col h-full gap-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 group-hover:border-zinc-700 transition-colors">
                                                {mat.icon}
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">
                                                {mat.type}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 flex-1">
                                            <h3 className="font-medium text-zinc-200 line-clamp-2 group-hover:text-blue-400 transition-colors" title={mat.title}>
                                                {mat.title}
                                            </h3>
                                            <p className="text-xs text-zinc-500 line-clamp-1">
                                                {mat.courseSection || mat.courseName}
                                            </p>
                                        </div>

                                        <div className="pt-3 mt-auto border-t border-zinc-800/50 flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                                From: {mat.sourceTitle.slice(0, 20)}...
                                            </span>
                                            <div
                                                className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-blue-600 transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-zinc-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No materials found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    )
}
