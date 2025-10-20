"use client";

import { Dialog } from "../ui/dialog";
import CreateFolderButton from "./folders/create-folder-button";
import FoldersGrid from "./folders/folders-grid";
import UploadDocumentButton from "./upload-document-button";

export function DocumentsOverview({
  usersFolders,
  department,
}: {
  usersFolders: { id: number; name: string; path?: string; updatedAt: Date }[];
  department: string;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="w-full flex justify-between pt-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            All Documents
          </h1>
          <p className="text-muted-foreground">
            Review and manage all folders across the organization
          </p>
        </div>

        <div className="space-y-2">
          <Dialog>
            <UploadDocumentButton
              usersFolders={usersFolders}
              department={department}
            />
          </Dialog>

          <Dialog>
            <CreateFolderButton
              usersFolders={usersFolders}
              department={department}
            />
          </Dialog>
        </div>
      </div>

      <div>
        <FoldersGrid folders={usersFolders} department={department} />
      </div>
    </div>
  );
}
