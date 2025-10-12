/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { email, emailRecipient, employees } from "@/db/schema";
import { and, eq, or, ilike, sql, desc, inArray } from "drizzle-orm";
import * as z from "zod";
import { getUser } from "../auth/dal";

const sendEmailSchema = z.object({
  recipientIds: z
    .array(z.number())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
});

const replyEmailSchema = z.object({
  parentEmailId: z.number(),
  recipientIds: z
    .array(z.number())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
});

const forwardEmailSchema = z.object({
  parentEmailId: z.number(),
  recipientIds: z
    .array(z.number())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
});

const searchEmailSchema = z.object({
  query: z.string().min(1),
  folder: z.enum(["inbox", "sent", "archive", "trash"]).optional(),
});

export async function sendEmail(data: z.infer<typeof sendEmailSchema>) {
  try {
    const currentUser = await getUser();

    if (!currentUser) {
      return {
        success: false,
        data: null,
        error: "Log in to continue",
      };
    }

    const validated = sendEmailSchema.parse(data);
    return await db.transaction(async (tx) => {
      const recipients = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(inArray(employees.id, validated.recipientIds));

      if (recipients.length !== validated.recipientIds.length) {
        return {
          success: false,
          data: null,
          error: "One or more recipients do not exist",
        };
      }

      const [newEmail] = await tx
        .insert(email)
        .values({
          senderId: currentUser.id,
          subject: validated.subject,
          body: validated.body,
          type: "sent",
        })
        .returning();

      await tx.insert(emailRecipient).values(
        validated.recipientIds.map((recipientId) => ({
          emailId: newEmail.id,
          recipientId,
        })),
      );

      return {
        success: true,
        data: newEmail,
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function replyToEmail(data: z.infer<typeof replyEmailSchema>) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        data: null,
        error: "Log in to continue",
      };
    }

    const validated = replyEmailSchema.parse(data);

    return await db.transaction(async (tx) => {
      const [parentEmail] = await tx
        .select()
        .from(email)
        .where(eq(email.id, validated.parentEmailId))
        .limit(1);

      if (!parentEmail) {
        return {
          success: false,
          data: null,
          error: "Parent email not found",
        };
      }

      const recipients = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(inArray(employees.id, validated.recipientIds));

      if (recipients.length !== validated.recipientIds.length) {
        return {
          success: false,
          data: null,
          error: "One or more recipients do not exist",
        };
      }

      const [newEmail] = await tx
        .insert(email)
        .values({
          senderId: currentUser.id,
          subject: validated.subject,
          body: validated.body,
          type: "reply",
          parentEmailId: validated.parentEmailId,
        })
        .returning();

      await tx.insert(emailRecipient).values(
        validated.recipientIds.map((recipientId) => ({
          emailId: newEmail.id,
          recipientId,
        })),
      );

      return {
        success: true,
        error: null,
        data: newEmail,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to reply to email",
    };
  }
}

export async function forwardEmail(data: z.infer<typeof forwardEmailSchema>) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }
    const validated = forwardEmailSchema.parse(data);

    return await db.transaction(async (tx) => {
      const [parentEmail] = await tx
        .select()
        .from(email)
        .where(eq(email.id, validated.parentEmailId))
        .limit(1);

      if (!parentEmail) {
        return {
          success: false,
          error: "Parent email not found",
          data: null,
        };
      }

      const recipients = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(inArray(employees.id, validated.recipientIds));

      if (recipients.length !== validated.recipientIds.length) {
        return {
          success: false,
          error: "One or more recipients do not exist",
          data: null,
        };
      }

      const [newEmail] = await tx
        .insert(email)
        .values({
          senderId: currentUser.id,
          subject: validated.subject,
          body: validated.body,
          type: "forward",
          parentEmailId: validated.parentEmailId,
        })
        .returning();

      await tx.insert(emailRecipient).values(
        validated.recipientIds.map((recipientId) => ({
          emailId: newEmail.id,
          recipientId,
        })),
      );

      return {
        success: true,
        error: null,
        data: newEmail,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to forward email",
    };
  }
}

export async function getInboxEmails(page = 1, limit = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser?.id) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }
    const offset = (page - 1) * limit;

    return await db.transaction(async (tx) => {
      const emails = await tx
        .select({
          id: email.id,
          subject: email.subject,
          body: email.body,
          createdAt: email.createdAt,
          type: email.type,
          senderId: email.senderId,
          senderName: employees.name,
          senderEmail: employees.email,
          isRead: emailRecipient.isRead,
          readAt: emailRecipient.readAt,
        })
        .from(emailRecipient)
        .innerJoin(email, eq(emailRecipient.emailId, email.id))
        .innerJoin(employees, eq(email.senderId, employees.id))
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isArchived, false),
            eq(emailRecipient.isDeleted, false),
          ),
        )
        .orderBy(desc(email.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isArchived, false),
            eq(emailRecipient.isDeleted, false),
          ),
        );

      return {
        success: true,
        data: {
          emails,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
        },
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to get inbox emails",
    };
  }
}

