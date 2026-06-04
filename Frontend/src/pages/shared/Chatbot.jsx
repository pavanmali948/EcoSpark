import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const FAQ = [
  {
    keys: ['book', 'slot', 'timing'],
    answer:
      'To book a slot: open Book Slot, choose a pump, pick an available time, and complete payment.',
  },
  {
    keys: ['pending', 'queue', 'worker'],
    answer:
      'Workers can see pending queue updates automatically after each booking or verification.',
  },
  {
    keys: ['subscription', 'plan', 'renew'],
    answer:
      'Pump admins can renew from Subscription page. Super admin can create plans from dashboard.',
  },
  {
    keys: ['cancel', 'missed', 'expired'],
    answer:
      'When a slot time passes without verification, it is marked as missed and removed from pending queue.',
  },
];

const defaultReply =
  'I can help with bookings, queue status, slots, and subscriptions. Try: "how to book slot" or "subscription plan".';

function resolveReply(text, role) {
  const q = (text || '').toLowerCase();
  const match = FAQ.find((f) => f.keys.some((k) => q.includes(k)));
  if (match) return match.answer;
  if (role === 'pump_admin') {
    return `${defaultReply} For admin actions, open Manage Slots, Manage Workers, or Subscription.`;
  }
  return `${defaultReply} For users, open Book Slot and History from the sidebar.`;
}

export default function ChatbotPage() {
  const role = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user?.role || '';
    } catch {
      return '';
    }
  }, []);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text:
        role === 'pump_admin'
          ? 'Hi Admin! Ask me about queue, worker pending bookings, slot timing rules, or subscription.'
          : 'Hi! Ask me about booking slots, queue updates, and your history.',
    },
  ]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const next = [
      ...messages,
      { type: 'user', text },
      { type: 'bot', text: resolveReply(text, role) },
    ];
    setMessages(next);
    setInput('');
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/70 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Assistant Chatbot
            </CardTitle>
            <p className="text-sm text-gray-600">
              Available only for logged-in users and pump admins.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[430px] overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((m, idx) => (
                <div
                  key={`msg-${idx}`}
                  className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.type === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {m.type === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      <span className="text-xs opacity-80">{m.type === 'user' ? 'You' : 'Assistant'}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about booking, queue, slots, subscription..."
                className="h-11 bg-white"
              />
              <Button onClick={sendMessage} className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Send className="w-4 h-4 mr-1" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-xs text-gray-600 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          This assistant currently provides guided help based on your role.
        </div>
      </div>
    </div>
  );
}
