"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { ExpenseFormDialog } from "./expense-form-dialog";

type Expense = {
  id: number;
  title: string;
  description: string | null;
  amount: string;
  category: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Rent",
  "Salaries",
  "Marketing",
  "Travel",
  "Equipment",
  "Maintenance",
  "Insurance",
  "Legal",
  "Other",
];

export function ExpensesTable() {
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, _setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const categoryParam = category === "all" ? "" : category;
      const res = await fetch(
        `/api/finance/expenses?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(categoryParam)}`,
      );
      const data = await res.json();
      setItems(data.expenses ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, category]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    try {
      await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
      load();
      // Notify balance card to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("expenses:changed"));
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  }

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search expenses..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={category} onValueChange={(v) => setCategory(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ExpenseFormDialog
          onCompleted={() => {
            load();
          }}
          trigger={<Button className="ml-auto">New Expense</Button>}
        />
      </div>
      <Separator />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              items.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell>
                    {expense.category ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {expense.category}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expense.description || "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ExpenseFormDialog
                      initial={expense}
                      onCompleted={() => {
                        load();
                      }}
                      trigger={
                        <Button
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          aria-label="Edit expense"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => onDelete(expense.id)}
                      aria-label="Delete expense"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {total > limit ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive href="#">
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const totalPages = Math.max(1, Math.ceil(total / limit));
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