export async function getArchivedEmails(page = 1, limit = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }
    const offset = (page - 1) * limit;

    return await db.transaction(async (tx) => {
      const emails = await tx
        .select({
          id: email.id,
          subject: email.subject,
          body: email.body,
          createdAt: email.createdAt,
          type: email.type,
          senderId: email.senderId,
          senderName: employees.name,
          senderEmail: employees.email,
          isRead: emailRecipient.isRead,
          readAt: emailRecipient.readAt,
          archivedAt: emailRecipient.archivedAt,
        })
        .from(emailRecipient)
        .innerJoin(email, eq(emailRecipient.emailId, email.id))
        .innerJoin(employees, eq(email.senderId, employees.id))
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isArchived, true),
            eq(emailRecipient.isDeleted, false),
          ),
        )
        .orderBy(desc(emailRecipient.archivedAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isArchived, true),
            eq(emailRecipient.isDeleted, false),
          ),
        );

      return {
        success: true,
        data: {
          emails,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
        },
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get archived emails",
    };
  }
}

export async function getSentEmails(page = 1, limit = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }
    const offset = (page - 1) * limit;

    return await db.transaction(async (tx) => {
      const emails = await tx
        .select({
          id: email.id,
          subject: email.subject,
          body: email.body,
          createdAt: email.createdAt,
          type: email.type,
          hasBeenOpened: email.hasBeenOpened,
          recipients: sql<
            Array<{ id: number; name: string; email: string; isRead: boolean }>
          >`
	json_agg(
		json_build_object(
				'id', ${employees.id},
				'name', ${employees.name},
				'email', ${employees.email},
				'isRead', ${emailRecipient.isRead},
				'readAt', ${emailRecipient.readAt}
				)
		)
	`,
        })
        .from(email)
        .innerJoin(emailRecipient, eq(email.id, emailRecipient.emailId))
        .innerJoin(employees, eq(emailRecipient.recipientId, employees.id))
        .where(eq(email.senderId, currentUser.id))
        .groupBy(email.id)
        .orderBy(desc(email.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(email)
        .where(eq(email.senderId, currentUser.id));

      return {
        success: true,
        data: {
          emails,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
        },
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to get sent emails",
    };
  }
}

// Get trash emails
export async function getTrashEmails(page = 1, limit = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    const offset = (page - 1) * limit;

    return await db.transaction(async (tx) => {
      const emails = await tx
        .select({
          id: email.id,
          subject: email.subject,
          body: email.body,
          createdAt: email.createdAt,
          type: email.type,
          senderId: email.senderId,
          senderName: employees.name,
          senderEmail: employees.email,
          isRead: emailRecipient.isRead,
          deletedAt: emailRecipient.deletedAt,
        })
        .from(emailRecipient)
        .innerJoin(email, eq(emailRecipient.emailId, email.id))
        .innerJoin(employees, eq(email.senderId, employees.id))
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isDeleted, true),
          ),
        )
        .orderBy(desc(emailRecipient.deletedAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isDeleted, true),
          ),
        );

      return {
        success: true,
        data: {
          emails,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
        },
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to get trash emails",
    };
  }
}

