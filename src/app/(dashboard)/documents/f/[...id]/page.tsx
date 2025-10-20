import { getUser } from "@/actions/auth/dal";
import { getSubFolders } from "@/actions/documents/folders";
import FoldersGrid from "@/components/documents/folders/folders-grid";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id: foldersId } = await params;
  const user = await getUser();
  if (!user) return null;

  const subFolders = await getSubFolders(Number(foldersId.at(-1)));

  return (
    <div>
      <FoldersGrid folders={subFolders} department={user.department} />
    </div>
  );
}
