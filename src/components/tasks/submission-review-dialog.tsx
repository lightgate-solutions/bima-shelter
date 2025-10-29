"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SubmissionReviewDialog({
  taskId,
  submissionId,
  trigger,
  onCompleted,
}: {
  taskId: number;
  submissionId: number;
  trigger?: React.ReactNode;
  onCompleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"Accepted" | "Rejected" | "">("");
  const [grade, setGrade] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!status) {
      setError("Please select a status");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: {
        status: "Accepted" | "Rejected";
        reviewNote?: string;
        grade?: number;
      } = { status, reviewNote: note || undefined };
      const g = Number(grade);
      if (!Number.isNaN(g)) body.grade = g;
      const res = await fetch(
        `/api/tasks/${taskId}/submissions/${submissionId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to submit review");
        return;
      }
      setOpen(false);
      setStatus("");
      setGrade("");
      setNote("");
      onCompleted?.();
    } catch (_e: unknown) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Review</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review submission</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Status</div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "Accepted" | "Rejected")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Grade (optional)</div>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 85"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Review note (optional)</div>
            <Textarea
              rows={3}
              placeholder="Share feedback for the employee"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={submit} disabled={loading || !status}>
              {loading ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
