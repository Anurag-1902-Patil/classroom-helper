"use client"

import { useSession, signIn } from "next-auth/react"
import { HeroSection } from "@/components/dashboard/hero-section"
import { TimelineFeed } from "@/components/dashboard/timeline-feed"
import { CourseGrid } from "@/components/dashboard/course-grid"
import { PriorityBanner } from "@/components/dashboard/priority-banner"
import { DebugInfo } from "@/components/dashboard/debug-info"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 z-10 max-w-md"
        >
          <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Student Sync.
          </h1>
          <p className="text-zinc-400 text-lg">
            Your centralized academic dashboard. Deadlines, announcements, and focus mode in one place.
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-8 font-medium"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-purple-500/30">
      <PriorityBanner />

      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 pb-12 relative z-10 max-w-6xl">
        <HeroSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-12">
            <TimelineFeed />
          </div>
          <div className="space-y-12">
            <CourseGrid />
            {process.env.NODE_ENV === "development" && (
              <div className="fixed bottom-4 right-4 z-50 w-80">
                <div className="bg-yellow-900/90 backdrop-blur-sm border border-yellow-800 rounded-lg p-4 text-xs max-h-96 overflow-y-auto">
                  <div className="font-bold mb-2">🐛 Debug Panel</div>
                  <DebugInfo />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Chat Assistant */}

    </div>
  )
}
