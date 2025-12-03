"use client"

import { useClassroomData } from "@/hooks/useClassroomData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Book, MoreVertical } from "lucide-react"

export function CourseGrid() {
    const { data: items, isLoading } = useClassroomData()

    // Extract unique courses
    const courses = Array.from(new Set(items?.map(i => i.courseId))).map(id => {
        const item = items?.find(i => i.courseId === id)
        return {
            id,
            name: item?.courseName || "Unknown Course",
            assignmentCount: items?.filter(i => i.courseId === id && i.type === "ASSIGNMENT").length || 0,
            eventCount: items?.filter(i => i.courseId === id && i.type === "EVENT").length || 0
        }
    })

    if (isLoading) {
        return <CourseGridSkeleton />
    }

    if (courses.length === 0) {
        return null
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Book className="w-5 h-5 text-zinc-400" />
                Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course, index) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="bg-zinc-900/40 backdrop-blur-sm border-zinc-800/60 hover:bg-zinc-900/60 transition-all duration-300 hover:border-zinc-700 group cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-200 line-clamp-1" title={course.name}>
                                    {course.name}
                                </CardTitle>
                                <MoreVertical className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700/50">
                                        {course.assignmentCount} Assignments
                                    </Badge>
                                    {course.eventCount > 0 && (
                                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20 border">
                                            {course.eventCount} Events
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function CourseGridSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-32 bg-zinc-800/50" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full bg-zinc-800/50 rounded-xl" />
                ))}
            </div>
        </div>
    )
}
