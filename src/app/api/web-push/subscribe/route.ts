import { NextResponse } from 'next/server'

// In a real app, save this to your database
// For now, we'll just log it. 
// You can use a simple JSON file or your existing DB.
let subscriptions: any[] = []

export async function POST(request: Request) {
    const subscription = await request.json()

    console.log('Received subscription:', subscription)
    subscriptions.push(subscription)

    // TODO: Save 'subscription' to your database associated with the current user

    return NextResponse.json({ message: 'Subscription saved successfully' })
}
