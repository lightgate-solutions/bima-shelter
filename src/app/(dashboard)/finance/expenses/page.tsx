import { ExpensesTable } from "@/components/finance/expenses-table";
import { BalanceCard } from "@/components/finance/balance-card";

export default function ExpensesPage() {
  return (
    <div className="p-2">
      <div className="mb-4">
        <BalanceCard />
      </div>
      <ExpensesTable />
    </div>
  );
}