export async function getEmailById(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    return await db.transaction(async (tx) => {
      const [emailData] = await tx
        .select({
          id: email.id,
          subject: email.subject,
          body: email.body,
          createdAt: email.createdAt,
          type: email.type,
          parentEmailId: email.parentEmailId,
          senderId: email.senderId,
          senderName: employees.name,
          senderEmail: employees.email,
          hasBeenOpened: email.hasBeenOpened,
        })
        .from(email)
        .innerJoin(employees, eq(email.senderId, employees.id))
        .where(eq(email.id, emailId))
        .limit(1);

      if (!emailData) {
        return {
          success: false,
          data: null,
          error: "Email not found",
        };
      }
      const [recipientRow] = await tx
        .select({ id: emailRecipient.recipientId })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.emailId, emailId),
            eq(emailRecipient.recipientId, currentUser.id),
          ),
        )
        .limit(1);

      const isSender = emailData.senderId === currentUser.id;
      const isRecipient = !!recipientRow;
      if (!isSender && !isRecipient) {
        return { success: false, data: null, error: "Unauthorized" };
      }

      const recipients = await tx
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          isRead: emailRecipient.isRead,
          readAt: emailRecipient.readAt,
        })
        .from(emailRecipient)
        .innerJoin(employees, eq(emailRecipient.recipientId, employees.id))
        .where(eq(emailRecipient.emailId, emailId));

      const isUserSender = emailData.senderId === currentUser.id;
      const isUserReceipient = recipients.some((r) => r.id === currentUser.id);

      if (!isUserSender && !isUserReceipient) {
        return {
          success: false,
          data: null,
          error: "Unauthorized",
        };
      }

      let recipientStatus = null;
      if (isRecipient) {
        const [status] = await tx
          .select({
            isRead: emailRecipient.isRead,
            isArchived: emailRecipient.isArchived,
            isDeleted: emailRecipient.isDeleted,
            readAt: emailRecipient.readAt,
          })
          .from(emailRecipient)
          .where(
            and(
              eq(emailRecipient.emailId, emailId),
              eq(emailRecipient.recipientId, currentUser.id),
            ),
          )
          .limit(1);
        recipientStatus = status;
      }

      return {
        success: true,
        error: null,
        data: {
          ...emailData,
          recipients,
          isSender,
          isRecipient,
          recipientStatus,
        },
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to get email",
    };
  }
}

export async function markEmailAsRead(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    return await db.transaction(async (tx) => {
      const [recipient] = await tx
        .select()
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.emailId, emailId),
            eq(emailRecipient.recipientId, currentUser.id),
          ),
        )
        .limit(1);

      if (!recipient) {
        return {
          success: false,
          data: null,
          error: "Email not found",
        };
      }

      if (recipient.isRead) {
        return {
          success: true,
          data: recipient,
          error: null,
        };
      }

      const [updated] = await tx
        .update(emailRecipient)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(emailRecipient.id, recipient.id))
        .returning();

      await tx
        .update(email)
        .set({
          hasBeenOpened: true,
        })
        .where(eq(email.id, emailId));

      return {
        success: true,
        data: updated,
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to mark email as read",
    };
  }
}

export async function archiveEmail(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    const [updated] = await db
      .update(emailRecipient)
      .set({
        isArchived: true,
        archivedAt: new Date(),
      })
      .where(
        and(
          eq(emailRecipient.emailId, emailId),
          eq(emailRecipient.recipientId, currentUser.id),
        ),
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Email not found",
        data: null,
      };
    }

    return {
      success: true,
      data: updated,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to archive email",
    };
  }
}

export async function unarchiveEmail(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    const [updated] = await db
      .update(emailRecipient)
      .set({
        isArchived: false,
        archivedAt: null,
      })
      .where(
        and(
          eq(emailRecipient.emailId, emailId),
          eq(emailRecipient.recipientId, currentUser.id),
        ),
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Email not found",
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to unarchive email",
    };
  }
}

