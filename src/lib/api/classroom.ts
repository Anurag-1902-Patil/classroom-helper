export interface Course {
    id: string
    name: string
    section?: string
    descriptionHeading?: string
    room?: string
    ownerId: string
    creationTime: string
    updateTime: string
    enrollmentCode?: string
    courseState: "ACTIVE" | "ARCHIVED" | "PROVISIONED" | "DECLINED" | "SUSPENDED"
    alternateLink: string
    teacherGroupEmail?: string
    courseGroupEmail?: string
    teacherFolder?: {
        id: string
        title: string
        alternateLink: string
    }
    guardiansEnabled?: boolean
    calendarId?: string
}

export interface DriveFile {
    driveFile: {
        id: string
        title: string
        alternateLink: string
        thumbnailUrl: string
    }
}

export interface YouTubeVideo {
    youtubeVideo: {
        id: string
        title: string
        alternateLink: string
        thumbnailUrl: string
    }
}

export interface Link {
    link: {
        url: string
        title: string
        thumbnailUrl: string
    }
}

export interface Form {
    form: {
        formUrl: string
        responseUrl: string
        title: string
        thumbnailUrl: string
    }
}

export type Material = DriveFile | YouTubeVideo | Link | Form

export interface CourseWork {
    id: string
    title: string
    description?: string
    materials?: Material[]
    state: "PUBLISHED" | "DRAFT" | "DELETED"
    alternateLink: string
    creationTime: string
    updateTime: string
    dueDate?: {
        year: number
        month: number
        day: number
    }
    dueTime?: {
        hours: number
        minutes: number
        seconds?: number
        nanos?: number
    }
    scheduledTime?: string
    maxPoints?: number
    workType: "ASSIGNMENT" | "SHORT_ANSWER_QUESTION" | "MULTIPLE_CHOICE_QUESTION"
    submissionModificationMode?: "MODIFIABLE_UNTIL_TURNED_IN" | "MODIFIABLE"
    assignment?: {
        studentWorkFolder?: {
            id: string
            title: string
            alternateLink: string
        }
    }
    courseId: string
    topicId?: string
}

export interface Announcement {
    id: string
    text: string
    materials?: Material[]
    state: "PUBLISHED" | "DRAFT" | "DELETED"
    alternateLink: string
    creationTime: string
    updateTime: string
    scheduledTime?: string
    assigneeMode: "ALL_STUDENTS" | "INDIVIDUAL_STUDENTS"
    individualStudentsOptions?: {
        studentIds: string[]
    }
    courseId: string
}

const BASE_URL = "https://classroom.googleapis.com/v1"

export async function fetchCourses(accessToken: string): Promise<Course[]> {
    const res = await fetch(`${BASE_URL}/courses?courseStates=ACTIVE`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
    if (!res.ok) {
        throw new Error(`Failed to fetch courses: ${res.statusText}`)
    }
    const data = await res.json()
    return data.courses || []
}

export async function fetchCourseWork(accessToken: string, courseId: string): Promise<CourseWork[]> {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/courseWork?orderBy=dueDate asc`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
    if (!res.ok) {
        throw new Error(`Failed to fetch courseWork for ${courseId}: ${res.statusText}`)
    }
    const data = await res.json()
    return data.courseWork || []
}

export interface CourseWorkMaterial {
    id: string
    title: string
    description?: string
    materials?: Material[]
    state: "PUBLISHED" | "DRAFT" | "DELETED"
    alternateLink: string
    creationTime: string
    updateTime: string
    scheduledTime?: string
    courseId: string
    topicId?: string
}

export async function fetchAnnouncements(accessToken: string, courseId: string): Promise<Announcement[]> {
    const allAnnouncements: Announcement[] = []
    let pageToken: string | undefined = undefined
    
    do {
        const url: string = `${BASE_URL}/courses/${courseId}/announcements?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`
        const res: Response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
        
        if (!res.ok) {
            throw new Error(`Failed to fetch announcements for ${courseId}: ${res.statusText}`)
        }
        
        const data: { announcements?: Announcement[], nextPageToken?: string } = await res.json()
        if (data.announcements) {
            allAnnouncements.push(...data.announcements)
        }
        
        pageToken = data.nextPageToken
    } while (pageToken)
    
    console.log(`📢 Fetched ${allAnnouncements.length} announcements for course ${courseId}`)
    return allAnnouncements
}

export async function fetchCourseWorkMaterials(accessToken: string, courseId: string): Promise<CourseWorkMaterial[]> {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/courseWorkMaterials`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
    if (!res.ok) {
        // courseWorkMaterials might return 404 or empty if feature not used, handle gracefully
        console.warn(`Failed to fetch courseWorkMaterials for ${courseId}: ${res.statusText}`)
        return []
    }
    const data = await res.json()
    return data.courseWorkMaterial || []
}
