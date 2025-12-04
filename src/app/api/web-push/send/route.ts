import { NextResponse } from 'next/server'
import webPush from 'web-push'

webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
    const { message, subscription } = await request.json()

    try {
        await webPush.sendNotification(
            subscription,
            JSON.stringify({
                title: 'Student Sync Alert',
                body: message,
                url: '/dashboard'
            })
        )
        return NextResponse.json({ message: 'Notification sent successfully' })
    } catch (error) {
        console.error('Error sending notification:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
}