export async function moveEmailToTrash(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    const [updated] = await db
      .update(emailRecipient)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(emailRecipient.emailId, emailId),
          eq(emailRecipient.recipientId, currentUser.id),
        ),
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Email not found",
        data: null,
      };
    }

    return {
      success: true,
      data: updated,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to move email to trash",
    };
  }
}

export async function restoreEmailFromTrash(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    const [updated] = await db
      .update(emailRecipient)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        and(
          eq(emailRecipient.emailId, emailId),
          eq(emailRecipient.recipientId, currentUser.id),
        ),
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Email not found",
        data: null,
      };
    }

    return {
      success: true,
      data: updated,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to restore email from trash",
    };
  }
}

export async function deleteSentEmail(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    return await db.transaction(async (tx) => {
      const [emailData] = await tx
        .select({
          id: email.id,
          senderId: email.senderId,
          hasBeenOpened: email.hasBeenOpened,
        })
        .from(email)
        .where(eq(email.id, emailId))
        .limit(1);

      if (!emailData) {
        return {
          success: false,
          data: null,
          error: "Email not found",
        };
      }

      if (emailData.senderId !== currentUser.id) {
        return {
          success: false,
          data: null,
          error: "Unauthorized - you are not the sender of this email",
        };
      }

      if (emailData.hasBeenOpened) {
        return {
          success: false,
          data: null,
          error:
            "Cannot delete email - it has already been opened by one or more recipients",
        };
      }

      await tx.delete(email).where(eq(email.id, emailId));

      return {
        success: true,
        error: null,
        data: "Email deleted successfully",
      };
    });
  } catch (error) {
    return {
      success: false,
      data: error,
      error:
        error instanceof Error ? error.message : "Failed to delete sent email",
    };
  }
}

export async function permanentlyDeleteEmail(emailId: number) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    const deleted = await db
      .delete(emailRecipient)
      .where(
        and(
          eq(emailRecipient.emailId, emailId),
          eq(emailRecipient.recipientId, currentUser.id),
          eq(emailRecipient.isDeleted, true),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return {
        success: false,
        data: null,
        error: "Email not found in trash",
      };
    }

    return {
      success: true,
      error: null,
      data: "Email permanently deleted",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to permanently delete email",
    };
  }
}

