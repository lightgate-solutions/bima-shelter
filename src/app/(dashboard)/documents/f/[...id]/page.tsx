import { getUser } from "@/actions/auth/dal";
import { getActiveFolderDocuments } from "@/actions/documents/documents";
import { getSubFolders } from "@/actions/documents/folders";
import DocumentsGrid from "@/components/documents/documents-grid";
import FoldersGrid from "@/components/documents/folders/folders-grid";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id: foldersId } = await params;
  const user = await getUser();
  if (!user) return null;

  const currentFolderId = foldersId.at(-1);

  const subFolders = await getSubFolders(Number(currentFolderId));

  const documents = await getActiveFolderDocuments(Number(currentFolderId));

  if (documents.error) return null;

  return (
    <div className="space-y-6">
      <FoldersGrid folders={subFolders} department={user.department} />
      <DocumentsGrid documents={documents.success.docs} />
    </div>
  );
}
