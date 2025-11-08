"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

type Submission = {
  id: number;
  taskId: number;
  submittedBy: number;
  submissionNote?: string | null;
  submittedFiles?: { fileUrl: string; fileName: string }[] | null;
  submittedAt: string;
};

type LocalFile = { id: string; fileUrl: string; fileName: string };

type Review = {
  id: number;
  taskId: number;
  submissionId: number;
  reviewedBy: number;
  status: "Accepted" | "Rejected";
  reviewNote?: string | null;
  reviewedAt: string;
};

export function TaskSubmit({
  taskId,
  user,
}: {
  taskId: number;
  user: User | null;
}) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviewsBySubmission, setReviewsBySubmission] = useState<
    Record<number, Review[]>
  >({});

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/submissions`);
      if (!res.ok) return;
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (e) {
      console.error("Error loading submissions", e);
    }
  }, [taskId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Load reviews for each submission (employee view)
  useEffect(() => {
    let active = true;
    async function loadReviews() {
      try {
        const entries = await Promise.all(
          submissions.map(async (s) => {
            try {
              const res = await fetch(
                `/api/tasks/${taskId}/submissions/${s.id}/reviews`,
              );
              if (!res.ok) return [s.id, [] as Review[]] as const;
              const data = await res.json();
              return [s.id, (data.reviews as Review[]) || []] as const;
            } catch {
              return [s.id, [] as Review[]] as const;
            }
          }),
        );
        if (active) setReviewsBySubmission(Object.fromEntries(entries));
      } catch {
        if (active) setReviewsBySubmission({});
      }
    }
    if (submissions.length > 0) {
      loadReviews();
    } else {
      setReviewsBySubmission({});
    }
    return () => {
      active = false;
    };
  }, [submissions, taskId]);

  const addFile = () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setFiles((prev) => [...prev, { id, fileUrl: "", fileName: "" }]);
  };
  const updateFile = (id: string, patch: Partial<Omit<LocalFile, "id">>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionNote: note || undefined,
          submittedFiles: files.length
            ? files.map(({ id, ...rest }) => rest)
            : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to submit task:", body?.error || "");
        return;
      }
      setNote("");
      setFiles([]);
      setSubmissions(body.submissions || []);
    } catch (e) {
      console.error("Error submitting task", e);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.isManager) return null;

  return (
    <div className="space-y-3">
      <h5 className="text-sm font-medium">Submit work</h5>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a submission note (optional)"
        rows={3}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Attachment links</div>
          <Button size="sm" variant="outline" type="button" onClick={addFile}>
            Add link
          </Button>
        </div>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add one or more file links (URL + name). File uploads are not
            configured yet.
          </p>
        ) : null}
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex gap-2">
              <input
                className="flex-1 rounded border px-2 py-1 text-sm"
                placeholder="https://..."
                value={f.fileUrl}
                onChange={(e) => updateFile(f.id, { fileUrl: e.target.value })}
              />
              <input
                className="w-48 rounded border px-2 py-1 text-sm"
                placeholder="File name"
                value={f.fileName}
                onChange={(e) => updateFile(f.id, { fileName: e.target.value })}
              />
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => removeFile(f.id)}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Task"}
        </Button>
      </div>

      <div className="space-y-2 pt-2">
        <h6 className="text-sm font-medium">Previous submissions</h6>
        {submissions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {submissions.map((s) => (
              <div key={s.id} className="rounded border p-2 text-sm space-y-2">
                <div className="text-xs text-muted-foreground">
                  #{s.submittedBy} • {new Date(s.submittedAt).toLocaleString()}
                </div>
                {s.submissionNote ? (
                  <p className="mt-1 whitespace-pre-wrap">{s.submissionNote}</p>
                ) : null}
                {s.submittedFiles && s.submittedFiles.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5">
                    {s.submittedFiles.map((f) => (
                      <li key={`${f.fileUrl}-${f.fileName}`}>
                        <a
                          className="underline"
                          href={f.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {f.fileName || f.fileUrl}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {/* Manager reviews for this submission */}
                <div className="pt-1">
                  <div className="text-xs font-medium">Manager review</div>
                  {reviewsBySubmission[s.id] &&
                  reviewsBySubmission[s.id].length > 0 ? (
                    <div className="mt-1 space-y-2">
                      {reviewsBySubmission[s.id].map((r) => (
                        <div
                          key={r.id}
                          className="rounded border bg-muted/40 p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant={
                                r.status === "Accepted"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {r.status}
                            </Badge>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(r.reviewedAt).toLocaleString()}
                            </div>
                          </div>
                          {r.reviewNote ? (
                            <div className="mt-1 text-xs whitespace-pre-wrap">
                              {r.reviewNote}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No review yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
