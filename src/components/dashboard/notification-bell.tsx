"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClassroomData } from "@/hooks/useClassroomData"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell() {
    const { data: items } = useClassroomData()
    const [permission, setPermission] = useState<NotificationPermission>("default")
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPermission(Notification.permission)
        }
    }, [])

    useEffect(() => {
        if (!items) return

        // Filter for high priority items (deadlines within 24h or new events)
        const urgentItems = items.filter(item => item.priority === "HIGH")
        setNotifications(urgentItems)

        // Trigger browser notification for the most urgent item if permission granted
        if (permission === "granted" && urgentItems.length > 0) {
            const newest = urgentItems[0]
            // Simple check to avoid spamming (in a real app, track 'notified' state)
            // For now, we just notify on load if there's something urgent
            new Notification(`Upcoming: ${newest.title}`, {
                body: `Due: ${newest.date?.toLocaleTimeString()} - ${newest.courseSection || newest.courseName}`,
                icon: "/favicon.ico"
            })
        }
    }, [items, permission])

    const requestPermission = async () => {
        const result = await Notification.requestPermission()
        setPermission(result)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-zinc-900 border-zinc-800 text-white p-0" align="end">
                <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Notifications</h4>
                        {permission !== "granted" && (
                            <Button
                                variant="xs"
                                size="sm"
                                onClick={requestPermission}
                                className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white border-none"
                            >
                                Enable Push
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            No new notifications
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {notifications.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-medium text-blue-400">
                                            {item.courseSection || item.courseName}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {item.date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-200 line-clamp-2">{item.title}</p>
                                    <p className="text-xs text-zinc-500 mt-1 capitalize">{item.type.toLowerCase()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
