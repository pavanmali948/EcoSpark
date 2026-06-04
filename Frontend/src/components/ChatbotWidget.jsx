import React, { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Send, Bot, User, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

const FAQ = [
  {
    keys: ['book', 'slot', 'timing'],
    answer: 'To book a slot: open Book Slot, choose a pump, pick an available time, and complete payment.',
  },
  {
    keys: ['pending', 'queue', 'worker'],
    answer: 'Workers can see pending queue updates automatically after each booking or verification.',
  },
  {
    keys: ['subscription', 'plan', 'renew'],
    answer: 'Pump admins can renew from the Subscription page. Super admin sets plan catalogue from dashboard.',
  },
  {
    keys: ['expired', 'missed', 'disable'],
    answer: 'When a slot time passes without verification, it is marked as missed and removed from pending queue.',
  },
]

const defaultReply =
  'I can help with bookings, queue status, slots, and subscriptions. Try: "how to book slot" or "subscription plan".'

function resolveReply(text, role) {
  const q = (text || '').toLowerCase()
  const match = FAQ.find((f) => f.keys.some((k) => q.includes(k)))
  if (match) return match.answer
  if (role === 'pump_admin') return `${defaultReply} For admin actions, use Manage Slots, Manage Workers, or Subscription.`
  return `${defaultReply} For users, use Book Slot and History from the sidebar.`
}

export default function ChatbotWidget({ userRole }) {
  const allowed = userRole === 'user' || userRole === 'pump_admin'
  const role = useMemo(() => userRole || 'user', [userRole])

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const initial =
      role === 'pump_admin'
        ? 'Hi Admin! Ask about queue/pending bookings, slot timing rules, or subscriptions.'
        : 'Hi! Ask about booking slots, queue updates, and your history.'
    setMessages([
      {
        type: 'bot',
        text: initial,
      },
    ])
    setInput('')
  }, [role])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    setMessages((prev) => [
      ...prev,
      { type: 'user', text },
      { type: 'bot', text: resolveReply(text, role) },
    ])
    setInput('')
  }

  if (!allowed) return null

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 shadow-lg rounded-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          aria-label="Open chatbot"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      ) : (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
          <Card className="overflow-hidden border border-gray-200 shadow-2xl">
            <CardHeader className="bg-white/80 border-b border-gray-100 p-4 flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Assistant</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-9 w-9"
                aria-label="Close chatbot"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="h-[360px] overflow-y-auto p-4 space-y-3 bg-white">
                {messages.map((m, idx) => (
                  <div
                    key={`msg-${idx}`}
                    className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        m.type === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-50 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {m.type === 'user' ? (
                          <User className="w-3.5 h-3.5" />
                        ) : (
                          <Bot className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px] opacity-80">
                          {m.type === 'user' ? 'You' : 'Assistant'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t bg-gray-50 flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about booking, queue, slots, subscription..."
                  className="h-10 bg-white"
                />
                <Button
                  onClick={sendMessage}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

