"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  use as usePromise,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Hash,
  MapPin,
  User,
  Wallet,
  Receipt,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";

type Milestone = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: number;
};

type Project = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  status: string;
  budgetPlanned: number;
  budgetActual: number;
  supervisorId: number | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

type Expense = {
  id: number;
  projectId: number;
  title: string;
  amount: number;
  spentAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const projectId = Number(id);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );

  const load = useCallback(async () => {
    const [pRes, mRes, eRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/projects/${projectId}/milestones`),
      fetch(`/api/projects/${projectId}/expenses`),
    ]);
    const p = await pRes.json();
    const m = await mRes.json();
    const e = await eRes.json();
    setProject(p.project);
    setMilestones(m.milestones ?? []);
    setExpenses(e.expenses ?? []);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = useMemo(() => {
    if (!milestones.length) return 0;
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  }, [milestones]);

  const spent = useMemo(
    () => expenses.reduce((acc, it) => acc + (it.amount ?? 0), 0),
    [expenses],
  );
  const remaining = useMemo(
    () => (project?.budgetPlanned ?? 0) - spent,
    [project, spent],
  );

  async function saveMilestone() {
    if (editingMilestone?.id) {
      await fetch(`/api/projects/${projectId}/milestones`, {
        method: "PUT",
        body: JSON.stringify({
          id: editingMilestone.id,
          title,
          description,
          dueDate,
        }),
      });
    } else {
      await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        body: JSON.stringify({ title, description, dueDate }),
      });
    }
    setTitle("");
    setDescription("");
    setDueDate("");
    setEditingMilestone(null);
    setOpen(false);
    load();
  }

  function openNewMilestone() {
    setEditingMilestone(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setOpen(true);
  }

  function openEditMilestone(m: Milestone) {
    setEditingMilestone(m);
    setTitle(m.title);
    setDescription(m.description ?? "");
    setDueDate(m.dueDate ? new Date(m.dueDate).toISOString().slice(0, 10) : "");
    setOpen(true);
  }

  async function deleteMilestone(m: Milestone) {
    await fetch(`/api/projects/${projectId}/milestones`, {
      method: "DELETE",
      body: JSON.stringify({ id: m.id }),
    });
    load();
  }

  async function toggleMilestone(m: Milestone) {
    await fetch(`/api/projects/${projectId}/milestones`, {
      method: "PUT",
      body: JSON.stringify({ id: m.id, completed: m.completed ? 0 : 1 }),
    });
    load();
  }

  // Expenses
  const [eOpen, setEOpen] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eAmount, setEAmount] = useState("");
  const [eDate, setEDate] = useState("");
  const [eNotes, setENotes] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  function openNewExpense() {
    setEditingExpense(null);
    setETitle("");
    setEAmount("");
    setEDate("");
    setENotes("");
    setEOpen(true);
  }

  function openEditExpense(exp: Expense) {
    setEditingExpense(exp);
    setETitle(exp.title ?? "");
    setEAmount(String(exp.amount ?? ""));
    setEDate(
      exp.spentAt ? new Date(exp.spentAt).toISOString().slice(0, 10) : "",
    );
    setENotes(exp.notes ?? "");
    setEOpen(true);
  }

  async function saveExpense() {
    const payload = {
      title: eTitle,
      amount: Number(eAmount) || 0,
      spentAt: eDate || null,
      notes: eNotes || null,
    };
    if (editingExpense?.id) {
      await fetch(`/api/projects/${projectId}/expenses`, {
        method: "PUT",
        body: JSON.stringify({ id: editingExpense.id, ...payload }),
      });
    } else {
      await fetch(`/api/projects/${projectId}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setEOpen(false);
    load();
  }

  async function deleteExpense(exp: Expense) {
    await fetch(`/api/projects/${projectId}/expenses`, {
      method: "DELETE",
      body: JSON.stringify({ id: exp.id }),
    });
    load();
  }

  // CSV exporters
  function downloadCSV(filename: string, rows: string[][]) {
    const csvContent = rows
      .map((r) =>
        r
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportMilestonesCSV() {
    const header = ["Title", "Description", "Due Date", "Completed"];
    const data = milestones.map((m) => [
      m.title,
      m.description ?? "",
      m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "",
      m.completed ? "Yes" : "No",
    ]);
    downloadCSV(`${project?.name ?? "project"}-milestones.csv`, [
      header,
      ...data,
    ]);
  }

  function exportExpensesCSV() {
    const header = ["Title", "Amount", "Date", "Notes"];
    const data = expenses.map((e) => [
      e.title,
      String(e.amount ?? 0),
      e.spentAt ? new Date(e.spentAt).toLocaleDateString() : "",
      e.notes ?? "",
    ]);
    downloadCSV(`${project?.name ?? "project"}-expenses.csv`, [
      header,
      ...data,
    ]);
  }

  return (
    <div className="space-y-6 p-2">
      <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
        <ChevronLeft className="mr-1" /> Back
      </Button>
      {project && (
        <Card>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Code</div>
                  <div className="font-medium">{project.code}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">{project.location ?? "—"}</div>
                </div>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Supervisor
                  </div>
                  <div className="font-medium">
                    {project.supervisorName
                      ? `${project.supervisorName} (${project.supervisorEmail})`
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Budget Planned
                  </div>
                  <div className="font-medium">
                    ₦{(project.budgetPlanned ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Budget Actual
                  </div>
                  <div className="font-medium">
                    ₦{(project.budgetActual ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Spent</div>
                  <div className="font-medium">
                    ₦{(spent ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                  <div className="font-medium">
                    ₦{(remaining ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-muted rounded">
                <div
                  className="h-2 rounded bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm mt-1">Progress: {progress}%</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Milestones</CardTitle>
            <Button variant="outline" onClick={exportMilestonesCSV}>
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewMilestone}>Add Milestone</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMilestone ? "Edit Milestone" : "New Milestone"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="ms-title">Title</Label>
                    <Input
                      id="ms-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ms-due">Due date</Label>
                    <Input
                      id="ms-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1 sm:col-span-3">
                    <Label htmlFor="ms-desc">Description</Label>
                    <Textarea
                      id="ms-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveMilestone}>
                    {editingMilestone ? "Save" : "Add"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="mt-4 space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-4 rounded border p-3"
                >
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{m.title}</div>
                      {m.dueDate ? (
                        <div className="text-xs text-muted-foreground">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={m.completed ? "secondary" : "default"}
                      onClick={() => toggleMilestone(m)}
                    >
                      {m.completed ? "Completed" : "Mark Complete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openEditMilestone(m)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteMilestone(m)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            <Button variant="outline" onClick={exportExpensesCSV}>
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Dialog open={eOpen} onOpenChange={setEOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewExpense}>Add Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? "Edit Expense" : "New Expense"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="ex-title">Title</Label>
                    <Input
                      id="ex-title"
                      value={eTitle}
                      onChange={(e) => setETitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ex-amount">Amount</Label>
                    <Input
                      id="ex-amount"
                      type="number"
                      value={eAmount}
                      onChange={(e) => setEAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ex-date">Date</Label>
                    <Input
                      id="ex-date"
                      type="date"
                      value={eDate}
                      onChange={(e) => setEDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1 sm:col-span-3">
                    <Label htmlFor="ex-notes">Notes</Label>
                    <Textarea
                      id="ex-notes"
                      value={eNotes}
                      onChange={(e) => setENotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveExpense}>
                    {editingExpense ? "Save" : "Add"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="mt-4 space-y-2">
              {expenses.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="flex items-start gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{ex.title}</div>
                      <div className="text-sm text-muted-foreground">
                        ₦{(ex.amount ?? 0).toLocaleString()}
                      </div>
                      {ex.spentAt ? (
                        <div className="text-xs text-muted-foreground">
                          {new Date(ex.spentAt).toLocaleDateString()}
                        </div>
                      ) : null}
                      {ex.notes ? (
                        <div className="text-xs text-muted-foreground">
                          {ex.notes}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openEditExpense(ex)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteExpense(ex)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
