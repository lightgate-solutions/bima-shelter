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
  senderName?: string | null;
  senderEmail?: string | null;
};

export default function TaskChat({ taskId, user }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const mounted = useRef(true);
  const pollRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<number>(0);
  const optimisticKeyRef = useRef<number>(-1);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages?limit=50`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      const list: Message[] = data.messages || [];
      setMessages(list);
      lastIdRef.current = list.length ? list[list.length - 1].id : 0;
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
    } catch (err) {
      console.error("Error fetching messages (initial):", err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [taskId]);

  const fetchAfter = useCallback(async () => {
    const lastId = lastIdRef.current;
    if (!lastId) {
      // No messages yet, fetch the latest one (if any)
      try {
        const res = await fetch(`/api/tasks/${taskId}/messages?limit=1`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted.current) return;
        const recent: Message[] = data.messages || [];
        if (recent.length > 0) {
          setMessages((prev) => {
            const merged = [...prev.filter((m) => m.id > 0), ...recent];
            lastIdRef.current = merged[merged.length - 1].id;
            return merged;
          });
          setTimeout(
            () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
            0,
          );
        }
      } catch (err) {
        console.error("Error fetching recent message:", err);
      }
      return;
    }
    try {
      const res = await fetch(
        `/api/tasks/${taskId}/messages?afterId=${lastId}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      const incoming: Message[] = data.messages || [];
      if (incoming.length > 0) {
        setMessages((prev) => {
          const next = [...prev, ...incoming];
          lastIdRef.current = next[next.length - 1].id;
          return next;
        });
        setTimeout(
          () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
          0,
        );
      }
    } catch (err) {
      console.error("Error fetching new messages:", err);
    }
  }, [taskId]);

  useEffect(() => {
    mounted.current = true;
    fetchInitial();
    // poll for new messages every 3.5 seconds
    pollRef.current = window.setInterval(fetchAfter, 3500);
    return () => {
      mounted.current = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchInitial, fetchAfter]);

  // Auto-scroll is handled after data updates to avoid extra dependencies in hooks

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!user?.id) return;
    const v = text.trim();
    if (!v) return;
    setSending(true);
    try {
      // optimistic append
      const optimisticId = optimisticKeyRef.current--;
      const optimistic: Message = {
        id: optimisticId,
        taskId,
        senderId: user.id,
        content: v,
        createdAt: new Date().toISOString(),
        senderName: user.name ?? undefined,
        senderEmail: user.email ?? undefined,
      } as unknown as Message;
      setMessages((prev) => [...prev, optimistic]);
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: v }),
      });
      if (!res.ok) {
        // rollback optimistic on error
        setMessages((prev) => prev.filter((m) => m.id > 0));
        return;
      }
      // Regardless of POST body, fetch new messages after lastId
      setText("");
      await fetchAfter();
      // remove any remaining optimistic items (negative ids)
      setMessages((prev) => prev.filter((m) => m.id > 0));
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
                    {m.senderName
                      ? `${m.senderName} (#${m.senderId})`
                      : `#${m.senderId}`}{" "}
                    • {new Date(m.createdAt).toLocaleString()}
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
