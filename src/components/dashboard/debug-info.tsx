"use client"

import { useClassroomData } from "@/hooks/useClassroomData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugInfo() {
    const { data: items, isLoading } = useClassroomData()

    if (process.env.NODE_ENV !== "development") return null

    const stats = items ? {
        total: items.length,
        byType: {
            TEST: items.filter(i => i.type === "TEST").length,
            ASSIGNMENT: items.filter(i => i.type === "ASSIGNMENT").length,
            ANNOUNCEMENT: items.filter(i => i.type === "ANNOUNCEMENT").length,
            URGENT: items.filter(i => i.type === "URGENT").length,
            INFO: items.filter(i => i.type === "INFO").length,
            SUBMISSION_WINDOW: items.filter(i => i.type === "SUBMISSION_WINDOW").length,
        },
        withDates: items.filter(i => i.date).length,
        withStatus: items.filter(i => i.status).length,
        postponed: items.filter(i => i.status === "POSTPONED").length,
        cancelled: items.filter(i => i.status === "CANCELLED").length,
    } : null

    return (
        <Card className="bg-yellow-900/20 border-yellow-800/50 text-xs">
            <CardHeader>
                <CardTitle className="text-sm">Debug Info (Dev Only)</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Loading...</p>
                ) : stats ? (
                    <div className="space-y-2">
                        <p><strong>Total Items:</strong> {stats.total}</p>
                        <p><strong>Types:</strong> TEST: {stats.byType.TEST}, ASSIGNMENT: {stats.byType.ASSIGNMENT}, ANNOUNCEMENT: {stats.byType.ANNOUNCEMENT}, URGENT: {stats.byType.URGENT}, INFO: {stats.byType.INFO}, SUBMISSION_WINDOW: {stats.byType.SUBMISSION_WINDOW}</p>
                        <p><strong>With Dates:</strong> {stats.withDates}</p>
                        <p><strong>With Status:</strong> {stats.withStatus} (POSTPONED: {stats.postponed}, CANCELLED: {stats.cancelled})</p>
                        <details className="mt-2">
                            <summary className="cursor-pointer">Show All Items</summary>
                            <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
                                {items?.map((item, idx) => (
                                    <div key={item.id} className="p-2 bg-zinc-900/50 rounded text-xs">
                                        <p><strong>{idx + 1}.</strong> {item.type} - {item.title?.substring(0, 50) || 'Untitled'}</p>
                                        <p className="text-zinc-500">Date: {item.date ? item.date.toLocaleString() : 'No date'} | Status: {item.status || 'None'}</p>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                ) : (
                    <p>No data</p>
                )}
            </CardContent>
        </Card>
    )
}

