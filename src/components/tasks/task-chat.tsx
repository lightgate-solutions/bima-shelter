"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { User } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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
  pending?: boolean;
};

export default function TaskChat({ taskId, user }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const mounted = useRef(true);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages?limit=50`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      const msgs: Message[] = data.messages || [];
      setMessages(msgs);
      lastIdRef.current = msgs.length ? msgs[msgs.length - 1].id : 0;
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "auto" }), 0);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [taskId]);

  const fetchNew = useCallback(async () => {
    try {
      const afterId = lastIdRef.current;
      const url = afterId
        ? `/api/tasks/${taskId}/messages?afterId=${afterId}`
        : `/api/tasks/${taskId}/messages?limit=50`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      const newMsgs: Message[] = data.messages || [];
      if (newMsgs.length > 0) {
        lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const dedup = newMsgs.filter((m) => !existing.has(m.id));
          return dedup.length > 0 ? [...prev, ...dedup] : prev;
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
    // Load messages only when chat opens (component mounts)
    fetchInitial();
    return () => {
      mounted.current = false;
    };
  }, [fetchInitial]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchNew();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchNew]);

  // Auto-scroll is handled after data updates to avoid extra dependencies in hooks

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (sending) return; // avoid double submit
    if (!user?.id) return;
    const v = text.trim();
    if (!v) return;
    setSending(true);
    // Optimistic UI: append a pending message
    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      taskId,
      senderId: user.id,
      content: v,
      createdAt: new Date().toISOString(),
      senderName: user.name ?? null,
      senderEmail: user.email ?? null,
      pending: true,
    } as unknown as Message;
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: v }),
      });
      if (res.ok) {
        const data = await res.json();
        const newMsg: Message | undefined = data?.message;
        if (newMsg) {
          // Replace the optimistic message with the actual one
          setMessages((prev) => {
            const replaced = prev.map((m) => (m.id === tempId ? newMsg : m));
            // Ensure no duplicate entries with same id exist (race with poll)
            const seen = new Set<number>();
            const unique: Message[] = [];
            for (const m of replaced) {
              if (seen.has(m.id)) continue;
              seen.add(m.id);
              unique.push(m);
            }
            return unique;
          });
          lastIdRef.current = Math.max(lastIdRef.current, newMsg.id);
        } else if (data?.messages) {
          // Fallback compatibility: server returned full list
          const msgs: Message[] = data.messages || [];
          setMessages((prev) => {
            // Merge uniquely to avoid duplicates
            const existing = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of msgs) {
              if (!existing.has(m.id)) merged.push(m);
            }
            return merged;
          });
          lastIdRef.current = msgs.length ? msgs[msgs.length - 1].id : 0;
        } else {
          // As a fallback, fetch new messages since previous last id
          await fetchNew();
        }
      } else {
        // On error, remove optimistic message and keep input
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(v);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2 border rounded p-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Discussion</h5>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh chat"
          title="Refresh"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <ScrollArea className="h-64 rounded border bg-muted/20 p-2">
        <div className="space-y-2">
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
          Send
        </button>
      </form>
    </div>
  );
}
