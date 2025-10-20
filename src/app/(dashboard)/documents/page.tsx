import { getUser } from "@/actions/auth/dal";
import { DocumentsPage } from "@/components/documents/documents-page";
import { db } from "@/db";
import { documentFolders } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Page() {
  const user = await getUser();
  if (!user) return null;

  const folders = await db
    .select({ name: documentFolders.name })
    .from(documentFolders)
    .where(eq(documentFolders.createdBy, user.id));
  return <DocumentsPage usersFolders={folders} department={user.department} />;
}
