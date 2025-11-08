"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  trigger: React.ReactNode;
  onCompleted?: () => void;
};

export function BalanceUpdateDialog({ trigger, onCompleted }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState<string>("0");

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/balance");
      const data = await res.json();
      setBalance(data.balance?.balance || "0");
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadBalance();
    }
  }, [open, loadBalance]);

  async function onSubmit() {
    if (!amount || Number(amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const addAmount = Number(amount);

      await fetch("/api/finance/balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addAmount: addAmount,
        }),
      });

      setOpen(false);
      setAmount("");
      onCompleted?.();
      // Notify balance card to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("expenses:changed"));
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Failed to update balance");
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Company Balance</DialogTitle>
          <DialogDescription>
            Add funds to the company balance. Current balance:{" "}
            <strong>{formatCurrency(balance)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount to Add *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount to add to the current balance
            </p>
          </div>
          {amount && Number(amount) > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                New balance will be:{" "}
                <strong>
                  {formatCurrency(
                    (Number(balance) + Number(amount)).toString(),
                  )}
                </strong>
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Adding..." : "Add to Balance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
