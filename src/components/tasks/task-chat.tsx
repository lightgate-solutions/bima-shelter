"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { User } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  taskId: number;
  user: User | null;
};

type Message = {
  id: number;
  taskId: number;
  senderId: number;
  content: string;
  createdAt: string;
};

export default function TaskChat({ taskId, user }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const mounted = useRef(true);
  const pollRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      setMessages(data.messages || []);
      // Scroll to bottom after loading new messages
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    mounted.current = true;
    fetchMessages();
    // poll every 5 seconds
    pollRef.current = window.setInterval(fetchMessages, 5000);
    return () => {
      mounted.current = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll is handled after data updates to avoid extra dependencies in hooks

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!user?.id) return;
    const v = text.trim();
    if (!v) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: v }),
      });
      if (!res.ok) {
        // TODO: show error
      } else {
        const data = await res.json();
        setMessages(data.messages || []);
        setText("");
        setTimeout(
          () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
          0,
        );
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2 border rounded p-3">
      <h5 className="text-sm font-medium">Discussion</h5>
      <ScrollArea className="h-64 rounded border bg-muted/20 p-2">
        <div className="space-y-2">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
          {messages.length === 0 && !loading && (
            <div className="text-sm text-muted-foreground">No messages yet</div>
          )}
          {messages.map((m) => {
            const isMine = user?.id === m.senderId;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  <div className="text-[10px] opacity-75 mb-1">
                    #{m.senderId} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write a message…" : "Log in to post messages"}
          className="resize-none flex-1 rounded border px-2 py-1 text-sm"
          rows={2}
          disabled={!user}
        />
        <button
          type="submit"
          className="btn btn-primary px-3"
          disabled={!user || sending}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
