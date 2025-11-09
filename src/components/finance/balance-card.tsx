"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { BalanceUpdateDialog } from "./balance-update-dialog";
import { Button } from "@/components/ui/button";
import { Plus, History } from "lucide-react";
import { useRouter } from "next/navigation";

export function BalanceCard() {
  const router = useRouter();
  const [balance, setBalance] = useState<string>("0");
  const [currency, setCurrency] = useState<string>("NGN");
  const [loading, setLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/balance");
      const data = await res.json();
      setBalance(data.balance?.balance || "0");
      setCurrency(data.balance?.currency || "NGN");
    } catch (error) {
      console.error("Error loading balance:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    // Refresh balance when expenses change
    const handleExpenseChange = () => {
      loadBalance();
    };
    window.addEventListener("expenses:changed", handleExpenseChange);
    return () => {
      window.removeEventListener("expenses:changed", handleExpenseChange);
    };
  }, [loadBalance]);

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(num);
  };

  const balanceNum = Number(balance);
  const isNegative = balanceNum < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Company Balance</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold">Loading...</div>
        ) : (
          <div
            className={`text-2xl font-bold ${
              isNegative
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {formatCurrency(balance)}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Current company balance
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => router.push("/finance/balance/history")}
            >
              <History className="h-3 w-3 mr-1" />
              History
            </Button>
            <BalanceUpdateDialog
              onCompleted={loadBalance}
              trigger={
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Funds
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
