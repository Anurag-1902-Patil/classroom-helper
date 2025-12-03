import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { fetchCourses, fetchCourseWork, fetchAnnouncements, fetchCourseWorkMaterials, Material } from "@/lib/api/classroom"
import { parseAnnouncementText } from "@/lib/smart-parser"

export interface CombinedItem {
    id: string
    title: string
    description?: string
    materials?: Material[]
    date?: Date
    type: "ASSIGNMENT" | "ANNOUNCEMENT" | "EVENT" | "MATERIAL"
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

            results.forEach(({ course, work, announcements, materials }) => {
                // Process Assignments
                work.forEach((w) => {
                    let date: Date | undefined
                    if (w.dueDate) {
                        // API returns {year, month, day}. Month is 1-12.
                        const dateObj = new Date(w.dueDate.year, w.dueDate.month - 1, w.dueDate.day)
                        if (w.dueTime) {
                            dateObj.setHours(w.dueTime.hours, w.dueTime.minutes)
                        }
                        if (!isNaN(dateObj.getTime())) {
                            date = dateObj
                        }
                    }

                    allItems.push({
                        id: w.id,
                        title: w.title,
                        description: w.description,
                        materials: w.materials,
                        date,
                        type: "ASSIGNMENT",
                        courseName: course.name,
                        courseSection: course.section,
                        courseId: course.id,
                        link: w.alternateLink,
                        status: w.state,
                        priority: isUrgent(date) ? "HIGH" : "MEDIUM"
                    })
                })

                // Process Announcements & Smart Parse
                announcements.forEach((a) => {
                    const detectedEvents = parseAnnouncementText(a.text, course.id)

                    if (detectedEvents.length > 0) {
                        detectedEvents.forEach(event => {
                            allItems.push({
                                id: `detected-${a.id}-${event.title}`,
                                title: event.title,
                                description: a.text,
                                materials: a.materials,
                                date: event.date,
                                type: "EVENT",
                                courseName: course.name,
                                courseSection: course.section,
                                courseId: course.id,
                                link: a.alternateLink,
                                priority: "HIGH"
                            })
                        })
                    } else {
                        // Regular announcement
                        allItems.push({
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
                })

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
            })

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