export async function searchEmails(data: z.infer<typeof searchEmailSchema>) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    return await db.transaction(async (tx) => {
      const validated = searchEmailSchema.parse(data);
      const searchTerm = `%${validated.query}%`;

      let results: any[] = [];

      if (!validated.folder || validated.folder === "inbox") {
        const inboxResults = await tx
          .select({
            id: email.id,
            subject: email.subject,
            body: email.body,
            createdAt: email.createdAt,
            type: email.type,
            senderId: email.senderId,
            senderName: employees.name,
            senderEmail: employees.email,
            isRead: emailRecipient.isRead,
            folder: sql<string>`'inbox'`,
          })
          .from(emailRecipient)
          .innerJoin(email, eq(emailRecipient.emailId, email.id))
          .innerJoin(employees, eq(email.senderId, employees.id))
          .where(
            and(
              eq(emailRecipient.recipientId, currentUser.id),
              eq(emailRecipient.isArchived, false),
              eq(emailRecipient.isDeleted, false),
              or(
                ilike(email.subject, searchTerm),
                ilike(email.body, searchTerm),
                ilike(employees.name, searchTerm),
                ilike(employees.email, searchTerm),
              ),
            ),
          )
          .orderBy(desc(email.createdAt));

        results = [...results, ...inboxResults];
      }

      if (!validated.folder || validated.folder === "archive") {
        const archiveResults = await tx
          .select({
            id: email.id,
            subject: email.subject,
            body: email.body,
            createdAt: email.createdAt,
            type: email.type,
            senderId: email.senderId,
            senderName: employees.name,
            senderEmail: employees.email,
            isRead: emailRecipient.isRead,
            folder: sql<string>`'archive'`,
          })
          .from(emailRecipient)
          .innerJoin(email, eq(emailRecipient.emailId, email.id))
          .innerJoin(employees, eq(email.senderId, employees.id))
          .where(
            and(
              eq(emailRecipient.recipientId, currentUser.id),
              eq(emailRecipient.isArchived, true),
              eq(emailRecipient.isDeleted, false),
              or(
                ilike(email.subject, searchTerm),
                ilike(email.body, searchTerm),
                ilike(employees.name, searchTerm),
                ilike(employees.email, searchTerm),
              ),
            ),
          )
          .orderBy(desc(email.createdAt));

        results = [...results, ...archiveResults];
      }

      if (!validated.folder || validated.folder === "sent") {
        const sentResults = await tx
          .select({
            id: email.id,
            subject: email.subject,
            body: email.body,
            createdAt: email.createdAt,
            type: email.type,
            senderId: email.senderId,
            senderName: sql<string>`${employees.name}`,
            senderEmail: sql<string>`${employees.email}`,
            isRead: sql<boolean>`false`,
            folder: sql<string>`'sent'`,
          })
          .from(email)
          .innerJoin(employees, eq(email.senderId, employees.id))
          .where(
            and(
              eq(email.senderId, currentUser.id),
              or(
                ilike(email.subject, searchTerm),
                ilike(email.body, searchTerm),
              ),
            ),
          )
          .orderBy(desc(email.createdAt));

        results = [...results, ...sentResults];
      }

      if (!validated.folder || validated.folder === "trash") {
        const trashResults = await tx
          .select({
            id: email.id,
            subject: email.subject,
            body: email.body,
            createdAt: email.createdAt,
            type: email.type,
            senderId: email.senderId,
            senderName: employees.name,
            senderEmail: employees.email,
            isRead: emailRecipient.isRead,
            folder: sql<string>`'trash'`,
          })
          .from(emailRecipient)
          .innerJoin(email, eq(emailRecipient.emailId, email.id))
          .innerJoin(employees, eq(email.senderId, employees.id))
          .where(
            and(
              eq(emailRecipient.recipientId, currentUser.id),
              eq(emailRecipient.isDeleted, true),
              or(
                ilike(email.subject, searchTerm),
                ilike(email.body, searchTerm),
                ilike(employees.name, searchTerm),
                ilike(employees.email, searchTerm),
              ),
            ),
          )
          .orderBy(desc(email.createdAt));

        results = [...results, ...trashResults];
      }

      return {
        success: true,
        data: results,
        error: null,
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to search emails",
    };
  }
}

export async function getEmailStats() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Log in to continue",
        data: null,
      };
    }

    return await db.transaction(async (tx) => {
      const [{ unreadCount }] = await tx
        .select({ unreadCount: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isRead, false),
            eq(emailRecipient.isArchived, false),
            eq(emailRecipient.isDeleted, false),
          ),
        );

      const [{ inboxCount }] = await tx
        .select({ inboxCount: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isArchived, false),
            eq(emailRecipient.isDeleted, false),
          ),
        );

      const [{ archivedCount }] = await tx
        .select({ archivedCount: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isArchived, true),
            eq(emailRecipient.isDeleted, false),
          ),
        );

      const [{ sentCount }] = await tx
        .select({ sentCount: sql<number>`count(*)::int` })
        .from(email)
        .where(eq(email.senderId, currentUser.id));

      const [{ trashCount }] = await tx
        .select({ trashCount: sql<number>`count(*)::int` })
        .from(emailRecipient)
        .where(
          and(
            eq(emailRecipient.recipientId, currentUser.id),
            eq(emailRecipient.isDeleted, true),
          ),
        );

      return {
        success: true,
        error: null,
        data: {
          unreadCount,
          inboxCount,
          archivedCount,
          sentCount,
          trashCount,
        },
      };
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to get email stats",
    };
  }
}
