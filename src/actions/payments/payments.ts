"use server";

import { db } from "@/db";
import { payments } from "@/db/schema/payments";
import { eq } from "drizzle-orm";

type PaymentStatus = "pending" | "successful" | "failed";

export async function createPayment(data: {
  payer_name: string;
  account_number: string;
  bank_name?: string;
  amount: string;
  description?: string;
}) {
  try {
    const parsedAmount = Number(data.amount);
    const [payment] = await db
      .insert(payments)
      .values({
        ...data,
        amount: parsedAmount,
      })
      .returning();
    return payment;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw new Error("Failed to create payment");
  }
}

export async function getAllPayments() {
  try {
    return await db.select().from(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Failed to fetch payments");
  }
}

export async function getApprovedPayments() {
  try {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.payment_status, "successful"));
  } catch (error) {
    console.error("Error fetching successful payments:", error);
    throw new Error("Failed to fetch successful payments");
  }
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  try {
    await db
      .update(payments)
      .set({ payment_status: status })
      .where(eq(payments.id, id));
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error("Failed to update payment status");
  }
}
