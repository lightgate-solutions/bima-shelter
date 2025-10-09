"use server";

import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ActionResult<T = unknown> = {
  success: { reason: string } | null;
  error: { reason: string } | null;
  data?: T;
};

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<ActionResult<{ user: { id: string; email: string } }>> {
  try {
    await auth.api.signInEmail({ body: { email, password, rememberMe: true } });

    return {
      success: { reason: "Login successful" },
      error: null,
      data: undefined,
    };
  } catch (err) {
    if (err instanceof APIError) {
      return {
        error: { reason: err.message },
        success: null,
      };
    }

    return {
      error: { reason: "Email or password incorrect. Try again!" },
      success: null,
    };
  }
}

export async function SignOut() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/auth/login");
}
