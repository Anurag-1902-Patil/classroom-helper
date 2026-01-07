"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Send, X, ExternalLink, Loader2, FileText, Minimize2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useClassroomData, CombinedItem } from "@/hooks/useClassroomData"
import { cn } from "@/lib/utils"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    type?: "text" | "results"
    results?: CombinedItem[]
}

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "assistant", content: "Hi! I'm your study assistant. Ask me for materials, assignments, or check upcoming tests!", type: "text" }
    ])
    const [isThinking, setIsThinking] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { data: allItems } = useClassroomData()

    // Load/Save Persistence
    useEffect(() => {
        const saved = localStorage.getItem("chat-history")
        if (saved) {
            try {
                setMessages(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to load chat history")
            }
        }
    }, [])

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("chat-history", JSON.stringify(messages))
        }
    }, [messages])

    // Auto-scroll to bottom
    useEffect(() => {
        const scrollViewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        const target = scrollViewport || scrollRef.current;

        if (target) {
            target.scrollTop = target.scrollHeight
        }
    }, [messages, isOpen])

    const handleClear = () => {
        const initial = [{ id: "1", role: "assistant" as const, content: "Hi! I'm your study assistant. Ask me for materials, assignments, or check upcoming tests!", type: "text" as const }]
        setMessages(initial)
        localStorage.removeItem("chat-history")
    }

    const handleSend = async () => {
        if (!inputValue.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputValue }
        setMessages(prev => [...prev, userMsg])
        setInputValue("")
        setIsThinking(true)

        try {
            // 1. Parse Intent via API
            const response = await fetch("/api/chat-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.content })
            })

            if (!response.ok) throw new Error("Failed to parse")

            const { intent, reply, criteria } = await response.json()

            // 2. Handle Response
            if (intent === "greeting") {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: reply || "Hello! How can I help you study today?"
                }])
            } else if (intent === "search" && criteria && allItems) {
                // 3. Perform Search
                const results = allItems.filter(item => {
                    // Filter by Course
                    if (criteria.courseName) {
                        const courseMatch = item.courseName.toLowerCase().includes(criteria.courseName.toLowerCase())
                        if (!courseMatch) return false
                    }

                    // Filter by Type
                    if (criteria.type) {
                        if (criteria.type === "TEST" && (item.type !== "TEST" && item.type !== "URGENT")) return false
                        if (criteria.type === "ASSIGNMENT" && item.type !== "ASSIGNMENT") return false
                    }

                    // Filter by Topic Keywords (Fuzzy OR Match)
                    if (criteria.keywords && Array.isArray(criteria.keywords) && criteria.keywords.length > 0) {
                        const content = (item.title + " " + (item.description || "") + " " + item.courseName).toLowerCase()
                        const hasKeywordMatch = criteria.keywords.some((k: string) => content.includes(k.toLowerCase()))
                        if (!hasKeywordMatch) return false
                    }
                    // Fallback for old "topic" (legacy support just in case)
                    else if (criteria.topic) {
                        const query = criteria.topic.toLowerCase()
                        const content = (item.title + " " + (item.description || "") + " " + item.courseName).toLowerCase()
                        if (!content.includes(query)) return false
                    }

                    // Filter by File Format
                    if (criteria.fileFormat) {
                        if (!item.materials || item.materials.length === 0) return false

                        const format = criteria.fileFormat
                        const hasMatchingFile = item.materials.some(m => {
                            if (format === 'PDF' && 'driveFile' in m && m.driveFile.title.toLowerCase().endsWith('.pdf')) return true
                            if (format === 'PPT' && 'driveFile' in m && (m.driveFile.title.toLowerCase().endsWith('.pptx') || m.driveFile.title.toLowerCase().includes('presentation'))) return true
                            if (format === 'DOC' && 'driveFile' in m && m.driveFile.title.toLowerCase().endsWith('.docx')) return true
                            if (format === 'FORM' && 'form' in m) return true
                            if (format === 'VIDEO' && 'youtubeVideo' in m) return true
                            return false
                        })

                        if (!hasMatchingFile) return false
                    }

                    return true
                }).slice(0, 5) // Limit to top 5

                if (results.length > 0) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: `I found ${results.length} items for you:`,
                        type: "results",
                        results: results
                    }])
                } else {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: "I searched your classroom but couldn't find any exact matches. Try searching for just the course name or a broader topic."
                    }])
                }
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: reply || "I'm not sure I understand. Try asking for specific materials like 'Math Unit 5 assignments'."
                }])
            }

        } catch (error) {
            console.error("Chat Error:", error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, I had trouble connecting to my brain. Please try again."
            }])
        } finally {
            setIsThinking(false)
        }
    }

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[80vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 ring-1 ring-white/10"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-purple-600 border border-purple-400/50">
                                    <AvatarImage src="/bot-avatar.png" />
                                    <AvatarFallback className="bg-purple-600 text-white"><Bot className="w-5 h-5" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">Study Assistant</h3>
                                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" onClick={handleClear} title="Clear History">
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
                                    <Minimize2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 min-h-0 bg-zinc-950/50 relative">
                            <ScrollArea className="h-full w-full p-4" ref={scrollRef}>
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex gap-3 max-w-[85%]",
                                                msg.role === "user" ? "ml-auto" : "mr-auto"
                                            )}
                                        >
                                            {msg.role === "assistant" && (
                                                <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                                                    <Bot className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <div className={cn(
                                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                                    msg.role === "user"
                                                        ? "bg-purple-600 text-white rounded-tr-sm"
                                                        : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"
                                                )}>
                                                    {msg.content}
                                                </div>

                                                {/* Render Results Cards */}
                                                {msg.type === "results" && msg.results && (
                                                    <div className="space-y-2">
                                                        {msg.results.map(item => (
                                                            <Card key={item.id} className="bg-zinc-900/80 border-zinc-800 hover:border-purple-500/30 transition-colors group cursor-pointer" onClick={() => window.open(item.link, '_blank')}>
                                                                <CardContent className="p-3 flex items-start gap-3">
                                                                    <div className={cn(
                                                                        "p-2 rounded-lg shrink-0",
                                                                        item.type === "TEST" ? "bg-orange-950/30 text-orange-400" :
                                                                            item.type === "ASSIGNMENT" ? "bg-blue-950/30 text-blue-400" :
                                                                                "bg-zinc-800 text-zinc-400"
                                                                    )}>
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-purple-300 transition-colors">{item.title}</h4>
                                                                        <p className="text-xs text-zinc-500 truncate">{item.courseName}</p>
                                                                    </div>
                                                                    <ExternalLink className="w-3 h-3 text-zinc-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="flex gap-3 mr-auto">
                                            <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                                                <Bot className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-3 flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
                                                <span className="text-xs text-zinc-400">Thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type a message..."
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500/20 text-zinc-200"
                                />
                                <Button type="submit" size="icon" disabled={!inputValue.trim() || isThinking} className="bg-purple-600 hover:bg-purple-700 text-white shrink-0">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center justify-center z-40 transition-colors"
                >
                    <Bot className="w-7 h-7" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950" />
                </motion.button>
            )}
        </>
    )
}
