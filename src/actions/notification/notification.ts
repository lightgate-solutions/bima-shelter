import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { eq, and, inArray, desc } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { notification_preferences } from "@/db/schema";
import { sendEmail } from "../mail/email";

type CreateNotificationInput = {
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  reference_id?: number;
  is_read?: boolean;
};

export async function createNotification({
  user_id,
  title,
  message,
  notification_type,
  reference_id = 0,
  is_read = false,
}: CreateNotificationInput) {
  try {
    console.log(
      "trying to create notification",
      user_id,
      title,
      message,
      notification_type,
      reference_id,
      is_read,
    );
    const currentUser = await getUser();

    if (!currentUser) {
      return {
        success: false,
        data: null,
        error: "Log in to continue",
      };
    }

    const prefs = await db.query.notification_preferences.findFirst({
      where: eq(notification_preferences.user_id, user_id),
    });
    console.log(prefs, reference_id);

    if (prefs?.in_app_notifications) {
      await db.insert(notifications).values({
        user_id,
        title,
        message,
        created_by: currentUser.id,
        notification_type: notification_type as
          | "message"
          | "approval"
          | "deadline",
        reference_id,
        is_read,
      });
    }

    if (prefs?.email_notifications) {
      await sendEmail(
        {
          recipientIds: [user_id],
          subject: title,
          body: message,
        },
        false,
      );
    }

    return {
      success: true,
      data: title,
      error: null,
    };
  } catch (error) {
    console.log("error", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create notification",
    };
  }
}

export async function getUserNotifications() {
  const currentUser = await getUser();
  if (!currentUser) {
    return {
      success: false,
      data: null,
      error: "Log in to continue",
    };
  }

  const user_id = currentUser.id;

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.user_id, user_id))
    .orderBy(desc(notifications.created_at));

  return userNotifications;
}

export async function markNotificationsAsRead(ids: number[]) {
  console.log("trying to mark a notification as read");
  const currentUser = await getUser();

  if (!currentUser) {
    return {
      success: false,
      data: null,
      error: "Log in to continue",
    };
  }
  const user_id = currentUser.id;

  await db
    .update(notifications)
    .set({ is_read: true })
    .where(
      and(
        eq(notifications.user_id, user_id),
        inArray(notifications.id, ids.map(String)),
      ),
    );
}
