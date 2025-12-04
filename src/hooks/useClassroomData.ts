import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { fetchCourses, fetchCourseWork, fetchAnnouncements, fetchCourseWorkMaterials, Material } from "@/lib/api/classroom"
import { parseAnnouncementText } from "@/lib/smart-parser"

export interface CombinedItem {
    id: string
    title: string
    summary?: string
    description?: string
    materials?: Material[]
    date?: Date
    type: "ASSIGNMENT" | "ANNOUNCEMENT" | "EVENT" | "MATERIAL" | "TEST" | "URGENT" | "INFO"
    courseName: string
    courseSection?: string
    courseId: string
    link: string
    status?: string
    priority: "HIGH" | "MEDIUM" | "LOW"
}

export function useClassroomData() {
    const { data: session } = useSession()
    const accessToken = session?.accessToken

    return useQuery({
        queryKey: ["classroomData", accessToken],
        queryFn: async () => {
            if (!accessToken) return []

            // 1. Fetch Courses
            const courses = await fetchCourses(accessToken)

            // 2. Fetch Work, Announcements, and Materials for each course
            const promises = courses.map(async (course) => {
                const [work, announcements, materials] = await Promise.all([
                    fetchCourseWork(accessToken, course.id).catch((e) => {
                        console.error(`Error fetching work for ${course.name}:`, e)
                        return []
                    }),
                    fetchAnnouncements(accessToken, course.id).catch((e) => {
                        console.error(`Error fetching announcements for ${course.name}:`, e)
                        return []
                    }),
                    fetchCourseWorkMaterials(accessToken, course.id).catch((e) => {
                        console.error(`Error fetching materials for ${course.name}:`, e)
                        return []
                    })
                ])

                return { course, work, announcements, materials }
            })

            const results = await Promise.all(promises)

            // 3. Process and Merge
            const allItems: CombinedItem[] = []

            for (const { course, work, announcements, materials } of results) {
                // Process Assignments with Concurrency Limit (Batch of 3)
                const processAssignment = async (w: any): Promise<CombinedItem> => {
                    let date: Date | undefined
                    if (w.dueDate) {
                        const dateObj = new Date(w.dueDate.year, w.dueDate.month - 1, w.dueDate.day)
                        if (w.dueTime) {
                            dateObj.setHours(w.dueTime.hours, w.dueTime.minutes)
                        }
                        if (!isNaN(dateObj.getTime())) {
                            date = dateObj
                        }
                    }

                    // AI Parsing for Description
                    let aiSummary = undefined
                    let aiType = undefined

                    if (w.description) {
                        try {
                            // Add a small delay to prevent hitting rate limits instantly
                            await new Promise(resolve => setTimeout(resolve, 100))
                            const detectedEvents = await parseAnnouncementText(w.description, course.id)
                            if (detectedEvents.length > 0) {
                                const bestEvent = detectedEvents[0]
                                if (!date && bestEvent.date) {
                                    date = bestEvent.date
                                }
                                aiSummary = bestEvent.summary
                                if (bestEvent.type === 'TEST' || bestEvent.type === 'URGENT') {
                                    aiType = bestEvent.type
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing assignment description:", e)
                        }
                    }

                    return {
                        id: w.id,
                        title: w.title,
                        summary: aiSummary,
                        description: w.description,
                        materials: w.materials,
                        date,
                        type: (aiType || "ASSIGNMENT") as any,
                        courseName: course.name,
                        courseSection: course.section,
                        courseId: course.id,
                        link: w.alternateLink,
                        status: w.state,
                        priority: (aiType === 'TEST' || aiType === 'URGENT' || isUrgent(date)) ? "HIGH" : "MEDIUM"
                    }
                }

                // Process in chunks of 3 to avoid rate limits
                const chunk = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))
                const assignmentChunks = chunk(work, 3)

                for (const batch of assignmentChunks) {
                    const batchResults = await Promise.all(batch.map(processAssignment))
                    allItems.push(...batchResults)
                }

                // Process Announcements with Concurrency Limit (Batch of 3)
                const processAnnouncement = async (a: any) => {
                    const detectedEvents = await parseAnnouncementText(a.text, course.id)
                    const results: CombinedItem[] = []

                    if (detectedEvents.length > 0) {
                        detectedEvents.forEach(event => {
                            results.push({
                                id: `detected-${a.id}-${event.title.replace(/\s+/g, '-')}`,
                                title: event.title,
                                summary: event.summary,
                                description: a.text,
                                materials: a.materials,
                                date: event.date,
                                type: event.type,
                                courseName: course.name,
                                courseSection: course.section,
                                courseId: course.id,
                                link: a.alternateLink,
                                status: event.status,
                                priority: event.type === "URGENT" || event.type === "TEST" ? "HIGH" : "MEDIUM"
                            })
                        })
                    } else {
                        // Regular announcement
                        results.push({
                            id: a.id,
                            title: a.text.slice(0, 100) + (a.text.length > 100 ? "..." : ""),
                            description: a.text,
                            materials: a.materials,
                            type: "ANNOUNCEMENT",
                            courseName: course.name,
                            courseSection: course.section,
                            courseId: course.id,
                            link: a.alternateLink,
                            priority: "LOW"
                        })
                    }
                    return results
                }

                const announcementChunks = chunk(announcements, 3)
                for (const batch of announcementChunks) {
                    // Add delay between batches
                    if (announcementChunks.indexOf(batch) > 0) {
                        await new Promise(resolve => setTimeout(resolve, 200))
                    }
                    const batchResults = await Promise.all(batch.map(processAnnouncement))
                    batchResults.flat().forEach(item => allItems.push(item))
                }

                // Process Course Materials
                materials.forEach((m) => {
                    allItems.push({
                        id: m.id,
                        title: m.title,
                        description: m.description,
                        materials: m.materials,
                        type: "MATERIAL",
                        courseName: course.name,
                        courseSection: course.section,
                        courseId: course.id,
                        link: m.alternateLink,
                        priority: "LOW"
                    })
                })
            }

            // Sort by date (items with date first, then undefined)
            return allItems.sort((a, b) => {
                if (!a.date) return 1
                if (!b.date) return -1
                return a.date.getTime() - b.date.getTime()
            })
        },
        enabled: !!accessToken,
    })
}

function isUrgent(date?: Date) {
    if (!date) return false
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return diff > 0 && diff < 24 * 60 * 60 * 1000 // 24 hours
}
