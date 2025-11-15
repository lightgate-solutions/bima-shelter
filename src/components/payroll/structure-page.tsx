"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalaryStructure } from "@/components/payroll/salary-structure";
import { Deductions } from "@/components/payroll/deductions";
import { Allowances } from "@/components/payroll/allowances";

export default function StructurePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Salary & Compensation</h1>
        <p className="text-muted-foreground">
          Manage salary structures, deductions, and allowances for your
          employees
        </p>
      </div>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="bg-background justify-start w-full rounded-none border-b p-0">
          <TabsTrigger
            value="structure"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Salary Structure
          </TabsTrigger>
          <TabsTrigger
            value="allowances"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Allowances
          </TabsTrigger>
          <TabsTrigger
            value="deductions"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Deductions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          <SalaryStructure />
        </TabsContent>

        <TabsContent value="allowances">
          <Allowances />
        </TabsContent>

        <TabsContent value="deductions">
          <Deductions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
