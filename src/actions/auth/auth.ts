"use server";
import { db } from "@/db";
import { employees } from "@/db/schema/hr";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function banUser(
  userId: string,
  banReason: string,
  banExpiresIn?: number,
) {
  try {
    const res = await auth.api.banUser({
      body: {
        userId,
        banReason,
        banExpiresIn,
      },
      headers: await headers(),
    });
    return {
      success: { reason: `User ${res.user.name} banned successful!` },
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
      error: { reason: "Couldn't ban user. Try again!" },
      success: null,
    };
  }
}

export async function unbanUser(userId: string) {
  try {
    const res = await auth.api.unbanUser({
      body: { userId },
      headers: await headers(),
    });
    return {
      success: {
        reason: `User ${res.user.name} has been unbanned successful!`,
      },
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
      error: { reason: "Couldn't unban user. Try again!" },
      success: null,
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    });

    await db.delete(employees).where(eq(employees.authId, userId));
    return {
      success: {
        reason: `User has been deleted permanently!`,
      },
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
      error: { reason: "Failed to delete user. Try again!" },
      success: null,
    };
  }
}

export async function revokeUserSessions(userId: string) {
  try {
    await auth.api.revokeUserSessions({
      body: { userId },
      headers: await headers(),
    });

    return {
      success: {
        reason: "user session has been revoked!",
      },
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
      error: { reason: "Failed to revoke user session. Try again!" },
      success: null,
    };
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin" | ("user" | "admin")[];
  // biome-ignore lint/suspicious/noExplicitAny: <>
  data?: Record<string, any> & {
    // Optional nested employee fields to create a full HR employee record
    phone?: string;
    staffNumber?: string;
    department?: string;
    managerId?: string | number | null;
    dateOfBirth?: string | Date | null;
    address?: string;
    maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
    employmentType?: "Full-time" | "Part-time" | "Contract" | "Intern";
  };
  autoVerify?: boolean;
  isManager: boolean;
}) {
  const { autoVerify, ...userData } = data;

  try {
    const createData = {
      ...userData,
      data: {
        ...userData.data,
        ...(autoVerify ? { emailVerified: true } : {}),
      },
    };

    const user = await auth.api.createUser({ body: createData });

    const parsedManagerId =
      userData.data?.managerId === undefined ||
      userData.data?.managerId === null ||
      userData.data?.managerId === ""
        ? null
        : typeof userData.data?.managerId === "string"
          ? parseInt(userData.data.managerId, 10)
          : Number(userData.data.managerId);

    const dobValue = userData.data?.dateOfBirth
      ? typeof userData.data.dateOfBirth === "string"
        ? userData.data.dateOfBirth
        : userData.data.dateOfBirth.toISOString().split("T")[0]
      : null;

    await db.insert(employees).values({
      name: data.name,
      email: data.email,
      authId: user.user.id,
      phone: userData.data?.phone ?? "",
      staffNumber: userData.data?.staffNumber ?? "",
      role: user.user.role ?? "user",
      isManager: data.isManager,
      department: userData.data?.department ?? null,
      managerId: parsedManagerId,
      dateOfBirth: dobValue,
      address: userData.data?.address ?? null,
      maritalStatus: userData.data?.maritalStatus ?? null,
      employmentType: userData.data?.employmentType ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: { reason: "User created successfully" },
      error: null,
      data: null,
    };
  } catch (err) {
    if (err instanceof APIError) {
      return {
        error: { reason: err.message },
        success: null,
        data: null,
      };
    }

    return {
      error: { reason: "Couldn't create user. Try again!" },
      success: null,
      data: null,
    };
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    await auth.api.setRole({
      body: {
        userId,
        role: role as "user" | "admin",
      },
      headers: await headers(),
    });

    return {
      success: { reason: "Updated users role successfully" },
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
      error: { reason: "Couldn't update user role. Try again!" },
      success: null,
    };
  }
}
